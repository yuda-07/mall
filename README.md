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
# uji
curl http://localhost:4000/health
