#!/bin/bash
set -e

CONFIG="--config wrangler.jsonc"
ENV_FILE=".dev.vars"

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo $ENV_FILE nao encontrado. Copie de .dev.vars.example e preencha."
  exit 1
fi

echo "=== Cloudflare Containers - Setup Secrets ==="
echo "Lendo secrets de $ENV_FILE"
echo ""

count=0
while IFS= read -r line; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  key="${line%%=*}"
  value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"

  echo "--- $key ---"
  echo "$value" | npx wrangler secret put "$key" $CONFIG
  count=$((count + 1))
done < "$ENV_FILE"

echo ""
echo "=== $count secrets configurados! ==="
