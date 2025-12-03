import { useState } from "react";
import { useHousehold } from "../context/HouseholdContext";
import { useNavigate } from "react-router-dom";

export default function HouseholdManagement() {
  const { household, loading, createHousehold, joinHousehold, leaveHousehold, regenerateInviteCode, removeMember } = useHousehold();
  const navigate = useNavigate();

  const [view, setView] = useState("main");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleCreateHousehold = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!householdName.trim()) {
      setFormError("Please enter a household name");
      return;
    }

    try {
      await createHousehold(householdName);
      setSuccessMessage("Household created successfully!");
      setHouseholdName("");
      setView("main");
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleJoinHousehold = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!inviteCode.trim()) {
      setFormError("Please enter an invite code");
      return;
    }

    try {
      await joinHousehold(inviteCode);
      setSuccessMessage("Successfully joined household!");
      setInviteCode("");
      setView("main");
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!window.confirm("Are you sure you want to leave this household? You'll lose access to all shared data.")) {
      return;
    }

    try {
      await leaveHousehold();
      setSuccessMessage("Successfully left household");
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleRegenerateCode = async () => {
    try {
      await regenerateInviteCode();
      setSuccessMessage("New invite code generated!");
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleRemoveMember = async (userId, username) => {
    if (!window.confirm(`Remove ${username} from the household?`)) {
      return;
    }

    try {
      await removeMember(userId);
      setSuccessMessage(`${username} has been removed`);
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={loadingStyle}>Loading household information...</p>
      </div>
    );
  }

  if (!household && view === "main") {
    return (
      <div style={pageStyle}>
        <section style={headerSectionStyle}>
          <h2 style={titleStyle}>Household Setup</h2>
          <p style={subtitleStyle}>
            Create or join a household to start collaborating with your roommates
          </p>
        </section>

        {formError && <div style={errorBoxStyle}>{formError}</div>}
        {successMessage && <div style={successBoxStyle}>{successMessage}</div>}

        <div style={cardsLayoutStyle}>
          <button style={actionCardStyle} onClick={() => setView("create")}>
            <div style={actionCardIconStyle}>+</div>
            <h3 style={actionCardTitleStyle}>Create Household</h3>
            <p style={actionCardDescStyle}>
              Start a new household and invite your roommates
            </p>
          </button>

          <button style={actionCardStyle} onClick={() => setView("join")}>
            <div style={actionCardIconStyle}>#</div>
            <h3 style={actionCardTitleStyle}>Join Household</h3>
            <p style={actionCardDescStyle}>
              Enter an invite code to join an existing household
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (view === "create") {
    return (
      <div style={pageStyle}>
        <section style={headerSectionStyle}>
          <h2 style={titleStyle}>Create New Household</h2>
          <p style={subtitleStyle}>Give your household a name</p>
        </section>

        {formError && <div style={errorBoxStyle}>{formError}</div>}

        <form onSubmit={handleCreateHousehold} style={formStyle}>
          <input
            type="text"
            placeholder="Household name (e.g., Apartment 3B)"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            style={inputStyle}
          />
          <div style={buttonRowStyle}>
            <button type="submit" style={primaryButtonStyle}>
              Create Household
            </button>
            <button type="button" style={secondaryButtonStyle} onClick={() => setView("main")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === "join") {
    return (
      <div style={pageStyle}>
        <section style={headerSectionStyle}>
          <h2 style={titleStyle}>Join Household</h2>
          <p style={subtitleStyle}>Enter the 6-character invite code</p>
        </section>

        {formError && <div style={errorBoxStyle}>{formError}</div>}

        <form onSubmit={handleJoinHousehold} style={formStyle}>
          <input
            type="text"
            placeholder="Invite code (e.g., A3K7W9)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={inputStyle}
          />
          <div style={buttonRowStyle}>
            <button type="submit" style={primaryButtonStyle}>
              Join Household
            </button>
            <button type="button" style={secondaryButtonStyle} onClick={() => setView("main")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <section style={headerSectionStyle}>
        <h2 style={titleStyle}>{household.name}</h2>
        <p style={subtitleStyle}>Manage your household and members</p>
      </section>

      {formError && <div style={errorBoxStyle}>{formError}</div>}
      {successMessage && <div style={successBoxStyle}>{successMessage}</div>}

      <section style={cardStyle}>
        <h3 style={cardTitleStyle}>Invite Code</h3>
        <div style={inviteCodeBoxStyle}>
          <span style={inviteCodeTextStyle}>{household.inviteCode}</span>
          {household.isAdmin && (
            <button style={smallButtonStyle} onClick={handleRegenerateCode}>
              Regenerate
            </button>
          )}
        </div>
        <p style={hintStyle}>
          Share this code with roommates to invite them to the household
        </p>
      </section>

      <section style={cardStyle}>
        <h3 style={cardTitleStyle}>Members ({household.members?.length || 0})</h3>
        <div style={membersListStyle}>
          {household.members?.map((member) => (
            <div key={member.userId._id || member.userId} style={memberItemStyle}>
              <div>
                <p style={memberNameStyle}>
                  {member.userId.displayName || member.userId.username}
                </p>
                <p style={memberRoleStyle}>{member.role}</p>
              </div>
              {household.isAdmin && member.role !== "admin" && (
                <button
                  style={removeButtonStyle}
                  onClick={() => handleRemoveMember(member.userId._id || member.userId, member.userId.username)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={cardTitleStyle}>Danger Zone</h3>
        <button style={dangerButtonStyle} onClick={handleLeaveHousehold}>
          Leave Household
        </button>
      </section>

      <button style={backButtonStyle} onClick={() => navigate("/profile")}>
        ← Back to Profile
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

const headerSectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.6rem",
  fontWeight: 700,
};

const subtitleStyle = {
  margin: 0,
  fontSize: "0.95rem",
  color: "var(--habita-muted)",
};

const loadingStyle = {
  textAlign: "center",
  color: "var(--habita-muted)",
  padding: "2rem",
};

const errorBoxStyle = {
  padding: "0.75rem 1rem",
  backgroundColor: "rgba(239, 68, 68, 0.1)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: "8px",
  color: "#ef4444",
  fontSize: "0.9rem",
};

const successBoxStyle = {
  padding: "0.75rem 1rem",
  backgroundColor: "rgba(34, 197, 94, 0.1)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  borderRadius: "8px",
  color: "#22c55e",
  fontSize: "0.9rem",
};

const cardsLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "1rem",
};

const actionCardStyle = {
  backgroundColor: "var(--habita-card)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "2rem 1.5rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
  cursor: "pointer",
  textAlign: "center",
};

const actionCardIconStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  backgroundColor: "rgba(74, 144, 226, 0.2)",
  color: "var(--habita-accent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2rem",
  fontWeight: 700,
};

const actionCardTitleStyle = {
  margin: 0,
  fontSize: "1.2rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const actionCardDescStyle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  maxWidth: "400px",
};

const inputStyle = {
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  backgroundColor: "var(--habita-input)",
  color: "var(--habita-text)",
  fontSize: "1rem",
};

const buttonRowStyle = {
  display: "flex",
  gap: "0.75rem",
};

const primaryButtonStyle = {
  flex: 1,
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  flex: 1,
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  backgroundColor: "transparent",
  color: "var(--habita-text)",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
};

const cardStyle = {
  backgroundColor: "var(--habita-card)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "1.1rem",
  fontWeight: 600,
};

const inviteCodeBoxStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "1rem",
  backgroundColor: "rgba(74, 144, 226, 0.1)",
  borderRadius: "8px",
  border: "1px solid rgba(74, 144, 226, 0.3)",
};

const inviteCodeTextStyle = {
  fontSize: "1.5rem",
  fontWeight: 700,
  fontFamily: "monospace",
  color: "var(--habita-accent)",
  letterSpacing: "0.1em",
};

const smallButtonStyle = {
  padding: "0.4rem 0.8rem",
  borderRadius: "6px",
  border: "1px solid var(--habita-border)",
  backgroundColor: "var(--habita-card)",
  color: "var(--habita-text)",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};

const hintStyle = {
  margin: 0,
  fontSize: "0.85rem",
  color: "var(--habita-muted)",
};

const membersListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const memberItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.75rem 1rem",
  backgroundColor: "var(--habita-chip)",
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
};

const memberNameStyle = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const memberRoleStyle = {
  margin: "0.25rem 0 0",
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
  textTransform: "capitalize",
};

const removeButtonStyle = {
  padding: "0.4rem 0.8rem",
  borderRadius: "6px",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  backgroundColor: "rgba(239, 68, 68, 0.1)",
  color: "#ef4444",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};

const dangerButtonStyle = {
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  backgroundColor: "rgba(239, 68, 68, 0.1)",
  color: "#ef4444",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
};

const backButtonStyle = {
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  backgroundColor: "transparent",
  color: "var(--habita-text)",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  alignSelf: "flex-start",
};
