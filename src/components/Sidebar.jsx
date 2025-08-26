import { Link } from "react-router-dom";
import './Sidebar.css'
function Sidebar() {
  return (
    <div className="Sidebar">
      <h2>Park<span>MAll</span></h2>
          <div className="yuda">
            <div> <Link to="/" className="navbar">Dashboard</Link></div>
            <div><Link to="/transaksi" className="navbar">Transaksi</Link></div>
            <div><Link to="/kelola-data" className="navbar">Kelola Data</Link></div>
          </div>
    </div>
  );
}

export default Sidebar;