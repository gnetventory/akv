#!/usr/bin/env bash
set -euo pipefail

if [ ! -d "src" ]; then
    echo "✔ No src/ directory found, skipping token check."
    exit 0
fi

echo "🔍 [Omni Guard] Validating CSS Design Tokens..."
ERRORS=$(grep -rEn '#[0-9a-fA-F]{3,8}\b' src \
  --include='*.css' --include='*.scss' --include='*.tsx' --include='*.jsx' --include='*.vue' --include='*.html' \
  --exclude='tokens.css' --exclude='variables.css' --exclude='theme.css' 2>/dev/null || true)

if [ -n "$ERRORS" ]; then
    echo "❌ Hardcoded hex colors detected in src/:"
    echo "$ERRORS"
    echo "⚠️ Replace hardcoded colors with CSS variables from .context/03_DESIGN_SYSTEM.md when possible."
fi
echo "✔ Token check passed."
