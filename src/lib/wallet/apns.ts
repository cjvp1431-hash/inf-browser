/**
 * Cliente APNs (token-based auth) para disparar actualizaciones de pases.
 *
 * Apple espera un push de payload vacío `{}` al topic = passTypeIdentifier. El dispositivo
 * responde llamando a GET /v1/passes/... para descargar la versión nueva.
 *
 * Auth: JWT ES256 firmado con el Auth Key (.p8) de APNs, usando Web Crypto (disponible en
 * Cloudflare Workers). El token de proveedor se cachea ~50 min (Apple permite reusarlo <1h).
 */
import type { WalletEnv } from "./env";

const b64url = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const der = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);
  return der.buffer as ArrayBuffer;
}

// Cache en memoria del token de proveedor (por instancia de Worker).
let cached: { jwt: string; iat: number } | null = null;

async function providerToken(env: WalletEnv): Promise<string> {
  if (!env.APNS_AUTH_KEY || !env.APNS_KEY_ID || !env.APNS_TEAM_ID) {
    throw new Error("APNs no configurado (faltan APNS_AUTH_KEY / APNS_KEY_ID / APNS_TEAM_ID).");
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (cached && nowSec - cached.iat < 3000) return cached.jwt; // <50 min

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(env.APNS_AUTH_KEY),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: env.APNS_KEY_ID })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ iss: env.APNS_TEAM_ID, iat: nowSec })));
  const signingInput = `${header}.${payload}`;
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${b64url(sig)}`; // ES256: firma raw r||s (formato JWS correcto)
  cached = { jwt, iat: nowSec };
  return jwt;
}

export interface ApnsResult {
  token: string;
  status: number;
  reason?: string;
  invalid?: boolean; // 410 o BadDeviceToken → el registro debe eliminarse
}

/** Envía un push de actualización a un push token. */
export async function pushOne(env: WalletEnv, deviceToken: string): Promise<ApnsResult> {
  const host = env.APNS_HOST || "api.push.apple.com";
  const jwt = await providerToken(env);
  const res = await fetch(`https://${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": env.PASS_TYPE_ID,
      "apns-push-type": "background",
      "apns-priority": "5", // background push → prioridad 5
      "apns-expiration": "0",
    },
    body: "{}", // Wallet ignora el cuerpo; el push solo dispara el refresco
  });

  if (res.status === 200) return { token: deviceToken, status: 200 };

  let reason: string | undefined;
  try {
    reason = ((await res.json()) as { reason?: string }).reason;
  } catch {
    /* sin cuerpo */
  }
  const invalid = res.status === 410 || reason === "BadDeviceToken" || reason === "Unregistered";
  return { token: deviceToken, status: res.status, reason, invalid };
}

/** Envía a múltiples tokens en paralelo (con límite de concurrencia). */
export async function pushMany(env: WalletEnv, tokens: string[], concurrency = 10): Promise<ApnsResult[]> {
  const out: ApnsResult[] = [];
  for (let i = 0; i < tokens.length; i += concurrency) {
    const batch = tokens.slice(i, i + concurrency);
    out.push(...(await Promise.all(batch.map((t) => pushOne(env, t)))));
  }
  return out;
}
