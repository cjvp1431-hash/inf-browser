#!/usr/bin/env node
/**
 * Toma el logo real (assets/logo-vp-original.png, monograma VP de la marca) y produce
 * "másters" recortados, con fondo transparente y recoloreados:
 *
 *   assets/master-logo-gold.png   -> monograma en oro (para tarjeta negra, brief Centurion)
 *   assets/master-logo-white.png  -> monograma en blanco cálido (alternativa)
 *   assets/master-logo-brand.png  -> monograma azul original, recortado + transparente
 *
 * El logo original viene en azul sobre BLANCO (sin alfa). Aquí se calcula una máscara
 * a partir de la "no-blancura" de cada pixel (255 - min(R,G,B)) con una rampa para
 * antialias, de modo que el fondo blanco -> transparente y el trazo azul -> opaco.
 * Esto preserva la geometría EXACTA de la marca; no se redibuja nada.
 *
 * Uso: node scripts/prepare-logo.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "assets");
const orig = join(SRC, "logo-vp-original.png");

// 1) Cargar RGB crudo y calcular canal alfa desde el fondo blanco.
const { data, info } = await sharp(orig)
  .flatten({ background: "#ffffff" }) // por si trae alfa, aplana sobre blanco
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H } = info;
const LO = 8, HI = 40; // rampa de antialias sobre "no-blancura"
const rgba = Buffer.alloc(W * H * 4);
for (let p = 0, q = 0; p < data.length; p += 3, q += 4) {
  const r = data[p], g = data[p + 1], b = data[p + 2];
  const m = 255 - Math.min(r, g, b); // 0 en blanco puro, alto en el trazo
  let a = ((m - LO) / (HI - LO)) * 255;
  a = a < 0 ? 0 : a > 255 ? 255 : a;
  rgba[q] = r; rgba[q + 1] = g; rgba[q + 2] = b; rgba[q + 3] = Math.round(a);
}

// 2) Recortar el margen transparente -> monograma "a sangre".
const trimmed = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .trim({ threshold: 5 })
  .png()
  .toBuffer({ resolveWithObject: true });
const { width, height } = trimmed.info;
console.log(`Monograma recortado: ${width}x${height} (aspecto ${(width / height).toFixed(3)})`);

// Máscara = canal alfa del monograma recortado.
const alphaMask = await sharp(trimmed.data).extractChannel(3).toBuffer();

// Helper: rellenar la máscara con un degradado vertical.
async function tint(name, stops) {
  const grad = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      ${stops.map((s) => `<stop offset="${s.o}" stop-color="${s.c}"/>`).join("")}
    </linearGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
  </svg>`;
  const gradRGB = await sharp(Buffer.from(grad)).removeAlpha().toBuffer();
  await sharp(gradRGB)
    .joinChannel(alphaMask)
    .png({ compressionLevel: 9 })
    .toFile(join(SRC, name));
  console.log(`✓ ${name}`);
}

await tint("master-logo-gold.png", [
  { o: 0, c: "#D8BE82" }, { o: 0.5, c: "#C6A664" }, { o: 1, c: "#A98545" },
]);
await tint("master-logo-white.png", [
  { o: 0, c: "#FBF9F3" }, { o: 1, c: "#E7E2D6" },
]);

// Marca original (azul), ya con fondo transparente.
await sharp(trimmed.data).png({ compressionLevel: 9 }).toFile(join(SRC, "master-logo-brand.png"));
console.log("✓ master-logo-brand.png");
