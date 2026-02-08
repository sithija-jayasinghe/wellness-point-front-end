import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardRedirector from '../pages/dashboard/DashboardPage';
import DashboardLayout from '../layout/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Dashboards
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import DoctorDashboard from '../pages/dashboard/DoctorDashboard';
import PatientDashboard from '../pages/dashboard/PatientDashboard';
import ReceptionistDashboard from '../pages/dashboard/ReceptionistDashboard';

// Feature Pages
import ClinicsListPage from '../pages/clinics/ClinicsListPage';
import ClinicFormPage from '../pages/clinics/ClinicFormPage';
import DoctorsListPage from '../pages/doctors/DoctorsListPage';
import DoctorFormPage from '../pages/doctors/DoctorFormPage';
import PatientsListPage from '../pages/patients/PatientsListPage';
import PatientFormPage from '../pages/patients/PatientFormPage';
import PatientHistoryPage from '../pages/patients/PatientHistoryPage';
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
import Unauthorized from '../pages/Unauthorized';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        
        {/* Root Redirector */}
        <Route path="/" element={<DashboardRedirector />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* --- ADMIN SECTION --- */}
        <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><Outlet /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            
            {/* Admin-Only Features */}
            <Route path="users" element={<UsersListPage />} />
            <Route path="users/new" element={<UserFormPage />} />
            <Route path="users/:id/edit" element={<UserFormPage />} />
            
            <Route path="roles" element={<RolesListPage />} />
            <Route path="permissions" element={<PermissionsListPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
        </Route>

        {/* --- DOCTOR SECTION --- */}
        <Route path="doctor" element={<ProtectedRoute allowedRoles={['DOCTOR']}><Outlet /></ProtectedRoute>}>
            <Route path="dashboard" element={<DoctorDashboard />} />
            {/* Doctor specific features if any strictly scoped */}
        </Route>

        {/* --- RECEPTION SECTION --- */}
        <Route path="reception" element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'STAFF']}><Outlet /></ProtectedRoute>}>
            <Route path="dashboard" element={<ReceptionistDashboard />} />
        </Route>

        {/* --- PATIENT SECTION --- */}
        <Route path="patient" element={<ProtectedRoute allowedRoles={['PATIENT']}><Outlet /></ProtectedRoute>}>
            <Route path="dashboard" element={<PatientDashboard />} />
        </Route>
        
        {/* --- SHARED RESOURCES (Keeping flat for shared access) --- */}
        
        {/* CLINICS (Admin, Reception) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF']}><Outlet /></ProtectedRoute>}>
            <Route path="/clinics" element={<ClinicsListPage />} />
            <Route path="/clinics/new" element={<ClinicFormPage />} />
            <Route path="/clinics/:id/edit" element={<ClinicFormPage />} />
        </Route>

        {/* DOCTORS (Admin, Reception, Patient) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'PATIENT']}><Outlet /></ProtectedRoute>}>
             <Route path="/doctors" element={<DoctorsListPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF']}><Outlet /></ProtectedRoute>}>
             <Route path="/doctors/new" element={<DoctorFormPage />} />
             <Route path="/doctors/:id/edit" element={<DoctorFormPage />} />
        </Route>

        {/* PATIENTS (Admin, Reception, Doctor) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'DOCTOR']}><Outlet /></ProtectedRoute>}>
            <Route path="/patients" element={<PatientsListPage />} />
            <Route path="/patients/new" element={<PatientFormPage />} />
            <Route path="/patients/:id/edit" element={<PatientFormPage />} />
            <Route path="/patients/:id/history" element={<PatientHistoryPage />} />
        </Route>

        {/* SCHEDULES (Admin, Reception, Doctor) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'DOCTOR']}><Outlet /></ProtectedRoute>}>
            <Route path="/schedules" element={<SchedulesListPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF']}><Outlet /></ProtectedRoute>}>
             <Route path="/schedules/new" element={<ScheduleFormPage />} />
             <Route path="/schedules/:id/edit" element={<ScheduleFormPage />} />
        </Route>

        {/* APPOINTMENTS (Everyone) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'DOCTOR', 'PATIENT']}><Outlet /></ProtectedRoute>}>
            <Route path="/appointments" element={<AppointmentsListPage />} />
            <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
        </Route>
        <Route path="/appointments/new" element={<AppointmentFormPage />} />
        <Route path="/appointments/:id/edit" element={<AppointmentFormPage />} />


        {/* CONSULTATIONS (Admin, Doctor) */}
         <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}><Outlet /></ProtectedRoute>}>
            <Route path="/consultations" element={<ConsultationsListPage />} />
            <Route path="/consultations/new" element={<ConsultationFormPage />} />
            <Route path="/consultations/:id/edit" element={<ConsultationFormPage />} />
        </Route>

        {/* PRESCRIPTIONS (Admin, Doctor, Patient, Staff) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'PATIENT']}><Outlet /></ProtectedRoute>}>
             <Route path="/prescriptions" element={<PrescriptionsListPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}><Outlet /></ProtectedRoute>}>
            <Route path="/prescriptions/new" element={<PrescriptionFormPage />} />
            <Route path="/prescriptions/:id/edit" element={<PrescriptionFormPage />} />
        </Route>

        {/* PAYMENTS & REFUNDS (Admin, Staff, Patient) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'PATIENT']}><Outlet /></ProtectedRoute>}>
            <Route path="/payments" element={<PaymentsListPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF']}><Outlet /></ProtectedRoute>}>
             <Route path="/payments/new" element={<PaymentFormPage />} />
             <Route path="/refunds" element={<RefundsListPage />} />
             <Route path="/refunds/new" element={<RefundFormPage />} />
        </Route>

      </Route>
    </Routes>
  );
};

export default AppRoutes;
