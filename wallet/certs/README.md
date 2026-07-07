# Certificados de firma (NO se versionan)

Este directorio contiene material sensible. Todo `*.pem`, `*.p12`, `*.key`, `*.cer`
está ignorado por git (ver `.gitignore` en la raíz). **Nunca** subas estas claves.

Para firmar el `.pkpass` necesitas 3 archivos aquí:

| Archivo | Qué es |
| --- | --- |
| `signerCert.pem` | Certificado **Pass Type ID** (parte pública) |
| `signerKey.pem`  | Clave privada de ese certificado |
| `wwdr.pem`       | Intermedia **Apple WWDR** (G4) |

## 1. Crear el Pass Type ID + certificado

En [Apple Developer](https://developer.apple.com/account) → Certificates, Identifiers & Profiles:

1. **Identifiers → Pass Type IDs → +** → crea `pass.com.velozpichardo.card`
   (debe coincidir con `passTypeIdentifier` en `data/contact.json`).
2. Genera un certificado para ese Pass Type ID (sube un CSR desde Acceso a Llaveros
   o desde OpenSSL). Descarga `pass.cer`.
3. Anota tu **Team ID** (arriba a la derecha) y ponlo en `teamIdentifier`.

## 2. Convertir a PEM

```bash
# Certificado del pase (público)
openssl x509 -inform DER -in pass.cer -out certs/signerCert.pem

# Si exportaste un .p12 desde Llaveros (cert + clave):
openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out certs/signerCert.pem -legacy
openssl pkcs12 -in Certificates.p12 -nocerts -out certs/signerKey.pem -legacy
#   -> te pedirá una passphrase para la clave; úsala como WALLET_KEY_PASS al firmar.

# Intermedia WWDR G4 (https://www.apple.com/certificateauthority/)
openssl x509 -inform DER -in AppleWWDRCAG4.cer -out certs/wwdr.pem
```

## 3. Firmar

```bash
cd wallet
WALLET_KEY_PASS='tu-passphrase' npm run build
# -> dist/VelozPichardo.pkpass
```

## Rotación / expiración

Los certificados Pass Type ID **caducan al año**. Cuando renuevas, la firma de pases
nuevos usa el cert nuevo; los pases ya instalados siguen funcionando. Programa un
recordatorio y re-firma antes del vencimiento.
