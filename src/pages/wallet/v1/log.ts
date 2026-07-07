/**
 * PassKit Web Service — logging de errores de Apple.
 *
 *  POST /v1/log   body: { "logs": ["mensaje", ...] }
 *
 * Apple envía aquí los errores que encuentra al hablar con tu web service. Guardarlos
 * ayuda a depurar problemas de registro/actualización en producción.
 */
import type { APIRoute } from "astro";
import { getEnv } from "@wallet/env";
import { WalletDB } from "@wallet/db";
import { empty, json } from "@wallet/http";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = getEnv(locals);
  const db = WalletDB.from(env);
  try {
    const body = (await request.json()) as { logs?: unknown };
    const logs = Array.isArray(body.logs) ? body.logs.map((l) => String(l)) : [];
    await db.writeLogs(logs);
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  return empty(200);
};
