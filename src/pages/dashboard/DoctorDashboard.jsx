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

                    const todayCount = filteredAppts.filter(a => isSameDay(parseDate(a.appointmentDate), new Date())).length;
                    const completedCount = filteredAppts.filter(a => a.status === 'COMPLETED').length;
                    const pendingCount = filteredAppts.filter(a => a.status === 'PENDING').length;

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
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold mb-4">Upcoming Appointments</h2>
                <div className="space-y-3">
                    {myAppointments.length > 0 ? myAppointments.map((appt, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-semibold">{patientsMap[appt.patientId] || 'Unknown Patient'} (ID: #{appt.patientId})</p>
                                <p className="text-sm text-gray-500">{parseDate(appt.appointmentDate).toLocaleString()}</p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-bold">{appt.status}</span>
                         </div>
                    )) : <p>No appointments found.</p>}
                </div>
            </div>
        </div>
    );
};


export default DoctorDashboard;
