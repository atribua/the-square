// Monta a pasta public/ que o Worker publica.
//
// - index.html é copiado como está;
// - cada foto de img-sources.txt vira variantes WebP em várias larguras
//   (480, 800, 1024 e 1600 px, só até a largura original) + um JPG de referência
//   (usado no og:image). A foto vem de img/ quando existe no repositório; se não
//   existir, é baixada do CDN do anúncio no QuintoAndar;
// - os favicons são gerados a partir de um recorte da foto da fachada;
// - _headers define o cache longo das imagens e ícones.
import { readFile, writeFile, mkdir, rm, access } from "node:fs/promises";
import sharp from "sharp";

const OUT = "public";
const WIDTHS = [480, 800, 1024, 1600];

// Recorte da fachada usado nos favicons (coordenadas na foto de 1024 x 683 px):
// céu azul + lateral do prédio com as sacadas vermelhas.
const FAVICON_CROP = { left: 200, top: 0, width: 240, height: 240 };

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/img`, { recursive: true });

const sources = (await readFile("img-sources.txt", "utf8"))
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => {
    const [name, url] = l.split(/\s+/);
    return { name, url };
  });

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadSource({ name, url }) {
  if (await exists(`img/${name}`)) return { buf: await readFile(`img/${name}`), from: "repo" };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar ${name}: HTTP ${res.status}`);
  return { buf: Buffer.from(await res.arrayBuffer()), from: "quintoandar" };
}

// ---------- Fotos ----------
let fromRepo = 0;
let downloaded = 0;
let variants = 0;
let fachada = null;

for (const src of sources) {
  const { buf, from } = await loadSource(src);
  from === "repo" ? fromRepo++ : downloaded++;
  if (src.name === "fachada.jpg") fachada = buf;

  const base = src.name.replace(/\.jpe?g$/i, "");
  const { width } = await sharp(buf).metadata();

  await sharp(buf)
    .rotate()
    .resize({ width: Math.min(width, 1600), withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(`${OUT}/img/${base}.jpg`);

  for (const w of WIDTHS.filter((w) => w <= width)) {
    await sharp(buf)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 72, effort: 5 })
      .toFile(`${OUT}/img/${base}-${w}.webp`);
    variants++;
  }
}

// ---------- Favicons ----------
if (!fachada) throw new Error("fachada.jpg não encontrada em img-sources.txt");
const crop = await sharp(fachada).extract(FAVICON_CROP).toBuffer();

async function icon(size) {
  return sharp(crop)
    .resize(size, size, { kernel: "lanczos3" })
    .modulate({ saturation: 1.12 })
    .sharpen(size <= 48 ? { sigma: 0.6 } : undefined)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const pngs = {};
for (const size of [16, 32, 48, 180, 192, 512]) pngs[size] = await icon(size);

await writeFile(`${OUT}/favicon-16x16.png`, pngs[16]);
await writeFile(`${OUT}/favicon-32x32.png`, pngs[32]);
await writeFile(`${OUT}/apple-touch-icon.png`, pngs[180]);
await writeFile(`${OUT}/icon-192.png`, pngs[192]);
await writeFile(`${OUT}/icon-512.png`, pngs[512]);

// favicon.ico com PNGs de 16, 32 e 48 px dentro
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((im) => im.data)]);
}
await writeFile(
  `${OUT}/favicon.ico`,
  ico([16, 32, 48].map((size) => ({ size, data: pngs[size] })))
);

await writeFile(
  `${OUT}/site.webmanifest`,
  JSON.stringify(
    {
      name: "Apartamento 3 suítes · The Square",
      short_name: "The Square",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: "#10231C",
      background_color: "#10231C",
      display: "browser",
    },
    null,
    2
  ) + "\n"
);

// ---------- Página ----------
await writeFile(`${OUT}/index.html`, await readFile("index.html"));

// ---------- Cache ----------
// Imagens: 1 ano. Se trocar uma foto, troque também o nome do arquivo.
// Ícones: 7 dias. HTML: sempre revalida, para mudanças aparecerem na hora.
await writeFile(
  `${OUT}/_headers`,
  [
    "/img/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/favicon.ico",
    "  Cache-Control: public, max-age=604800",
    "/favicon-*",
    "  Cache-Control: public, max-age=604800",
    "/apple-touch-icon.png",
    "  Cache-Control: public, max-age=604800",
    "/icon-*",
    "  Cache-Control: public, max-age=604800",
    "/site.webmanifest",
    "  Cache-Control: public, max-age=604800",
    "",
    "/",
    "  Cache-Control: public, max-age=0, must-revalidate",
    "",
  ].join("\n")
);

console.log(
  `public/ pronto: ${fromRepo} fotos do repositório, ${downloaded} baixadas do QuintoAndar, ` +
    `${variants} variantes WebP, favicons gerados`
);
