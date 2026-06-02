# AGENTS.md
This repo is part of the muffy86 AI Ecosystem.

## Cost Routing (mandatory)
| Task | Model |
|------|-------|
| Code/edits | LOCAL qwen2.5-coder:14b via Ollama |
| Simple lookups | LOCAL llama3.1:8b |
| Analysis | claude-haiku-4-5-20251001 |
| Complex/agentic | claude-sonnet-4-6 |

## Rules
- All secrets via env vars — never hardcode
- .env always in .gitignore
- API-first architecture
- Tests required before merging to main
