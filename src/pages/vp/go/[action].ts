/**
 * Redirección con tracking para las acciones de la landing.
 *
 *  GET /vp/go/{action}   action ∈ whatsapp | web | email | office
 *
 * Registra el clic (best-effort) y hace 302 al destino real. Así medimos clics sin
 * depender de JavaScript ni exponer analíticas en el cliente.
 */
import type { APIRoute } from "astro";
import contact from "../../../../wallet/data/contact.json";
import { getEnv, waitUntil } from "@wallet/env";
import { WalletDB, type AnalyticsEvent } from "@wallet/db";

export const prerender = false;

const enc = encodeURIComponent;
const c = contact.contact;

const TARGETS: Record<string, { url: string; event: AnalyticsEvent }> = {
  whatsapp: {
    url: `https://wa.me/${c.whatsappNumber}?text=${enc(c.whatsappMessage)}`,
    event: "click_whatsapp",
  },
  web: { url: c.website, event: "click_web" },
  email: { url: `mailto:${c.email}`, event: "click_email" },
  office: {
    url: `https://maps.apple.com/?ll=${c.address.latitude},${c.address.longitude}&q=${enc(contact.identity.organization)}`,
    event: "click_office",
  },
};

export const GET: APIRoute = async ({ params, locals, request }) => {
  const target = TARGETS[(params.action ?? "").toLowerCase()];
  if (!target) return new Response("Not found", { status: 404 });

  // Tracking best-effort: nunca debe impedir la redirección.
  try {
    const env = getEnv(locals);
    const db = WalletDB.from(env);
    waitUntil(
      locals,
      db.track(target.event, { userAgent: request.headers.get("user-agent") }).catch(() => {}),
    );
  } catch {
    /* sin runtime/D1: seguimos igual */
  }

  return new Response(null, { status: 302, headers: { location: target.url, "cache-control": "no-store" } });
};
