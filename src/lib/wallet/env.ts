/**
 * Acceso tipado al entorno del Worker (bindings de Cloudflare).
 *
 * Los bindings se declaran en wrangler.json (DB, PASS_BUCKET, ASSETS, vars) y los
 * secretos se inyectan con `wrangler secret put` (ver wallet/WEBSERVICE.md).
 */
export interface WalletEnv {
  // --- Bindings ---
  DB: D1Database;
  PASS_BUCKET?: R2Bucket; // opcional: binarios .pkpass por serial; si falta, se usa ASSETS
  ASSETS?: Fetcher; // assets estáticos del sitio (fallback del .pkpass)

  // --- Vars (wrangler.json → vars) ---
  PASS_TYPE_ID: string; // = passTypeIdentifier del pase
  APNS_HOST?: string; // api.push.apple.com (prod) | api.sandbox.push.apple.com (dev)
  SITE_URL?: string; // https://card.velozpichardo.com (para armar rutas absolutas)

  // --- Secretos (wrangler secret put) ---
  APNS_TEAM_ID?: string; // Apple Team ID
  APNS_KEY_ID?: string; // Key ID del Auth Key APNs (.p8)
  APNS_AUTH_KEY?: string; // contenido del .p8 (PEM PKCS#8)
  ADMIN_TOKEN?: string; // protege /wallet/admin/*
}

/** Extrae el entorno del Worker desde `Astro.locals`. */
export function getEnv(locals: App.Locals): WalletEnv {
  const runtime = (locals as { runtime?: { env?: unknown } }).runtime;
  if (!runtime?.env) {
    throw new Error("Runtime de Cloudflare no disponible (¿falta el adapter o platformProxy?).");
  }
  return runtime.env as unknown as WalletEnv;
}

/** waitUntil para tareas en segundo plano (logging/analíticas sin bloquear la respuesta). */
export function waitUntil(locals: App.Locals, promise: Promise<unknown>): void {
  const ctx = (locals as { runtime?: { ctx?: { waitUntil?: (p: Promise<unknown>) => void } } }).runtime?.ctx;
  if (ctx?.waitUntil) ctx.waitUntil(promise);
}
