/**
 * Admin — alta/actualización del registro de un pase (token esperado por serial).
 *
 *  POST /wallet/admin/passes
 *  Authorization: Bearer <ADMIN_TOKEN>
 *  body: { "serialNumber": "VP-0001-CJVP", "authToken": "<mismo de pass.json>" }
 *
 * Debe ejecutarse una vez por cada pase emitido, para que el web service conozca su token.
 */
import type { APIRoute } from "astro";
import { getEnv } from "@wallet/env";
import { WalletDB } from "@wallet/db";
import { json, verifyAdmin } from "@wallet/http";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = getEnv(locals);
  if (!verifyAdmin(request, env.ADMIN_TOKEN)) return json({ error: "unauthorized" }, 401);

  let serialNumber = "";
  let authToken = "";
  try {
    const b = (await request.json()) as { serialNumber?: string; authToken?: string };
    serialNumber = b.serialNumber ?? "";
    authToken = b.authToken ?? "";
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  if (!serialNumber || !authToken) return json({ error: "missing_fields" }, 400);

  const db = WalletDB.from(env);
  await db.upsertPass(env.PASS_TYPE_ID, serialNumber, authToken);
  return json({ ok: true, passTypeId: env.PASS_TYPE_ID, serialNumber });
};
