export default function Home() {
  return (
    <div
      style={{
        padding: "1.5rem",
        backgroundColor: "#f7f8fa",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div style={cardStyle}>
          <h3 style={titleStyle}>😊 Mood Summary</h3>
          <p style={textStyle}>You’re feeling great today!</p>
        </div>

        <div style={cardStyle}>
          <h3 style={titleStyle}>📋 Task Summary</h3>
          <p style={textStyle}>2 pending tasks remaining.</p>
        </div>

        <div style={cardStyle}>
          <h3 style={titleStyle}>💰 Bill Summary</h3>
          <p style={textStyle}>1 unpaid bill: Internet $45 (Alex).</p>
        </div>
      </div>

      <h4 style={{ color: "#555", marginBottom: "1rem" }}>Quick Actions</h4>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <button style={buttonStyle}>+ Add Task</button>
        <button style={buttonStyle}>+ Add Bill</button>
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  padding: "1rem 1.2rem",
  textAlign: "left",
};

const titleStyle = {
  margin: "0 0 0.3rem 0",
  fontSize: "1rem",
  color: "#333",
};

const textStyle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "#666",
};

const buttonStyle = {
  backgroundColor: "black",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "0.7rem 1.2rem",
  cursor: "pointer",
  fontWeight: "500",
};
