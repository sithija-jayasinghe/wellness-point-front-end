import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllAppointments } from '../../api/appointments.api';
import { getAllSchedules } from '../../api/schedules.api';
import { getAllPatients } from '../../api/patients.api';
import { getAllDoctors } from '../../api/doctors.api';
import Spinner from '../../components/Spinner';

const parseDate = (dateArr) => {
    if (!dateArr) return new Date();
    if (Array.isArray(dateArr)) {
        return new Date(dateArr[0], dateArr[1] - 1, dateArr[2], dateArr[3] || 0, dateArr[4] || 0);
    }
    return new Date(dateArr);
};

const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const DoctorDashboard = () => {
    const { user } = useAuth();
    const [myAppointments, setMyAppointments] = useState([]);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [nextAppointment, setNextAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        today: 0,
        completed: 0,
        pending: 0
    });
    const [patientsMap, setPatientsMap] = useState({});

    useEffect(() => {
        const fetchDoctorData = async () => {
             if (!user) return; // Wait for user to be available
             
             try {
                const [allAppts, schedules, patients, doctors] = await Promise.all([
                    getAllAppointments(),
                    getAllSchedules(),
                    getAllPatients(),
                    getAllDoctors()
                ]);

                // Map patients for name resolution
                const pMap = Object.fromEntries(patients.map(p => [p.id, p.name]));
                setPatientsMap(pMap);

                // Find the doctor record matching current logged-in user
                // Robust matching: Check user.id/userId vs doctor.user.id/userId, then name fallback
                const currentUserId = user.id || user.userId;
                const currentDoctor = doctors.find(d => {
                    // 1. Try matching by User ID linkage
                    const docUserId = d.user?.id || d.user?.userId;
                    if (currentUserId && docUserId) {
                        return String(currentUserId) === String(docUserId);
                    }
                    // 2. Fallback: match by name/username (for legacy/unlinked records)
                    return (d.name && d.name === user.username) || 
                           (d.username && d.username === user.username) ||
                           (d.email && d.email === user.email);
                });
                
                if (currentDoctor) {
                    // Get schedules belonging to this doctor
                    const doctorScheduleIds = schedules
                        .filter(s => s.doctorId === currentDoctor.id)
                        .map(s => s.id);

                    // Filter appointments for this doctor's schedules
                    const filteredAppts = allAppts.filter(a => doctorScheduleIds.includes(a.scheduleId));
                    
                    // Sort by date (descending for history, but we want upcoming/recent)
                    const sorted = [...filteredAppts].sort((a, b) => parseDate(b.appointmentDate) - parseDate(a.appointmentDate));

                    const now = new Date();
                    const todayAppts = filteredAppts
                        .filter(a => isSameDay(parseDate(a.appointmentDate), now))
                        .sort((a, b) => parseDate(a.appointmentDate) - parseDate(b.appointmentDate));

                    const todayCount = todayAppts.length;
                    const completedCount = filteredAppts.filter(a => a.status === 'COMPLETED').length;
                    const pendingCount = filteredAppts.filter(a => a.status === 'PENDING').length;

                    // Determine Current and Next Appointment
                    // Assuming 30 min duration for simplicity if not in data
                    const DURATION_MS = 30 * 60 * 1000; 
                    
                    let curr = null;
                    let next = null;

                    for (const appt of todayAppts) {
                        const start = parseDate(appt.appointmentDate);
                        const end = new Date(start.getTime() + DURATION_MS);
                        
                        if (now >= start && now <= end && appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED') {
                            curr = appt;
                        } else if (start > now && appt.status !== 'CANCELLED' && !next) {
                            next = appt;
                        }
                    }

                    setTodayAppointments(todayAppts);
                    setCurrentAppointment(curr);
                    setNextAppointment(next);

                    setStats({
                        today: todayCount,
                        completed: completedCount,
                        pending: pendingCount
                    });

                    setMyAppointments(sorted.slice(0, 5));
                }
             } catch (e) {
                 console.error("Error fetching doctor dashboard data:", e);
             } finally {
                 setLoading(false);
             }
        };
        
        fetchDoctorData();
    }, [user]);

    if (loading) return <Spinner fullScreen />;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
            
            {/* Quick Actions / Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Patient Card */}
                <div className={`p-6 rounded-xl shadow-sm border ${currentAppointment ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <CheckCircle className={`h-5 w-5 ${currentAppointment ? 'text-blue-600' : 'text-gray-400'}`} />
                        Current Consultation
                    </h3>
                    {currentAppointment ? (
                        <div>
                            <p className="text-2xl font-bold text-blue-900">{patientsMap[currentAppointment.patientId] || 'Unknown Patient'}</p>
                            <p className="text-blue-700">ID: #{currentAppointment.patientId}</p>
                            <div className="mt-4 flex gap-2">
                                <span className="px-3 py-1 bg-white text-blue-700 text-sm rounded-full shadow-sm font-semibold">
                                    {parseDate(currentAppointment.appointmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full shadow-sm font-semibold">In Progress</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No consultation in progress currently.</p>
                    )}
                </div>

                {/* Next Patient Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        Next Patient
                    </h3>
                    {nextAppointment ? (
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{patientsMap[nextAppointment.patientId] || 'Unknown Patient'}</p>
                            <p className="text-gray-600">ID: #{nextAppointment.patientId}</p>
                            <div className="mt-4">
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-semibold">
                                    Upcoming: {parseDate(nextAppointment.appointmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No more appointments scheduled for today.</p>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Appointments Today</p>
                            <h3 className="text-2xl font-bold">{stats.today}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <h3 className="text-2xl font-bold">{stats.completed}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <h3 className="text-2xl font-bold">{stats.pending}</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Today's Schedule Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Today's Schedule
                    </h2>
                    <span className="text-sm text-gray-500">{new Date().toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</span>
                </div>
                
                <div className="space-y-3">
                    {todayAppointments.length > 0 ? todayAppointments.map((appt, i) => {
                        const date = parseDate(appt.appointmentDate);
                        const isPast = date < new Date();
                        const isCompleted = appt.status === 'COMPLETED';
                        
                        return (
                         <div key={i} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${
                             isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 
                             isPast ? 'bg-orange-50/50 border-orange-100' : 
                             'bg-white border-gray-200 hover:shadow-md hover:border-blue-200'
                         }`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg font-bold text-center min-w-[80px] ${
                                    isPast ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'
                                }`}>
                                    <div className="text-lg">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{patientsMap[appt.patientId] || 'Unknown Patient'}</p>
                                    <p className="text-sm text-gray-500 font-medium">Patient ID: #{appt.patientId}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wide ${
                                    appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                    appt.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                    appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {appt.status}
                                </span>
                                {/* Action Buttons could go here */}
                            </div>
                         </div>
                    )}) : (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">No appointments scheduled for today</p>
                            <p className="text-sm text-gray-400">Enjoy your free time!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default DoctorDashboard;
