# Stocxify CI

GitHub Actions for the Stocxify frontend
(Next.js 16 App Router + React 19 + TypeScript + Tailwind v4).

## Workflows

| File | Trigger | What it does |
|------|---------|--------------|
| `workflows/pr.yaml` | PR opened/updated against `development` or `main` | Runs typecheck, lint, format check, and build. Then posts an AI code review (OpenRouter). |
| `workflows/pr-conversation.yaml` | A comment on a PR mentions `@ai` / `@ai-bot` / `@openrouter` / `@code-review` | The AI bot replies in the thread using the prior review + diff as context. |

## Static checks

`pr.yaml` runs these npm scripts (defined in `package.json`):

- `npm run typecheck` — `tsc --noEmit`
- `npm run lint:check` — ESLint
- `npm run format:check` — Prettier check
- `npm run build` — Next.js production build

## AI review (OpenRouter)

Both AI workflows call `https://openrouter.ai/api/v1/chat/completions`.

- Model defaults to `openai/gpt-oss-120b:free` (OpenAI's open-weight 117B-parameter
  MoE model). Override without editing YAML by setting the repository **variable**
  `OPENROUTER_MODEL` (e.g. `qwen/qwen3-coder:free`).
  Browse free models: https://openrouter.ai/models?max_price=0
- Free models rotate and have rate limits. If reviews start failing, switch the model variable.

### Required setup
- Secret `OPENROUTER_API_KEY` — your OpenRouter key.
  Settings → Secrets and variables → Actions → New repository secret.
- (`GITHUB_TOKEN` is provided automatically by GitHub Actions.)

If you don't want AI reviews, delete the `pr_review` job from `pr.yaml` and the
whole `pr-conversation.yaml` file. The static checks will still run.

## Prompts
- `prompts/pr_review_system.txt` — instructions for the AI reviewer (React/Next.js focused).
- `prompts/pr_conversation_system.txt` — instructions for the follow-up conversation bot.
