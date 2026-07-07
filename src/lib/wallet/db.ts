/**
 * Capa de datos (Cloudflare D1). Todas las consultas del web service pasan por aquí.
 * Esquema en wallet/db/schema.sql.
 */
import type { WalletEnv } from "./env";

export interface PassRecord {
  pass_type_id: string;
  serial_number: string;
  auth_token: string;
  updated_at: number; // epoch ms
  revoked: number; // 0 | 1
}

export type AnalyticsEvent =
  | "install"
  | "uninstall"
  | "pass_download"
  | "view_landing"
  | "click_whatsapp"
  | "click_web"
  | "click_email"
  | "click_office"
  | "download_vcard"
  | "revoke";

export class WalletDB {
  constructor(private db: D1Database) {}

  static from(env: WalletEnv): WalletDB {
    return new WalletDB(env.DB);
  }

  // ---- Pases -------------------------------------------------------------
  async getPass(passTypeId: string, serial: string): Promise<PassRecord | null> {
    return this.db
      .prepare("SELECT * FROM passes WHERE pass_type_id = ? AND serial_number = ?")
      .bind(passTypeId, serial)
      .first<PassRecord>();
  }

  /** Crea o actualiza el registro de un pase (token esperado + timestamp). */
  async upsertPass(passTypeId: string, serial: string, authToken: string): Promise<void> {
    const now = Date.now();
    await this.db
      .prepare(
        `INSERT INTO passes (pass_type_id, serial_number, auth_token, updated_at, revoked)
         VALUES (?, ?, ?, ?, 0)
         ON CONFLICT(pass_type_id, serial_number)
         DO UPDATE SET auth_token = excluded.auth_token, updated_at = excluded.updated_at`,
      )
      .bind(passTypeId, serial, authToken, now)
      .run();
  }

  /** Marca el pase como modificado (para que Apple lo vuelva a descargar). */
  async touchPass(passTypeId: string, serial: string): Promise<number> {
    const now = Date.now();
    await this.db
      .prepare("UPDATE passes SET updated_at = ? WHERE pass_type_id = ? AND serial_number = ?")
      .bind(now, passTypeId, serial)
      .run();
    return now;
  }

  async setRevoked(passTypeId: string, serial: string, revoked: boolean): Promise<number> {
    const now = Date.now();
    await this.db
      .prepare("UPDATE passes SET revoked = ?, updated_at = ? WHERE pass_type_id = ? AND serial_number = ?")
      .bind(revoked ? 1 : 0, now, passTypeId, serial)
      .run();
    return now;
  }

  // ---- Registros de dispositivos ----------------------------------------
  async registerDevice(
    deviceLibId: string,
    passTypeId: string,
    serial: string,
    pushToken: string,
  ): Promise<"created" | "updated"> {
    const existing = await this.db
      .prepare(
        "SELECT push_token FROM registrations WHERE device_library_id = ? AND pass_type_id = ? AND serial_number = ?",
      )
      .bind(deviceLibId, passTypeId, serial)
      .first<{ push_token: string }>();

    await this.db
      .prepare(
        `INSERT INTO registrations (device_library_id, pass_type_id, serial_number, push_token, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(device_library_id, pass_type_id, serial_number)
         DO UPDATE SET push_token = excluded.push_token`,
      )
      .bind(deviceLibId, passTypeId, serial, pushToken, Date.now())
      .run();

    return existing ? "updated" : "created";
  }

  async unregisterDevice(deviceLibId: string, passTypeId: string, serial: string): Promise<boolean> {
    const res = await this.db
      .prepare(
        "DELETE FROM registrations WHERE device_library_id = ? AND pass_type_id = ? AND serial_number = ?",
      )
      .bind(deviceLibId, passTypeId, serial)
      .run();
    return (res.meta.changes ?? 0) > 0;
  }

  /** Push tokens de todos los dispositivos que tienen un serial concreto. */
  async pushTokensForSerial(passTypeId: string, serial: string): Promise<string[]> {
    const { results } = await this.db
      .prepare("SELECT push_token FROM registrations WHERE pass_type_id = ? AND serial_number = ?")
      .bind(passTypeId, serial)
      .all<{ push_token: string }>();
    return (results ?? []).map((r) => r.push_token);
  }

  /** Elimina registros que usen un push token inválido (APNs 410/BadDeviceToken). */
  async deleteByPushToken(pushToken: string): Promise<void> {
    await this.db.prepare("DELETE FROM registrations WHERE push_token = ?").bind(pushToken).run();
  }

  /**
   * Seriales de un dispositivo actualizados después de `sinceTag` (epoch ms como string).
   * Devuelve también el mayor updated_at para usarlo como próximo tag (lastUpdated).
   */
  async serialsToUpdate(
    deviceLibId: string,
    passTypeId: string,
    sinceTag: string | null,
  ): Promise<{ serialNumbers: string[]; lastUpdated: string }> {
    const since = sinceTag ? Number(sinceTag) || 0 : 0;
    const { results } = await this.db
      .prepare(
        `SELECT p.serial_number, p.updated_at
           FROM registrations r
           JOIN passes p ON p.pass_type_id = r.pass_type_id AND p.serial_number = r.serial_number
          WHERE r.device_library_id = ? AND r.pass_type_id = ? AND p.updated_at > ?
          ORDER BY p.updated_at ASC`,
      )
      .bind(deviceLibId, passTypeId, since)
      .all<{ serial_number: string; updated_at: number }>();

    const rows = results ?? [];
    const lastUpdated = rows.length ? String(Math.max(...rows.map((r) => r.updated_at))) : String(since);
    return { serialNumbers: rows.map((r) => r.serial_number), lastUpdated };
  }

  // ---- Logs de Apple -----------------------------------------------------
  async writeLogs(messages: string[]): Promise<void> {
    if (!messages.length) return;
    const now = Date.now();
    const stmt = this.db.prepare("INSERT INTO device_logs (created_at, message) VALUES (?, ?)");
    await this.db.batch(messages.map((m) => stmt.bind(now, m.slice(0, 2000))));
  }

  // ---- Analíticas --------------------------------------------------------
  async track(event: AnalyticsEvent, meta: {
    serial?: string;
    passTypeId?: string;
    userAgent?: string | null;
    ipHash?: string | null;
  } = {}): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO analytics (created_at, event, serial_number, pass_type_id, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        Date.now(),
        event,
        meta.serial ?? null,
        meta.passTypeId ?? null,
        (meta.userAgent ?? null)?.slice(0, 400) ?? null,
        meta.ipHash ?? null,
      )
      .run();
  }

  /** Resumen de analíticas: total por evento + últimos 14 días por evento. */
  async analyticsSummary(): Promise<{
    totals: Record<string, number>;
    activeInstalls: number;
    daily: Array<{ day: string; event: string; count: number }>;
  }> {
    const totalsQ = await this.db
      .prepare("SELECT event, COUNT(*) AS count FROM analytics GROUP BY event")
      .all<{ event: string; count: number }>();
    const totals: Record<string, number> = {};
    for (const r of totalsQ.results ?? []) totals[r.event] = r.count;

    const installs = await this.db
      .prepare("SELECT COUNT(*) AS n FROM registrations")
      .first<{ n: number }>();

    const dailyQ = await this.db
      .prepare(
        `SELECT date(created_at / 1000, 'unixepoch') AS day, event, COUNT(*) AS count
           FROM analytics
          WHERE created_at >= ?
          GROUP BY day, event
          ORDER BY day DESC`,
      )
      .bind(Date.now() - 14 * 864e5)
      .all<{ day: string; event: string; count: number }>();

    return {
      totals,
      activeInstalls: installs?.n ?? 0,
      daily: dailyQ.results ?? [],
    };
  }
}

/** Hash SHA-256 (hex) de una IP para analíticas sin almacenar la IP en claro. */
export async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + "::vp-wallet"));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}
