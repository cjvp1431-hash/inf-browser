# Credencial Ejecutiva — Apple Wallet PKPass
### Veloz Pichardo Abogados · César José Veloz Pichardo · *Managing Partner*

Una **credencial ejecutiva** para Apple Wallet diseñada con lenguaje _Centurion / Apple Card_:
negro profundo, oro sutil, muchísimo espacio negativo y tipografía del sistema. No parece
una tarjeta de presentación: parece una membresía de lujo.

---

## 1. Arquitectura completa del PKPass

```
┌─────────────────────────────────────────────────────────────────┐
│  FUENTE ÚNICA DE VERDAD                                          │
│  wallet/data/contact.json  ── datos, colores, IDs, URLs         │
└───────────────┬───────────────────────────────┬────────────────┘
                │                                │
     ┌──────────▼──────────┐          ┌──────────▼───────────┐
     │  GENERACIÓN PASE    │          │  LANDING (destino QR)│
     │  scripts/*.mjs      │          │  Astro + Cloudflare  │
     │  · prepare-logo     │          │  /vp  /vp/cesar.vcf  │
     │  · generate-assets  │          └──────────┬───────────┘
     │  · build-pass-json  │                     │
     │  · build-pkpass     │        vCard · WhatsApp · Web · Correo · Mapa
     └──────────┬──────────┘
                │  firma PKCS#7 (certs/) + ZIP
     ┌──────────▼──────────┐
     │  dist/*.pkpass      │────▶ usuario lo agrega a Apple Wallet
     └──────────┬──────────┘
                │  webServiceURL
     ┌──────────▼──────────────────────────────┐
     │  WEB SERVICE (Fase 2, sección 6)         │
     │  registro de dispositivos + APNs push    │
     │  Cloudflare Worker + D1 + APNs Auth Key  │
     └──────────────────────────────────────────┘
```

**Estilo del pase:** `generic`. Es la elección correcta para una credencial (ver
[§ Por qué `generic`](#por-qué-generic)). Da el look Centurion con campos de color puro,
etiquetas en oro y el monograma como logo — sin imágenes que ensucien el frente.

---

## 2. Estructura de carpetas

```
wallet/
├── data/
│   └── contact.json                  ← EDITA AQUÍ (fuente única de verdad)
├── assets/
│   ├── logo-vp-original.png          ← logo real de la marca (azul, fondo blanco)
│   ├── master-logo-brand.png         ← azul de marca, transparente ← EN USO
│   ├── master-logo-gold.png          ← variante oro (generado)
│   └── master-logo-white.png         ← variante blanca (generado)
├── pass/
│   └── VelozPichardo.pass/           ← "carpeta cruda" del pase
│       ├── pass.json                 ← generado desde contact.json
│       ├── icon.png / @2x / @3x
│       ├── logo.png / @2x / @3x
│       ├── thumbnail.png / @2x / @3x
│       └── strip.png / @2x / @3x     ← solo para variante storeCard
├── scripts/
│   ├── prepare-logo.mjs              ← recorta + recolorea el logo real
│   ├── generate-assets.mjs           ← rasteriza PNG a dimensiones exactas
│   ├── build-pass-json.mjs           ← genera pass.json
│   └── build-pkpass.mjs              ← firma (OpenSSL) + empaqueta el .pkpass
├── certs/                            ← certificados (git-ignored, ver certs/README.md)
├── dist/                            ← .pkpass firmado (git-ignored)
├── package.json
└── README.md

src/pages/vp/                         ← landing destino del QR (Astro)
├── index.astro                       ← /vp  (tarjeta digital: botones de acción)
└── cesar.vcf.ts                      ← /vp/cesar.vcf  (endpoint vCard 3.0)

public/vp/
├── logo-gold.png                     ← logo web para la landing
└── VelozPichardo.pkpass              ← (coloca aquí el pase firmado para descargarlo)
```

### Comandos

```bash
cd wallet
npm install                 # instala sharp
npm run prepare:all         # logo + assets + pass.json
WALLET_KEY_PASS=xxx npm run build   # firma y genera dist/VelozPichardo.pkpass
# o todo junto:
WALLET_KEY_PASS=xxx npm run all
```

---

## 3. `pass.json`

Generado por `scripts/build-pass-json.mjs`. Estructura (valores reales en el archivo):

```jsonc
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.velozpichardo.card",  // del Apple Developer Portal
  "teamIdentifier": "TEAMID1234",                       // tu Team ID
  "organizationName": "Veloz Pichardo Abogados",
  "serialNumber": "VP-0001-CJVP",
  "description": "Credencial ejecutiva — Veloz Pichardo Abogados",

  "webServiceURL": "https://card.velozpichardo.com/wallet",  // APNs (Fase 2)
  "authenticationToken": "…32+ chars…",

  "backgroundColor": "rgb(11, 11, 12)",    // negro profundo
  "foregroundColor": "rgb(240, 238, 232)", // blanco cálido (valores)
  "labelColor": "rgb(198, 166, 100)",      // oro (etiquetas)
  // logoText omitido a propósito → máximo espacio negativo

  "barcodes": [{
    "format": "PKBarcodeFormatQR",
    "message": "https://card.velozpichardo.com/vp",  // ← landing
    "messageEncoding": "iso-8859-1",
    "altText": "velozpichardo.com"
  }],

  "locations": [{                          // geofencing de la oficina
    "latitude": 18.4725, "longitude": -69.9388,
    "relevantText": "Veloz Pichardo Abogados · César José Veloz Pichardo"
  }],

  "generic": {
    "primaryFields":   [{ "key": "name", "value": "César José Veloz Pichardo" }],
    "secondaryFields": [{ "key": "role", "label": "VELOZ PICHARDO ABOGADOS",
                          "value": "Managing Partner" }],
    "headerFields": [], "auxiliaryFields": [],
    "backFields": [ /* Sitio web · Correo · WhatsApp · Oficina · Guardar contacto */ ]
  }
}
```

### Organización de campos (UX)

| Zona | Campo | Contenido | Color |
| --- | --- | --- | --- |
| **Frente** | logo (arriba-izq) | Monograma **VP** (tu logo real, azul de marca) | azul |
| | header | *(vacío)* | — |
| | primary | **César José Veloz Pichardo** | blanco |
| | secondary | `VELOZ PICHARDO ABOGADOS` → Managing Partner | oro / blanco |
| **Reverso** | backFields | Sitio web · Correo · WhatsApp · Oficina · Guardar contacto | oro / blanco |
| **Barcode** | QR | → landing `/vp` | — |

Los `backFields` usan `attributedValue` con `<a href>` para que web, correo, WhatsApp y
mapa sean **tappables** directamente desde el reverso del pase.

<a name="por-qué-generic"></a>
### Por qué `generic` (y no `storeCard`/`coupon`)

- `generic` renderiza el frente **solo con color + tipografía + logo**: es el look más
  cercano a una Apple Card / Amex Centurion, con espacio negativo real.
- `storeCard`/`coupon`/`eventTicket` obligan a una **strip image** detrás de los campos.
  Una imagen de fondo compite con la tipografía y se ve más "cupón" que "credencial".
- Regla de Apple: **strip** es mutuamente excluyente con **thumbnail** y **background**.

> Igual dejamos generados `strip.png` y `thumbnail.png` por si en el futuro quieres la
> **variante storeCard** (cara "black card" full-bleed): cambia `generic` por `storeCard`
> en `build-pass-json.mjs` y usa la strip. Documentado, listo para activar.

---

## 4. Assets necesarios y dimensiones

Todos se generan desde tu **logo real** (`logo-vp-original.png`) con `sharp`, sin fuentes
externas (rasterizado determinista). Color aplicado: **azul de marca**. Para cambiar a oro
o blanco, edita la constante `LOGO` en `scripts/generate-assets.mjs`.

| Asset | @1x | @2x | @3x | Uso | ¿Requerido? |
| --- | --- | --- | --- | --- | --- |
| `icon` | 29×29 | 58×58 | 87×87 | Pantalla de bloqueo, Mail, notificaciones | **Sí** |
| `logo` | alto 50 | 100 | 150 | Monograma arriba-izquierda del frente | **Sí** |
| `thumbnail` | 90×90 | 180×180 | 270×270 | Imagen a la derecha (opcional en `generic`) | No |
| `strip` | 312×123 | 624×246 | 936×369 | Cara full-bleed (solo variante storeCard) | No |

**Reglas de imagen que respetamos:**
- `icon` **no** transparente (se ve en lock screen): tile negro + monograma + filete.
- `logo` **sí** transparente: el monograma flota sobre el negro del pase.
- Se entregan `@2x` y `@3x` (dispositivos modernos); `@1x` por compatibilidad.
- El monograma se **extrae del fondo blanco** (máscara por no-blancura con antialias) y se
  recorta, preservando la **geometría exacta** de tu marca; no se redibuja el trazo.

---

## 5. Código para generar el `.pkpass`

Cuatro scripts encadenados (`npm run all`). El firmado (`build-pkpass.mjs`) hace:

1. **`manifest.json`** — SHA-1 de cada archivo del pase.
2. **`signature`** — firma PKCS#7 *detached* (DER) del manifest, con OpenSSL:
   ```bash
   openssl smime -binary -sign \
     -certfile certs/wwdr.pem \
     -signer   certs/signerCert.pem \
     -inkey    certs/signerKey.pem \
     -in  pass/VelozPichardo.pass/manifest.json \
     -out pass/VelozPichardo.pass/signature \
     -outform DER
   ```
3. **`.pkpass`** — ZIP (sin carpeta raíz) de `pass.json` + imágenes + `manifest.json` + `signature`.

> **Verificado en este repo:** el pipeline se probó con certificados autofirmados
> desechables — los SHA-1 del manifest coinciden 13/13, la firma PKCS#7 valida contra el
> manifest y el ZIP tiene estructura plana. Solo falta reemplazar por tus certificados
> Apple reales (ver `certs/README.md`) para que Wallet lo acepte.

Alternativa Node pura (sin OpenSSL): [`passkit-generator`](https://github.com/alexandercerutti/passkit-generator)
o [`node-passbook`]. El script actual usa OpenSSL por ser cero-dependencias y estándar.

---

## 6. Recomendaciones para hospedar el servicio

### 6.1 Landing + descarga del pase (ya implementado)

Este repo es un **Cloudflare Worker (Astro)**. La landing vive en `/vp` y la vCard en
`/vp/cesar.vcf`. Para publicar:

```bash
npm run build && npm run deploy          # despliega a Cloudflare Workers
```

- Sube el `.pkpass` firmado a `public/vp/VelozPichardo.pkpass`.
- **Importante:** sírvelo con `Content-Type: application/vnd.apple.pkpass`. Si Cloudflare
  no lo infiere, añade un endpoint `src/pages/vp/[card].pkpass.ts` que lea el binario y
  fije el header (o una regla de transformación).
- Apunta un subdominio bonito, p. ej. `card.velozpichardo.com`, y pon esa URL en el QR
  (`landingURL` en `contact.json`).

### 6.2 QR dinámico

El QR del pase apunta a `landingURL` (una URL fija y corta). "Dinámico" = el **destino no
cambia, pero su contenido sí**: editas la landing (o rediriges) sin re-emitir el pase.
Para métricas/redirección server-side, haz que `/vp` sea un endpoint que registre la
visita y luego renderice — o usa un acortador propio con analytics.

### 6.3 Actualizaciones automáticas vía APNs (PassKit Web Service)

Apple Wallet refresca un pase llamando a tu `webServiceURL`. Necesitas implementar la
**PassKit Web Service REST API** y empujar cambios con **APNs**. Encaja perfecto en este
Worker (Astro API routes + D1 + Cloudflare como cliente APNs HTTP/2).

**Endpoints a implementar** (base = `webServiceURL`, Apple añade `/v1/...`):

| Método | Ruta | Función |
| --- | --- | --- |
| POST | `/v1/devices/{deviceLibId}/registrations/{passTypeId}/{serial}` | Registrar dispositivo |
| DELETE | `/v1/devices/{deviceLibId}/registrations/{passTypeId}/{serial}` | Dar de baja |
| GET | `/v1/devices/{deviceLibId}/registrations/{passTypeId}?passesUpdatedSince=…` | Seriales con cambios |
| GET | `/v1/passes/{passTypeId}/{serial}` | Devolver el `.pkpass` actualizado |
| POST | `/v1/log` | Log de errores de Apple |

Todas exigen header `Authorization: ApplePass {authenticationToken}` (el de `pass.json`).

**Almacenamiento (Cloudflare D1):**

```sql
CREATE TABLE registrations (
  device_lib_id   TEXT NOT NULL,
  serial          TEXT NOT NULL,
  push_token      TEXT NOT NULL,
  pass_type_id    TEXT NOT NULL,
  updated_at      INTEGER NOT NULL,
  PRIMARY KEY (device_lib_id, serial)
);
```

**Empujar una actualización** (cuando cambian los datos del pase):

1. Actualiza `updated_at` de los seriales afectados.
2. Por cada `push_token` registrado, envía un push APNs **vacío** (`{}`) al topic =
   `passTypeIdentifier`, autenticando con un **APNs Auth Key (.p8)** vía JWT ES256:

```js
// Cloudflare Worker: notificar a Apple que hay cambios (payload vacío).
async function pushWalletUpdate(pushToken, env) {
  const jwt = await makeES256JWT({          // firma con tu .p8 (env.APNS_KEY)
    iss: env.APNS_TEAM_ID, kid: env.APNS_KEY_ID,
  });
  await fetch(`https://api.push.apple.com/3/device/${pushToken}`, {
    method: "POST",
    headers: {
      "authorization": `bearer ${jwt}`,
      "apns-topic": env.PASS_TYPE_ID,        // = passTypeIdentifier
      "apns-push-type": "background",
      "apns-priority": "5",
    },
    body: "{}",                              // Wallet ignora el cuerpo; solo dispara refresh
  });
}
```

3. Apple llama a `GET /v1/passes/…`; devuelves el `.pkpass` re-firmado con los datos nuevos
   y header `Last-Modified`. Wallet actualiza el pase en segundo plano.

**Auth Key APNs:** en Apple Developer → Keys → **+** → *Apple Push Notification service (APNs)*
→ descarga el `.p8` (guárdalo como secreto de Worker, nunca en git). Un solo `.p8` sirve
para todos tus topics.

> Fase 2 opcional: la credencial funciona perfectamente **sin** web service. Solo lo
> necesitas si quieres **actualizar pases ya instalados** (p. ej. cambiar el cargo, el
> teléfono o mostrar un mensaje) sin que la persona vuelva a escanear el QR.

### 6.4 Alternativas de hosting

- **Todo en Cloudflare** (recomendado): Worker + D1 + secretos. Cero servidores, HTTP/2 a APNs.
- PassKit administrado (PassSlot, Passcreator, Urban Airship Wallet) si no quieres operar
  la firma ni el web service — a cambio de costo recurrente y menos control del diseño.

---

## 7. Diseño visual — Human Interface Guidelines

**Principios aplicados** ([HIG · Wallet](https://developer.apple.com/design/human-interface-guidelines/wallet)):

- **Jerarquía clara y mínima.** Frente = 3 elementos (logo, nombre, cargo). Nada más.
  El campo primario (nombre) es el ancla; el secundario (firma → cargo) lo apoya.
- **Color con propósito.** Fondo negro (`rgb(11,11,12)`), valores en blanco cálido,
  **etiquetas en oro** (`rgb(198,166,100)`). El oro es acento, no relleno → "muy sutil".
- **Contraste AA.** Blanco cálido sobre negro y oro sobre negro superan 4.5:1.
- **Tipografía del sistema.** Apple renderiza San Francisco automáticamente; no incrustamos
  fuentes → consistente, legible, nativo. Etiquetas en mayúsculas con tracking = tono premium.
- **Espacio negativo.** Sin `logoText`, sin header, sin campos auxiliares. El vacío
  comunica lujo (código Centurion).
- **Logo, no texto, para la marca.** El monograma VP real (azul de marca) va como `logo`
  (arriba-izq), reforzando identidad sin ruido. El oro queda para la tipografía de acento.
- **Reverso = acción.** Todo lo "operativo" (contacto, enlaces, mapa) vive en el reverso,
  tappable. El frente se mantiene ceremonial.
- **QR discreto.** El código de barras QR queda al pie; su `altText` da fallback textual.
- **Relevancia contextual.** `locations` hace que el pase aparezca en la pantalla de
  bloqueo al llegar a la oficina.
- **Coherencia con la landing.** La web destino usa el mismo negro/oro/tipografía del
  sistema → una sola experiencia de marca del QR a la pantalla.

### Paleta

| Rol | Valor | Uso |
| --- | --- | --- |
| Negro profundo | `#0B0B0C` / `rgb(11,11,12)` | Fondo del pase y la web |
| Blanco cálido | `#F0EEE8` / `rgb(240,238,232)` | Nombre y valores |
| Oro | `#C6A664` / `rgb(198,166,100)` | Etiquetas, acentos, monograma |
| Oro apagado | `#8C7A4E` | Filetes, detalles secundarios |

---

## Antes de producción — checklist

- [ ] Reemplazar en `data/contact.json`: web, correo, teléfono/WhatsApp reales,
      dirección + `latitude`/`longitude` exactas de la oficina.
- [ ] `passTypeIdentifier`, `teamIdentifier` reales (Apple Developer).
- [ ] `authenticationToken` = cadena aleatoria ≥ 16 chars (`openssl rand -hex 24`).
- [ ] `webServiceURL` / `landingURL` con tu dominio real.
- [ ] Colocar certificados en `certs/` (ver `certs/README.md`) y `npm run all`.
- [ ] Subir `.pkpass` a `public/vp/` y desplegar (`npm run deploy`).
- [ ] Probar el QR y el botón "Agregar a Apple Wallet" en un iPhone real.
```
