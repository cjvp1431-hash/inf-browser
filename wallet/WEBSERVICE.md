# Apple Wallet Web Service — Fase 2

Servicio completo de actualización de pases sobre **Cloudflare Workers (Astro) + D1 + R2 + APNs**,
conforme a la [PassKit Web Service Reference](https://developer.apple.com/documentation/walletpasses)
de Apple. Incluye registro de dispositivos, entrega de pases, actualizaciones vía APNs,
revocaciones, autenticación, logging y una capa de analíticas.

> El pase se **firma offline** (donde viven los certificados, ver `README.md` §5). El Worker
> nunca maneja la clave del certificado del pase: solo sirve bytes ya firmados y orquesta
> registros/pushes. La única clave en el Worker es el **Auth Key APNs (.p8)**, como secreto.

---

## Arquitectura

```
 iPhone (Wallet)                 Cloudflare Worker (Astro)              Apple APNs
 ───────────────                 ─────────────────────────              ──────────
   añade el pase  ──register──▶  POST /v1/devices/…                     
                                   └─ guarda (device, serial, pushToken) en D1
                                   └─ analítica: install
   (más tarde)                                                          
   admin cambia datos ─────────▶  POST /wallet/admin/update  ──push {}──▶  api.push.apple.com
                                   └─ touch updated_at (D1)                    │
                                                                              ▼
   Wallet recibe push  ◀───────────────────────────────────────────  notifica al device
   pide cambios   ──GET──────▶   GET /v1/devices/…/registrations/…?passesUpdatedSince=
                                   └─ devuelve [serials] con updated_at > tag
   descarga pase  ──GET──────▶   GET /v1/passes/{type}/{serial}
                                   └─ 401 si revocado · 304 si sin cambios
                                   └─ sirve .pkpass desde R2 (o assets)
```

**Componentes (código):**

| Archivo | Rol |
| --- | --- |
| `src/lib/wallet/env.ts` | Acceso tipado a bindings + `waitUntil` |
| `src/lib/wallet/http.ts` | Respuestas, `timingSafeEqual`, parseo de auth |
| `src/lib/wallet/db.ts` | Repositorio D1 (registros, pases, logs, analíticas) |
| `src/lib/wallet/apns.ts` | JWT ES256 (Web Crypto) + push HTTP/2 a APNs |
| `src/lib/wallet/passStore.ts` | Carga del binario `.pkpass` (R2 → assets) |
| `src/pages/wallet/v1/**` | Endpoints oficiales de Apple |
| `src/pages/wallet/admin/**` | Operación: alta, update, revoke, analytics, health |
| `src/pages/vp/go/[action].ts`, `px.ts` | Analíticas de la landing (clics y vistas) |

---

## Endpoints

### Oficiales de Apple (base = `webServiceURL`, Apple añade `/v1`)

| Método | Ruta | Auth | Respuestas |
| --- | --- | --- | --- |
| POST | `/v1/devices/{device}/registrations/{passType}/{serial}` | `ApplePass` | 201 nuevo · 200 ya existía · 401 · 404 |
| DELETE | `/v1/devices/{device}/registrations/{passType}/{serial}` | `ApplePass` | 200 · 401 |
| GET | `/v1/devices/{device}/registrations/{passType}?passesUpdatedSince=` | — | 200 `{lastUpdated, serialNumbers}` · 204 |
| GET | `/v1/passes/{passType}/{serial}` | `ApplePass` | 200 `.pkpass` · 304 · 401 revocado · 404 |
| POST | `/v1/log` | — | 200 |

### Administración (auth `Authorization: Bearer <ADMIN_TOKEN>`)

| Método | Ruta | Función |
| --- | --- | --- |
| POST | `/wallet/admin/passes` | Alta/actualización del token esperado de un pase |
| POST | `/wallet/admin/update` | Marca modificado + push APNs a los dispositivos |
| POST | `/wallet/admin/revoke` | Revoca/reactiva + push (Wallet elimina el pase) |
| GET | `/wallet/admin/analytics` | Resumen de instalaciones y clics |
| GET | `/wallet/admin/health` | Diagnóstico de configuración (sin secretos) |

---

## Puesta en marcha

### 1. Base de datos D1

```bash
npx wrangler d1 create vp_wallet
# copia el database_id devuelto a wrangler.json → d1_databases[0].database_id
npx wrangler d1 execute vp_wallet --remote --file wallet/db/schema.sql
```

### 2. Bucket R2 (binarios de pases)

```bash
npx wrangler r2 bucket create vp-wallet-passes
# Sube el pase firmado por serial:
npx wrangler r2 object put vp-wallet-passes/passes/VP-0001-CJVP.pkpass \
  --file wallet/dist/VelozPichardo.pkpass
```
> Sin R2, el Worker sirve `public/vp/VelozPichardo.pkpass` (caso de una sola tarjeta).

### 3. Secretos

```bash
npx wrangler secret put ADMIN_TOKEN       # p.ej. openssl rand -hex 24
npx wrangler secret put APNS_TEAM_ID      # Team ID de Apple Developer
npx wrangler secret put APNS_KEY_ID       # Key ID del Auth Key APNs (.p8)
npx wrangler secret put APNS_AUTH_KEY     # pega el contenido del .p8 (PEM PKCS#8)
```
El **Auth Key APNs** se crea en Apple Developer → Keys → **+** → *Apple Push Notification
service (APNs)*. Un solo `.p8` sirve para todos los topics de tu cuenta.

### 4. Vincular pase ↔ web service

En `wallet/data/contact.json`:
- `pass.webServiceURL` = `https://TU-DOMINIO/wallet`
- `pass.authenticationToken` = token aleatorio (`openssl rand -hex 24`)

Regenera y firma el pase (`cd wallet && npm run all`), súbelo a R2/assets y registra su token:

```bash
curl -X POST https://TU-DOMINIO/wallet/admin/passes \
  -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"serialNumber":"VP-0001-CJVP","authToken":"<mismo authenticationToken>"}'
```

### 5. Desplegar

```bash
npm run build && npm run deploy
```

---

## Operación

**Publicar un cambio de datos del pase** (p. ej. nuevo teléfono):

```bash
cd wallet && npm run all                      # 1. regenera y firma el .pkpass
wrangler r2 object put vp-wallet-passes/passes/VP-0001-CJVP.pkpass \
  --file dist/VelozPichardo.pkpass            # 2. sube el binario nuevo
curl -X POST https://TU-DOMINIO/wallet/admin/update \
  -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"serialNumber":"VP-0001-CJVP"}'        # 3. push a los dispositivos
```

**Revocar un pase:**

```bash
curl -X POST https://TU-DOMINIO/wallet/admin/revoke \
  -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"serialNumber":"VP-0001-CJVP","revoked":true}'
```

**Ver analíticas:**

```bash
curl https://TU-DOMINIO/wallet/admin/analytics -H "authorization: Bearer $ADMIN_TOKEN"
```
```jsonc
{
  "activeInstalls": 1,                       // registros vigentes
  "totals": { "install": 12, "uninstall": 3, "view_landing": 40,
              "click_whatsapp": 9, "click_web": 5, "download_vcard": 7 },
  "daily": [ { "day": "2026-07-07", "event": "install", "count": 4 }, ... ]
}
```

---

## Analíticas — cómo se miden

| Evento | Origen |
| --- | --- |
| `install` / `uninstall` | Registro/baja de dispositivo (endpoints de Apple) |
| `pass_download` | Descarga/actualización del `.pkpass` |
| `view_landing` | Beacon `navigator.sendBeacon` en `/vp` |
| `click_whatsapp` / `click_web` / `click_email` / `click_office` | Redirección `/vp/go/{action}` |
| `download_vcard` | Endpoint `/vp/cesar.vcf` |
| `revoke` | Acción de revocación |

Privacidad: no se guarda IP en claro (solo un hash SHA-256 truncado) ni cookies.

---

## Notas de seguridad

- **Auth por token, sin cookies.** Endpoints de Apple: `Authorization: ApplePass <token>`
  comparado en **tiempo constante**. Admin: `Authorization: Bearer <ADMIN_TOKEN>`.
- **CSRF (`checkOrigin`) desactivado** en `astro.config.mjs`: Apple/APNs son clientes
  máquina-a-máquina sin `Origin`; como no hay auth por cookies, no hay riesgo CSRF.
- **Secretos** solo vía `wrangler secret` (nunca en git). `.dev.vars` está ignorado.
- **Pase revocado** → `GET /v1/passes` responde 401 y Wallet elimina el pase del dispositivo.
- **Tokens push inválidos** (APNs 410 / BadDeviceToken) se eliminan automáticamente.

## Notas de APNs

- Host: `api.push.apple.com` (prod) o `api.sandbox.push.apple.com` (var `APNS_HOST`).
- Push de payload vacío `{}`, `apns-topic` = `passTypeIdentifier`, `apns-push-type: background`,
  `apns-priority: 5`.
- El JWT de proveedor (ES256) se firma con Web Crypto y se **cachea ~50 min** (Apple permite
  reusarlo hasta 1 h). Verificado con round-trip de firma/verificación P-256.

---

## Pruebas locales

```bash
printf 'ADMIN_TOKEN=testadmin\n' > .dev.vars
npx wrangler d1 execute vp_wallet --local --file wallet/db/schema.sql
npm run build && npx wrangler dev --local
# En otra terminal, ejercita los endpoints con curl (ver ejemplos arriba).
```

Este web service se probó de extremo a extremo con D1 local: registro (201/200/401/404),
lista de actualizaciones, revocación (→401), baja (200), logging y analíticas. La firma
ES256 de APNs se validó con verificación de clave pública.
