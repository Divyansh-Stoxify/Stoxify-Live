# Stocxify CI/CD

This folder holds the GitHub Actions setup for the Stocxify frontend
(Next.js 16 App Router + React 19 + TypeScript + Tailwind v4).

## Workflows

| File | Trigger | What it does |
|------|---------|--------------|
| `workflows/pr.yaml` | PR opened/updated against `development` or `main` | Runs typecheck, lint, format check, build, then posts an AI code review (OpenRouter). |
| `workflows/pr-conversation.yaml` | A comment on a PR mentions `@ai` / `@ai-bot` / `@openrouter` / `@code-review` | The AI bot replies in the thread using the prior review + diff as context. |
| `workflows/deploy.yaml` | Push to `main`, or manual `workflow_dispatch` | Static checks → version bump (by commit prefix) → build & push Docker image → deploy to the target server. |

## AI review (OpenRouter)

Both AI workflows call `https://openrouter.ai/api/v1/chat/completions`.

- Model defaults to `openai/gpt-oss-120b:free` (OpenAI's open-weight 117B-parameter
  MoE model). Override without editing YAML by setting the repository **variable**
  `OPENROUTER_MODEL` (e.g. `qwen/qwen3-coder:free`).
  Browse free models: https://openrouter.ai/models?max_price=0
- Free models rotate and have rate limits. If reviews start failing, switch the model variable.

### Required for AI workflows
- Secret `OPENROUTER_API_KEY` — your OpenRouter key.
- (`GITHUB_TOKEN` is provided automatically by GitHub Actions.)

If you don't want AI reviews, delete the `pr_review` job from `pr.yaml` and the
whole `pr-conversation.yaml` file. CI checks will still run.

## Deployment (self-hosted)

`deploy.yaml` builds a Docker image from the root `Dockerfile` (Next.js
`output: "standalone"`), pushes it to your registry, then SSHes into your server
and runs `docker compose up` via `scripts/execute-stocxify.sh`.

Versioning: when pushing to `main`, the commit message prefix decides the bump:
- `[fix] ...`     → patch (v1.0.0 → v1.0.1)
- `[feature] ...` → minor (v1.0.0 → v1.1.0)
- `[release] ...` → major (v1.0.0 → v2.0.0)
- anything else   → no tag / image is created

### Required for deploy
Secrets:
- `DOCKER_REGISTRY_URL`, `DOCKER_REGISTRY_USERNAME`, `DOCKER_REGISTRY_PASSWORD`
- `SSH_USERNAME`, and either `SSH_PASSWORD` (dev/raw mode) or `SSH_PRIVATE_KEY_BASE64` (image mode)
- VPN-only (optional, see below): `OVPN_USERNAME`, `OVPN_PASSWORD`,
  `OVPN_PROFILE_BASE64`, `OVPN_PROFILE_BASE64_2`

Variables:
- `TARGET_SERVER` (host/IP), `PORT` (host port to expose), `DISK_USAGE_THRESHOLD` (e.g. `85`)

### VPN steps are OPTIONAL
The `Install OpenVPN` / `Connect to VPN` steps in `deploy.yaml` are only needed
if your server is reachable only through a VPN. If you deploy to a directly
reachable host (most VPS/cloud setups):
1. Delete those two steps from both deploy jobs.
2. Delete `scripts/wait-for-vpn.sh` and the `OVPN_*` secrets.

If you DO use a VPN, edit `scripts/wait-for-vpn.sh` and replace the placeholder
subnets (`10.0.100.` / `10.0.120.`) with the subnet(s) your VPN assigns.

## Scripts
- `scripts/execute-stocxify.sh` — runs on the target server; `raw` mode builds and
  runs the standalone Node server, `docker` mode pulls the image and runs compose.
- `scripts/app-status.sh` — polls `http://TARGET:PORT` until it returns HTTP 200.
- `scripts/wait-for-vpn.sh` — waits for a VPN subnet (only if using VPN).
