import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';

const DashboardRedirector = () => {
    const { user, isAuthenticated } = useAuth(); // Using context instead of direct storage

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    // If user is authenticated but user object isn't fully loaded yet, show spinner
    // This prevents premature redirection to unauthorized/login
    if (!user) return <Spinner fullScreen />;

    // Normalize role check (handle case sensitivity)
    const role = user.role ? user.role.toUpperCase().trim() : '';

    switch (role) {
        case 'ADMIN':
            return <Navigate to="/admin/dashboard" replace />;
        case 'DOCTOR':
            return <Navigate to="/doctor/dashboard" replace />;
        case 'RECEPTIONIST':
            return <Navigate to="/reception/dashboard" replace />;
        case 'STAFF':
            // Assuming STAFF shares dashboard with Receptionist
            return <Navigate to="/reception/dashboard" replace />;
        case 'PATIENT':
            return <Navigate to="/patient/dashboard" replace />;
        case 'LAB_OPERATOR':
            return <Navigate to="/lab-operator/dashboard" replace />;
        default:
            console.warn("Unknown Role:", role);
            return <Navigate to="/unauthorized" replace />;
    }
};

export default DashboardRedirector;
