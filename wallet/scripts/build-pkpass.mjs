#!/usr/bin/env node
/**
 * Firma y empaqueta pass/VelozPichardo.pass/ en un archivo .pkpass válido.
 *
 * Flujo Apple PassKit:
 *   1. manifest.json  = { "archivo": SHA1(archivo), ... } para cada asset del pase.
 *   2. signature      = firma PKCS#7 (DER) DETACHED del manifest.json, hecha con el
 *                       certificado Pass Type ID + su clave privada + la intermedia WWDR.
 *   3. .pkpass        = ZIP (sin carpeta raíz) de pass.json + imágenes + manifest + signature.
 *
 * Requisitos (colocar en wallet/certs/, ver certs/README.md):
 *   certs/signerCert.pem   Certificado "Pass Type ID" (PEM)
 *   certs/signerKey.pem    Clave privada del certificado (PEM). Passphrase por env WALLET_KEY_PASS.
 *   certs/wwdr.pem         Apple Worldwide Developer Relations G4 (PEM)
 *
 * Uso:  WALLET_KEY_PASS=xxxxx node scripts/build-pkpass.mjs
 * Salida: wallet/dist/VelozPichardo.pkpass
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PASS = join(ROOT, "pass", "VelozPichardo.pass");
const CERTS = join(ROOT, "certs");
const DIST = join(ROOT, "dist");
const OUT = join(DIST, "VelozPichardo.pkpass");

const signerCert = join(CERTS, "signerCert.pem");
const signerKey = join(CERTS, "signerKey.pem");
const wwdr = join(CERTS, "wwdr.pem");

// --- Verificar certificados ---
const missing = [signerCert, signerKey, wwdr].filter((f) => !existsSync(f));
if (missing.length) {
  console.error("✗ Faltan certificados para firmar:\n  " + missing.join("\n  "));
  console.error("\nLee wallet/certs/README.md para generarlos. Los assets y pass.json ya están listos.");
  process.exit(1);
}

// --- 1. manifest.json (SHA1 de cada archivo, excepto manifest/signature) ---
const files = readdirSync(PASS).filter((f) => f !== "manifest.json" && f !== "signature" && !f.startsWith("."));
const manifest = {};
for (const f of files) {
  manifest[f] = createHash("sha1").update(readFileSync(join(PASS, f))).digest("hex");
}
writeFileSync(join(PASS, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`✓ manifest.json (${files.length} archivos)`);

// --- 2. signature (PKCS#7 detached, DER) ---
const args = [
  "smime", "-binary", "-sign",
  "-certfile", wwdr,
  "-signer", signerCert,
  "-inkey", signerKey,
  "-in", join(PASS, "manifest.json"),
  "-out", join(PASS, "signature"),
  "-outform", "DER",
];
if (process.env.WALLET_KEY_PASS) args.push("-passin", `env:WALLET_KEY_PASS`);
execFileSync("openssl", args, { stdio: "inherit" });
console.log("✓ signature (PKCS#7 detached)");

// --- 3. .pkpass (ZIP sin carpeta raíz) ---
mkdirSync(DIST, { recursive: true });
if (existsSync(OUT)) rmSync(OUT);
const zipFiles = [...files, "manifest.json", "signature"];
execFileSync("zip", ["-X", "-q", OUT, ...zipFiles], { cwd: PASS });
console.log(`✓ ${OUT}`);
console.log("\nListo. Sirve el .pkpass con Content-Type: application/vnd.apple.pkpass");
