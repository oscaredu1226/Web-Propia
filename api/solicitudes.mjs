import { createHash, randomBytes } from "node:crypto";
import { JWT } from "google-auth-library";

const services = new Set(["Sitio web", "Tienda online", "Aplicación web", "Aplicación móvil"]);
const legacyColumns = ["Código", "Registrada el (Perú)", "Nombre", "Servicio", "Fecha preferida", "Origen", "Estado", "ID"];
const columns = [...legacyColumns, "Celular"];
const scope = "https://www.googleapis.com/auth/spreadsheets";
const windowMs = 10 * 60 * 1000;
let googleClient;

function settingsFrom(env) {
  try {
    const url = new URL(env.GOOGLE_SHEETS_URL);
    const id = url.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)?.[1];
    const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    const key = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
    if (url.protocol !== "https:" || url.hostname !== "docs.google.com" || !id
      || !email?.endsWith(".gserviceaccount.com") || !key?.includes("BEGIN PRIVATE KEY")) return null;
    const tab = env.GOOGLE_SHEETS_TAB?.trim();
    return { id, email, key, prefix: tab ? `'${tab.replaceAll("'", "''")}'!` : "" };
  } catch { return null; }
}

function json(status, body, headers = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers } });
}

function normalizePhone(value) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return "";
  if (raw.length > 32 || !/^\+?[\d\s().-]+$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, "");
  if (/^9\d{8}$/.test(digits)) digits = `51${digits}`;
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (!raw.startsWith("+") && !/^519\d{8}$/.test(digits)) return null;
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

export async function appendToSheet({ settings, record, createdAt }, client) {
  const auth = client || (googleClient ??= new JWT({ email: settings.email, key: settings.key, scopes: [scope] }));
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(settings.id)}/values/`;
  const request = options => auth.request({ timeout: 4500, retry: false, ...options });
  const headerUrl = base + encodeURIComponent(`${settings.prefix}A1:I1`);
  const { data: header } = await request({ url: headerUrl });
  if (!header.values?.some(row => row.some(value => String(value).trim()))) {
    await request({ url: `${headerUrl}?valueInputOption=RAW`, method: "PUT", data: { values: [columns] } });
  } else {
    if (legacyColumns.some((column, index) => header.values[0]?.[index] !== column)
      || (header.values[0]?.[8] && header.values[0][8] !== "Celular")) throw new Error("sheet_columns");
    if (!header.values[0]?.[8]) {
      await request({ url: `${base}${encodeURIComponent(`${settings.prefix}I1`)}?valueInputOption=RAW`, method: "PUT", data: { values: [["Celular"]] } });
    }
  }
  const timestamp = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(createdAt);
  const { data } = await request({
    url: `${base}${encodeURIComponent(`${settings.prefix}A:I`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    method: "POST",
    data: { values: [[`OS-${record.requestId.slice(0, 8).toUpperCase()}`, timestamp, record.name, record.service,
      record.date, "Formulario web", "Solicitud preparada; envío no verificado", record.requestId, record.phone || ""]] },
  });
  if (data.updates?.updatedRows !== 1) throw new Error("sheet_append");
}

// The dependency seam permits tests without a Google account or real visitor data.
export function createHandler({ env = process.env, save = appendToSheet, now = () => new Date() } = {}) {
  const recent = new Map();
  const visitors = new Map();
  const salt = randomBytes(32);
  return async function handle(request) {
    if (request.method !== "POST") return json(405, { ok: false }, { Allow: "POST" });
    if (request.headers.get("origin") !== new URL(request.url).origin
      || request.headers.get("sec-fetch-site") === "cross-site") return json(403, { ok: false });
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json(415, { ok: false });
    const settings = settingsFrom(env);
    if (!settings) return json(503, { ok: false, code: "unavailable" });
    let body;
    try {
      if (Number(request.headers.get("content-length")) > 2048) return json(413, { ok: false });
      const text = await request.text();
      if (Buffer.byteLength(text) > 2048) return json(413, { ok: false });
      body = JSON.parse(text);
    } catch { return json(400, { ok: false }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json(400, { ok: false });
    if (body.website) return json(400, { ok: false });
    const record = {
      name: typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "",
      phone: normalizePhone(body.phone),
      service: body.service, date: body.date, requestId: body.requestId,
    };
    const instant = now();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
    const date = typeof record.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.date) ? new Date(`${record.date}T12:00:00Z`) : null;
    if (!record.name || record.phone === null || record.name.length > 80 || /[\u0000-\u001f\u007f]/u.test(record.name)
      || !services.has(record.service) || !date || !Number.isFinite(date.getTime())
      || date.toISOString().slice(0, 10) !== record.date || record.date < today
      || typeof record.requestId !== "string" || !/^[a-f0-9]{32}$/.test(record.requestId)) return json(400, { ok: false });
    const time = instant.getTime();
    for (const map of [recent, visitors]) {
      for (const [key, value] of map) if (value.expires <= time) map.delete(key);
    }
    const signature = JSON.stringify(record);
    const previous = recent.get(record.requestId);
    if (previous) {
      if (previous.signature !== signature) return json(409, { ok: false });
      const saved = await previous.result;
      return json(saved.status, saved.body);
    }
    // Best-effort limits within each warm function. Vercel Firewall can enforce a shared limit.
    const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "unknown";
    const fingerprint = createHash("sha256").update(salt).update(ip.split(",")[0].trim()).digest("hex");
    const visitor = visitors.get(fingerprint) || { count: 0, expires: time + windowMs };
    if (visitor.count >= 5 || visitors.size >= 2000 || recent.size >= 2000) return json(429, { ok: false }, { "Retry-After": "600" });
    visitor.count++;
    visitors.set(fingerprint, visitor);
    const result = (async () => {
      try {
        await save({ settings, record, createdAt: instant });
        return { status: 201, body: { ok: true, recorded: true, requestId: record.requestId } };
      } catch {
        // Never log visitor data, Google responses, tokens, URLs or private keys.
        console.error("sheets_lead_write_failed");
        recent.delete(record.requestId);
        return { status: 502, body: { ok: false, code: "unavailable" } };
      }
    })();
    recent.set(record.requestId, { signature, result, expires: time + windowMs });
    const saved = await result;
    return json(saved.status, saved.body);
  };
}

export default { fetch: createHandler() };
