const express = require("express");
const router = express.Router();
const { prisma } = require("../prisma");
const { hitungDurasi, tarifPerJamByJenis } = require("../utils/tarif");
const { parseRangeOrToday } = require("../utils/time");

// POST /api/transaksi/pay -> proses bayar + gate-out
router.post("/pay", async (req, res) => {
  try {
    const { kode, gateOut, metode, tunaiDiterima, operatorOut } = req.body || {};
    if (!kode || !gateOut || !metode) {
      return res.status(400).json({ message: "kode, gateOut, metode wajib." });
    }

    const masuk = await prisma.gateMasuk.findUnique({ where: { kode } });
    if (!masuk) return res.status(404).json({ message: "Kode tidak ditemukan di gate_masuk." });

    const existing = await prisma.transaksi.findUnique({ where: { kode } });
    if (existing) return res.status(409).json({ message: "Kode ini sudah dibayar." });

    const now = new Date();
    const { totalMenit, jamBulatKeAtas } = hitungDurasi(masuk.jamMasuk, now);
    const perJam = tarifPerJamByJenis(masuk.jenis);
    const totalBayar = perJam * jamBulatKeAtas;

    let kembalian = null;
    let tunaiFix = null;
    if (metode === "CASH") {
      const pay = parseInt(tunaiDiterima ?? 0, 10);
      if (isNaN(pay) || pay < totalBayar) {
        return res.status(400).json({ message: "Tunai kurang dari total bayar." });
      }
      tunaiFix = pay;
      kembalian = pay - totalBayar;
    }

    const trx = await prisma.transaksi.create({
      data: {
        kode,
        gateOut,
        jamKeluar: now,
        durasiMenit: totalMenit,
        jamDibulatkan: jamBulatKeAtas,
        tarifPerJam: perJam,
        totalBayar,
        metode,
        tunaiDiterima: tunaiFix,
        kembalian,
        operatorOut: operatorOut || null
      }
    });

    return res.status(201).json({
      id: trx.id,
      kode: trx.kode,
      totalBayar: trx.totalBayar,
      jamKeluar: trx.jamKeluar,
      metode: trx.metode,
      tunaiDiterima: trx.tunaiDiterima,
      kembalian: trx.kembalian,
      gateOut: trx.gateOut
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Gagal memproses transaksi." });
  }
});

// GET /api/transaksi/keluar?start&end -> rekap keluar (default: hari ini)
router.get("/keluar", async (req, res) => {
  try {
    const { start, end } = parseRangeOrToday(req.query);
    const data = await prisma.transaksi.findMany({
      where: { jamKeluar: { gte: start, lt: end } },
      orderBy: { jamKeluar: "desc" },
      select: {
        kode: true,
        jamKeluar: true,
        gateOut: true,
        totalBayar: true,
        metode: true,
        masuk: { select: { jenis: true, plat: true } }
      }
    });

    const mapped = data.map(d => ({
      kode: d.kode,
      jenis: d.masuk?.jenis || "-",
      plat: d.masuk?.plat || "-",
      gateOut: d.gateOut,
      jamKeluar: d.jamKeluar,
      totalBayar: d.totalBayar,
      metode: d.metode
    }));

    return res.json(mapped);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Gagal mengambil data keluar." });
  }
});

module.exports = router;
