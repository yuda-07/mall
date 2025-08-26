# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


README — Aplikasi Parkir (Frontend React + Backend Express/MySQL)

Dokumen ini menjelaskan langkah dari awal sampai akhir untuk men-setup, menjalankan, dan memahami arsitektur aplikasi parkir: Gate-In, Transaksi (Gate-Out/Pay), Rekapan Masuk/Keluar, dan Grafik Pendapatan.

1) Prasyarat

Node.js ≥ 18

MySQL 8.x aktif di mesin lokal (atau pakai Docker/XAMPP)

OS: Windows (contoh perintah pakai PowerShell)

Buat database kosong:

CREATE DATABASE parkmall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

2) Struktur Proyek
mall/
├─ Backend/
│  ├─ .env
│  ├─ package.json
│  ├─ prisma/
│  │  └─ schema.prisma
│  └─ src/
│     ├─ server.js
│     ├─ prisma.js
│     ├─ routes/
│     │  ├─ masuk.routes.js
│     │  ├─ transaksi.routes.js
│     │  └─ statistik.routes.js
│     └─ utils/
│        ├─ tarif.js
│        └─ time.js
└─ Frontend/
   ├─ .env
   └─ src/
      ├─ pages/
      │  ├─ Dashboard.jsx
      │  ├─ Data.jsx
      │  ├─ Data_Masuk.jsx
      │  ├─ Data_Keluar.jsx
      │  ├─ KelolaData.jsx
      │  └─ Transaksi.jsx
      └─ utils/
         ├─ api.js
         └─ dayRange.js

3) Setup Backend (Express + Prisma + MySQL)

Masuk folder Backend lalu inisialisasi:

cd Backend
npm init -y
npm i express cors dotenv @prisma/client
npm i -D prisma nodemon


package.json (script inti):

{
  "name": "backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init",
    "prisma:studio": "prisma studio"
  }
}


.env (ganti password/port sesuai mesinmu):

PORT=4000
NODE_ENV=development
TZ=Asia/Jakarta
# contoh: root tanpa simbol rumit
DATABASE_URL="mysql://root:PasswordAnda@127.0.0.1:3306/parkmall"


Jika password mengandung simbol seperti @:/?#&%, encode hanya password-nya (pakai encodeURIComponent), contoh: Pa@ss#1% → Pa%40ss%231%25.

Prisma
npx prisma init


prisma/schema.prisma:

generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum Jenis { Motor Mobil }
enum MetodePembayaran { CASH QRIS EMONEY DEBIT }

model GateMasuk {
  id         String   @id @default(cuid())
  kode       String   @unique
  jenis      Jenis
  plat       String
  gateIn     String
  jamMasuk   DateTime
  operatorIn String?
  transaksi  Transaksi?
  @@index([jamMasuk])
}

model Transaksi {
  id            String   @id @default(cuid())
  kode          String   @unique
  gateOut       String
  jamKeluar     DateTime
  durasiMenit   Int
  jamDibulatkan Int
  tarifPerJam   Int
  totalBayar    Int
  metode        MetodePembayaran
  tunaiDiterima Int?
  kembalian     Int?
  operatorOut   String?
  masuk         GateMasuk @relation(fields: [kode], references: [kode])
  @@index([jamKeluar])
}


Generate & migrate:

npm run prisma:generate
npm run prisma:migrate

Kode Backend

src/prisma.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
module.exports = { prisma };


src/utils/tarif.js

function hitungDurasi(jamMasukISO, now = new Date()) {
  const masuk = new Date(jamMasukISO);
  const ms = Math.max(0, now - masuk);
  const totalMenit = Math.ceil(ms / 60000);
  const jamBulatKeAtas = Math.max(1, Math.ceil(totalMenit / 60));
  return { totalMenit, jamBulatKeAtas };
}
function tarifPerJamByJenis(jenis) {
  return String(jenis).toLowerCase() === "mobil" ? 5000 : 2000;
}
module.exports = { hitungDurasi, tarifPerJamByJenis };


src/utils/time.js

function parseRangeOrToday(qs) {
  let start = qs.start ? new Date(qs.start) : null;
  let end   = qs.end   ? new Date(qs.end)   : null;
  if (!(start instanceof Date) || isNaN(start)) { start = new Date(); start.setHours(0,0,0,0); }
  if (!(end instanceof Date) || isNaN(end))     { end = new Date();   end.setHours(23,59,59,999); }
  return { start, end };
}
const HARI = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];
function idxSenin0(d) { return (d.getDay() + 6) % 7; }
function rangeMingguIni() {
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const monIdx = idxSenin0(start);
  start.setDate(start.getDate() - monIdx);
  const end = new Date(start); end.setDate(start.getDate() + 7);
  return { start, end };
}
module.exports = { parseRangeOrToday, HARI, idxSenin0, rangeMingguIni };


src/routes/masuk.routes.js

const express = require("express");
const router = express.Router();
const { prisma } = require("../prisma");
const { parseRangeOrToday } = require("../utils/time");

router.post("/", async (req, res) => {
  try {
    const { kode, jenis, plat, gateIn, jamMasuk, operatorIn } = req.body || {};
    if (!kode || !jenis || !plat || !gateIn) return res.status(400).json({ message: "kode, jenis, plat, gateIn wajib." });
    const jm = jamMasuk ? new Date(jamMasuk) : new Date();
    const created = await prisma.gateMasuk.create({
      data: { kode, jenis, plat, gateIn, jamMasuk: jm, operatorIn: operatorIn || null },
      select: { kode: true, jamMasuk: true }
    });
    res.status(201).json(created);
  } catch (e) {
    if (e?.code === "P2002") return res.status(409).json({ message: "Kode sudah terdaftar." });
    console.error(e); res.status(500).json({ message: "Gagal mencatat kendaraan masuk." });
  }
});

router.get("/", async (req, res) => {
  try {
    const { start, end } = parseRangeOrToday(req.query);
    const data = await prisma.gateMasuk.findMany({
      where: { jamMasuk: { gte: start, lt: end } },
      orderBy: { jamMasuk: "desc" },
      select: { kode: true, jenis: true, plat: true, gateIn: true, jamMasuk: true }
    });
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ message: "Gagal mengambil data masuk." }); }
});

router.get("/:kode", async (req, res) => {
  try {
    const d = await prisma.gateMasuk.findUnique({
      where: { kode: req.params.kode },
      select: { kode: true, jenis: true, plat: true, gateIn: true, jamMasuk: true }
    });
    if (!d) return res.status(404).json({ message: "Tidak ditemukan" });
    res.json(d);
  } catch (e) { console.error(e); res.status(500).json({ message: "Gagal lookup tiket." }); }
});

module.exports = router;


src/routes/transaksi.routes.js

const express = require("express");
const router = express.Router();
const { prisma } = require("../prisma");
const { hitungDurasi, tarifPerJamByJenis } = require("../utils/tarif");
const { parseRangeOrToday } = require("../utils/time");

router.post("/pay", async (req, res) => {
  try {
    const { kode, gateOut, metode, tunaiDiterima, operatorOut } = req.body || {};
    if (!kode || !gateOut || !metode) return res.status(400).json({ message: "kode, gateOut, metode wajib." });

    const masuk = await prisma.gateMasuk.findUnique({ where: { kode } });
    if (!masuk) return res.status(404).json({ message: "Kode tidak ditemukan di gate_masuk." });

    const existing = await prisma.transaksi.findUnique({ where: { kode } });
    if (existing) return res.status(409).json({ message: "Kode ini sudah dibayar." });

    const now = new Date();
    const { totalMenit, jamBulatKeAtas } = hitungDurasi(masuk.jamMasuk, now);
    const perJam = tarifPerJamByJenis(masuk.jenis);
    const totalBayar = perJam * jamBulatKeAtas;

    let kembalian = null, tunaiFix = null;
    if (metode === "CASH") {
      const pay = parseInt(tunaiDiterima ?? 0, 10);
      if (isNaN(pay) || pay < totalBayar) return res.status(400).json({ message: "Tunai kurang dari total bayar." });
      tunaiFix = pay; kembalian = pay - totalBayar;
    }

    const trx = await prisma.transaksi.create({
      data: {
        kode, gateOut, jamKeluar: now,
        durasiMenit: totalMenit, jamDibulatkan: jamBulatKeAtas,
        tarifPerJam: perJam, totalBayar, metode,
        tunaiDiterima: tunaiFix, kembalian, operatorOut: operatorOut || null
      }
    });

    res.status(201).json({
      id: trx.id, kode: trx.kode, totalBayar: trx.totalBayar,
      jamKeluar: trx.jamKeluar, metode: trx.metode,
      tunaiDiterima: trx.tunaiDiterima, kembalian: trx.kembalian, gateOut: trx.gateOut
    });
  } catch (e) { console.error(e); res.status(500).json({ message: "Gagal memproses transaksi." }); }
});

router.get("/keluar", async (req, res) => {
  try {
    const { start, end } = parseRangeOrToday(req.query);
    const data = await prisma.transaksi.findMany({
      where: { jamKeluar: { gte: start, lt: end } },
      orderBy: { jamKeluar: "desc" },
      select: {
        kode: true, jamKeluar: true, gateOut: true, totalBayar: true, metode: true,
        masuk: { select: { jenis: true, plat: true } }
      }
    });
    const mapped = data.map(d => ({
      kode: d.kode, jenis: d.masuk?.jenis || "-", plat: d.masuk?.plat || "-",
      gateOut: d.gateOut, jamKeluar: d.jamKeluar, totalBayar: d.totalBayar, metode: d.metode
    }));
    res.json(mapped);
  } catch (e) { console.error(e); res.status(500).json({ message: "Gagal mengambil data keluar." }); }
});

module.exports = router;


src/routes/statistik.routes.js

const express = require("express");
const router = express.Router();
const { prisma } = require("../prisma");
const { HARI, rangeMingguIni, idxSenin0, parseRangeOrToday } = require("../utils/time");

router.get("/pendapatan", async (req, res) => {
  try {
    const range = (req.query.range || "week").toLowerCase();

    if (range === "today") {
      const { start, end } = parseRangeOrToday({});
      const rows = await prisma.transaksi.findMany({ where: { jamKeluar: { gte: start, lt: end } }, select: { totalBayar: true } });
      const total = rows.reduce((s, r) => s + (r.totalBayar || 0), 0);
      return res.json({ labels: ["Hari Ini"], values: [total] });
    }

    if (range === "week") {
      const { start, end } = rangeMingguIni();
      const rows = await prisma.transaksi.findMany({ where: { jamKeluar: { gte: start, lt: end } }, select: { jamKeluar: true, totalBayar: true } });
      const totals = new Array(7).fill(0);
      for (const r of rows) totals[idxSenin0(new Date(r.jamKeluar))] += r.totalBayar || 0;
      return res.json({ labels: HARI, values: totals });
    }

    const { start, end } = parseRangeOrToday(req.query);
    const rows = await prisma.transaksi.findMany({ where: { jamKeluar: { gte: start, lt: end } }, select: { totalBayar: true } });
    const total = rows.reduce((s, r) => s + (r.totalBayar || 0), 0);
    res.json({ labels: ["Custom"], values: [total] });
  } catch (e) { console.error(e); res.status(500).json({ message: "Gagal mengambil statistik." }); }
});

module.exports = router;


src/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Matikan ETag & cache untuk API (hindari 304)
app.set("etag", false);
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// routes
app.use("/api/masuk", require("./routes/masuk.routes"));
app.use("/api/transaksi", require("./routes/transaksi.routes"));
app.use("/api/statistik", require("./routes/statistik.routes"));

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));


Jalankan backend:

npm run dev

4) Setup Frontend

Masuk folder Frontend:

cd ../Frontend
npm i


Frontend/.env

VITE_API_BASE=http://localhost:4000


src/utils/api.js

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function buildUrl(path, params) {
  const url = new URL(path.replace(/^\//, ""), API_BASE + "/");
  if (params) for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }
  return url.toString();
}

export async function getJSON(path, params) {
  const url = buildUrl(path, { ...(params || {}), _ts: Date.now() });
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { "Accept": "application/json", "Cache-Control": "no-store" },
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
  return res.json();
}
export async function postJSON(path, body) {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


Poin penting halaman:

Transaksi.jsx → Cari: GET /api/masuk/:kode, Bayar: POST /api/transaksi/pay.

Data_Masuk.jsx → GET /api/masuk (range hari ini).

Data_Keluar.jsx → GET /api/transaksi/keluar (range hari ini).

Data.jsx → grafik pendapatan mingguan: GET /api/statistik/pendapatan?range=week.

KelolaData.jsx → daftar transaksi 30 hari terakhir: GET /api/transaksi/keluar?start&end.

Jalankan frontend:

npm run dev

5) Uji Cepat (PowerShell)

Gunakan Invoke-RestMethod (irm), bukan curl gaya bash.

Gate-In:

$json = @'
{ "kode":"A1B2C3", "jenis":"Mobil", "plat":"B 1234 CD", "gateIn":"Pintu Masuk B" }
'@
irm http://localhost:4000/api/masuk -Method Post -ContentType 'application/json' -Body $json


Lookup tiket:

irm http://localhost:4000/api/masuk/A1B2C3


Bayar (Gate-Out):

$json = @'
{ "kode":"A1B2C3", "gateOut":"Pintu Keluar A", "metode":"CASH", "tunaiDiterima":20000 }
'@
irm http://localhost:4000/api/transaksi/pay -Method Post -ContentType 'application/json' -Body $json


Rekap hari ini:

irm http://localhost:4000/api/masuk
irm http://localhost:4000/api/transaksi/keluar


Statistik mingguan:

irm "http://localhost:4000/api/statistik/pendapatan?range=week"

6) Alur & Algoritma Inti
Gate-In (catat kendaraan masuk)

Admin/alat gate membuat kode struk unik kode.

Frontend kirim POST /api/masuk { kode, jenis, plat, gateIn }.

Backend simpan ke GateMasuk (jamMasuk = now).

Rekapan Masuk hari ini membaca dari GateMasuk range 00:00–23:59.

Transaksi (bayar & keluar)

Kasir input kode → Frontend GET /api/masuk/:kode.

Frontend hitung durasi & estimasi total (info ke kasir).

Kasir konfirmasi → POST /api/transaksi/pay { kode, gateOut, metode, tunaiDiterima? }.

Backend:

Validasi kode ada & belum dibayar.

Hitung durasi (dibulatkan ≥1 jam), tentukan tarif/jam (Mobil 5.000, Motor 2.000).

Jika CASH, cek tunaiDiterima ≥ total; hitung kembalian.

Simpan Transaksi.

Rekapan Keluar hari ini & Grafik Pendapatan membaca dari Transaksi.

7) Troubleshooting (ringkas)

P1001: Can't reach DB → MySQL belum jalan/port salah. Pakai 127.0.0.1:3306.

P1000: Authentication failed → user/password salah. Coba buat user khusus:

CREATE USER 'parkmall_user'@'127.0.0.1' IDENTIFIED BY 'StrongPass123';
GRANT ALL PRIVILEGES ON parkmall.* TO 'parkmall_user'@'127.0.0.1';
FLUSH PRIVILEGES;


.env → mysql://parkmall_user:StrongPass123@127.0.0.1:3306/parkmall

P1013: invalid port number → URL ter-encode salah (jangan encode host/port, encode password saja).

PowerShell “-X/-H/-d tidak dikenali” → gunakan irm/iwr atau curl.exe.

UI “Data struk tidak ditemukan” padahal ada:

Pastikan frontend pakai /api/masuk/:kode (bukan mock).

Nonaktifkan cache (frontend cache:'no-store', backend app.set('etag', false) + header no-store).

Kode yang dicari sama dengan di DB (perhatikan huruf/angka).

8) Siap Produksi (opsional)

Keamanan: helmet, CORS ketat, validasi payload (zod/joi), rate-limit.

Operasional: jalankan dengan PM2 atau Docker, monitoring, backup DB.

Realtime: ganti polling menjadi SSE/WebSocket untuk update tabel langsung.

Export: Endpoint CSV/Excel untuk KelolaData.git add README.md
