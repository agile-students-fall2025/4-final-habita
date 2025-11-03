import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const active = (path) =>
    location.pathname === path
      ? "var(--habita-accent)"
      : "var(--habita-muted)";

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        height: "60px",
        borderTop: "1px solid var(--habita-border)",
        background: "rgba(74,144,226,0.08)",
        position: "sticky",
        bottom: 0,
      }}
    >
      <Link
        to="/home"
        style={{ color: active("/home"), textDecoration: "none", fontWeight: 600 }}
      >
        Home
      </Link>
      <Link
        to="/tasks"
        style={{ color: active("/tasks"), textDecoration: "none", fontWeight: 600 }}
      >
        Tasks
      </Link>
      <Link
        to="/bills"
        style={{ color: active("/bills"), textDecoration: "none", fontWeight: 600 }}
      >
        Bills
      </Link>
      <Link
        to="/chat"
        style={{ color: active("/chat"), textDecoration: "none", fontWeight: 600 }}
      >
        Chat
      </Link>
      <Link
        to="/profile"
        style={{ color: active("/profile"), textDecoration: "none", fontWeight: 600 }}
      >
        Profile
      </Link>
    </nav>
  );
}

export default Navbar;
