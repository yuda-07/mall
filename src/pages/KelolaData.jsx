// src/pages/KelolaData.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../Style/KelolaData.css";
import { getJSON } from "../utils/api";

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n || 0);

function KelolaData() {
  const [rows, setRows] = useState([]);

  const refresh = async () => {
    // default: 30 hari terakhir
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - 30);
    const data = await getJSON("/api/transaksi/keluar", {
      start: start.toISOString(), end: end.toISOString(), tz: "Asia/Jakarta",
    });
    const list = (Array.isArray(data) ? data : []).sort(
      (a, b) => new Date(b.jamKeluar) - new Date(a.jamKeluar)
    );
    setRows(list);
  };

  useEffect(() => { refresh(); }, []);

  const totalSemua = useMemo(
    () => rows.reduce((sum, r) => sum + (r.totalBayar || 0), 0),
    [rows]
  );

  return (
    <>
      <h1>Kelola Data</h1>
      <div className="KelolaData">
        <div className="box-one-KelolaData">
          <div className="table-wrap" role="region" aria-label="Data kendaraan keluar (scrollable)">
            <table className="parking-table" role="table">
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>No</th>
                  <th style={{ width: "16%" }}>Jenis</th>
                  <th style={{ width: "18%" }}>Nomor Plat</th>
                  <th style={{ width: "18%" }}>Kode Struk</th>
                  <th style={{ width: "18%" }}>Jam Keluar</th>
                  <th style={{ width: "18%" }}>Total Uang</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="empty">Belum ada transaksi.</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.kode + i}>
                      <td>{i + 1}</td>
                      <td>{r.jenis || "-"}</td>
                      <td>{r.plat || "-"}</td>
                      <td>{r.kode || "-"}</td>
                      <td>{new Date(r.jamKeluar).toLocaleString("id-ID")}</td>
                      <td className="money">{formatRupiah(r.totalBayar || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="tfoot-label">Total Pendapatan (30 hari)</td>
                  <td className="money tfoot-total">{formatRupiah(totalSemua)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <small className="hint">Sumber data: backend /api/transaksi/keluar.</small>
        </div>
      </div>
    </>
  );
}
export default KelolaData;
