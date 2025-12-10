import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated, translate: t } = useUser();
  const [form, setForm] = useState({ name: "", username: "", password: "", householdId: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/home";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      setSubmitting(true);
      try {
        await register({
          username: form.username,
          password: form.password,
          name: form.name,
          householdId: form.householdId,
        });
        navigate(redirectPath, { replace: true });
      } catch (err) {
        setError(err.message || t("Unable to create account."));
      } finally {
        setSubmitting(false);
      }
    },
    [form.name, form.password, form.username, navigate, redirectPath, register, t]
  );

  return (
    <div style={pageStyle}>
      <div style={card}>
        <div style={headerBlock}>
          <span style={eyebrow}>{t("Join the house")}</span>
          <h2 style={title}>{t("Create your account")}</h2>
          <p style={subtitle}>{t("Set up your profile and start collaborating with roommates.")}</p>
        </div>

        <form style={formStyles} onSubmit={handleSubmit}>
          <label style={field}>
            <span style={label}>{t("Name")}</span>
            <input
              style={input}
              type="text"
              placeholder={t("Full name placeholder")}
              value={form.name}
              onChange={handleChange("name")}
            />
          </label>
          <label style={field}>
            <span style={label}>{t("Username or email")}</span>
            <input
              style={input}
              type="text"
              placeholder="alex@example.com"
              value={form.username}
              onChange={handleChange("username")}
              required
              autoComplete="username"
            />
          </label>
          <label style={field}>
            <span style={label}>{t("Password")}</span>
            <input
              style={input}
              type="password"
              placeholder={t("Minimum 6 characters")}
              value={form.password}
              onChange={handleChange("password")}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </label>
          <label style={field}>
            <span style={label}>{t("Invite code (optional)")}</span>
            <input
              style={input}
              type="text"
              placeholder={t("Invite code placeholder")}
              value={form.householdId}
              onChange={handleChange("householdId")}
              autoComplete="off"
            />
            <span style={hint}>
              {t("Invite code hint")}
            </span>
          </label>
          {error && <div style={errorStyle}>{error}</div>}
          <button style={button} type="submit" disabled={submitting}>
            {submitting ? t("Registering...") : t("Register")}
          </button>
        </form>

        <div style={footerRow}>
          <span style={footerText}>{t("Already have an account?")}</span>
          <Link to="/login" style={link}>
            {t("Sign in")}
          </Link>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  background: "var(--habita-bg)",
};

const card = {
  width: "100%",
  maxWidth: "440px",
  background: "var(--habita-card)",
  borderRadius: "18px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "2.25rem",
  color: "var(--habita-text)",
  display: "flex",
  flexDirection: "column",
  gap: "1.6rem",
  boxSizing: "border-box",
};

const headerBlock = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  textAlign: "left",
};

const eyebrow = {
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--habita-accent)",
};

const title = { margin: 0, fontSize: "1.7rem", fontWeight: 600 };
const subtitle = {
  margin: 0,
  fontSize: "0.95rem",
  color: "var(--habita-muted)",
  lineHeight: 1.5,
};

const formStyles = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const field = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const label = {
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--habita-muted)",
};

const input = {
  padding: "0.9rem 1rem",
  borderRadius: "10px",
  border: "1px solid var(--habita-border)",
  fontSize: "1rem",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
  outline: "none",
};

const hint = {
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
  lineHeight: 1.3,
};

const button = {
  marginTop: "0.4rem",
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "999px",
  padding: "0.9rem 1.2rem",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
};

const footerRow = {
  display: "flex",
  gap: "0.35rem",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.9rem",
};

const footerText = {
  color: "var(--habita-muted)",
};

const link = {
  color: "var(--habita-accent)",
  fontWeight: 600,
  textDecoration: "none",
};

const errorStyle = {
  background: "rgba(255, 99, 71, 0.15)",
  border: "1px solid rgba(255, 99, 71, 0.35)",
  color: "#ff5c5c",
  borderRadius: "10px",
  padding: "0.8rem 0.95rem",
  fontSize: "0.9rem",
};
