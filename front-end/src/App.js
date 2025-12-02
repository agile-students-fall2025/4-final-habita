import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Bills from "./pages/Bills";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EditProfile from "./pages/EditProfile";
import { TasksProvider } from "./context/TasksContext";
import { UserProvider } from "./context/UserContext";
import { BillsProvider } from "./context/BillsContext";
import { ChatProvider } from "./context/ChatContext";
import RequireAuth from "./components/RequireAuth";


function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <RequireAuth>
                <ChatProvider>
                  <TasksProvider>
                    <BillsProvider>
                      <Dashboard />
                    </BillsProvider>
                  </TasksProvider>
                </ChatProvider>
              </RequireAuth>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
          </Route>
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
