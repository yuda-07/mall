// src/pages/Data_Masuk.jsx
import React, { useEffect, useState, useRef } from "react";
import { todayRangeLocal, toISO } from "../../utils/dayRange";
import { getJSON } from "../../utils/api";

function Data_Masuk() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const fetchHariIni = async () => {
    setLoading(true);
    try {
      const { start, end } = todayRangeLocal();
      const data = await getJSON("/api/masuk", {
        start: toISO(start), end: toISO(end), tz: "Asia/Jakarta",
      });
      const mapped = (Array.isArray(data) ? data : []).map((d) => ({
        jenis: d.jenis || "-",
        jamMasukLabel: new Date(d.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        plat: d.plat || "-",
        kode: d.kode || "-",
      }));
      setRows(mapped);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchHariIni();
    timerRef.current = setInterval(fetchHariIni, 10000);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div>
      <section className="card">
        <div className="title">Rekapan Kendaraan Masuk (Hari Ini)</div>
        <div className="paper">
          <div className="table-wrap" role="region" aria-label="Tabel rekapan kendaraan masuk (hari ini)">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "28%" }}>Jenis Kendaraan</th>
                  <th style={{ width: "20%" }}>Jam Masuk</th>
                  <th style={{ width: "26%" }}>Nomor Plat</th>
                  <th style={{ width: "26%" }}>Kode Struk</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={4}>Memuat...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={4} className="muted">Belum ada data masuk hari ini.</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.kode + i}>
                      <td>{r.jenis}</td>
                      <td>{r.jamMasukLabel}</td>
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

export default Data_Masuk;
