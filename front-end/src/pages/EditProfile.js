import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser, avatarOptions } = useUser();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    password: "",
    confirm: "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (form.password && form.password !== form.confirm) {
      return;
    }
    updateUser({
      name: form.name,
      email: form.email,
      avatar: selectedAvatar,
    });
    navigate(-1);
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button type="button" style={ghostButtonStyle} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 style={titleStyle}>Edit Profile</h2>
      </header>

        <div style={avatarSectionStyle}>
          <button
            type="button"
            style={{ ...avatarDisplayStyle, fontSize: "2.4rem" }}
            onClick={() => {
              const currentIndex = avatarOptions.indexOf(selectedAvatar);
              const nextIndex = (currentIndex + 1) % avatarOptions.length;
              setSelectedAvatar(avatarOptions[nextIndex]);
            }}
            title="Shuffle avatar"
          >
            {selectedAvatar}
          </button>
          <p style={avatarHintStyle}>Click to shuffle or pick below.</p>
          <div style={avatarGridStyle}>
            {avatarOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedAvatar(option)}
                style={{
                  ...avatarOptionStyle,
                  ...(option === selectedAvatar ? avatarOptionActiveStyle : {}),
                }}
                aria-label={`Choose avatar ${option}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

      <section style={cardStyle}>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              style={inputStyle}
              required
            />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              style={inputStyle}
              required
            />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>New Password</span>
            <input
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              style={inputStyle}
              placeholder="Leave blank to keep current"
            />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Confirm Password</span>
            <input
              type="password"
              value={form.confirm}
              onChange={handleChange("confirm")}
              style={inputStyle}
              placeholder="Re-enter new password"
            />
          </label>

          <div style={buttonRowStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button type="submit" style={primaryButtonStyle}>
              Save Changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

const pageStyle = {
  padding: "1.25rem",
  backgroundColor: "var(--habita-bg)",
  minHeight: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  color: "var(--habita-text)",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.8rem",
  background: "rgba(74,144,226,0.08)",
  padding: "0.6rem 0.9rem",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.2rem",
  color: "var(--habita-text)",
};

const ghostButtonStyle = {
  background: "transparent",
  border: "none",
  color: "var(--habita-accent)",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 600,
  padding: 0,
};

const avatarSectionStyle = {
  background: "rgba(74,144,226,0.08)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  alignItems: "center",
};

const avatarDisplayStyle = {
  width: "76px",
  height: "76px",
  borderRadius: "50%",
  border: "2px solid var(--habita-accent)",
  background: "var(--habita-chip)",
  color: "var(--habita-chip-text)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const avatarHintStyle = {
  margin: 0,
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
};

const avatarGridStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
  justifyContent: "center",
};

const avatarOptionStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  border: "1px solid var(--habita-border)",
  background: "var(--habita-card)",
  fontSize: "1.5rem",
  cursor: "pointer",
};

const avatarOptionActiveStyle = {
  borderColor: "var(--habita-accent)",
  outline: "2px solid rgba(74,144,226,0.3)",
  outlineOffset: "2px",
};

const cardStyle = {
  background: "rgba(74,144,226,0.08)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "1.2rem",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const labelStyle = {
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
  fontWeight: 600,
};

const inputStyle = {
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  padding: "0.55rem 0.7rem",
  fontSize: "0.95rem",
  outline: "none",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.6rem",
  marginTop: "0.5rem",
};

const secondaryButtonStyle = {
  border: "1px solid rgba(74,144,226,0.3)",
  background: "rgba(74,144,226,0.12)",
  borderRadius: "8px",
  padding: "0.55rem 1rem",
  fontSize: "0.9rem",
  color: "var(--habita-text)",
  cursor: "pointer",
};

const primaryButtonStyle = {
  backgroundImage: "linear-gradient(135deg, var(--habita-accent), #9ecbff)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "8px",
  padding: "0.55rem 1.2rem",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
};
