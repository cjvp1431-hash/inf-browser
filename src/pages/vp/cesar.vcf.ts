import type { APIRoute } from "astro";
import contact from "../../../wallet/data/contact.json";
import { getEnv, waitUntil } from "@wallet/env";
import { WalletDB } from "@wallet/db";

export const prerender = false;

// Endpoint vCard 3.0 -> /vp/cesar.vcf
// Al abrirse en iOS/Android/macOS ofrece "Agregar a Contactos".
export const GET: APIRoute = ({ locals, request }) => {
  const c = contact.contact;
  const id = contact.identity;
  const a = c.address;

  // Tracking best-effort de descarga de vCard.
  try {
    const db = WalletDB.from(getEnv(locals));
    waitUntil(locals, db.track("download_vcard", { userAgent: request.headers.get("user-agent") }).catch(() => {}));
  } catch {
    /* sin runtime/D1: seguimos igual */
  }

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${id.lastName};${id.firstName};;;`,
    `FN:${id.fullName}`,
    `ORG:${id.organization}`,
    `TITLE:${id.title}`,
    `TEL;TYPE=CELL,VOICE:${c.phoneE164}`,
    `EMAIL;TYPE=INTERNET,WORK:${c.email}`,
    `URL:${c.website}`,
    `ADR;TYPE=WORK:;;${a.street};${a.city};${a.region};;${a.country}`,
    `X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${c.whatsappNumber}`,
    `NOTE:${id.organization} — ${id.title}`,
    "END:VCARD",
  ];

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="Cesar-Veloz-Pichardo.vcf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
};
