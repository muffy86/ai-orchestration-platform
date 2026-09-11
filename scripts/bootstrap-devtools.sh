#!/usr/bin/env bash
set -Eeuo pipefail

log(){ printf '\n[APEX] %s\n' "$*"; }
has(){ command -v "$1" >/dev/null 2>&1; }

log "Bootstrapping core AI development fabric"

if ! has node || ! has npm; then
  echo "Node.js/npm are required before this bootstrap. Install current Node 22+ and rerun." >&2
  exit 2
fi

# npm global installs are idempotent upgrades.
log "Installing/updating Codex CLI"
npm install -g @openai/codex

log "Installing/updating Gemini CLI"
npm install -g @google/gemini-cli@latest

# Python tooling is isolated through uv when available. We do not curl|sh arbitrary
# installers here; bootstrap trust roots are intentionally explicit.
if has uv; then
  log "Installing/updating Aider"
  uv tool install --force aider-chat || true
else
  log "uv not present: skipping Aider automated install (install uv from its official distribution, then rerun)"
fi

# Goose installation mechanisms vary by platform/release. Keep it outside this
# bootstrap until the release artifact/signature path is verified for this host.
if ! has goose; then
  log "Goose not installed: pending platform-specific verified installation"
fi

# Jctx is optional until its current package/release path has been verified.
if ! has jctx; then
  log "Jctx not installed: pending verified installation"
fi

log "Versions"
for cmd in node npm codex gemini goose aider jctx adb java; do
  if has "$cmd"; then
    printf '%-10s ' "$cmd"
    "$cmd" --version 2>/dev/null | head -n 1 || true
  else
    printf '%-10s MISSING\n' "$cmd"
  fi
done

log "Bootstrap complete. Missing optional tools are reported above."
