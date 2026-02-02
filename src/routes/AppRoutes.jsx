import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import DashboardLayout from '../layout/DashboardLayout';
import RequireAuth from '../auth/RequireAuth';
import ClinicsListPage from '../pages/clinics/ClinicsListPage';
import ClinicFormPage from '../pages/clinics/ClinicFormPage';
import DoctorsListPage from '../pages/doctors/DoctorsListPage';
import DoctorFormPage from '../pages/doctors/DoctorFormPage';
import EmptyState from '../components/EmptyState';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ title }) => (
    <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 flex items-center justify-center min-h-[400px]">
            <EmptyState 
                title="Coming Soon" 
                description={`The ${title} module is currently under development.`} 
                icon={Construction}
            />
        </div>
    </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route path="/" element={<DashboardPage />} />
        
        {/* Clinics Routes */}
        <Route path="/clinics" element={<ClinicsListPage />} />
        <Route path="/clinics/new" element={<ClinicFormPage />} />
        <Route path="/clinics/:id/edit" element={<ClinicFormPage />} />

        {/* Doctors Routes */}
        <Route path="/doctors" element={<DoctorsListPage />} />
        <Route path="/doctors/new" element={<DoctorFormPage />} />
        <Route path="/doctors/:id/edit" element={<DoctorFormPage />} />

        {/* Placeholder Routes */}
        <Route path="/patients" element={<PlaceholderPage title="Patients" />} />
        <Route path="/schedules" element={<PlaceholderPage title="Schedules" />} />
        <Route path="/appointments" element={<PlaceholderPage title="Appointments" />} />
        <Route path="/consultations" element={<PlaceholderPage title="Consultations" />} />
        <Route path="/prescriptions" element={<PlaceholderPage title="Prescriptions" />} />
        <Route path="/payments" element={<PlaceholderPage title="Payments" />} />
        <Route path="/refunds" element={<PlaceholderPage title="Refunds" />} />
        <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
        <Route path="/audit-logs" element={<PlaceholderPage title="Audit Logs" />} />
        <Route path="/staff" element={<PlaceholderPage title="Staff" />} />
        
        {/* Admin Only Routes - In real app, wrap with Role Check component */}
        <Route path="/users" element={<PlaceholderPage title="Users Management" />} />
        <Route path="/roles" element={<PlaceholderPage title="Roles Management" />} />
        <Route path="/permissions" element={<PlaceholderPage title="Permissions Management" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
