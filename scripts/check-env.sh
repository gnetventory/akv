#!/usr/bin/env bash
set -euo pipefail

echo "🔍 [Omni Guard] Checking environment & host target configuration..."
if [ -f ".env" ]; then
    if grep -q "CHANGE_ME" .env || grep -q "your_secret_key_here" .env; then
        echo "⚠️ Warning: Unconfigured placeholder values detected in .env file."
    fi
fi
echo "✔ Environment check passed."
