#!/usr/bin/env bash
# Monta a pasta public/ que o Worker publica.
# Para cada foto listada em img-sources.txt:
#   - se ela existir na pasta img/ do repositório, usa a cópia do repositório;
#   - se não existir, baixa do CDN do anúncio no QuintoAndar.
set -euo pipefail

rm -rf public
mkdir -p public/img
cp index.html public/

do_repo=0
baixadas=0
while read -r nome url; do
  [ -z "$nome" ] && continue
  if [ -f "img/$nome" ]; then
    cp "img/$nome" "public/img/$nome"
    do_repo=$((do_repo + 1))
  else
    curl -sSfL --retry 3 --retry-delay 2 -o "public/img/$nome" "$url"
    baixadas=$((baixadas + 1))
  fi
done < img-sources.txt

echo "public/ pronto: $do_repo fotos do repositório, $baixadas baixadas do QuintoAndar"
