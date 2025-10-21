import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
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
      <div
        style={{
          backgroundColor: "white",
          padding: "10px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
