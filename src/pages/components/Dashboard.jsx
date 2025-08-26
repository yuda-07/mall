import "../../Style/Dashboard.css"; // <-- ini path yang benar
import Data_Keluar from "./Data_Keluar";
import Data_Masuk from "./Data_Masuk";
import Data from "./Data";

import React from "react";

function Dashboard() {
  const byId = (id) => document.getElementById(id);
  
  return (
    <div className="Dashbord" id="Dashbord">
      <div className="container">
        <h1>Dashboard</h1>
        <div className="pencarian">
          <input
            type="pencarian"
            name="pencarian"
            id="pencarian"
            placeholder="masukan kata kunci"
          />{" "}
          <button type="submit">Cari</button>
        </div>
      </div>

      <div className="parent" id="Perent">
        {/* container 1 Mulai */}

        <div className="Grid">
          <div>
            <Data_Masuk />
          </div>
          <div>
            <Data_Keluar />
          </div>
        </div>

        {/* Container 1 Selesai */}

        {/* container 2 Start */}
        <div className="wrap">
          <Data/>
        </div>

        {/* Container 2 Selesai */}

        
          <div className="cardt wide">
            <p className="label">Pendapatan Hari Ini</p>
            <p className="value--money" id="nominalHariIni">Rp 0</p>
          </div>
    
      </div>
    </div>
  );
}

export default Dashboard;
