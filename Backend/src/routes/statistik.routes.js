const express = require("express");
const router = express.Router();
const { prisma } = require("../prisma");
const { HARI, rangeMingguIni, idxSenin0, parseRangeOrToday } = require("../utils/time");

// GET /api/statistik/pendapatan?range=today|week|custom&start&end
router.get("/pendapatan", async (req, res) => {
  try {
    const range = (req.query.range || "week").toLowerCase();

    if (range === "today") {
      const { start, end } = parseRangeOrToday({});
      const rows = await prisma.transaksi.findMany({
        where: { jamKeluar: { gte: start, lt: end } },
        select: { totalBayar: true }
      });
      const total = rows.reduce((s, r) => s + (r.totalBayar || 0), 0);
      return res.json({ labels: ["Hari Ini"], values: [total] });
    }

    if (range === "week") {
      const { start, end } = rangeMingguIni();
      const rows = await prisma.transaksi.findMany({
        where: { jamKeluar: { gte: start, lt: end } },
        select: { jamKeluar: true, totalBayar: true }
      });
      const totals = new Array(7).fill(0);
      for (const r of rows) {
        const idx = idxSenin0(new Date(r.jamKeluar));
        totals[idx] += r.totalBayar || 0;
      }
      return res.json({ labels: HARI, values: totals });
    }

    const { start, end } = parseRangeOrToday(req.query);
    const rows = await prisma.transaksi.findMany({
      where: { jamKeluar: { gte: start, lt: end } },
      select: { totalBayar: true }
    });
    const total = rows.reduce((s, r) => s + (r.totalBayar || 0), 0);
    return res.json({ labels: ["Custom"], values: [total] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Gagal mengambil statistik." });
  }
});

module.exports = router;
