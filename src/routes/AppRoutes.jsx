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
import PatientsListPage from '../pages/patients/PatientsListPage';
import PatientFormPage from '../pages/patients/PatientFormPage';
import PatientHistoryPage from '../pages/patients/PatientHistoryPage';
import EmptyState from '../components/EmptyState';
import { Construction } from 'lucide-react';
import SchedulesListPage from '../pages/schedules/SchedulesListPage';
import ScheduleFormPage from '../pages/schedules/ScheduleFormPage';
import AppointmentsListPage from '../pages/appointments/AppointmentsListPage';
import AppointmentFormPage from '../pages/appointments/AppointmentFormPage';
import AppointmentDetailsPage from '../pages/appointments/AppointmentDetailsPage';
import ConsultationsListPage from '../pages/consultations/ConsultationsListPage';
import ConsultationFormPage from '../pages/consultations/ConsultationFormPage';
import PrescriptionsListPage from '../pages/prescriptions/PrescriptionsListPage';
import PrescriptionFormPage from '../pages/prescriptions/PrescriptionFormPage';
import PaymentsListPage from '../pages/payments/PaymentsListPage';
import PaymentFormPage from '../pages/payments/PaymentFormPage';
import RefundsListPage from '../pages/refunds/RefundsListPage';
import RefundFormPage from '../pages/refunds/RefundFormPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import AuditLogsPage from '../pages/audit/AuditLogsPage';

import UsersListPage from '../pages/users/UsersListPage';
import UserFormPage from '../pages/users/UserFormPage';
import RolesListPage from '../pages/roles/RolesListPage';
import PermissionsListPage from '../pages/permissions/PermissionsListPage';

import UnauthorizedPage from '../pages/UnauthorizedPage';

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
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
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

        {/* Patients Routes */}
        <Route path="/patients" element={<PatientsListPage />} />
        <Route path="/patients/new" element={<PatientFormPage />} />
        <Route path="/patients/:id/edit" element={<PatientFormPage />} />
        <Route path="/patients/:id/history" element={<PatientHistoryPage />} />

        {/* Schedules Routes */}
        <Route path="/schedules" element={<SchedulesListPage />} />
        <Route path="/schedules/new" element={<ScheduleFormPage />} />
        <Route path="/schedules/:id/edit" element={<ScheduleFormPage />} />

        {/* Appointments Routes */}
        <Route path="/appointments" element={<AppointmentsListPage />} />
        <Route path="/appointments/new" element={<AppointmentFormPage />} />
        <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
        <Route path="/appointments/:id/edit" element={<AppointmentFormPage />} />

        {/* Consultations Routes */}
        <Route path="/consultations" element={<ConsultationsListPage />} />
        <Route path="/consultations/new" element={<ConsultationFormPage />} />
        <Route path="/consultations/:id/edit" element={<ConsultationFormPage />} />

        {/* Prescriptions Routes */}
        <Route path="/prescriptions" element={<PrescriptionsListPage />} />
        <Route path="/prescriptions/new" element={<PrescriptionFormPage />} />
        <Route path="/prescriptions/:id/edit" element={<PrescriptionFormPage />} />

        {/* Payments Routes */}
        <Route path="/payments" element={<PaymentsListPage />} />
        <Route path="/payments/new" element={<PaymentFormPage />} />
        <Route path="/payments/:id/edit" element={<PaymentFormPage />} />

        {/* Refunds Routes */}
        <Route path="/refunds" element={<RefundsListPage />} />
        <Route path="/refunds/new" element={<RefundFormPage />} />
        <Route path="/refunds/:id/edit" element={<RefundFormPage />} />

        {/* Notifications Routes */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Admin Only Routes */}
        <Route path="/users" element={
            <RequireAuth allowedRoles={['ADMIN']}>
                <UsersListPage />
            </RequireAuth>
        } />
        <Route path="/users/new" element={
            <RequireAuth allowedRoles={['ADMIN']}>
                <UserFormPage />
            </RequireAuth>
        } />
        <Route path="/users/:id/edit" element={
            <RequireAuth allowedRoles={['ADMIN']}>
                <UserFormPage />
            </RequireAuth>
        } />
        
        <Route path="/roles" element={
            <RequireAuth allowedRoles={['ADMIN']}>
                <RolesListPage />
            </RequireAuth>
        } />
        <Route path="/permissions" element={
            <RequireAuth allowedRoles={['ADMIN']}>
                <PermissionsListPage />
            </RequireAuth>
        } />
        
        <Route path="/audit-logs" element={
           <RequireAuth allowedRoles={['ADMIN']}>
               <AuditLogsPage />
           </RequireAuth>
        } />

      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
