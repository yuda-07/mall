const express = require("express");
const router = express.Router();
const { prisma } = require("../prisma");
const { parseRangeOrToday } = require("../utils/time");

// POST /api/masuk  -> catat gate-in
router.post("/", async (req, res) => {
  try {
    const { kode, jenis, plat, gateIn, jamMasuk, operatorIn } = req.body || {};
    if (!kode || !jenis || !plat || !gateIn) {
      return res.status(400).json({ message: "kode, jenis, plat, gateIn wajib." });
    }
    const jm = jamMasuk ? new Date(jamMasuk) : new Date();
    const created = await prisma.gateMasuk.create({
      data: { kode, jenis, plat, gateIn, jamMasuk: jm, operatorIn: operatorIn || null },
      select: { kode: true, jamMasuk: true }
    });
    return res.status(201).json(created);
  } catch (e) {
    if (e?.code === "P2002") {
      return res.status(409).json({ message: "Kode sudah terdaftar." });
    }
    console.error(e);
    return res.status(500).json({ message: "Gagal mencatat kendaraan masuk." });
  }
});

// GET /api/masuk?start&end -> rekap masuk (default: hari ini)
router.get("/", async (req, res) => {
  try {
    const { start, end } = parseRangeOrToday(req.query);
    const data = await prisma.gateMasuk.findMany({
      where: { jamMasuk: { gte: start, lt: end } },
      orderBy: { jamMasuk: "desc" },
      select: { kode: true, jenis: true, plat: true, gateIn: true, jamMasuk: true }
    });
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Gagal mengambil data masuk." });
  }
});

// GET /api/masuk/:kode -> lookup tiket untuk halaman Transaksi (Cari)
router.get("/:kode", async (req, res) => {
  try {
    const d = await prisma.gateMasuk.findUnique({
      where: { kode: req.params.kode },
      select: { kode: true, jenis: true, plat: true, gateIn: true, jamMasuk: true }
    });
    if (!d) return res.status(404).json({ message: "Tidak ditemukan" });
    res.json(d);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Gagal lookup tiket." });
  }
});

module.exports = router;
