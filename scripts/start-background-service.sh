#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

# Kill any previous background instance on port 5175
fuser -k 5175/tcp 2>/dev/null || true

# Start static production server in detached background mode on PORT 5175
nohup npx --yes serve -s dist -l 5175 > "$DIR/server-background.log" 2>&1 &

PID=$!
echo "Smart Directory 24/7 background service started with PID: $PID on http://localhost:5175"
