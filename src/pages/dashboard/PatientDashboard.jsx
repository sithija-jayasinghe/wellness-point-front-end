import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Calendar, Clock } from 'lucide-react';

const PatientDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
             <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || user?.username}</h1>
                <p className="text-teal-100">Track your health journey and upcoming appointments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-cyan-500" />
                            Next Appointment
                        </h2>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
                        <p className="text-sm font-semibold text-cyan-900">Dr. Smith (Cardiology)</p>
                        <p className="text-xs text-cyan-600 mt-1">Tomorrow at 10:00 AM</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-500" />
                            Recent Prescriptions
                        </h2>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex justify-between text-sm">
                            <span className="text-gray-600">Amoxicillin 500mg</span>
                            <span className="text-gray-400">2 days ago</span>
                        </li>
                         <li className="flex justify-between text-sm">
                            <span className="text-gray-600">Paracetamol</span>
                            <span className="text-gray-400">1 week ago</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
