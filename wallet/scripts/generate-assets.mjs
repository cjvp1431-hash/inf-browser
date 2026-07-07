#!/usr/bin/env node
/**
 * Genera TODOS los PNG del pase en las dimensiones exactas de Apple Wallet,
 * usando el LOGO REAL de la marca (assets/master-logo-*.png, producido por
 * scripts/prepare-logo.mjs a partir de assets/logo-vp-original.png de Google Drive).
 *
 * Uso: node scripts/prepare-logo.mjs && node scripts/generate-assets.mjs
 *
 * Dimensiones (puntos -> px @1x / @2x / @3x):
 *   icon       29 x 29   -> 29,  58,  87    (REQUERIDO; tile negro + monograma)
 *   logo       alto 50   -> h50, h100, h150 (REQUERIDO; monograma a sangre, transparente)
 *   thumbnail  90 x 90   -> 90,  180, 270   (tile negro + monograma; opcional)
 *   strip      312 x 123 -> ...             (variante storeCard; watermark del monograma)
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "assets");
const OUT = join(ROOT, "pass", "VelozPichardo.pass");
mkdirSync(OUT, { recursive: true });

// Cambia a "master-logo-white.png" o "master-logo-brand.png" para otra variante.
const LOGO = join(SRC, "master-logo-gold.png");

const write = (pipeline, name, w, h) =>
  pipeline.png({ compressionLevel: 9 }).toFile(join(OUT, name)).then(() => console.log(`✓ ${name}  (${w}x${h})`));

// Reduce la opacidad de una imagen RGBA (para el watermark del strip).
async function faded(path, factor) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * factor);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

// Fondo negro de tile (icono / thumbnail) con filete oro sutil.
const tileBG = (size) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><radialGradient id="b" cx="0.5" cy="0.36" r="0.75">
      <stop offset="0" stop-color="#17171A"/><stop offset="1" stop-color="#08080A"/>
    </radialGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#b)"/>
    <rect x="${size * 0.035}" y="${size * 0.035}" width="${size * 0.93}" height="${size * 0.93}"
          fill="none" stroke="#3A3226" stroke-width="${Math.max(1, size * 0.008)}"/>
  </svg>`);

// ---- LOGO (monograma a sangre, fondo transparente) -----------------------
for (const [suffix, h] of [["", 50], ["@2x", 100], ["@3x", 150]]) {
  const buf = await sharp(LOGO).resize({ height: h }).toBuffer({ resolveWithObject: true });
  await write(sharp(buf.data), `logo${suffix}.png`, buf.info.width, h);
}

// ---- ICON (tile negro + monograma oro centrado) --------------------------
for (const [suffix, s] of [["", 29], ["@2x", 58], ["@3x", 87]]) {
  const mono = await sharp(LOGO).resize({ width: Math.round(s * 0.7) }).toBuffer();
  await write(
    sharp(tileBG(s)).composite([{ input: mono, gravity: "center" }]),
    `icon${suffix}.png`, s, s);
}

// ---- THUMBNAIL (tile negro + monograma oro centrado) ---------------------
for (const [suffix, s] of [["", 90], ["@2x", 180], ["@3x", 270]]) {
  const mono = await sharp(LOGO).resize({ width: Math.round(s * 0.62) }).toBuffer();
  await write(
    sharp(tileBG(s)).composite([{ input: mono, gravity: "center" }]),
    `thumbnail${suffix}.png`, s, s);
}

// ---- STRIP (variante storeCard: negro + watermark del monograma) ---------
for (const [suffix, w, h] of [["", 312, 123], ["@2x", 624, 246], ["@3x", 936, 369]]) {
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#101012"/><stop offset="0.6" stop-color="#0A0A0B"/><stop offset="1" stop-color="#050506"/>
      </linearGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#g)"/>
      <rect x="0" y="${h * 0.03}" width="${w}" height="1.5" fill="#3A3226"/>
      <rect x="0" y="${h * 0.96}" width="${w}" height="1.5" fill="#3A3226"/>
    </svg>`);
  const wmBuf = await sharp(await faded(LOGO, 0.1)).resize({ height: Math.round(h * 0.9) }).toBuffer({ resolveWithObject: true });
  await write(
    sharp(bg).composite([{ input: wmBuf.data, left: w - wmBuf.info.width - Math.round(w * 0.04), top: Math.round(h * 0.05) }]),
    `strip${suffix}.png`, w, h);
}

console.log("\nAssets generados en pass/VelozPichardo.pass/ (logo real de la marca).");
