/**
 * Entrega del binario .pkpass firmado.
 *
 * El pase se FIRMA offline (donde viven los certificados, ver wallet/scripts/build-pkpass.mjs)
 * y se publica. Aquí solo se sirven bytes. Estrategia:
 *   1. R2 (binding PASS_BUCKET), clave `passes/{serial}.pkpass`  ← recomendado, multi-serial.
 *   2. Fallback: asset estático /vp/{serial}.pkpass o /vp/VelozPichardo.pkpass (caso single-card).
 */
import type { WalletEnv } from "./env";

export interface StoredPass {
  body: ArrayBuffer;
  lastModified: number; // epoch ms
}

export async function loadPass(env: WalletEnv, serial: string): Promise<StoredPass | null> {
  // 1) R2
  if (env.PASS_BUCKET) {
    const obj = await env.PASS_BUCKET.get(`passes/${serial}.pkpass`);
    if (obj) {
      return { body: await obj.arrayBuffer(), lastModified: obj.uploaded.getTime() };
    }
  }

  // 2) Assets estáticos (single-card): primero por serial, luego el binario por defecto
  if (env.ASSETS) {
    const base = env.SITE_URL || "https://placeholder.local";
    for (const path of [`/vp/${serial}.pkpass`, "/vp/VelozPichardo.pkpass"]) {
      const res = await env.ASSETS.fetch(new Request(new URL(path, base)));
      if (res.ok) {
        const lm = res.headers.get("last-modified");
        return {
          body: await res.arrayBuffer(),
          lastModified: lm ? Date.parse(lm) : Date.now(),
        };
      }
    }
  }

  return null;
}

export const PKPASS_CONTENT_TYPE = "application/vnd.apple.pkpass";
