#!/bin/bash
cd "$(dirname "$0")/.."

for lang in src/*/; do
  name=$(basename "$lang")
  mkdir -p "dist/$name"
  cp -R "$lang/assets/"* "dist/$name/"
done
