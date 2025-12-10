import { Link, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

function Navbar() {
  const location = useLocation();
  const { translate: t } = useUser();
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
        {t("nav.home")}
      </Link>
      <Link
        to="/tasks"
        style={{ color: active("/tasks"), textDecoration: "none", fontWeight: 600 }}
      >
        {t("nav.tasks")}
      </Link>
      <Link
        to="/bills"
        style={{ color: active("/bills"), textDecoration: "none", fontWeight: 600 }}
      >
        {t("nav.bills")}
      </Link>
      <Link
        to="/calendar"
        style={{ color: active("/calendar"), textDecoration: "none", fontWeight: 600 }}
      >
        {t("nav.calendar")}
      </Link>
      <Link
        to="/profile"
        style={{ color: active("/profile"), textDecoration: "none", fontWeight: 600 }}
      >
        {t("nav.profile")}
      </Link>
    </nav>
  );
}

export default Navbar;
