import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Calendar, 
    FileText, 
    CreditCard, 
    Activity, 
    Clock, 
    ChevronRight,
    PlusCircle,
    User,
    Pill
} from 'lucide-react';
import { getAllPatients } from '../../api/patients.api';
import { getAllAppointments } from '../../api/appointments.api';
import { getAllPrescriptions } from '../../api/prescriptions.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllPayments } from '../../api/payments.api';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // State
    const [loading, setLoading] = useState(true);
    const [currentPatient, setCurrentPatient] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [doctorsMap, setDoctorsMap] = useState({});
    
    // Helper to parse date array [yyyy, mm, dd, hh, mm]
    const parseDate = (dateArr) => {
        if (!dateArr) return null;
        if (Array.isArray(dateArr)) {
            const [y, m, d, h = 0, min = 0] = dateArr;
            return new Date(y, m - 1, d, h, min);
        }
        return new Date(dateArr);
    };

    const formatDate = (dateArr) => {
        const date = parseDate(dateArr);
        if (!date) return 'N/A';
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatTime = (dateArr) => {
        const date = parseDate(dateArr);
        if (!date) return 'N/A';
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // 1. Fetch reference data
            const [usersDoctors, usersPatients] = await Promise.all([
                getAllDoctors(),
                getAllPatients()
            ]);

            // Create Doctor Map
            const docMap = {};
            usersDoctors.forEach(doc => {
                docMap[doc.id] = doc.name;
            });
            setDoctorsMap(docMap);

            // 2. Identify Current Patient
            // Try matching by linked user ID first, then email, then name
            const patient = usersPatients.find(p => 
                (p.userId && p.userId === user?.id) || 
                (p.email && p.email === user?.email) ||
                (p.name && user?.name && p.name.toLowerCase() === user.name.toLowerCase())
            );

            if (!patient) {
                console.warn("Could not link logged-in user to a patient record.");
                setLoading(false);
                return;
            }

            setCurrentPatient(patient);

            // 3. Fetch Patient Specific Data
            const [allAppts, allPrescs, allPayments] = await Promise.all([
                getAllAppointments(),
                getAllPrescriptions(),
                getAllPayments()
            ]);

            // Filter Appointments
            const myAppts = allAppts
                .filter(a => a.patientId === patient.id)
                .sort((a, b) => { // Sort descending (newest first)
                     const dateA = parseDate(a.appointmentTime || a.appointmentDate) || new Date(0);
                     const dateB = parseDate(b.appointmentTime || b.appointmentDate) || new Date(0);
                     return dateB - dateA;
                });

            // Filter Prescriptions
            const myPrescs = allPrescs
                .filter(p => p.patientId === patient.id)
                .sort((a,b) => b.id - a.id); // Simple sort by ID assuming newer ID = newer

            // Filter Payments
            const myPayments = allPayments.filter(p => p.patientId === patient.id);

            setAppointments(myAppts);
            setPrescriptions(myPrescs);
            setPayments(myPayments);

        } catch (error) {
            console.error("Error loading patient dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

    // Derived State for UI
    const now = new Date();
    
    // Filter strictly for future appointments
    const upcomingAppointments = appointments
        .filter(a => {
            const d = parseDate(a.appointmentTime || a.appointmentDate);
            return d && d > now && a.status !== 'CANCELLED' && a.status !== 'COMPLETED';
        })
        .sort((a, b) => { // Ascending (soonest first)
            const dateA = parseDate(a.appointmentTime || a.appointmentDate);
            const dateB = parseDate(b.appointmentTime || b.appointmentDate);
            return dateA - dateB;
        });

    const nextAppointment = upcomingAppointments[0];
    
    const pastAppointments = appointments.filter(a => {
        const d = parseDate(a.appointmentTime || a.appointmentDate);
        return d && d <= now;
    });

    const pendingBills = payments.filter(p => p.status === 'PENDING');
    const totalPendingAmount = pendingBills.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                             Welcome back, {currentPatient?.name || user?.name} 👋
                        </h1>
                        <p className="text-teal-100 text-lg">
                            Track your health, manage appointments, and view your history.
                        </p>
                    </div>
                    <Button 
                        variant="primary" 
                        className="bg-white text-teal-700 hover:bg-teal-50 border-none shadow-md"
                        onClick={() => navigate('/appointments/new')}
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Book Appointment
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Upcoming</p>
                        <p className="text-xl font-bold text-gray-800">{upcomingAppointments.length} Appointments</p>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <Pill className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Prescriptions</p>
                        <p className="text-xl font-bold text-gray-800">{prescriptions.length} Active</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                     <div className="p-3 bg-orange-100 rounded-lg">
                        <CreditCard className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Pending Bills</p>
                        <p className="text-xl font-bold text-gray-800">${totalPendingAmount.toFixed(2)}</p>
                    </div>
                </div>

                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                     <div className="p-3 bg-green-100 rounded-lg">
                        <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Completed</p>
                        <p className="text-xl font-bold text-gray-800">{pastAppointments.length} Visits</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Next Appointment Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-teal-500" />
                                Next Appointment
                            </h2>
                        </div>
                        
                        <div className="p-6">
                            {nextAppointment ? (
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-teal-50 rounded-xl p-6 border border-teal-100">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                                {nextAppointment.type || 'General'}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                ID: #{nextAppointment.id}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            Dr. {doctorsMap[nextAppointment.doctorId] || 'Unknown Doctor'}
                                        </h3>
                                        <div className="flex flex-wrap gap-4 mt-3">
                                            <div className="flex items-center text-gray-600">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                {formatDate(nextAppointment.appointmentTime || nextAppointment.appointmentDate)}
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                {formatTime(nextAppointment.appointmentTime || nextAppointment.appointmentDate)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto flex flex-col gap-2">
                                        <Button size="sm" onClick={() => navigate(`/appointments/${nextAppointment.id}`)}>
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Appointments</h3>
                                    <p className="text-gray-500 mb-4">You have no scheduled visits at the moment.</p>
                                    <Button onClick={() => navigate('/appointments/new')}>Book Now</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent History Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                         <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-gray-900">Recent Visits</h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>
                                View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Date</th>
                                        <th className="px-6 py-3 font-medium">Doctor</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {pastAppointments.slice(0, 5).map((appt) => (
                                        <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-900 font-medium">
                                                {formatDate(appt.appointmentTime || appt.appointmentDate)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                Dr. {doctorsMap[appt.doctorId] || appt.doctorId}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {appt.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => navigate(`/appointments/${appt.id}`)}
                                                    className="text-teal-600 hover:text-teal-800 font-medium text-xs"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {pastAppointments.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                No past appointment history found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column (1/3 width) */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button 
                                onClick={() => navigate('/appointments/new')}
                                className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all group"
                            >
                                <div className="p-2 bg-teal-100 rounded-md group-hover:bg-teal-200 transition-colors">
                                    <PlusCircle className="w-5 h-5 text-teal-700" />
                                </div>
                                <span className="ml-3 font-medium text-gray-700 group-hover:text-teal-900">Book New Appointment</span>
                            </button>
                            
                            <button 
                                onClick={() => navigate('/prescriptions')}
                                className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="p-2 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors">
                                    <FileText className="w-5 h-5 text-blue-700" />
                                </div>
                                <span className="ml-3 font-medium text-gray-700 group-hover:text-blue-900">My Prescriptions</span>
                            </button>

                             <button 
                                onClick={() => navigate('/payments')}
                                className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
                            >
                                <div className="p-2 bg-orange-100 rounded-md group-hover:bg-orange-200 transition-colors">
                                    <CreditCard className="w-5 h-5 text-orange-700" />
                                </div>
                                <span className="ml-3 font-medium text-gray-700 group-hover:text-orange-900">Billing & Payments</span>
                            </button>
                        </div>
                    </div>

                    {/* Recent Prescriptions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-gray-900">Latest Prescriptions</h2>
                             <button onClick={() => navigate('/prescriptions')} className="text-xs text-teal-600 hover:underline">View All</button>
                        </div>
                        <ul className="space-y-4">
                            {prescriptions.slice(0, 3).map((pres) => (
                                <li key={pres.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{pres.medication || `Prescription #${pres.id}`}</p>
                                        <p className="text-xs text-gray-500">Dr. {doctorsMap[pres.doctorId] || 'Unknown'}</p>
                                        <p className="text-xs text-gray-400 mt-1">{pres.date ? formatDate(pres.date) : 'Recent'}</p>
                                    </div>
                                </li>
                            ))}
                            {prescriptions.length === 0 && (
                                <li className="text-center text-gray-500 text-sm py-4">No recent prescriptions.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
