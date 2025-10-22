import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div style={container}>
      <h2 style={title}>Create Account 🏡</h2>
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
  background: "#fff",
  padding: "2rem",
  borderRadius: "12px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

const title = { marginBottom: "0.3rem", color: "#333" };
const subtitle = { marginBottom: "1.5rem", color: "#777", fontSize: "0.9rem" };
const form = { display: "flex", flexDirection: "column", gap: "1rem" };
const input = {
  padding: "0.8rem",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "1rem",
};
const button = {
  backgroundColor: "black",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "0.8rem",
  cursor: "pointer",
  fontWeight: "500",
};
const footerText = { marginTop: "1rem", fontSize: "0.85rem", color: "#555" };
const link = { color: "#4A90E2", textDecoration: "none", fontWeight: "500" };
