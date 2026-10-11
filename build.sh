#!/usr/bin/env bash
# Monta a pasta public/ que o Worker publica.
# As fotos vêm do CDN do anúncio no QuintoAndar (lista em img-sources.txt).
set -euo pipefail

rm -rf public
mkdir -p public/img
cp index.html public/

while read -r nome url; do
  [ -z "$nome" ] && continue
  curl -sSfL --retry 3 --retry-delay 2 -o "public/img/$nome" "$url"
  echo "baixado: $nome"
done < img-sources.txt

echo "public/ pronto: $(ls public/img | wc -l) fotos"
