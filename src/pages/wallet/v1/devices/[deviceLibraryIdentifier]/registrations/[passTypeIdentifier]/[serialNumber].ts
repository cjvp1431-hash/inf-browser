/**
 * PassKit Web Service — registro y baja de un dispositivo para un pase.
 *
 *  POST   /v1/devices/{deviceLibraryId}/registrations/{passTypeId}/{serial}
 *  DELETE /v1/devices/{deviceLibraryId}/registrations/{passTypeId}/{serial}
 *
 * Autenticación: header `Authorization: ApplePass <authenticationToken>`.
 * Docs: developer.apple.com/documentation/walletpasses (Register/Unregister a Device).
 */
import type { APIRoute } from "astro";
import { getEnv, waitUntil } from "@wallet/env";
import { WalletDB, hashIp } from "@wallet/db";
import { empty, json, parseApplePassToken, timingSafeEqual } from "@wallet/http";

export const prerender = false;

async function authorize(request: Request, db: WalletDB, passTypeId: string, serial: string) {
  const pass = await db.getPass(passTypeId, serial);
  if (!pass) return { ok: false as const, status: 404, pass: null };
  const token = parseApplePassToken(request);
  if (!token || !timingSafeEqual(token, pass.auth_token)) {
    return { ok: false as const, status: 401, pass };
  }
  return { ok: true as const, status: 200, pass };
}

export const POST: APIRoute = async ({ params, request, locals, clientAddress }) => {
  const env = getEnv(locals);
  const db = WalletDB.from(env);
  const { deviceLibraryIdentifier: device, passTypeIdentifier: passType, serialNumber: serial } = params as Record<string, string>;

  const auth = await authorize(request, db, passType, serial);
  if (!auth.ok) return empty(auth.status);
  if (auth.pass?.revoked) return empty(401); // pase revocado → el dispositivo lo elimina

  let pushToken = "";
  try {
    pushToken = ((await request.json()) as { pushToken?: string }).pushToken ?? "";
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  if (!pushToken) return json({ error: "missing_pushToken" }, 400);

  const result = await db.registerDevice(device, passType, serial, pushToken);

  if (result === "created") {
    waitUntil(
      locals,
      db.track("install", {
        serial,
        passTypeId: passType,
        userAgent: request.headers.get("user-agent"),
        ipHash: await hashIp(clientAddress ?? null),
      }),
    );
    return empty(201); // primer registro de este dispositivo
  }
  return empty(200); // ya estaba registrado (push token actualizado)
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const env = getEnv(locals);
  const db = WalletDB.from(env);
  const { deviceLibraryIdentifier: device, passTypeIdentifier: passType, serialNumber: serial } = params as Record<string, string>;

  const auth = await authorize(request, db, passType, serial);
  if (!auth.ok) return empty(auth.status);

  const removed = await db.unregisterDevice(device, passType, serial);
  if (removed) {
    waitUntil(locals, db.track("uninstall", { serial, passTypeId: passType }));
  }
  return empty(200);
};
