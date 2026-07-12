# Robotdesign.net (RDN) — newsroom repository

AI-native robotics intelligence media. Hugo (hextra v0.12.3) → GitHub Actions
→ S3 (robotdesign-newsroom-2026) + CloudFront. Operator: EC (sole editor).

## Working model — NON-NEGOTIABLE
- Design/decisions live in the Claude.ai operating channel. This repo session
  IMPLEMENTS instructions from there. Do not redesign architecture here.
- EC gate: show the full diff and WAIT for explicit EC approval before every
  commit. Never push without approval. One concern = one commit.
- Before push: `git pull --rebase origin main` (n8n bot commits to
  content/posts/ concurrently — rebase is safe by domain separation).

## Domain ownership
- content/posts/        → n8n News_Pipeline owns. Do not hand-edit.
- content/design/       → Design_Pipeline (critique articles). publishDate rules apply.
- layouts/, assets/css/ → design work (Gen2 tokens: #3f7d1e light / #c6f24e dark,
  Archivo + IBM Plex Mono). Live CSS = assets/css/custom.css ONLY.
- static/css/custom.css, layouts/partials/custom/head.html,
  layouts/partials/navbar-logo.html → DEAD files. Never edit or reference.

## Naming (frozen 0712-C, unified to "design")
- S3 image prefix: design/img/  (sync exclude: --exclude "design/img/*")
- Queue file: data/design_queue.json (schema v1.2), entry id prefix: dq_
- App: /opt/design-queue/ on OCI (queue.robotdesign.net), container: design-queue
- Slug reserve: never generate slug "img" under design/.

## Publishing invariants
- content/design/ visibility is governed 100% by publishDate (= publish_on).
  Daily cron build 15:00 UTC (KST 00:00). buildFuture stays false.
- byline frontmatter is mandatory on design articles:
  "Analysis by Eunchang Lee · drafted with AI assistance"
- Never enable auto-publish paths; draft resolution logic lives in n8n, not here.

## Known pitfalls
- deploy.yml uses `s3 sync --delete` — the design/img/ exclude must never be removed.
- hugo.toml: timeZone = 'Asia/Seoul' must persist.
- Korean filenames on macOS are NFD — normalize to NFC before comparisons.
- Root .gitignore uses anchored /public/ (Hugo build output only). Never revert
  to unanchored public/ — it would untrack apps/*/public/.

## Current implementation track: S0–S4 (지시서 0712-C)
S0 sync exclude → S1 timeZone/cron/design section → S2 upload app (OCI)
→ S3 n8n assembly → S4 E2E. Each step = EC-approved commits.
