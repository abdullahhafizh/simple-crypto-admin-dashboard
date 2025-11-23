import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth() {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
