import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import {
  canAccessAdminRoute,
  getAdminAccessRedirect
} from "../utils/permissions.js";

export default function AdminRouteGuard() {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading || isAuthenticated === null) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessAdminRoute(user, location.pathname)) {
    return <Navigate to={getAdminAccessRedirect(user)} replace />;
  }

  return <Outlet />;
}
