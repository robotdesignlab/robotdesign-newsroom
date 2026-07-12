# design-queue (RDN S2)

Mobile-first upload app for EC. Submits product photos and a design-queue entry:

1. Photos are resized in-browser (width 1600px, JPEG q0.85) and uploaded to S3
   `robotdesign-newsroom-2026` under `design/img/`.
2. A v1.2 entry per item is appended to `data/design_queue.json` in the repo via
   the GitHub Contents API (read sha → append → PUT, one retry on 409).

No build step, no framework. Node 22 + `@aws-sdk/client-s3`; the frontend is a
single static `public/index.html`.

## Run locally

```sh
cp .env.example .env   # fill AWS_* and GITHUB_PAT
npm install
npm start              # http://localhost:8080
```

## Deploy (OCI, arm64)

Ports are not published — Caddy on the external `web` docker network proxies
`queue.robotdesign.net` → `design-queue:8080`.

```sh
# on the host, in /opt/design-queue/ with .env present
docker compose up -d --build
```

## Entry schema (v1.2)

```json
{
  "id": "dq_...",
  "publish_on": "2026-07-13",
  "review": "manual",
  "gate": null,
  "images": [{ "path": "design/img/dq_..._0.jpg", "credit": "", "license": "editorial_press", "alt": "" }],
  "subject": { "company": "", "product": "", "desk": "humanoid" },
  "context": "",
  "ec_notes": [],
  "lens": [],
  "facts": {},
  "status": "pending"
}
```

The queue file is a wrapper object: `{ "schema_version": "1.2", "entries": [ ... ] }`.

## Environment

See `.env.example`. All credentials come from the environment; nothing secret
lives in source. `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`
are read by the AWS SDK; `GITHUB_PAT` needs `contents:write` on the repo.
