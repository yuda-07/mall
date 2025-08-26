// src/pages/Data_Keluar.jsx
import React, { useEffect, useRef, useState } from "react";
import { todayRangeLocal, toISO } from "../../utils/dayRange";
import { getJSON } from "../../utils/api";

function Data_Keluar() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const fetchKeluarHariIni = async () => {
    setLoading(true);
    try {
      const { start, end } = todayRangeLocal();
      const data = await getJSON("/api/transaksi/keluar", {
        start: toISO(start), end: toISO(end), tz: "Asia/Jakarta",
      });
      const mapped = (Array.isArray(data) ? data : [])
        .sort((a, b) => new Date(b.jamKeluar) - new Date(a.jamKeluar))
        .map((d) => ({
          jenis: d.jenis || "-",
          jamKeluarLabel: new Date(d.jamKeluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          plat: d.plat || "-",
          kode: d.kode || "-",
        }));
      setRows(mapped);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchKeluarHariIni();
    timerRef.current = setInterval(fetchKeluarHariIni, 10000);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div>
      <section className="card">
        <div className="title">Rekapan Kendaraan Keluar (Hari Ini)</div>
        <div className="paper">
          <div className="table-wrap" role="region" aria-label="Tabel rekapan kendaraan keluar (hari ini)">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "28%" }}>Jenis Kendaraan</th>
                  <th style={{ width: "20%" }}>Jam Keluar</th>
                  <th style={{ width: "26%" }}>Nomor Plat</th>
                  <th style={{ width: "26%" }}>Kode Struk</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={4}>Memuat...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={4} className="muted">Belum ada data keluar hari ini.</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.kode + i}>
                      <td>{r.jenis}</td>
                      <td>{r.jamKeluarLabel}</td>
                      <td>{r.plat}</td>
                      <td>{r.kode}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="muted">Gulir untuk melihat data lainnya</div>
        </div>
      </section>
    </div>
  );
}

export default Data_Keluar;
