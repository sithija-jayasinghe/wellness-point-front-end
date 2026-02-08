import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';

const DashboardRedirector = () => {
    const { user, isAuthenticated } = useAuth(); // Using context instead of direct storage

    if (!user && !isAuthenticated) return <Navigate to="/login" replace />;
    if (!user) return <Spinner fullScreen />; // AuthContext loading state usually handles this

    switch (user.role) {
        case 'ADMIN':
            return <Navigate to="/admin/dashboard" replace />;
        case 'DOCTOR':
            return <Navigate to="/doctor/dashboard" replace />;
        case 'RECEPTIONIST':
            return <Navigate to="/reception/dashboard" replace />;
        case 'STAFF':
            return <Navigate to="/reception/dashboard" replace />;
        case 'PATIENT':
            return <Navigate to="/patient/dashboard" replace />;
        default:
            return <Navigate to="/unauthorized" replace />;
    }
};

export default DashboardRedirector;
