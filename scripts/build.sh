#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p dist
cp -R content/. dist/
find dist -name '.DS_Store' -delete
