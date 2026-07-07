/**
 * Admin — health check y diagnóstico de configuración (sin exponer secretos).
 *
 *  GET /wallet/admin/health   Authorization: Bearer <ADMIN_TOKEN>
 */
import type { APIRoute } from "astro";
import { getEnv } from "@wallet/env";
import { WalletDB } from "@wallet/db";
import { json, verifyAdmin } from "@wallet/http";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const env = getEnv(locals);
  if (!verifyAdmin(request, env.ADMIN_TOKEN)) return json({ error: "unauthorized" }, 401);

  let dbOk = false;
  try {
    await WalletDB.from(env).analyticsSummary();
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return json({
    ok: dbOk,
    passTypeId: env.PASS_TYPE_ID,
    config: {
      d1: dbOk,
      r2PassBucket: Boolean(env.PASS_BUCKET),
      assetsFallback: Boolean(env.ASSETS),
      apns: Boolean(env.APNS_AUTH_KEY && env.APNS_KEY_ID && env.APNS_TEAM_ID),
      apnsHost: env.APNS_HOST || "api.push.apple.com",
    },
  });
};
