import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/components/Dashboard";
import Transaksi from "./pages/Transaksi";
import KelolaData from "./pages/KelolaData";
import './App.css';

function App() {
  return (
    <Router>
      <div className="layout">
        {/* Sidebar di kiri */}
        <Sidebar />

        {/* Konten utama */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route path="/kelola-data" element={<KelolaData />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
