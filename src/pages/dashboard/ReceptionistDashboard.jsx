import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Phone, Clock, DollarSign, CreditCard } from 'lucide-react';
import { getAllAppointments } from '../../api/appointments.api';
import { getAllPayments } from '../../api/payments.api';
import { getAllSchedules } from '../../api/schedules.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllPatients } from '../../api/patients.api';
import Spinner from '../../components/Spinner';

const ReceptionistDashboard = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [financials, setFinancials] = useState({ collected: 0, pending: 0 });
    const [stats, setStats] = useState({ scheduled: 0, checkedIn: 0, inquiries: 0 });
    const [loading, setLoading] = useState(true);

    // Helper to parse date
    const getAppointmentDateObj = (dateData) => {
        if (!dateData) return null;
        let dateObj;
        if (Array.isArray(dateData)) {
            const [year, month, day, hour = 0, minute = 0, second = 0] = dateData;
            dateObj = new Date(year, month - 1, day, hour, minute, second);
        } else {
            dateObj = new Date(dateData);
        }
        return isNaN(dateObj.getTime()) ? null : dateObj;
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [appointmentsData, paymentsData, schedulesData, doctorsData, patientsData] = await Promise.all([
                    getAllAppointments(),
                    getAllPayments(),
                    getAllSchedules().catch(() => []),
                    getAllDoctors().catch(() => []),
                    getAllPatients().catch(() => [])
                ]);
                
                setSchedules(schedulesData);
                setDoctors(doctorsData);
                setPatients(patientsData);

                const today = new Date();
                const isSameDay = (d1, d2) => 
                    d1 && d2 &&
                    d1.getDate() === d2.getDate() &&
                    d1.getMonth() === d2.getMonth() &&
                    d1.getFullYear() === d2.getFullYear();

                // Appointments Processing
                const todayAppointments = appointmentsData.filter(app => {
                     const appDate = getAppointmentDateObj(app.appointmentTime);
                     return isSameDay(appDate, today);
                });
                
                // Sort by time
                todayAppointments.sort((a, b) => {
                    const dateA = getAppointmentDateObj(a.appointmentTime);
                    const dateB = getAppointmentDateObj(b.appointmentTime);
                    return dateA - dateB;
                });

                setAppointments(todayAppointments);

                const scheduled = todayAppointments.filter(app => app.status !== 'CANCELLED').length;
                const checkedIn = todayAppointments.filter(app => app.status === 'CHECKED_IN').length;
                
                setStats({ scheduled, checkedIn, inquiries: 0 });

                // Financials Processing
                const todayPayments = paymentsData.filter(p => {
                    const pDate = getAppointmentDateObj(p.paymentDate);
                    return isSameDay(pDate, today);
                });

                const collected = todayPayments
                    .filter(p => p.status && p.status.toUpperCase() === 'PAID')
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                
                const pending = todayPayments
                    .filter(p => p.status && p.status.toUpperCase() === 'PENDING')
                    .length;

                setFinancials({ collected, pending });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const formatTime = (dateData) => {
        const dateObj = getAppointmentDateObj(dateData);
        return dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    };

    // Helper to resolve doctor name
    const getDoctorName = (apt) => {
        if (apt.doctorName) return apt.doctorName;
        if (apt.doctor && apt.doctor.name) return apt.doctor.name;
        
        if (apt.scheduleId) {
            const schedule = schedules.find(s => s.id === apt.scheduleId);
            if (schedule && schedule.doctorId) {
                const doctor = doctors.find(d => d.id === schedule.doctorId);
                if (doctor) return doctor.name;
            }
        }
        return `Dr. #${apt.doctorId || 'Unknown'}`;
    };

    // Helper to resolve patient name
    const getPatientName = (apt) => {
        if (apt.patientName) return apt.patientName;
        
        if (apt.patientId) {
            const patient = patients.find(p => p.id === apt.patientId);
            if (patient) {
                return patient.name || patient.patientName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
            }
        }
        return `Patient #${apt.patientId}`;
    };

    if (loading) return <Spinner fullScreen />;

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Reception Desk</h1>
                <button 
                    onClick={() => navigate('/appointments/new')}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-700 transition"
                >
                    + New Appointment
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Scheduled Today</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Checked In</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.checkedIn}</p>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <Phone className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Inquiries</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.inquiries}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Collected Today</p>
                        <p className="text-2xl font-bold text-gray-900">LKR {financials.collected.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Pending Payments</p>
                        <p className="text-2xl font-bold text-gray-900">{financials.pending}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Quick Check-in / Appointments</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {appointments.length === 0 ? (
                         <div className="p-8 text-center text-gray-500">
                            No appointments scheduled for today.
                         </div>
                    ) : (
                        appointments.map((appt) => (
                            <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex gap-3 items-center">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                                        {formatTime(appt.appointmentTime)}
                                    </span>
                                    <div>
                                        <p className="font-medium text-gray-900">{getPatientName(appt)}</p>
                                        <p className="text-xs text-gray-500">Dr. {getDoctorName(appt)}</p>
                                    </div>
                                </div>
                                {appt.status === 'CHECKED_IN' ? (
                                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-md font-medium">Checked In</span>
                                ) : (
                                    <button className="text-xs bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-md font-medium hover:bg-cyan-100 border border-cyan-200">
                                        Check In
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDashboard;
