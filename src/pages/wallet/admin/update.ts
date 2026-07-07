/**
 * Admin — dispara una actualización de pase vía APNs.
 *
 *  POST /wallet/admin/update
 *  Authorization: Bearer <ADMIN_TOKEN>
 *  body: { "serialNumber": "VP-0001-CJVP" }
 *
 * Marca el pase como modificado y notifica a todos los dispositivos registrados.
 * (Antes debiste subir el nuevo .pkpass firmado a R2/assets.)
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
  try {
    serial = ((await request.json()) as { serialNumber?: string }).serialNumber ?? "";
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  if (!serial) return json({ error: "missing_serialNumber" }, 400);

  const db = WalletDB.from(env);
  const pass = await db.getPass(env.PASS_TYPE_ID, serial);
  if (!pass) return json({ error: "unknown_pass" }, 404);

  const updatedAt = await db.touchPass(env.PASS_TYPE_ID, serial);
  const tokens = await db.pushTokensForSerial(env.PASS_TYPE_ID, serial);

  // El pase queda marcado como modificado aunque APNs no esté configurado; Wallet
  // igual lo refrescará en su próximo sondeo. El push solo acelera la entrega.
  let delivered = 0;
  let removedInvalid = 0;
  let apnsError: string | undefined;
  try {
    const results = await pushMany(env, tokens);
    const invalid = results.filter((r) => r.invalid);
    for (const r of invalid) await db.deleteByPushToken(r.token);
    delivered = results.filter((r) => r.status === 200).length;
    removedInvalid = invalid.length;
  } catch (e) {
    apnsError = e instanceof Error ? e.message : "apns_error";
  }

  return json({
    ok: true,
    serialNumber: serial,
    updatedAt,
    devicesNotified: tokens.length,
    delivered,
    removedInvalid,
    ...(apnsError ? { apnsError } : {}),
  });
};
