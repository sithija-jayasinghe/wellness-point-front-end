import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Phone, Clock } from 'lucide-react';
import { getAllAppointments } from '../../api/appointments.api';
import Spinner from '../../components/Spinner';

const ReceptionistDashboard = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getAllAppointments();
                // Show today's appointments for receptionist to manage check-ins
                setAppointments(data.slice(0, 10)); 
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Scheduled Today</p>
                        <p className="text-2xl font-bold text-gray-900">15</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Checked In</p>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <Phone className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Inquiries</p>
                        <p className="text-2xl font-bold text-gray-900">3</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Quick Check-in / Appointments</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {appointments.map((appt, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex gap-3 items-center">
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">09:30 AM</span>
                                <div>
                                    <p className="font-medium text-gray-900">{appt.patientName}</p>
                                    <p className="text-xs text-gray-500">Dr. {appt.doctorName}</p>
                                </div>
                            </div>
                            <button className="text-xs bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-md font-medium hover:bg-cyan-100 border border-cyan-200">
                                Check In
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDashboard;
