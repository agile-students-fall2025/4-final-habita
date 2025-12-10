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
import HouseholdManagement from "./pages/HouseholdManagement";

import { TasksProvider } from "./context/TasksContext";
import { UserProvider } from "./context/UserContext";
import { BillsProvider } from "./context/BillsContext";
import { HouseholdProvider } from "./context/HouseholdContext";
import RequireAuth from "./components/RequireAuth";

// Debug imports (remove after diagnosing)
// eslint-disable-next-line no-console
console.log('App imports:', {
  Dashboard: typeof Dashboard,
  Home: typeof Home,
  Tasks: typeof Tasks,
  Bills: typeof Bills,
  Chat: typeof Chat,
  Profile: typeof Profile,
  Calendar: typeof Calendar,
  Login: typeof Login,
  Register: typeof Register,
  EditProfile: typeof EditProfile,
  HouseholdManagement: typeof HouseholdManagement,
  TasksProvider: typeof TasksProvider,
  UserProvider: typeof UserProvider,
  BillsProvider: typeof BillsProvider,
  HouseholdProvider: typeof HouseholdProvider,
  RequireAuth: typeof RequireAuth,
});


function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected app shell (Dashboard) */}
          <Route
            element={
              <RequireAuth>
                <HouseholdProvider>
                  <TasksProvider>
                    <BillsProvider>
                      <Dashboard />
                    </BillsProvider>
                  </TasksProvider>
                </HouseholdProvider>
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
            <Route path="/household" element={<HouseholdManagement />} />
          </Route>
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
