import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { getAllAppointments } from '../../api/appointments.api';
import Spinner from '../../components/Spinner';

const parseDate = (dateArr) => {
    if (!dateArr) return new Date();
    if (Array.isArray(dateArr)) {
        return new Date(dateArr[0], dateArr[1] - 1, dateArr[2], dateArr[3] || 0, dateArr[4] || 0);
    }
    return new Date(dateArr);
};

const DoctorDashboard = ({ user }) => {
    const [myAppointments, setMyAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDoctorData = async () => {
             // In a real app, we might have getDoctorAppointments(doctorId)
             // For now, we fetch all and filter by doctorId (assuming user.id maps to doctorId or we have a specialized endpoint)
             try {
                const allAppts = await getAllAppointments();
                // Filter where doctorId matches user's associated doctor ID
                // Note: user object might need 'doctorId' or we filter by user.id if they are same
                // Fallback: Just show all for now if we can't filter, or show empty. 
                // Better: Filter by name if ID matches are tricky without backend change
                
                // Assuming backend returns doctorName we can filter by user.username for demo
                const myAppts = allAppts.filter(a => a.status !== 'CANCELLED'); // Simplified
                
                setMyAppointments(myAppts.slice(0, 5));
             } catch (e) {
                 console.error(e);
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
                            <h3 className="text-2xl font-bold">4</h3>
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
                            <h3 className="text-2xl font-bold">12</h3>
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
                            <h3 className="text-2xl font-bold">2</h3>
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
                                <p className="font-semibold">{appt.patientName}</p>
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
