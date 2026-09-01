#!/usr/bin/env bash
# Renders every .mmd in src/ to svg/ and png/.
# Requires: npm i -g @mermaid-js/mermaid-cli
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p svg png
for f in src/*.mmd; do
  name=$(basename "$f" .mmd)
  echo "→ $name"
  mmdc -i "$f" -o "svg/$name.svg" -c mermaid-config.json -b white
  mmdc -i "$f" -o "png/$name.png" -c mermaid-config.json -b white -s 2
done
echo "✓ rendered $(ls src/*.mmd | wc -l) diagrams to svg/ and png/"
