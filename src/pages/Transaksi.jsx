// src/pages/Transaksi.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../Style/Transaksi.css";
import { getJSON, postJSON } from "../utils/api";



const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n || 0);

function hitungDurasi(jamMasukISO, now = new Date()) {
  const masuk = new Date(jamMasukISO);
  const ms = Math.max(0, now - masuk);
  const totalMenit = Math.ceil(ms / 60000);
  const jamBulatKeAtas = Math.max(1, Math.ceil(totalMenit / 60));
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  return { jam, menit, jamBulatKeAtas, totalMenit };
}

function hitungTarif(jenis, jamBulatKeAtas) {
  const perJam = (jenis || "").toLowerCase() === "mobil" ? 5000 : 2000;
  return { perJam, total: perJam * jamBulatKeAtas };
}

function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="modal-close" aria-label="Tutup" onClick={onClose} type="button">×</button>
        </header>
        <div className="modal-body print-area">{children}</div>
        <footer className="modal-footer">
          <button type="button" className="btn" onClick={() => window.print()}>Cetak</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
        </footer>
      </div>
    </div>
  );
}

export default function Transaksi() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [metode, setMetode] = useState("CASH");
  const [tunaiDiterima, setTunaiDiterima] = useState("");
  const [outGate, setOutGate] = useState("Pintu Keluar A");

  const kembalian = useMemo(() => {
    if (metode !== "CASH") return 0;
    const bayar = parseInt(tunaiDiterima || "0", 10);
    const total = detail?.total || 0;
    return Math.max(0, bayar - total);
  }, [tunaiDiterima, metode, detail]);

  const nowText = useMemo(() => {
    const d = new Date();
    return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }, []);

  // 1) Cari tiket by kode ke backend
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setDetail(null);

  const kode = query.trim().toUpperCase();
  if (!kode) { setError("Masukkan kode struk terlebih dahulu."); return; }

  setLoading(true);
  try {
    // WAJIB: pakai endpoint backend, bukan MOCK /api/tiket
    const d = await getJSON(`/api/masuk/${encodeURIComponent(kode)}`); 
    // d: { kode, jenis, plat, gateIn, jamMasuk }

    const masukDate = new Date(d.jamMasuk);
    const now = new Date();
    const ms = Math.max(0, now - masukDate);
    const totalMenit = Math.ceil(ms / 60000);
    const jamBulatKeAtas = Math.max(1, Math.ceil(totalMenit / 60));
    const jam = Math.floor(totalMenit / 60);
    const menit = totalMenit % 60;

    const perJam = (d.jenis || "").toLowerCase() === "mobil" ? 5000 : 2000;
    const total = perJam * jamBulatKeAtas;

    setDetail({
      kode: d.kode,
      jenis: d.jenis,
      plat: d.plat,
      gate: d.gateIn,
      jamMasuk: d.jamMasuk,
      durasiLabel: `${jam} jam ${menit} menit`,
      jamBulat: jamBulatKeAtas,
      total,
      paidAt: null
    });
    setOpen(true);
  } catch (err) {
    console.error("Cari tiket gagal:", err);
    setError("Data struk tidak ditemukan.");
  } finally {
    setLoading(false);
  }
};


  // 2) Konfirmasi Bayar -> POST /api/transaksi/pay
const handleBayar = async () => {
  if (!detail) return;

  if (metode === "CASH") {
    const bayar = parseInt(tunaiDiterima || "0", 10);
    if (Number.isNaN(bayar) || bayar <= 0) { setError("Nominal tunai tidak valid."); return; }
    if (bayar < detail.total) { setError("Nominal tunai kurang dari total bayar."); return; }
  }

  setProcessing(true); setError("");
  try {
    const hasil = await postJSON("/api/transaksi/pay", {
      kode: detail.kode,
      gateOut: outGate,
      metode,
      tunaiDiterima: metode === "CASH" ? parseInt(tunaiDiterima || "0", 10) : undefined,
    });
    // hasil: { jamKeluar, totalBayar, metode, tunaiDiterima, kembalian, gateOut }
    setDetail((prev) => ({
      ...prev,
      paidAt: hasil.jamKeluar,
      metodePembayaran: hasil.metode,
      tunaiDiterima: hasil.tunaiDiterima || 0,
      kembalian: hasil.kembalian || 0,
      gateOut: hasil.gateOut,
      total: hasil.totalBayar,
    }));
  } catch (err) {
    console.error("Bayar gagal:", err);
    setError("Gagal memproses pembayaran.");
  } finally {
    setProcessing(false);
  }
};


  return (
    <div className="TransaksiPage">
      <h1>Transaksi Pembayaran</h1>

      <div className="Transaksi">
        <div className="box-one-Transaksi">
          <p>Masukkan / Scan Kode Struk</p>

          <form onSubmit={handleSubmit} className="form-cari">
            <input
              type="text"
              placeholder="contoh: 23334OP"
              id="Pencarian"
              className="Pencarian"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              aria-label="Masukkan kode struk"
            />
            <button type="submit" id="Submit" className="Submit" disabled={loading}>
              {loading ? "Memuat..." : "Cari"}
            </button>
          </form>

          {error && <div className="error">{error}</div>}

          <small className="hint">
            {/* Contoh kode uji: <code>23334OP</code>, <code>A1B2C3</code>, <code>A1B2C2</code> */}
          </small>
        </div>

      </div>

      {/* Modal Pembayaran & Struk */}
      <Modal open={open} onClose={() => setOpen(false)} title="Transaksi Pembayaran Parkir">
        {detail ? (
          <div className="detail-grid">
            {/* Informasi Tiket */}
            <div className="row">
              <span className="label">Kode Struk</span>
              <span className="sep">:</span>
              <span className="value">{detail.kode}</span>
            </div>
            <div className="row">
              <span className="label">Jenis Kendaraan</span>
              <span className="sep">:</span>
              <span className="value">{detail.jenis}</span>
            </div>
            <div className="row">
              <span className="label">Nomor Plat</span>
              <span className="sep">:</span>
              <span className="value">{detail.plat}</span>
            </div>
            <div className="row">
              <span className="label">Gerbang Masuk</span>
              <span className="sep">:</span>
              <span className="value">{detail.gate}</span>
            </div>
            <div className="row">
              <span className="label">Jam Masuk</span>
              <span className="sep">:</span>
              <span className="value">{new Date(detail.jamMasuk).toLocaleString("id-ID")}</span>
            </div>
            <div className="row">
              <span className="label">Waktu Sekarang</span>
              <span className="sep">:</span>
              <span className="value">{nowText}</span>
            </div>
            <div className="row">
              <span className="label">Durasi Parkir</span>
              <span className="sep">:</span>
              <span className="value">
                {detail.durasiLabel} (dibulatkan {detail.jamBulat} jam)
              </span>
            </div>
            <div className="row">
              <span className="label">Tarif / Jam</span>
              <span className="sep">:</span>
              <span className="value">{formatRupiah(detail.tarifPerJam)}</span>
            </div>

            <hr className="divider" />

            {/* Total */}
            <div className="row total">
              <span className="label">Total Bayar</span>
              <span className="sep">:</span>
              <span className="value">{formatRupiah(detail.total)}</span>
            </div>

            {/* Jika belum dibayar, tampilkan form pembayaran */}
            {!detail.paidAt && (
              <>
                <div className="row">
                  <span className="label">Metode Pembayaran</span>
                  <span className="sep">:</span>
                  <span className="value">
                    <select
                      value={metode}
                      onChange={(e) => setMetode(e.target.value)}
                      aria-label="Pilih metode pembayaran"
                    >
                      <option value="CASH">Cash</option>
                      <option value="QRIS">QRIS</option>
                      <option value="EMONEY">E-Money</option>
                      <option value="DEBIT">Debit</option>
                    </select>
                  </span>
                </div>

                {metode === "CASH" && (
                  <>
                    <div className="row">
                      <span className="label">Tunai Diterima</span>
                      <span className="sep">:</span>
                      <span className="value">
                        <input
                          type="number"
                          min={0}
                          placeholder="mis. 10000"
                          value={tunaiDiterima}
                          onChange={(e) => setTunaiDiterima(e.target.value)}
                          aria-label="Nominal tunai diterima"
                        />
                      </span>
                    </div>
                    <div className="row">
                      <span className="label">Kembalian</span>
                      <span className="sep">:</span>
                      <span className="value">{formatRupiah(kembalian)}</span>
                    </div>
                  </>
                )}

                <div className="row">
                  <span className="label">Gerbang Keluar</span>
                  <span className="sep">:</span>
                  <span className="value">
                    <select
                      value={outGate}
                      onChange={(e) => setOutGate(e.target.value)}
                      aria-label="Pilih gerbang keluar"
                    >
                      <option>Pintu Keluar A</option>
                      <option>Pintu Keluar B</option>
                      <option>Pintu Keluar C</option>
                    </select>
                  </span>
                </div>

                <div className="actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={handleBayar}
                    disabled={processing}
                  >
                    {processing ? "Memproses..." : "Konfirmasi Bayar"}
                  </button>
                </div>
              </>
            )}

            {/* Setelah lunas, tampilkan ringkasan pembayaran (untuk cetak) */}
            {detail.paidAt && (
              <>
                <hr className="divider" />
                <div className="row">
                  <span className="label">Status</span>
                  <span className="sep">:</span>
                  <span className="value value--paid">LUNAS</span>
                </div>
                <div className="row">
                  <span className="label">Waktu Bayar</span>
                  <span className="sep">:</span>
                  <span className="value">{new Date(detail.paidAt).toLocaleString("id-ID")}</span>
                </div>
                <div className="row">
                  <span className="label">Metode</span>
                  <span className="sep">:</span>
                  <span className="value">{detail.metodePembayaran}</span>
                </div>
                {detail.metodePembayaran === "CASH" && (
                  <>
                    <div className="row">
                      <span className="label">Tunai Diterima</span>
                      <span className="sep">:</span>
                      <span className="value">{formatRupiah(detail.tunaiDiterima || 0)}</span>
                    </div>
                    <div className="row">
                      <span className="label">Kembalian</span>
                      <span className="sep">:</span>
                      <span className="value">{formatRupiah(detail.kembalian || 0)}</span>
                    </div>
                  </>
                )}
                <div className="row">
                  <span className="label">Gerbang Keluar</span>
                  <span className="sep">:</span>
                  <span className="value">{detail.gateOut || outGate}</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <p>Tidak ada data.</p>
        )}
      </Modal>
    </div>
  );
}
