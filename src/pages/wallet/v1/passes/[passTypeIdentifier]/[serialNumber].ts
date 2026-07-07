/**
 * PassKit Web Service — descarga de la versión más reciente de un pase.
 *
 *  GET /v1/passes/{passTypeId}/{serial}
 *
 * Autenticación: `Authorization: ApplePass <authenticationToken>`.
 * - Si el pase está revocado → 401 (el dispositivo elimina el pase).
 * - Respeta `If-Modified-Since` → 304 si no cambió.
 * - Devuelve el binario .pkpass con Content-Type y Last-Modified correctos.
 */
import type { APIRoute } from "astro";
import { getEnv, waitUntil } from "@wallet/env";
import { WalletDB } from "@wallet/db";
import { empty, parseApplePassToken, timingSafeEqual } from "@wallet/http";
import { loadPass, PKPASS_CONTENT_TYPE } from "@wallet/passStore";

export const prerender = false;

export const GET: APIRoute = async ({ params, request, locals }) => {
  const env = getEnv(locals);
  const db = WalletDB.from(env);
  const { passTypeIdentifier: passType, serialNumber: serial } = params as Record<string, string>;

  const pass = await db.getPass(passType, serial);
  if (!pass) return empty(404);

  const token = parseApplePassToken(request);
  if (!token || !timingSafeEqual(token, pass.auth_token)) return empty(401);
  if (pass.revoked) return empty(401); // revocado → Wallet lo elimina

  // If-Modified-Since (Apple manda el Last-Modified que le dimos antes).
  const ims = request.headers.get("if-modified-since");
  if (ims) {
    const since = Date.parse(ims);
    if (!Number.isNaN(since) && Math.floor(pass.updated_at / 1000) * 1000 <= since) {
      return empty(304);
    }
  }

  const stored = await loadPass(env, serial);
  if (!stored) return empty(404);

  waitUntil(locals, db.track("pass_download", { serial, passTypeId: passType }));

  return new Response(stored.body, {
    status: 200,
    headers: {
      "content-type": PKPASS_CONTENT_TYPE,
      "last-modified": new Date(pass.updated_at).toUTCString(),
      "cache-control": "no-store",
    },
  });
};
