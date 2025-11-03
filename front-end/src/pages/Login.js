import { Link, useNavigate } from "react-router-dom";
import { useCallback } from "react";

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      navigate("/home");
    },
    [navigate]
  );

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={headerBlockStyle}>
          <span style={eyebrowStyle}>Welcome back</span>
          <h2 style={titleStyle}>Sign in to Habita</h2>
          <p style={subtitleStyle}>
            Keep up with shared tasks, bills, and roommate chats in one spot.
          </p>
        </div>

        <form style={formStyle} onSubmit={handleSubmit}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Email</span>
            <input style={inputStyle} type="email" placeholder="you@example.com" required />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Password</span>
            <input style={inputStyle} type="password" placeholder="••••••••" required />
          </label>
          <button style={submitButtonStyle} type="submit">
            Log In
          </button>
        </form>

        <div style={footerRowStyle}>
          <span style={footerTextStyle}>New to Habita?</span>
          <Link to="/register" style={footerLinkStyle}>
            Create an account
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

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  background: "var(--habita-card)",
  borderRadius: "18px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "2.5rem",
  color: "var(--habita-text)",
  display: "flex",
  flexDirection: "column",
  gap: "1.75rem",
  boxSizing: "border-box",
};

const headerBlockStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const eyebrowStyle = {
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--habita-accent)",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.8rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const subtitleStyle = {
  margin: 0,
  fontSize: "0.95rem",
  color: "var(--habita-muted)",
  lineHeight: 1.5,
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1.1rem",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
  textAlign: "left",
};

const labelStyle = {
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--habita-muted)",
};

const inputStyle = {
  padding: "0.85rem 1rem",
  borderRadius: "10px",
  border: "1px solid var(--habita-border)",
  fontSize: "0.95rem",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
  outline: "none",
};

const submitButtonStyle = {
  marginTop: "0.2rem",
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "999px",
  padding: "0.85rem 1.2rem",
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer",
};

const footerRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "0.35rem",
  fontSize: "0.9rem",
};

const footerTextStyle = {
  color: "var(--habita-muted)",
};

const footerLinkStyle = {
  color: "var(--habita-accent)",
  fontWeight: 600,
  textDecoration: "none",
};
