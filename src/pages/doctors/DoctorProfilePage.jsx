import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    User, 
    Mail, 
    Stethoscope, 
    CreditCard, 
    Building2, 
    Calendar, 
    Clock, 
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Edit
} from 'lucide-react';
import { getDoctorById } from '../../api/doctors.api';
import { getAllClinics } from '../../api/clinics.api';
import { getAllSchedules } from '../../api/schedules.api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ErrorState from '../../components/ErrorState';

const DoctorProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isPatient = user?.role === 'PATIENT';
    const isDoctor = user?.role === 'DOCTOR';

    const [doctor, setDoctor] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [doctorData, clinicsData, schedulesData] = await Promise.all([
                getDoctorById(id),
                getAllClinics(),
                getAllSchedules()
            ]);
            
            setDoctor(doctorData);
            setClinics(clinicsData || []);
            
            // Filter schedules for this doctor and only future ones
            const now = new Date();
            const doctorSchedules = (schedulesData || []).filter(schedule => {
                if (String(schedule.doctorId) !== String(id)) return false;
                
                // Parse date
                let start;
                const dt = schedule.startDateTime;
                if (Array.isArray(dt)) {
                    const [y, m, d, h, min, s = 0] = dt;
                    start = new Date(y, m - 1, d, h, min, s);
                } else {
                    start = new Date(dt);
                }
                
                return start >= now;
            });
            
            // Sort by earliest first
            doctorSchedules.sort((a, b) => {
                const getDt = (dt) => Array.isArray(dt) ? new Date(dt[0], dt[1]-1, dt[2], dt[3], dt[4], dt[5]||0) : new Date(dt);
                return getDt(a.startDateTime) - getDt(b.startDateTime);
            });
            
            setSchedules(doctorSchedules);
            setError(null);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err.message || 'Failed to load doctor profile');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dt) => {
        if (!dt) return '';
        let d;
        if (Array.isArray(dt)) {
            const [y, m, day, h, min, s = 0] = dt;
            d = new Date(y, m - 1, day, h, min, s);
        } else {
            d = new Date(dt);
        }
        return d.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) return <Spinner fullScreen />;
    
    if (error || !doctor) return (
        <ErrorState 
            title="Profile Not Found" 
            description={error || "The doctor you are looking for does not exist."}
            onRetry={() => navigate('/doctors')} 
        />
    );

    // Normalize name
    const displayName = doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name || 'Unknown'}`;
    const initials = displayName.replace('Dr. ', '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const isActive = doctor.status === 'ACTIVE' || doctor.status === 'Active';

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Top Navigation */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    icon={ArrowLeft}
                    onClick={() => navigate('/doctors')}
                >
                    Back to Doctors
                </Button>
            </div>

            {/* Hero / Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                {/* Background Banner */}
                <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                
                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        {/* Avatar & Basic Info */}
                        <div className="flex gap-6 -mt-12">
                            <div className="h-28 w-28 rounded-full bg-white p-1 shadow-md flex-shrink-0">
                                <div className="h-full w-full rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 text-3xl font-bold">
                                    {initials}
                                </div>
                            </div>
                            
                            <div className="pt-14">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{displayName}</h1>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {isActive ? 'Available' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="text-lg text-cyan-600 font-medium mt-1">{doctor.specialization}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 w-full sm:w-auto">
                            {isPatient ? (
                                <Button
                                    className="w-full sm:w-auto shadow-sm"
                                    onClick={() => navigate(`/appointments/new?doctorId=${doctor.id}`)}
                                    disabled={!isActive}
                                >
                                    Book Appointment
                                </Button>
                            ) : !isDoctor && (
                                <Button
                                    variant="outline"
                                    icon={Edit}
                                    onClick={() => navigate(`/doctors/${doctor.id}/edit`)}
                                    className="w-full sm:w-auto"
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Details & Clinics */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* About Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <User className="h-5 w-5 text-gray-400" />
                            Professional Details
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-3 rounded-xl">
                                    <Stethoscope className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Specialization</p>
                                    <p className="text-gray-900 font-semibold">{doctor.specialization || 'Not specified'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-green-50 p-3 rounded-xl">
                                    <CreditCard className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Consultation Fee</p>
                                    <p className="text-gray-900 font-semibold">
                                        {doctor.consultationFee ? `LKR ${Number(doctor.consultationFee).toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'Not specified'}
                                    </p>
                                </div>
                            </div>
                            
                            {doctor.email && (
                                <div className="flex items-start gap-4 sm:col-span-2">
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <Mail className="h-6 w-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Email Address</p>
                                        <a href={`mailto:${doctor.email}`} className="text-cyan-600 hover:underline">{doctor.email}</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Associated Clinics */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            Associated Clinics
                        </h2>
                        
                        {doctor.clinics && doctor.clinics.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {doctor.clinics.map(clinicRef => {
                                    const fullClinic = clinics.find(c => c.id === clinicRef.id);
                                    const name = fullClinic ? fullClinic.name : clinicRef.name || `Clinic #${clinicRef.id}`;
                                    const cStatus = fullClinic ? fullClinic.status : clinicRef.status;
                                    const isClinicActive = cStatus === 'ACTIVE' || cStatus === 'Active';
                                    
                                    return (
                                        <div key={clinicRef.id} className="border border-gray-100 rounded-xl p-4 flex items-start gap-3 bg-gray-50/50">
                                            <div className="mt-0.5">
                                                {isClinicActive ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {isClinicActive ? 'Currently accepting patients' : 'Temporarily unavailable'}
                                                </p>
                                                {fullClinic?.location && (
                                                    <p className="text-sm text-gray-600 mt-1">{fullClinic.location}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 bg-gray-50 p-4 rounded-xl text-center">No clinics assigned</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Schedule */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                Upcoming Schedule
                            </h2>
                        </div>

                        {schedules.length > 0 ? (
                            <div className="space-y-3">
                                {schedules.slice(0, 5).map(schedule => (
                                    <div key={schedule.id} className="border border-gray-100 rounded-xl p-4 hover:border-cyan-200 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900">
                                                {formatDateTime(schedule.startDateTime).split(',')[0]} {/* Day/Date */}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                                                schedule.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {schedule.status}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>
                                                {formatDateTime(schedule.startDateTime).split(',')[1]} - 
                                                {formatDateTime(schedule.endDateTime).split(',')[1]}
                                            </span>
                                        </div>
                                        
                                        {/* Find the clinic name for this schedule if it provides a clinicId */}
                                        {schedule.clinicId && (
                                            <div className="mt-2 text-sm text-gray-500 flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5" />
                                                <span>
                                                    {clinics.find(c => c.id === schedule.clinicId)?.name || 'Clinic'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                
                                {schedules.length > 5 && (
                                    <button 
                                        onClick={() => navigate('/schedules')}
                                        className="w-full py-2 mt-2 text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                                    >
                                        View all schedules
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="bg-gray-50 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Calendar className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-gray-900 font-medium">No upcoming sessions</p>
                                <p className="text-sm text-gray-500 mt-1">Check back later for new availability</p>
                            </div>
                        )}
                        
                        {isPatient && isActive && (
                            <div className="mt-6">
                                <Button 
                                    className="w-full" 
                                    onClick={() => navigate(`/appointments/new?doctorId=${doctor.id}`)}
                                >
                                    Book Now
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfilePage;
