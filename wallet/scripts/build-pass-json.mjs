#!/usr/bin/env node
/**
 * Genera pass/VelozPichardo.pass/pass.json a partir de data/contact.json.
 * Uso: node scripts/build-pass-json.mjs
 *
 * Estilo: `generic` (credencial ejecutiva). Se eligió generic sobre storeCard/coupon
 * porque maximiza el espacio negativo y da el look "Centurion": campos de color puro,
 * etiquetas en oro, monograma como logo. (Ver README, sección "Por qué generic".)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const c = JSON.parse(readFileSync(join(ROOT, "data", "contact.json"), "utf8"));

const enc = encodeURIComponent;
const waURL = `https://wa.me/${c.contact.whatsappNumber}?text=${enc(c.contact.whatsappMessage)}`;
const webHost = c.contact.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
const mapsURL = `https://maps.apple.com/?ll=${c.contact.address.latitude},${c.contact.address.longitude}&q=${enc(c.pass.organizationName)}`;

const pass = {
  formatVersion: 1,

  // --- Identidad del pase (del Apple Developer Portal) ---
  passTypeIdentifier: c.pass.passTypeIdentifier,
  teamIdentifier: c.pass.teamIdentifier,
  organizationName: c.pass.organizationName,
  serialNumber: c.pass.serialNumber,
  description: c.pass.description,

  // --- Actualizaciones automáticas vía APNs (PassKit Web Service) ---
  webServiceURL: c.pass.webServiceURL,
  authenticationToken: c.pass.authenticationToken,

  // --- Paleta: negro profundo, texto blanco cálido, etiquetas oro ---
  backgroundColor: c.colors.background,
  foregroundColor: c.colors.foreground,
  labelColor: c.colors.label,
  // logoText omitido a propósito: máximo espacio negativo en el encabezado.

  // --- Código de barras (QR) hacia la landing page ---
  barcodes: [
    {
      format: "PKBarcodeFormatQR",
      message: c.pass.landingURL,
      messageEncoding: "iso-8859-1",
      altText: webHost,
    },
  ],

  // --- Geolocalización de la oficina (relevancia en pantalla de bloqueo) ---
  locations: [
    {
      latitude: c.contact.address.latitude,
      longitude: c.contact.address.longitude,
      relevantText: `${c.identity.organization} · ${c.identity.fullName}`,
    },
  ],

  // --- Contenido del pase ---
  generic: {
    // FRENTE — solo 3 elementos + logo (monograma VP arriba a la izquierda)
    headerFields: [],
    primaryFields: [
      {
        key: "name",
        value: c.identity.fullName,
      },
    ],
    secondaryFields: [
      {
        key: "role",
        label: c.identity.organization.toUpperCase(),
        value: c.identity.title,
      },
    ],
    auxiliaryFields: [],

    // REVERSO — acciones y datos de contacto (enlaces tappables)
    backFields: [
      {
        key: "web",
        label: "SITIO WEB",
        value: webHost,
        attributedValue: `<a href="${c.contact.website}">${webHost}</a>`,
      },
      {
        key: "email",
        label: "CORREO",
        value: c.contact.email,
        attributedValue: `<a href="mailto:${c.contact.email}">${c.contact.email}</a>`,
      },
      {
        key: "whatsapp",
        label: "WHATSAPP",
        value: c.contact.phoneDisplay,
        attributedValue: `<a href="${waURL}">Enviar mensaje &rsaquo;</a>`,
      },
      {
        key: "office",
        label: "OFICINA",
        value: c.contact.address.oneLine,
        attributedValue: `<a href="${mapsURL}">${c.contact.address.street}, ${c.contact.address.city}</a>`,
      },
      {
        key: "save",
        label: "GUARDAR CONTACTO",
        value: "Escanea el QR o toca aquí para guardar la vCard, abrir WhatsApp, visitar la web o escribir un correo.",
        attributedValue: `<a href="${c.pass.landingURL}">Abrir tarjeta digital &rsaquo;</a>`,
      },
      {
        key: "legal",
        label: " ",
        value: `${c.identity.organization} · Todos los derechos reservados.`,
      },
    ],
  },
};

const outPath = join(ROOT, "pass", "VelozPichardo.pass", "pass.json");
writeFileSync(outPath, JSON.stringify(pass, null, 2) + "\n", "utf8");
console.log("✓ pass.json generado en", outPath);
