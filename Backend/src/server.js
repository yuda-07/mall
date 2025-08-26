require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ⬇️ Matikan ETag + paksa no-cache (letakkan sebelum routes)
app.set("etag", false);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");   // jangan cache response API
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
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
