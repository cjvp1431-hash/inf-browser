/**
 * Beacon 1x1 para medir vistas de la landing (que es estática).
 *
 *  GET /vp/px?e=view_landing
 *
 * La landing lo dispara con navigator.sendBeacon en la carga. Solo acepta eventos de una
 * lista blanca. Responde 204 (sin cuerpo) para no bloquear el render.
 */
import type { APIRoute } from "astro";
import { getEnv, waitUntil } from "@wallet/env";
import { WalletDB, hashIp, type AnalyticsEvent } from "@wallet/db";

export const prerender = false;

const ALLOWED = new Set<AnalyticsEvent>(["view_landing"]);

export const GET: APIRoute = async ({ url, locals, request, clientAddress }) => {
  const e = url.searchParams.get("e") as AnalyticsEvent | null;
  if (e && ALLOWED.has(e)) {
    try {
      const db = WalletDB.from(getEnv(locals));
      waitUntil(
        locals,
        db
          .track(e, { userAgent: request.headers.get("user-agent"), ipHash: await hashIp(clientAddress ?? null) })
          .catch(() => {}),
      );
    } catch {
      /* sin runtime/D1: no-op */
    }
  }
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
};
