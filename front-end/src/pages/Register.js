import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div style={container}>
      <h2 style={title}>Create Account</h2>
      <p style={subtitle}>Join your housemates on Habita</p>

      <form style={form}>
        <input style={input} type="text" placeholder="Full Name" required />
        <input style={input} type="email" placeholder="Email" required />
        <input style={input} type="password" placeholder="Password" required />
        <button style={button} type="submit">
          Register
        </button>
      </form>

      <p style={footerText}>
        Already have an account?{" "}
        <Link to="/login" style={link}>
          Login
        </Link>
      </p>
    </div>
  );
}

const container = {
  maxWidth: "360px",
  margin: "5rem auto",
  textAlign: "center",
  background: "rgba(74,144,226,0.08)",
  padding: "2rem",
  borderRadius: "16px",
  border: "1px solid rgba(74,144,226,0.25)",
  color: "var(--habita-text)",
};

const title = { marginBottom: "0.3rem", color: "var(--habita-text)" };
const subtitle = {
  marginBottom: "1.5rem",
  color: "var(--habita-muted)",
  fontSize: "0.9rem",
};
const form = { display: "flex", flexDirection: "column", gap: "1rem" };
const input = {
  padding: "0.8rem",
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  fontSize: "1rem",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
};
const button = {
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "8px",
  padding: "0.8rem",
  cursor: "pointer",
  fontWeight: "500",
};
const footerText = {
  marginTop: "1rem",
  fontSize: "0.85rem",
  color: "var(--habita-muted)",
};
const link = {
  color: "var(--habita-accent)",
  textDecoration: "none",
  fontWeight: "500",
};
