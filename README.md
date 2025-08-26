# Mall Parkir — README (Singkat & Penting)

Aplikasi parkir full-stack: **React (Vite)** + **Express** + **MySQL (Prisma)**.  
Fitur inti: Gate-In, Transaksi Pembayaran (Gate-Out), Rekap Harian (Masuk/Keluar), dan Grafik Pendapatan.

---

## 1) Prasyarat
- Node.js ≥ 18, npm
- MySQL 8 (lokal) berjalan
- Buat database:
  ```sql
  CREATE DATABASE parkmall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
## 2) Struktur Proyek (ringkas)
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
          ├─ pages/ (Dashboard, Data, Data_Masuk, Data_Keluar, Transaksi, KelolaData)
          └─ utils/api.js
## 3) Setup Backend (Express + Prisma)
3.1 Install & skrip
cd Backend
npm i express cors dotenv @prisma/client
npm i -D prisma nodemon

    package.json
    {
      "main": "src/server.js",
      "scripts": {
        "dev": "nodemon src/server.js",
        "start": "node src/server.js",
        "prisma:generate": "prisma generate",
        "prisma:migrate": "prisma migrate dev --name init",
        "prisma:studio": "prisma studio"
      }
    }

3.2 Konfigurasi .env

    Gunakan host 127.0.0.1 dan encode hanya password jika ada karakter spesial.
    PORT=4000
    NODE_ENV=development
    TZ=Asia/Jakarta
    DATABASE_URL="mysql://root:PASSWORD_ENCODE@127.0.0.1:3306/parkmall"
3.3 Prisma

    npx prisma init
    # edit prisma/schema.prisma sesuai model (GateMasuk & Transaksi)
    npm run prisma:generate
    npm run prisma:migrate

3.4 Matikan cache ETag (hindari 304 di API)

     Di src/server.js (sebelum routes):
     app.set("etag", false);
      app.use((req,res,next)=>{res.set("Cache-Control","no-store");res.set("Pragma","no-cache");res.set("Expires","0");next();});
3.5 Jalankan

    npm run dev
    uji
    curl http://localhost:4000/health

# 4) Setup Frontend (React + Vite)
4.1 Base URL API

Frontend/.env

    VITE_API_BASE=http://localhost:4000

4.2 Helper fetch tanpa cache

src/utils/api.js

    export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
    const u = (p, q={}) => {
      const url = new URL(p.replace(/^\//,''), API_BASE + '/');
      Object.entries(q).forEach(([k,v])=> (v??false) !== false && url.searchParams.set(k, v));
      return url.toString();
    };
    export async function getJSON(path, params){
      const res = await fetch(u(path, {...params, _ts: Date.now()}), { cache: 'no-store', headers: { 'Accept':'application/json','Cache-Control':'no-store' }});
      if(!res.ok) throw new Error(await res.text());
      return res.json();
    }
    export async function postJSON(path, body){
      const res = await fetch(u(path), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{}), cache:'no-store' });
      if(!res.ok) throw new Error(await res.text());
      return res.json();
    }

4.3 Integrasi halaman Transaksi

Cari tiket → GET /api/masuk/:kode (bukan MOCK).

Bayar → POST /api/transaksi/pay.

Contoh ringkas:

    // Cari
    const d = await getJSON(`/api/masuk/${encodeURIComponent(kode)}`);
    // Bayar
    await postJSON("/api/transaksi/pay", { kode, gateOut, metode, tunaiDiterima });

# 5) Alur Pakai (End-to-End)
   
5.1 Gate-In (buat tiket)

    PowerShell (Invoke-RestMethod):
    $json=@'
    { "kode":"A1B253", "jenis":"Mobil", "plat":"B 1234 CD", "gateIn":"Pintu Masuk B" }
    '@
    irm http://localhost:4000/api/masuk -Method Post -ContentType 'application/json' -Body $json

5.2 Transaksi Pembayaran (Gate-Out)

    $json=@'
    { "kode":"A1B253", "gateOut":"Pintu Keluar A", "metode":"CASH", "tunaiDiterima":20000 }
    '@
    irm http://localhost:4000/api/transaksi/pay -Method Post -ContentType 'application/json' -Body $json

5.3 Rekap & Grafik

    # Rekap Masuk (hari ini)
    irm http://localhost:4000/api/masuk
    
    # Rekap Keluar (hari ini)
    irm http://localhost:4000/api/transaksi/keluar

    # Pendapatan Mingguan (untuk Chart.js)
    irm "http://localhost:4000/api/statistik/pendapatan?range=week"

# 6) Ringkasan Endpoint

        -- POST /api/masuk → catat gate-in.
        -- GET /api/masuk?start&end → rekap masuk (default hari ini).
        -- GET /api/masuk/:kode → lookup tiket (dipakai halaman Transaksi → “Cari”).
        -- POST /api/transaksi/pay → proses bayar + gate-out.
        -- GET /api/transaksi/keluar?start&end → rekap keluar (default hari ini).
        -- GET /api/statistik/pendapatan?range=today|week|custom&start&end → data grafik.

# 7) Troubleshooting Singkat

        P1000 (auth gagal) → periksa user/password, gunakan host 127.0.0.1, encode password saja
        P1001 (tidak bisa connect) → MySQL belum start / port salah (3306/3307)
        PowerShell “-X/-H/-d” tidak dikenal → gunakan irm (Invoke-RestMethod) atau curl.exe
        UI “Data struk tidak ditemukan” → pastikan:
        Kode yang dicari ada (GET /api/masuk/:kode = 200).
        Frontend memanggil /api/masuk/:kode (bukan MOCK).
        Cache dimatikan (frontend no-store, backend etag off).
8) Production Notes (singkat)

        Tambah security: helmet, rate-limit, validasi payload (zod/joi).
        Jalankan dengan PM2/Docker; gunakan prisma migrate deploy saat deploy.
        Backup DB terjadwal; monitoring health & logs.
