// RDN S2 — design-queue upload server (Node.js 22, ESM, no framework).
//
// Responsibilities:
//   (a) receive resized JPEGs and PUT them to S3 under design/img/
//   (b) read data/design_queue.json from GitHub (Contents API), append the new
//       entries, and PUT it back — retrying once on a 409 (stale sha) conflict.
//
// ALL credentials come from the environment. No secrets in source.
//   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION  (read by the SDK)
//   GITHUB_PAT                                              (contents:write)

import http from 'node:http';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Config (non-secret; overridable by env) --------------------------------
const PORT = Number(process.env.PORT) || 8080;
const S3_BUCKET = process.env.S3_BUCKET || 'robotdesign-newsroom-2026';
const S3_PREFIX = process.env.S3_PREFIX || 'design/img/';
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-2';
const GITHUB_REPO = process.env.GITHUB_REPO || 'robotdesignlab/robotdesign-newsroom';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_QUEUE_PATH = process.env.GITHUB_QUEUE_PATH || 'data/design_queue.json';
const SCHEMA_VERSION = '1.2';
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES) || 40 * 1024 * 1024;

const DESKS = ['humanoid', 'industrial', 'mobility', 'research'];
const REVIEWS = ['manual', 'auto'];

const s3 = new S3Client({ region: AWS_REGION });

// --- Small helpers -----------------------------------------------------------
function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('invalid JSON body'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function newId() {
  return (
    'dq_' +
    Date.now().toString(36) +
    crypto.randomBytes(3).toString('hex')
  );
}

function isYmd(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// --- S3 ----------------------------------------------------------------------
async function putImage(key, buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
}

// --- GitHub Contents API -----------------------------------------------------
const GH_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_QUEUE_PATH}`;

function ghHeaders() {
  const pat = process.env.GITHUB_PAT;
  if (!pat) throw Object.assign(new Error('GITHUB_PAT not set'), { status: 500 });
  return {
    authorization: `Bearer ${pat}`,
    accept: 'application/vnd.github+json',
    'user-agent': 'design-queue',
    'x-github-api-version': '2022-11-28',
  };
}

function emptyQueue() {
  return { schema_version: SCHEMA_VERSION, entries: [] };
}

// Returns { sha, data }. sha is null when the file does not exist yet.
async function getQueue() {
  const res = await fetch(`${GH_BASE}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, {
    headers: ghHeaders(),
  });
  if (res.status === 404) return { sha: null, data: emptyQueue() };
  if (!res.ok) {
    throw Object.assign(new Error(`GitHub GET ${res.status}`), {
      status: 502,
      detail: await res.text(),
    });
  }
  const json = await res.json();
  const decoded = Buffer.from(json.content, 'base64').toString('utf8');
  let data;
  try {
    data = JSON.parse(decoded);
  } catch {
    data = emptyQueue();
  }
  if (!data || !Array.isArray(data.entries)) data = emptyQueue();
  return { sha: json.sha, data };
}

// PUT the queue. Returns { ok, status, commitSha }. ok=false with status 409
// means a stale-sha conflict the caller should retry.
async function putQueue(data, sha, message) {
  const body = {
    message,
    content: Buffer.from(JSON.stringify(data, null, 2) + '\n', 'utf8').toString('base64'),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(GH_BASE, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 409) return { ok: false, status: 409 };
  if (!res.ok) {
    throw Object.assign(new Error(`GitHub PUT ${res.status}`), {
      status: 502,
      detail: await res.text(),
    });
  }
  const json = await res.json();
  return { ok: true, status: res.status, commitSha: json.commit && json.commit.sha };
}

// Append entries with one retry on 409 (re-read fresh sha, re-append, re-PUT).
async function appendEntries(entries, message) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { sha, data } = await getQueue();
    data.schema_version = SCHEMA_VERSION;
    data.entries.push(...entries);
    const result = await putQueue(data, sha, message);
    if (result.ok) return result.commitSha;
    // 409: loop once more with a freshly fetched sha.
  }
  throw Object.assign(new Error('GitHub PUT conflict after retry'), { status: 409 });
}

// --- Submit handler ----------------------------------------------------------
// Validates the payload, uploads images to S3, builds v1.2 entries, and appends
// them to the queue file. Images are uploaded BEFORE the GitHub append so a 409
// retry never re-uploads.
async function handleSubmit(req, res) {
  const payload = await readJsonBody(req);
  const items = Array.isArray(payload && payload.items) ? payload.items : null;
  if (!items || items.length === 0) {
    return send(res, 400, { ok: false, error: 'no items' });
  }

  const entries = [];
  for (const item of items) {
    const id = newId();
    const subject = (item && item.subject) || {};
    const desk = DESKS.includes(subject.desk) ? subject.desk : DESKS[0];
    const review = REVIEWS.includes(item.review) ? item.review : 'manual';
    const publish_on = isYmd(item.publish_on)
      ? item.publish_on
      : new Date().toISOString().slice(0, 10);

    const srcImages = Array.isArray(item.images) ? item.images : [];
    const images = [];
    for (let i = 0; i < srcImages.length; i++) {
      const img = srcImages[i] || {};
      if (!img.data) continue;
      const buffer = Buffer.from(img.data, 'base64');
      const key = `${S3_PREFIX}${id}_${i}.jpg`;
      await putImage(key, buffer);
      images.push({
        path: key,
        credit: (img.credit || '').trim(),
        license: (img.license || 'editorial_press').trim(),
        alt: (img.alt || '').trim(),
      });
    }

    entries.push({
      id,
      publish_on,
      review,
      gate: null,
      images,
      subject: {
        company: (subject.company || '').trim(),
        product: (subject.product || '').trim(),
        desk,
      },
      context: (item.context || '').trim(),
      ec_notes: Array.isArray(item.ec_notes)
        ? item.ec_notes.map(s => String(s).trim()).filter(Boolean)
        : [],
      lens: Array.isArray(item.lens)
        ? item.lens.map(s => String(s).trim()).filter(Boolean)
        : [],
      facts:
        item.facts && typeof item.facts === 'object' && !Array.isArray(item.facts)
          ? item.facts
          : {},
      status: 'pending',
    });
  }

  const label =
    entries.length === 1
      ? entries[0].subject.company || entries[0].id
      : `${entries.length} items`;
  const commitSha = await appendEntries(
    entries,
    `queue: add ${label} (${entries.length} pending)`
  );

  send(res, 200, {
    ok: true,
    commit: commitSha,
    commit_url: commitSha
      ? `https://github.com/${GITHUB_REPO}/commit/${commitSha}`
      : null,
    entries: entries.map(e => ({
      id: e.id,
      publish_on: e.publish_on,
      review: e.review,
      images: e.images.length,
    })),
  });
}

// --- Static file serving (public/) ------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function serveStatic(req, res) {
  const urlPath = req.url.split('?')[0];
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const publicDir = join(__dirname, 'public');
  const filePath = normalize(join(publicDir, rel));
  if (!filePath.startsWith(publicDir)) {
    return send(res, 403, { ok: false, error: 'forbidden' });
  }
  try {
    const buf = await readFile(filePath);
    const ext = filePath.slice(filePath.lastIndexOf('.'));
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    send(res, 404, { ok: false, error: 'not found' });
  }
}

// --- Router ------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url.split('?')[0] === '/health') {
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && req.url.split('?')[0] === '/api/submit') {
      return await handleSubmit(req, res);
    }
    if (req.method === 'GET') {
      return await serveStatic(req, res);
    }
    send(res, 405, { ok: false, error: 'method not allowed' });
  } catch (err) {
    const status = err.status || 500;
    console.error(`[error] ${req.method} ${req.url} -> ${status}:`, err.message);
    if (err.detail) console.error('  detail:', String(err.detail).slice(0, 500));
    if (!res.headersSent) send(res, status, { ok: false, error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`design-queue listening on :${PORT}`);
  console.log(`  S3: s3://${S3_BUCKET}/${S3_PREFIX} (region ${AWS_REGION})`);
  console.log(`  queue: ${GITHUB_REPO}@${GITHUB_BRANCH}:${GITHUB_QUEUE_PATH}`);
});
