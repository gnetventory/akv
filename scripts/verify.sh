#!/usr/bin/env bash
set -euo pipefail

STATE_DIR=".agents/state"
ATTEMPT_FILE="${STATE_DIR}/attempts"
MAX_ATTEMPTS=3

mkdir -p "$STATE_DIR"
ATTEMPTS=$(cat "$ATTEMPT_FILE" 2>/dev/null || echo 0)
ATTEMPTS=$((ATTEMPTS + 1))
echo "$ATTEMPTS" > "$ATTEMPT_FILE"

echo "🔍 [Omni Pipeline] Running Full Verification (Attempt ${ATTEMPTS}/${MAX_ATTEMPTS})..."

if [ "$ATTEMPTS" -gt "$MAX_ATTEMPTS" ]; then
    echo "🛑 MAXIMUM RETRY CAP REACHED (${MAX_ATTEMPTS}/${MAX_ATTEMPTS}). Halting execution."
    exit 99
fi

./scripts/scan-secrets.sh
./scripts/check-env.sh
[ -f "./scripts/check-tokens.sh" ] && ./scripts/check-tokens.sh

if [ -f "package.json" ]; then
    if grep -q '"typecheck"' package.json; then npm run typecheck; fi
    if grep -q '"lint"' package.json; then npm run lint; fi
    if grep -q '"test"' package.json; then npm test; fi
    if grep -q '"build"' package.json; then npm run build; fi
elif [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
    if command -v pytest >/dev/null 2>&1; then pytest; fi
fi

rm -f "$ATTEMPT_FILE"
echo "✅ Verification pipeline passed!"
