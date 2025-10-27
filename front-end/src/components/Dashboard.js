import Navbar from "./Navbar";
import { Outlet, Link } from "react-router-dom";
import { useState } from "react";

function Dashboard({ children }) {
  const [pendingTasks] = useState(2);
  const [unpaidBills] = useState(3);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#fafafa",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
          padding: "1rem 1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          zIndex: 1,
        }}
      >
        <h2 style={{ margin: 0, fontWeight: 600, color: "#333" }}>
          <Link
            to="/home"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            Habita
          </Link>
        </h2>
        <button
          style={{
            border: "none",
            background: "#fff",
            borderRadius: "50%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "0.5rem 0.6rem",
            cursor: "pointer",
          }}
        >
          🔔
        </button>
      </header>
      <div
        style={{
          backgroundColor: "white",
          padding: "10px 20px",
          borderBottom: "1px solid #f0f0f0",
          fontWeight: "bold",
        }}
      >
        🧹 {pendingTasks} pending tasks ・ 💰 {unpaidBills} unpaid bills
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{children || <Outlet />}</div>
      <Navbar />
    </div>
  );
}

export default Dashboard;
