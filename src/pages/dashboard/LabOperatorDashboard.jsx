import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Clock, CheckCircle2, AlertCircle, Activity, Users } from 'lucide-react';
import { getAllLabTests } from '../../api/labTests.api';
import { getAllPatients } from '../../api/patients.api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import { cn } from '../../utils';

const StatCard = ({ title, value, icon: IconComponent, color, subtitle }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-500',
        cyan: 'bg-cyan-50 text-cyan-500',
        purple: 'bg-purple-50 text-purple-500',
        green: 'bg-green-50 text-green-500',
        orange: 'bg-orange-50 text-orange-500',
        red: 'bg-red-50 text-red-500',
    };

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-40">
            <div className="flex justify-between items-start">
                <div className={cn("p-2.5 rounded-xl", colorClasses[color])}>
                    <IconComponent className="h-6 w-6" />
                </div>
            </div>
            <div>
                <p className="text-[13px] font-medium text-gray-400 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
};

const LabOperatorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [labTests, setLabTests] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [labTestsData, patientsData] = await Promise.all([
                    getAllLabTests().catch(() => []),
                    getAllPatients().catch(() => []),
                ]);
                setLabTests(labTestsData);
                setPatients(patientsData);
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    const totalTests = labTests.length;
    const requested = labTests.filter(t => t.status === 'REQUESTED').length;
    const sampleCollected = labTests.filter(t => t.status === 'SAMPLE_COLLECTED').length;
    const inProgress = labTests.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = labTests.filter(t => t.status === 'COMPLETED').length;
    const cancelled = labTests.filter(t => t.status === 'CANCELLED').length;

    const recentTests = [...labTests]
        .sort((a, b) => {
            const dateA = a.requestedDate ? new Date(a.requestedDate) : new Date(0);
            const dateB = b.requestedDate ? new Date(b.requestedDate) : new Date(0);
            return dateB - dateA;
        })
        .slice(0, 8);

    const getPatientName = (patientId) => {
        const patient = patients.find(p => String(p.id) === String(patientId));
        return patient ? (patient.name || patient.patientName || `Patient #${patientId}`) : `Patient #${patientId}`;
    };

    const getStatusBadge = (status) => {
        const styles = {
            REQUESTED: 'bg-yellow-100 text-yellow-700',
            SAMPLE_COLLECTED: 'bg-blue-100 text-blue-700',
            IN_PROGRESS: 'bg-purple-100 text-purple-700',
            COMPLETED: 'bg-emerald-100 text-emerald-700',
            CANCELLED: 'bg-red-100 text-red-700',
        };
        return (
            <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider", styles[status] || 'bg-gray-100 text-gray-700')}>
                {status?.replace('_', ' ') || 'Unknown'}
            </span>
        );
    };

    const formatDate = (dateData) => {
        if (!dateData) return '-';
        try {
            if (Array.isArray(dateData)) {
                const [year, month, day] = dateData;
                return new Date(year, month - 1, day).toLocaleDateString();
            }
            return new Date(dateData).toLocaleDateString();
        } catch {
            return String(dateData);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Lab Operator Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Welcome back, {user?.name || user?.username || 'Lab Operator'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard title="Total Tests" value={totalTests} icon={FlaskConical} color="blue" />
                <StatCard title="Requested" value={requested} icon={Clock} color="orange" />
                <StatCard title="Sample Collected" value={sampleCollected} icon={Activity} color="cyan" />
                <StatCard title="In Progress" value={inProgress} icon={Activity} color="purple" />
                <StatCard title="Completed" value={completed} icon={CheckCircle2} color="green" />
                <StatCard title="Cancelled" value={cancelled} icon={AlertCircle} color="red" />
            </div>

            {/* Recent Lab Tests */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Recent Lab Tests</h2>
                    <button
                        onClick={() => navigate('/lab-tests')}
                        className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
                    >
                        View All
                    </button>
                </div>

                {recentTests.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No lab tests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Test Name</th>
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Code</th>
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentTests.map((test) => (
                                    <tr key={test.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/lab-tests')}>
                                        <td className="py-3 px-2 font-medium text-gray-900">{test.testName}</td>
                                        <td className="py-3 px-2 text-gray-500">{test.testCode || '-'}</td>
                                        <td className="py-3 px-2 text-gray-700">{getPatientName(test.patientId)}</td>
                                        <td className="py-3 px-2 text-gray-500">{formatDate(test.requestedDate)}</td>
                                        <td className="py-3 px-2">{getStatusBadge(test.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabOperatorDashboard;
