import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Bills from "./pages/Bills";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EditProfile from "./pages/EditProfile";
import Notifications from "./pages/Notifications";
import { TasksProvider } from "./context/TasksContext";
import { UserProvider } from "./context/UserContext";
import { BillsProvider } from "./context/BillsContext";
import { ChatProvider } from "./context/ChatContext";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <UserProvider>
              <ChatProvider>
                <TasksProvider>
                  <BillsProvider>
                    <Dashboard />
                  </BillsProvider>
                </TasksProvider>
              </ChatProvider>
            </UserProvider>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
