import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
