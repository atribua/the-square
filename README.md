# the-square

Landing page do apartamento 3 suítes no The Square Vertical Home (Vila Maria José, Goiânia), usada como destino dos anúncios de Meta e Google Ads.

## Como funciona

- `index.html` — a página inteira (CSS e JS embutidos).
- `img/` — as 23 fotos originais (JPG).
- `img-sources.txt` — lista `nome-do-arquivo URL` das fotos. Se alguma não estiver em `img/`, o build baixa do CDN do anúncio no QuintoAndar.
- `build.mjs` — gera a pasta `public/`:
  - cada foto vira WebP em 480, 800, 1024 e 1600 px (até a largura original), mais um JPG de referência usado no `og:image`;
  - favicons (`favicon.ico`, PNGs de 16 e 32 px, `apple-touch-icon.png`, ícones de 192 e 512 px e `site.webmanifest`) a partir de um recorte da foto da fachada (`FAVICON_CROP` no topo do arquivo);
  - `_headers` com cache de 1 ano para `/img/*`, 7 dias para os ícones e revalidação sempre para o HTML.
- `build.sh` — instala as dependências (`sharp`) e roda o `build.mjs`.
- `wrangler.jsonc` — Worker de assets estáticos servindo `./public`.

## Build e deploy no Cloudflare

- Comando da build: `bash build.sh`
- Comando de deploy: `npx wrangler deploy`

A pasta `public/` não é versionada: ela é gerada a cada build.

Como as imagens ficam em cache por 1 ano, ao trocar uma foto use um nome de arquivo novo (e atualize `img-sources.txt` e o `index.html`).

## Desempenho

- Fontes do Google carregadas sem bloquear a renderização.
- Imagem do topo com `preload` e `srcset` em WebP; as demais com `srcset` e `loading="lazy"`.
- Bibliotecas do Google e do Meta baixadas na primeira interação (rolar, tocar, clicar, teclar) ou 3 s após o carregamento, o que vier primeiro. Os eventos (PageView, ViewContent, conversões) entram na fila desde o início e são enviados quando as bibliotecas chegam.

## Rastreamento

- Meta Pixel `1497290982233419`: PageView e ViewContent; evento personalizado `AgendarVisita` no clique dos botões.
- Google tag `AW-18507235030` e conversão `AW-18507235030/WlvFCPHho5kdENb99_hE` nos mesmos cliques.
- Os parâmetros `utm_*`, `fbclid` e `gclid` são repassados para o link do QuintoAndar, e o `utm_content` identifica qual botão foi clicado (topo, hero, sticky, final).

Os IDs ficam no objeto `CONFIG`, no fim do `index.html`.
