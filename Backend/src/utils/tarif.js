function hitungDurasi(jamMasukISO, now = new Date()) {
  const masuk = new Date(jamMasukISO);
  const ms = Math.max(0, now - masuk);
  const totalMenit = Math.ceil(ms / 60000);
  const jamBulatKeAtas = Math.max(1, Math.ceil(totalMenit / 60)); // minimal 1 jam
  return { totalMenit, jamBulatKeAtas };
}

function tarifPerJamByJenis(jenis) {
  return String(jenis).toLowerCase() === "mobil" ? 5000 : 2000; // sesuaikan aturanmu
}

module.exports = { hitungDurasi, tarifPerJamByJenis };
