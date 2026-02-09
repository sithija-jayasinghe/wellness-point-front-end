import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Debugging logs to console to trace access issues
  // console.log("Protected Route Check:", { path: location.pathname, userRole: user?.role, allowedRoles });

  // Normalize user role for comparison (robustness)
  const userRole = user.role ? user.role.toUpperCase().trim() : '';

  if (allowedRoles.length > 0) {
      // Check if ANY of the allowed roles match the user's role
      // We also normalize allowedRoles to uppercase to be safe
      const hasPermission = allowedRoles.some(role => role.toUpperCase().trim() === userRole);

      if (!hasPermission) {
        console.warn(`Access Denied: User role '${userRole}' not in allowed roles:`, allowedRoles);
        return <Navigate to="/unauthorized" replace />;
      }
  }

  return children;
};

export default ProtectedRoute;
