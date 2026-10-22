#!/usr/bin/env bash
set -euo pipefail

echo "🛡️ [Omni Guard] Scanning workspace for exposed secrets..."
LEAKS=$(grep -rEi '(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33})' \
  --exclude-dir={node_modules,.git,.agents/state} \
  --exclude={.env.example,*.log} . 2>/dev/null || true)

if [ -n "$LEAKS" ]; then
    echo "❌ CRITICAL: Potential secret/key leak detected:"
    echo "$LEAKS"
    exit 1
fi
echo "✔ No raw secrets detected."
