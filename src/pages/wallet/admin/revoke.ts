/**
 * Admin — revoca (o reactiva) un pase.
 *
 *  POST /wallet/admin/revoke
 *  Authorization: Bearer <ADMIN_TOKEN>
 *  body: { "serialNumber": "VP-0001-CJVP", "revoked": true }
 *
 * Al revocar, se notifica a los dispositivos: al re-descargar el pase reciben 401 y Wallet
 * lo elimina automáticamente. `revoked: false` reactiva el pase.
 */
import type { APIRoute } from "astro";
import { getEnv } from "@wallet/env";
import { WalletDB } from "@wallet/db";
import { pushMany } from "@wallet/apns";
import { json, verifyAdmin } from "@wallet/http";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = getEnv(locals);
  if (!verifyAdmin(request, env.ADMIN_TOKEN)) return json({ error: "unauthorized" }, 401);

  let serial = "";
  let revoked = true;
  try {
    const b = (await request.json()) as { serialNumber?: string; revoked?: boolean };
    serial = b.serialNumber ?? "";
    revoked = b.revoked ?? true;
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  if (!serial) return json({ error: "missing_serialNumber" }, 400);

  const db = WalletDB.from(env);
  const pass = await db.getPass(env.PASS_TYPE_ID, serial);
  if (!pass) return json({ error: "unknown_pass" }, 404);

  await db.setRevoked(env.PASS_TYPE_ID, serial, revoked);
  if (revoked) await db.track("revoke", { serial, passTypeId: env.PASS_TYPE_ID });

  const tokens = await db.pushTokensForSerial(env.PASS_TYPE_ID, serial);
  let apnsError: string | undefined;
  try {
    const results = await pushMany(env, tokens);
    const invalid = results.filter((r) => r.invalid);
    for (const r of invalid) await db.deleteByPushToken(r.token);
  } catch (e) {
    apnsError = e instanceof Error ? e.message : "apns_error";
  }

  return json({ ok: true, serialNumber: serial, revoked, devicesNotified: tokens.length, ...(apnsError ? { apnsError } : {}) });
};
