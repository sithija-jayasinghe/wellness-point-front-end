import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, RefreshCw, Users, CheckCircle2, XCircle, Clock,
    ChevronRight, User, Stethoscope, Calendar, Eye
} from 'lucide-react';
import { getAllAppointments, completeAppointment } from '../../api/appointments.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllPatients } from '../../api/patients.api';
import Button from '../../components/Button';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

// ── Status badge colours ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
    SCHEDULED: {
        label: 'Waiting',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-400',
        text: 'text-amber-700',
        headerBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
        icon: Clock,
    },
    COMPLETED: {
        label: 'Completed',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-400',
        text: 'text-emerald-700',
        headerBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: 'Cancelled',
        bg: 'bg-red-50',
        border: 'border-red-200',
        dot: 'bg-red-400',
        text: 'text-red-700',
        headerBg: 'bg-gradient-to-r from-red-500 to-rose-500',
        icon: XCircle,
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseDate = (raw) => {
    if (!raw) return null;
    if (Array.isArray(raw)) {
        const [y, m, d, h = 0, min = 0, s = 0] = raw;
        return new Date(y, m - 1, d, h, min, s);
    }
    const dt = new Date(raw);
    return isNaN(dt.getTime()) ? null : dt;
};

const isToday = (raw) => {
    const dt = parseDate(raw);
    if (!dt) return false;
    const now = new Date();
    return (
        dt.getFullYear() === now.getFullYear() &&
        dt.getMonth() === now.getMonth() &&
        dt.getDate() === now.getDate()
    );
};

const fmtTime = (raw) => {
    const dt = parseDate(raw);
    if (!dt) return 'N/A';
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ── Appointment Card ──────────────────────────────────────────────────────────
const QueueCard = ({ apt, doctorName, patientName, onComplete, completing, onView }) => {
    const status = (apt.status || 'SCHEDULED').toUpperCase();
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED;
    const isWaiting = status === 'SCHEDULED';

    return (
        <div
            className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
        >
            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                    #{apt.id}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${isWaiting ? 'animate-pulse' : ''}`} />
                    {cfg.label}
                </span>
            </div>

            {/* Patient */}
            <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">{patientName}</p>
                    <p className="text-xs text-gray-400">Patient</p>
                </div>
            </div>

            {/* Doctor */}
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                <span>{doctorName || 'Unassigned'}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium">{fmtTime(apt.appointmentTime)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => onView(apt.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                >
                    <Eye className="h-3.5 w-3.5" />
                    View
                </button>

                {isWaiting && (
                    <button
                        disabled={completing}
                        onClick={() => onComplete(apt.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {completing ? (
                            <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Complete
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

// ── Column ────────────────────────────────────────────────────────────────────
const QueueColumn = ({ status, appointments, doctors, patients, onComplete, completingId, onView }) => {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;

    const getDoctorName = (apt) => {
        if (apt.doctor?.name) return apt.doctor.name;
        const doctor = doctors.find(d => d.id === apt.doctorId);
        return doctor?.name || '';
    };

    const getPatientName = (apt) => {
        if (apt.patientName) return apt.patientName;
        const patient = patients.find(p => p.id === apt.patientId);
        return patient?.name || `Patient #${apt.patientId}`;
    };

    return (
        <div className="flex flex-col min-h-0">
            {/* Column header */}
            <div className={`${cfg.headerBg} rounded-xl p-4 mb-4 text-white shadow-md`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-bold text-base">{cfg.label}</span>
                    </div>
                    <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                        {appointments.length}
                    </span>
                </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                        <Icon className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">No appointments</p>
                    </div>
                ) : (
                    appointments.map(apt => (
                        <QueueCard
                            key={apt.id}
                            apt={apt}
                            doctorName={getDoctorName(apt)}
                            patientName={getPatientName(apt)}
                            onComplete={onComplete}
                            completing={completingId === apt.id}
                            onView={onView}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const LiveQueuePage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [allAppointments, setAllAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completingId, setCompletingId] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [appointmentsData, doctorsData, patientsData] = await Promise.all([
                getAllAppointments(),
                getAllDoctors().catch(() => []),
                getAllPatients().catch(() => []),
            ]);
            setAllAppointments(appointmentsData);
            setDoctors(doctorsData);
            setPatients(patientsData);
            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Failed to fetch queue data', err);
            if (!silent) {
                toast({ title: 'Error', description: 'Failed to load queue data.', variant: 'destructive' });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [toast]);

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => fetchData(true), 30_000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    const handleComplete = async (id) => {
        setCompletingId(id);
        try {
            await completeAppointment(id);
            toast({ title: 'Done!', description: 'Appointment marked as completed.', variant: 'success' });
            // Optimistic update
            setAllAppointments(prev =>
                prev.map(a => a.id === id ? { ...a, status: 'COMPLETED' } : a)
            );
        } catch {
            toast({ title: 'Error', description: 'Could not complete appointment.', variant: 'destructive' });
        } finally {
            setCompletingId(null);
        }
    };

    // Filter to today only
    const todaysAppointments = allAppointments.filter(a => isToday(a.appointmentTime));

    const waiting = todaysAppointments.filter(a => (a.status || '').toUpperCase() === 'SCHEDULED');
    const completed = todaysAppointments.filter(a => (a.status || '').toUpperCase() === 'COMPLETED');
    const cancelled = todaysAppointments.filter(a => (a.status || '').toUpperCase() === 'CANCELLED');

    const totalToday = todaysAppointments.length;
    const completionRate = totalToday > 0 ? Math.round((completed.length / totalToday) * 100) : 0;

    if (loading) return <Spinner fullScreen />;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Live Queue</h1>
                        {autoRefresh && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Today's appointments •{' '}
                        <span className="font-medium text-gray-700">
                            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                            autoRefresh
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                    </button>
                    <Button variant="outline" onClick={() => fetchData()} icon={RefreshCw}>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ── Stats Bar ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Today', value: totalToday, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                    { label: 'Waiting', value: waiting.length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                    { label: 'Completed', value: completed.length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                    { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
                ].map(stat => (
                    <div key={stat.label} className={`rounded-xl border p-4 ${stat.bg}`}>
                        <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            {totalToday > 0 && (
                <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Daily Progress</span>
                        <span>{completed.length} / {totalToday} completed</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-700"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>
            )}

            {/* ── Kanban Board ── */}
            {totalToday === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-300">
                    <Calendar className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg font-semibold text-gray-400">No appointments scheduled for today</p>
                    <p className="text-sm text-gray-300 mt-1">Check back later or book a new appointment</p>
                    <button
                        onClick={() => navigate('/appointments/new')}
                        className="mt-4 flex items-center gap-1 text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                    >
                        Book Appointment <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QueueColumn
                        status="SCHEDULED"
                        appointments={waiting.sort((a, b) => {
                            const da = parseDate(a.appointmentTime);
                            const db = parseDate(b.appointmentTime);
                            return (da || 0) - (db || 0);
                        })}
                        doctors={doctors}
                        patients={patients}
                        onComplete={handleComplete}
                        completingId={completingId}
                        onView={id => navigate(`/appointments/${id}`)}
                    />
                    <QueueColumn
                        status="COMPLETED"
                        appointments={completed}
                        doctors={doctors}
                        patients={patients}
                        onComplete={handleComplete}
                        completingId={completingId}
                        onView={id => navigate(`/appointments/${id}`)}
                    />
                    <QueueColumn
                        status="CANCELLED"
                        appointments={cancelled}
                        doctors={doctors}
                        patients={patients}
                        onComplete={handleComplete}
                        completingId={completingId}
                        onView={id => navigate(`/appointments/${id}`)}
                    />
                </div>
            )}

            {/* Footer */}
            <p className="text-center text-xs text-gray-400">
                Last refreshed: {lastRefreshed.toLocaleTimeString()} 
                {autoRefresh && ' · Auto-refreshes every 30 seconds'}
            </p>
        </div>
    );
};

export default LiveQueuePage;
