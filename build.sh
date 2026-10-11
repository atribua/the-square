#!/usr/bin/env bash
# Comando da build no Cloudflare: bash build.sh
# Instala o sharp (otimização de imagens) e gera a pasta public/.
set -euo pipefail
npm install --no-audit --no-fund --loglevel=error
node build.mjs
