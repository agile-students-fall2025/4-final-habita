import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Bills from "./pages/Bills";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Dashboard>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Dashboard>
    </Router>
  );
}

export default App;
