import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* 
          Base Layout Wrapper: Checks if user is logged in.
          All nested routes share the DashboardLayout.
      */}
      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        
        {/* --- Public to Authenticated Users --- */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        
        {/* --- CLINICS --- */}
        {/* View: Admin, Staff */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF']}><Outlet /></RequireAuth>}>
            <Route path="/clinics" element={<ClinicsListPage />} />
            <Route path="/clinics/new" element={<ClinicFormPage />} />
            <Route path="/clinics/:id/edit" element={<ClinicFormPage />} />
        </Route>

        {/* --- DOCTORS --- */}
        {/* View List: Admin, Staff, Patient */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'PATIENT']}><Outlet /></RequireAuth>}>
             <Route path="/doctors" element={<DoctorsListPage />} />
        </Route>
        {/* Manage: Admin, Staff */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF']}><Outlet /></RequireAuth>}>
             <Route path="/doctors/new" element={<DoctorFormPage />} />
             <Route path="/doctors/:id/edit" element={<DoctorFormPage />} />
        </Route>

        {/* --- PATIENTS --- */}
        {/* View/Manage: Admin, Staff, Doctor */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'DOCTOR']}><Outlet /></RequireAuth>}>
            <Route path="/patients" element={<PatientsListPage />} />
            <Route path="/patients/new" element={<PatientFormPage />} />
            <Route path="/patients/:id/edit" element={<PatientFormPage />} />
            <Route path="/patients/:id/history" element={<PatientHistoryPage />} />
        </Route>

        {/* --- SCHEDULES --- */}
        {/* View: Admin, Staff, Doctor */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'DOCTOR']}><Outlet /></RequireAuth>}>
            <Route path="/schedules" element={<SchedulesListPage />} />
        </Route>
        {/* Manage: Admin, Staff */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF']}><Outlet /></RequireAuth>}>
             <Route path="/schedules/new" element={<ScheduleFormPage />} />
             <Route path="/schedules/:id/edit" element={<ScheduleFormPage />} />
        </Route>

        {/* --- APPOINTMENTS --- */}
        {/* View: Everyone (Context filtered in UI) */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'DOCTOR', 'PATIENT']}><Outlet /></RequireAuth>}>
            <Route path="/appointments" element={<AppointmentsListPage />} />
            <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
        </Route>
        {/* Create/Edit: Admin, Staff, Patient(Create Own) */}
        {/* Refinement: Doctors usually don't create appointments for themselves, but maybe for patients? Left open for now. */}
        <Route path="/appointments/new" element={<AppointmentFormPage />} />
        <Route path="/appointments/:id/edit" element={<AppointmentFormPage />} />


        {/* --- CONSULTATIONS --- */}
        {/* View: Admin, Doctor */}
         <Route element={<RequireAuth allowedRoles={['ADMIN', 'DOCTOR']}><Outlet /></RequireAuth>}>
            <Route path="/consultations" element={<ConsultationsListPage />} />
            <Route path="/consultations/new" element={<ConsultationFormPage />} />
            <Route path="/consultations/:id/edit" element={<ConsultationFormPage />} />
        </Route>

        {/* --- PRESCRIPTIONS --- */}
        {/* View List: Admin, Doctor, Patient, Staff */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'PATIENT']}><Outlet /></RequireAuth>}>
             <Route path="/prescriptions" element={<PrescriptionsListPage />} />
        </Route>
        {/* Manage: Admin, Doctor */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'DOCTOR']}><Outlet /></RequireAuth>}>
            <Route path="/prescriptions/new" element={<PrescriptionFormPage />} />
            <Route path="/prescriptions/:id/edit" element={<PrescriptionFormPage />} />
        </Route>

        {/* --- PAYMENTS & REFUNDS --- */}
        {/* View/Manage: Admin, Staff, Patient(View Own) */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF', 'PATIENT']}><Outlet /></RequireAuth>}>
            <Route path="/payments" element={<PaymentsListPage />} />
        </Route>
        {/* Manage Only: Admin, Staff */}
        <Route element={<RequireAuth allowedRoles={['ADMIN', 'RECEPTIONIST', 'STAFF']}><Outlet /></RequireAuth>}>
             <Route path="/payments/new" element={<PaymentFormPage />} />
             <Route path="/refunds" element={<RefundsListPage />} />
             <Route path="/refunds/new" element={<RefundFormPage />} />
        </Route>

        {/* --- ADMIN ONLY MODULES --- */}
        <Route element={<RequireAuth allowedRoles={['ADMIN']}><Outlet /></RequireAuth>}>
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/new" element={<UserFormPage />} />
            <Route path="/users/:id/edit" element={<UserFormPage />} />
            
            <Route path="/roles" element={<RolesListPage />} />
            <Route path="/permissions" element={<PermissionsListPage />} />
            <Route path="/audit" element={<AuditLogsPage />} />
        </Route>

      </Route>
    </Routes>
  );
};

export default AppRoutes;
