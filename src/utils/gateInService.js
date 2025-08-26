// src/utils/gateInService.js
import { postJSON } from "./api";

export async function catatKendaraanMasuk({ kode, jenis, plat, gateIn }) {
  return postJSON("/api/masuk", {
    kode, jenis, plat, gateIn,
    jamMasuk: new Date().toISOString()
  });
}




// // src/utils/gateInService.js
// import { postJSON } from "./api";

// export async function catatKendaraanMasuk({ kode, jenis, plat, gateIn }) {
//   return postJSON("/api/masuk", {
//     kode, jenis, plat, gateIn,
//     jamMasuk: new Date().toISOString()
//   });
// }

// export async function catatKendaraanMasuk({ kode, jenis, plat, gateIn }) {
//   const body = {
//     kode,
//     jenis,     // "Motor" | "Mobil"
//     plat,
//     gateIn,
//     jamMasuk: new Date().toISOString(), // atau pakai waktu dari device gate
//   };
//   const res = await fetch("/api/masuk", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body),
//   });
//   if (!res.ok) throw new Error("Gagal mencatat kendaraan masuk.");
//   return await res.json();
// }
