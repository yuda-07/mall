// src/pages/Data.jsx
import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "../../Style/Data.css";
import { getJSON } from "../../utils/api";
import { todayRangeLocal, toISO } from "../../utils/dayRange";

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n || 0);

const HARI = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];

function Data() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const buildOrUpdateChart = async () => {
    const stats = await getJSON("/api/statistik/pendapatan", { range: "week" });
    const labels = stats.labels || HARI;
    const values = stats.values || new Array(7).fill(0);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    if (!chartRef.current) {
      chartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Pendapatan (Mingguan)",
            data: values,
            borderRadius: 8,
            barThickness: 28,
            backgroundColor: (context) => {
              const { ctx, chartArea } = context.chart;
              if (!chartArea) return null;
              const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              g.addColorStop(0, "rgba(58,134,255,1)");
              g.addColorStop(1, "rgba(0,38,255,1)");
              return g;
            },
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => ` ${formatRupiah(c.parsed.y || 0)}` } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#e8e9ff", font: { weight: "600" } } },
            y: {
              beginAtZero: true,
              ticks: { callback: (v) => formatRupiah(v).replace(",00", ""), color: "#e8e9ff" },
              grid: { color: "rgba(255,255,255,.15)" },
            },
          },
        },
      });
    } else {
      const ch = chartRef.current;
      ch.data.labels = labels;
      ch.data.datasets[0].data = values;
      ch.update();
    }
  };

  const updateCardsToday = async () => {
    const { start, end } = todayRangeLocal();
    const masuk = await getJSON("/api/masuk", { start: toISO(start), end: toISO(end), tz: "Asia/Jakarta" });
    const keluar = await getJSON("/api/transaksi/keluar", { start: toISO(start), end: toISO(end), tz: "Asia/Jakarta" });

    const jMasuk = masuk.length;
    const jKeluar = keluar.length;
    const roda2 = keluar.filter((x) => (x.jenis || "").toLowerCase() === "motor").length;
    const roda4 = keluar.filter((x) => (x.jenis || "").toLowerCase() === "mobil").length;
    const pendapatan = keluar.reduce((s, x) => s + (x.totalBayar || 0), 0);

    const byId = (id) => document.getElementById(id);
    byId("masuk")  && (byId("masuk").innerText  = String(jMasuk));
    byId("keluar") && (byId("keluar").innerText = String(jKeluar));
    byId("roda2")  && (byId("roda2").innerText  = String(roda2));
    byId("roda4")  && (byId("roda4").innerText  = String(roda4));
    byId("nominalHariIni") && (byId("nominalHariIni").innerText = formatRupiah(pendapatan));
  };

  useEffect(() => {
    buildOrUpdateChart();
    updateCardsToday();
    const t = setInterval(() => { updateCardsToday(); }, 10000);
    return () => {
      clearInterval(t);
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  // markup kartu & canvas tetap seperti punyamu sekarang
  return (
    <div>
      <main className="wrap">
        <section className="graph-card" aria-label="Grafik pendapatan per hari (minggu ini)" style={{ height: 260 }}>
          <canvas ref={canvasRef} role="img" aria-label="Grafik pendapatan mingguan" />
        </section>

        <section className="stats" aria-label="Ringkasan harian">
          <div className="cardt"><p className="label">Kendaraan Masuk</p><p className="value--in" id="masuk">0</p></div>
          <div className="cardt"><p className="label">Kendaraan Keluar</p><p className="value--out" id="keluar">0</p></div>
          <div className="cardt"><p className="label">Roda 2 Hari Ini</p><p className="value--blue" id="roda2">0</p></div>
          <div className="cardt"><p className="label">Roda 4 Hari Ini</p><p className="value--blue" id="roda4">0</p></div>
        </section>

        <small className="subnote">*Data langsung dari backend, diperbarui berkala.</small>
      </main>
    </div>
  );
}
export default Data;
