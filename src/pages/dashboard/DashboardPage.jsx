import React, { useState, useEffect } from 'react';
import { getUser } from '../../auth/authStorage';
import AdminDashboard from './AdminDashboard';
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import { Navigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';

const DashboardPage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = getUser();
        setUser(storedUser);
        setLoading(false);
    }, []);

    if (loading) return <Spinner fullScreen />;
    if (!user) return <Navigate to="/login" replace />;

    switch (user.role) {
        case 'ADMIN':
            return <AdminDashboard user={user} />;
        case 'DOCTOR':
            return <DoctorDashboard user={user} />;
        case 'RECEPTIONIST':
            return <ReceptionistDashboard user={user} />;
        case 'STAFF': // Handling alias if backend returns STAFF
            return <ReceptionistDashboard user={user} />;
        case 'PATIENT':
            return <PatientDashboard user={user} />;
        default:
            return (
                <div className="p-10 text-center">
                    <h2 className="text-xl font-bold text-red-600">Access Restricted</h2>
                    <p className="text-gray-600">Your role ({user.role}) is not recognized.</p>
                </div>
            );
    }
};

export default DashboardPage;
