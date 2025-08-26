// utils/dayRange.js
export function todayRangeLocal() {
  // Asumsi browser kiosk sudah set ke WIB (UTC+7).
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function toISO(d) {
  // kirim ISO ke backend
  return new Date(d).toISOString();
}
