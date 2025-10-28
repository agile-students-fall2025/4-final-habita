import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const roommates = [
  { id: 1, name: "Alex", initials: "A", role: "Organizer" },
  { id: 2, name: "Sam", initials: "S", role: "Bills" },
  { id: 3, name: "Jordan", initials: "J", role: "Cleaning" },
];

const languages = ["English", "Spanish", "Mandarin"];
const roommateProfiles = {
  Alex: { role: "Organizer", fun: "Keeper of the household calendar." },
  Sam: { role: "Bills", fun: "Handles split expenses like a pro." },
  Jordan: { role: "Cleaning", fun: "Always ready with the cleaning playlist." },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, cycleAvatar, darkMode, toggleDarkMode, updateUser } = useUser();
  const [inviteCode] = useState("HBT-92F7");
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    language: "English",
  });
  const [hoveredRoommate, setHoveredRoommate] = useState(null);

  const groupedRoommates = useMemo(() => [...roommates], []);

  return (
    <div style={pageStyle}>
      <section style={profileCardStyle}>
        <div style={profileHeaderStyle}>
          <button
            type="button"
            style={avatarButtonStyle}
            onClick={cycleAvatar}
            title="Click to swap avatar"
          >
            {user.avatar}
          </button>
          <div>
            <h2 style={profileNameStyle}>{user.name}</h2>
            <p style={profileEmailStyle}>{user.email}</p>
          </div>
        </div>
        <div style={profileActionsStyle}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => navigate("/profile/edit")}
          >
            Edit Profile
          </button>
        </div>
      </section>

      <section style={groupCardStyle}>
        <header style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>My Group</h3>
          <button
            type="button"
            style={ghostButtonStyle}
            onClick={() => setShowInvite((prev) => !prev)}
          >
            {showInvite ? "Hide Invite" : "Invite Roommate"}
          </button>
        </header>
        <div style={roommateGridStyle}>
          {groupedRoommates.map((roommate) => (
            <div
              key={roommate.id}
              style={roommateChipStyle}
              onMouseEnter={() => setHoveredRoommate(roommate)}
              onMouseLeave={() => setHoveredRoommate(null)}
            >
              <div style={chipAvatarStyle}>{roommate.initials}</div>
              <div>
                <span style={chipNameStyle}>{roommate.name}</span>
                <span style={chipRoleStyle}>{roommate.role}</span>
              </div>
              {hoveredRoommate?.id === roommate.id && (
                <div style={tooltipStyle}>
                  <strong style={tooltipTitleStyle}>{roommate.name}</strong>
                  <span style={tooltipMetaStyle}>
                    {roommateProfiles[roommate.name]?.role ?? "Roommate"}
                  </span>
                  <span style={tooltipFunStyle}>
                    {roommateProfiles[roommate.name]?.fun ??
                      "Teamwork makes the dream work."}
                  </span>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            style={addMemberButtonStyle}
            onClick={() => setShowInvite(true)}
            aria-label="Invite roommate"
          >
            +
          </button>
        </div>
      </section>

      {showInvite && (
        <section style={inviteCardStyle}>
          <h3 style={sectionTitleStyle}>Invite Roommates</h3>
          <p style={sectionHintStyle}>
            Share this code so your roommates can join your household.
          </p>
          <div style={codeRowStyle}>
            <span style={codeBadgeStyle}>{inviteCode}</span>
            <button type="button" style={secondaryButtonStyle}>
              Copy Code
            </button>
            <button type="button" style={secondaryButtonStyle}>
              Share Link
            </button>
          </div>
        </section>
      )}

      <section style={settingsCardStyle}>
        <header style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>Settings</h3>
          <button
            type="button"
            style={ghostButtonStyle}
            onClick={() => setShowSettings((prev) => !prev)}
          >
            {showSettings ? "Hide" : "Adjust"}
          </button>
        </header>
        {showSettings && (
          <div style={settingsBodyStyle}>
            <div style={settingRowStyle}>
              <span>Notifications</span>
              <label style={toggleWrapperStyle}>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={() =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: !prev.notifications,
                    }))
                  }
                  style={toggleInputStyle}
                />
                <span
                  style={{
                    ...toggleTrackStyle,
                    backgroundColor: settings.notifications
                      ? "var(--habita-accent)"
                      : "var(--habita-border)",
                  }}
                >
                  <span
                    style={{
                      ...toggleKnobStyle,
                      background: settings.notifications
                        ? "var(--habita-button-text)"
                        : "var(--habita-card)",
                      transform: settings.notifications
                        ? "translateX(18px)"
                        : "translateX(0)",
                    }}
                  />
                </span>
              </label>
            </div>
            <div style={settingRowStyle}>
              <span>Dark Mode</span>
              <label style={toggleWrapperStyle}>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  style={toggleInputStyle}
                />
                <span
                  style={{
                    ...toggleTrackStyle,
                    backgroundColor: darkMode
                      ? "var(--habita-accent)"
                      : "var(--habita-border)",
                  }}
                >
                  <span
                    style={{
                      ...toggleKnobStyle,
                      background: darkMode
                        ? "var(--habita-button-text)"
                        : "var(--habita-card)",
                      transform: darkMode
                        ? "translateX(18px)"
                        : "translateX(0)",
                    }}
                  />
                </span>
              </label>
            </div>
            <label style={settingColumnStyle}>
              <span>Language</span>
              <select
                value={settings.language}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    language: event.target.value,
                  }))
                }
                style={selectStyle}
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      <button
        type="button"
        style={logoutButtonStyle}
        onClick={() => {
          updateUser({ avatar: "🌿", name: "Mavis Liu", email: "mavisliu@example.com" });
          navigate("/login");
        }}
      >
        Log out
      </button>
    </div>
  );
}

const pageStyle = {
  padding: "1.25rem",
  backgroundColor: "var(--habita-bg)",
  minHeight: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
  color: "var(--habita-text)",
};

const profileCardStyle = {
  background: "var(--habita-card)",
  borderRadius: "12px",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
  boxShadow: "var(--habita-shadow)",
};

const profileHeaderStyle = {
  display: "flex",
  gap: "0.9rem",
  alignItems: "center",
};

const avatarButtonStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  backgroundColor: "var(--habita-chip)",
  color: "var(--habita-chip-text)",
  border: "1px solid var(--habita-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.8rem",
  cursor: "pointer",
};

const profileNameStyle = {
  margin: 0,
  fontSize: "1.2rem",
  color: "var(--habita-text)",
};

const profileEmailStyle = {
  margin: "0.1rem 0 0",
  fontSize: "0.85rem",
  color: "var(--habita-muted)",
};

const profileActionsStyle = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
};

const secondaryButtonStyle = {
  border: "1px solid var(--habita-border)",
  background: "var(--habita-card)",
  borderRadius: "8px",
  padding: "0.45rem 0.9rem",
  fontSize: "0.85rem",
  color: "var(--habita-text)",
  cursor: "pointer",
  boxShadow: "var(--habita-shadow)",
};

const groupCardStyle = {
  background: "var(--habita-card)",
  borderRadius: "12px",
  padding: "1rem",
  boxShadow: "var(--habita-shadow)",
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "1rem",
  color: "var(--habita-text)",
};

const ghostButtonStyle = {
  background: "transparent",
  border: "1px dashed var(--habita-accent)",
  color: "var(--habita-accent)",
  borderRadius: "8px",
  padding: "0.35rem 0.8rem",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const roommateGridStyle = {
  display: "flex",
  gap: "0.8rem",
  flexWrap: "wrap",
};

const roommateChipStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  background: "var(--habita-chip)",
  borderRadius: "999px",
  padding: "0.4rem 0.8rem",
  position: "relative",
};

const chipAvatarStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
};

const chipNameStyle = {
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const chipRoleStyle = {
  display: "block",
  fontSize: "0.7rem",
  color: "var(--habita-muted)",
};

const addMemberButtonStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  border: "1px dashed var(--habita-accent)",
  background: "transparent",
  color: "var(--habita-accent)",
  fontWeight: 600,
  cursor: "pointer",
};

const tooltipStyle = {
  position: "absolute",
  top: "110%",
  left: 0,
  width: "180px",
  background: "var(--habita-card)",
  borderRadius: "10px",
  boxShadow: "var(--habita-shadow)",
  padding: "0.6rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  zIndex: 5,
};

const tooltipTitleStyle = {
  fontSize: "0.85rem",
  color: "var(--habita-text)",
};

const tooltipMetaStyle = {
  fontSize: "0.7rem",
  color: "var(--habita-accent)",
};

const tooltipFunStyle = {
  fontSize: "0.7rem",
  color: "var(--habita-muted)",
};

const inviteCardStyle = {
  background: "var(--habita-card)",
  borderRadius: "12px",
  padding: "1rem",
  boxShadow: "var(--habita-shadow)",
  display: "flex",
  flexDirection: "column",
  gap: "0.7rem",
};

const sectionHintStyle = {
  margin: 0,
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
};

const codeRowStyle = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
  alignItems: "center",
};

const codeBadgeStyle = {
  background: "var(--habita-chip)",
  color: "var(--habita-chip-text)",
  borderRadius: "8px",
  padding: "0.45rem 0.8rem",
  fontWeight: 600,
  fontSize: "0.9rem",
};

const settingsCardStyle = {
  background: "var(--habita-card)",
  borderRadius: "12px",
  padding: "1rem",
  boxShadow: "var(--habita-shadow)",
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
};

const settingsBodyStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
};

const settingRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "0.9rem",
  color: "var(--habita-text)",
};

const settingColumnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
  fontSize: "0.85rem",
  color: "var(--habita-muted)",
};

const toggleWrapperStyle = {
  position: "relative",
  width: "42px",
  height: "24px",
  display: "inline-flex",
  alignItems: "center",
};

const toggleInputStyle = {
  opacity: 0,
  width: 0,
  height: 0,
};

const toggleTrackStyle = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  width: "42px",
  height: "24px",
  borderRadius: "999px",
  transition: "background-color 0.2s ease",
  backgroundColor: "var(--habita-border)",
};

const toggleKnobStyle = {
  position: "absolute",
  left: "3px",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "var(--habita-card)",
  transition: "transform 0.2s ease",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
};

const selectStyle = {
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  padding: "0.5rem 0.7rem",
  fontSize: "0.9rem",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
};

const logoutButtonStyle = {
  alignSelf: "stretch",
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "999px",
  padding: "0.7rem",
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: "0.5rem",
  boxShadow: "var(--habita-shadow)",
};
