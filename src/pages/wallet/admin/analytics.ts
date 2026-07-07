/**
 * Admin — resumen de analíticas.
 *
 *  GET /wallet/admin/analytics
 *  Authorization: Bearer <ADMIN_TOKEN>
 *
 * Devuelve: instalaciones activas, totales por evento y desglose diario (14 días).
 * Eventos: install, uninstall, pass_download, view_landing, click_whatsapp, click_web,
 *          click_email, click_office, download_vcard, revoke.
 */
import type { APIRoute } from "astro";
import { getEnv } from "@wallet/env";
import { WalletDB } from "@wallet/db";
import { json, verifyAdmin } from "@wallet/http";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const env = getEnv(locals);
  if (!verifyAdmin(request, env.ADMIN_TOKEN)) return json({ error: "unauthorized" }, 401);

  const db = WalletDB.from(env);
  const summary = await db.analyticsSummary();
  return json({ ok: true, generatedAt: new Date().toISOString(), ...summary });
};
