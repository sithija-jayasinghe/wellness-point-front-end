import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, getUser } from './authStorage';

const RequireAuth = ({ children, allowedRoles = [] }) => {
  const token = getToken();
  const user = getUser();
  const location = useLocation();

  if (!token) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are restricted and user role is not in the allowed list
  // We check if allowedRoles has entries (if empty, we assume the route is open to any authenticated user)
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RequireAuth;
