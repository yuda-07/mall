// src/utils/transaksiStore.js
const KEY = "transaksi_parkir";

export function loadTransaksi() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    // Normalisasi minimal (antisipasi data lama)
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveTransaksiList(list) {
  localStorage.setItem(KEY, JSON.stringify(list || []));
  broadcast();
}

export function addTransaksi(tx) {
  const list = loadTransaksi();
  list.push(tx);
  saveTransaksiList(list);
}

export function broadcast() {
  // untuk update real-time di tab yang sama
  window.dispatchEvent(new Event("transaksi:updated"));
}

/** Subscribe perubahan data.
 *  - 'storage' => untuk tab lain
 *  - 'transaksi:updated' => untuk tab ini
 */
export function onTransaksiUpdated(handler) {
  const storageHandler = (e) => {
    if (e.key === KEY) handler();
  };
  window.addEventListener("storage", storageHandler);
  window.addEventListener("transaksi:updated", handler);
  return () => {
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener("transaksi:updated", handler);
  };
}

/** Util kecil */
export const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n || 0);

export function isToday(d) {
  const x = new Date(d);
  const now = new Date();
  return (
    x.getFullYear() === now.getFullYear() &&
    x.getMonth() === now.getMonth() &&
    x.getDate() === now.getDate()
  );
}

/** Range Senin–Minggu minggu ini (zona lokal) */
export function getThisWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  // Senin=0...Minggu=6
  const monIdx = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - monIdx);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function getDayIndexMon0(date) {
  // getDay(): Minggu=0..Sabtu=6 → ubah ke Senin=0..Minggu=6
  return ((date.getDay() + 6) % 7);
}

/** Agregasi pendapatan per-hari (minggu ini) */
export function pendapatanMingguan(transaksiList) {
  const { start, end } = getThisWeekRange();
  const totals = new Array(7).fill(0);
  for (const tx of transaksiList) {
    if (tx?.status !== "LUNAS") continue;
    const t = new Date(tx.jamKeluar || tx.paidAt || tx.jamKeluarISO || tx.jamKeluarUtc || tx.jamKeluarLocal);
    if (t >= start && t < end) {
      totals[getDayIndexMon0(t)] += tx.totalBayar || 0;
    }
  }
  return totals;
}
