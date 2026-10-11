# the-square

Landing page do apartamento 3 suítes no The Square Vertical Home (Vila Maria José, Goiânia), usada como destino dos anúncios de Meta e Google Ads.

## Como funciona

- `index.html` — a página inteira (CSS e JS embutidos).
- `img-sources.txt` — lista `nome-do-arquivo URL` das 23 fotos, que ficam no CDN do anúncio no QuintoAndar.
- `build.sh` — monta a pasta `public/` com o `index.html` e as fotos baixadas.
- `wrangler.jsonc` — Worker de assets estáticos servindo `./public`.

## Build e deploy no Cloudflare

- Comando da build: `bash build.sh`
- Comando de deploy: `npx wrangler deploy`

A pasta `public/` não é versionada: ela é gerada a cada build.

Se as fotos saírem do ar no QuintoAndar (por exemplo, depois da venda), o build falha. Nesse caso, suba as imagens para `public/img/` no próprio repositório, tire o `public/` do `.gitignore` e troque o comando da build por `cp index.html public/`.

## Rastreamento

- Meta Pixel `1497290982233419`: PageView e ViewContent no carregamento; evento personalizado `AgendarVisita` no clique dos botões.
- Google tag `AW-18507235030` e conversão `AW-18507235030/WlvFCPHho5kdENb99_hE` nos mesmos cliques.
- Os parâmetros `utm_*`, `fbclid` e `gclid` são repassados para o link do QuintoAndar, e o `utm_content` identifica qual botão foi clicado (topo, hero, sticky, final).

Os IDs ficam no objeto `CONFIG`, no fim do `index.html`.
