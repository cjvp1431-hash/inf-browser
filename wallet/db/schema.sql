-- Esquema del Apple Wallet Web Service (Cloudflare D1).
-- Aplicar:  wrangler d1 execute vp_wallet --file wallet/db/schema.sql   (--local para dev)

-- Registro de dispositivos que reciben push para un pase.
CREATE TABLE IF NOT EXISTS registrations (
  device_library_id TEXT NOT NULL,
  pass_type_id      TEXT NOT NULL,
  serial_number     TEXT NOT NULL,
  push_token        TEXT NOT NULL,
  created_at        INTEGER NOT NULL,      -- epoch ms
  PRIMARY KEY (device_library_id, pass_type_id, serial_number)
);
CREATE INDEX IF NOT EXISTS idx_reg_serial ON registrations (pass_type_id, serial_number);
CREATE INDEX IF NOT EXISTS idx_reg_device ON registrations (device_library_id, pass_type_id);
CREATE INDEX IF NOT EXISTS idx_reg_push   ON registrations (push_token);

-- Un registro por pase emitido: token esperado, versión y estado de revocación.
CREATE TABLE IF NOT EXISTS passes (
  pass_type_id  TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  auth_token    TEXT NOT NULL,             -- debe coincidir con authenticationToken de pass.json
  updated_at    INTEGER NOT NULL,          -- epoch ms; Last-Modified / passesUpdatedSince
  revoked       INTEGER NOT NULL DEFAULT 0, -- 0 activo, 1 revocado
  PRIMARY KEY (pass_type_id, serial_number)
);

-- Logs que Apple envía a POST /v1/log.
CREATE TABLE IF NOT EXISTS device_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL,
  message    TEXT NOT NULL
);

-- Analíticas de instalaciones y clics en acciones.
CREATE TABLE IF NOT EXISTS analytics (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    INTEGER NOT NULL,          -- epoch ms
  event         TEXT NOT NULL,             -- install | uninstall | pass_download | view_landing
                                           -- | click_whatsapp | click_web | click_email | click_office
                                           -- | download_vcard | revoke
  serial_number TEXT,
  pass_type_id  TEXT,
  user_agent    TEXT,
  ip_hash       TEXT                        -- SHA-256 truncado (sin IP en claro)
);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics (event, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_time  ON analytics (created_at);
