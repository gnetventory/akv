#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

PORT=5175

echo "🚀 Starting Smart Directory Dev Server..."
echo "👉 Opening on http://localhost:$PORT"
echo ""

# Run Vite dev server with live hot reloading
./node_modules/.bin/vite --port $PORT --host
