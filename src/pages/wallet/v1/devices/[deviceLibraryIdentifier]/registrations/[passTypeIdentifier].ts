/**
 * PassKit Web Service — seriales que necesitan actualización para un dispositivo.
 *
 *  GET /v1/devices/{deviceLibraryId}/registrations/{passTypeId}?passesUpdatedSince={tag}
 *
 * Respuesta 200: { "lastUpdated": "<tag>", "serialNumbers": [...] }
 * Respuesta 204: no hay nada nuevo.
 * Este endpoint NO lleva Authorization (así lo define Apple).
 */
import type { APIRoute } from "astro";
import { getEnv } from "@wallet/env";
import { WalletDB } from "@wallet/db";
import { empty, json } from "@wallet/http";

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
  const env = getEnv(locals);
  const db = WalletDB.from(env);
  const { deviceLibraryIdentifier: device, passTypeIdentifier: passType } = params as Record<string, string>;

  const sinceTag = url.searchParams.get("passesUpdatedSince");
  const { serialNumbers, lastUpdated } = await db.serialsToUpdate(device, passType, sinceTag);

  if (serialNumbers.length === 0) return empty(204);
  return json({ lastUpdated, serialNumbers });
};
