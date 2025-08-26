export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function buildUrl(path, params) {
  const url = new URL(path.replace(/^\//, ""), API_BASE + "/");
  if (params) for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }
  return url.toString();
}

export async function getJSON(path, params) {
  // tambahkan cache-buster + no-store agar tidak kena 304
  const url = buildUrl(path, { ...(params || {}), _ts: Date.now() });
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { "Accept": "application/json", "Cache-Control": "no-store" },
  });

  if (!res.ok) {
    // biar error-nya kebaca, tapi 404 tetap naik sebagai error
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function postJSON(path, body) {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
