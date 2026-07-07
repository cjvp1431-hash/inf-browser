/** Helpers de respuesta HTTP para los endpoints del web service. */

export const json = (data: unknown, status = 200, headers: HeadersInit = {}): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });

export const empty = (status: number, headers: HeadersInit = {}): Response =>
  new Response(null, { status, headers });

export const text = (body: string, status = 200, headers: HeadersInit = {}): Response =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", ...headers } });

/** Comparación en tiempo constante (evita timing attacks sobre tokens). */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  // Longitudes distintas: comparamos contra sí mismo para no revelar longitud por timing.
  const len = Math.max(ba.length, bb.length);
  let diff = ba.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (ba[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

/**
 * Extrae el token del header `Authorization: ApplePass <token>`.
 * Devuelve null si el header no existe o no tiene el esquema esperado.
 */
export function parseApplePassToken(request: Request): string | null {
  const auth = request.headers.get("authorization") ?? "";
  const m = /^ApplePass\s+(.+)$/i.exec(auth.trim());
  return m ? m[1] : null;
}

/** Verifica el token de administración (`Authorization: Bearer <ADMIN_TOKEN>`). */
export function verifyAdmin(request: Request, adminToken?: string): boolean {
  if (!adminToken) return false;
  const auth = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  return m ? timingSafeEqual(m[1], adminToken) : false;
}
