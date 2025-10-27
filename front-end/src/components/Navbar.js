import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const active = (path) => (location.pathname === path ? "#4A90E2" : "gray");

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        height: "60px",
        borderTop: "1px solid #eee",
        background: "#fff",
        position: "sticky",
        bottom: 0,
      }}
    >
      <Link
        to="/home"
        style={{ color: active("/home"), textDecoration: "none" }}
      >
        Home
      </Link>
      <Link
        to="/tasks"
        style={{ color: active("/tasks"), textDecoration: "none" }}
      >
        Tasks
      </Link>
      <Link
        to="/bills"
        style={{ color: active("/bills"), textDecoration: "none" }}
      >
        Bills
      </Link>
      <Link
        to="/chat"
        style={{ color: active("/chat"), textDecoration: "none" }}
      >
        Chat
      </Link>
      <Link
        to="/profile"
        style={{ color: active("/profile"), textDecoration: "none" }}
      >
        Profile
      </Link>
    </nav>
  );
}

export default Navbar;
