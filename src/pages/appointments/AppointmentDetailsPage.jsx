import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Clock, Activity, CheckCircle, XCircle } from 'lucide-react';
import { getAllAppointments } from '../../api/appointments.api'; 
import { getAllPatients } from '../../api/patients.api';
import { getAllSchedules } from '../../api/schedules.api';
import { getAllDoctors } from '../../api/doctors.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/useToast';

const AppointmentDetailsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();
    
    const [appointment, setAppointment] = useState(null);
    const [patient, setPatient] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to parse date data into Date object
    const getAppointmentDateObj = (dateData) => {
        if (!dateData) return null;
        
        let dateObj;
        if (Array.isArray(dateData)) {
            const [year, month, day, hour, minute, second = 0] = dateData;
            // Note: Java month is 1-12, JS Date month is 0-11
            dateObj = new Date(year, month - 1, day, hour, minute, second);
        } else {
            dateObj = new Date(dateData);
        }

        return isNaN(dateObj.getTime()) ? null : dateObj;
    };

    // Helper to format Java LocalDateTime array or string
    const formatDateTime = (dateData) => {
        const dateObj = getAppointmentDateObj(dateData);
        if (!dateObj) return dateData ? 'Invalid Date' : 'N/A';
        return dateObj.toLocaleString();
    };

    // Helper to calculate duration or return default
    const getDurationText = () => {
         if (schedule) {
             // Try to calculate duration from schedule limits
             let start, end;
             
             // Handle array format (likely from backend)
             if (schedule.startDateTime) start = getAppointmentDateObj(schedule.startDateTime);
             if (schedule.endDateTime) end = getAppointmentDateObj(schedule.endDateTime);
             
             if (start && end && schedule.maxPatients > 0) {
                 const diffMinutes = (end - start) / (1000 * 60);
                 const duration = Math.floor(diffMinutes / Math.max(1, parseInt(schedule.maxPatients)));
                 return `${duration} minutes`;
             }
         }
         return "15 minutes"; // Default to 15 mins instead of "Standard Consultation" text
    };

    const getAvailabilityText = () => {
        if (!schedule) return '-';
        // Check for startDateTime/endDateTime first (from Schedule entity structure)
        const start = getAppointmentDateObj(schedule.startDateTime);
        const end = getAppointmentDateObj(schedule.endDateTime);
        
        if (start && end) {
            const dateStr = start.toLocaleDateString();
            const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${dateStr} • ${startTime} - ${endTime}`;
        }
        
        // Fallback to old format if properties exist
        if (schedule.dayOfWeek && schedule.startTime && schedule.endTime) {
            return `${schedule.dayOfWeek} ${schedule.startTime} - ${schedule.endTime}`;
        }
        
        return '-';
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch All Data needed
            const [appointments, patients, schedules, doctors] = await Promise.all([
                 getAllAppointments(),
                 getAllPatients(),
                 getAllSchedules().catch(() => []), 
                 getAllDoctors().catch(() => [])
            ]);

            const apt = appointments.find(a => a.id === parseInt(id) || a.id === id);
            
            if (!apt) {
                toast({ title: 'Error', description: 'Appointment not found', variant: 'destructive' });
                navigate('/appointments');
                return;
            }

            setAppointment(apt);

            // Find related data
            if (apt.patientId) {
                const pat = patients.find(p => p.id === apt.patientId);
                setPatient(pat);
            }

            if (apt.scheduleId) {
                const sch = schedules.find(s => s.id === apt.scheduleId);
                setSchedule(sch);
                
                if (sch && sch.doctorId) {
                    const doc = doctors.find(d => d.id === sch.doctorId);
                    setDoctor(doc);
                }
            }

        } catch (err) {
            console.error('Failed to load appointment details', err);
            toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>;
    }

    if (!appointment) return null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Appointment Details"
                description={`Reference #${appointment.id}`}
                actions={
                    <Button variant="ghost" onClick={() => navigate('/appointments')} icon={ArrowLeft}>
                        Back to List
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Appointment Info</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                            {appointment.status}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date & Time</p>
                                <p className="text-gray-900 font-medium">
                                    {formatDateTime(appointment.appointmentTime)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Duration</p>
                                <p className="text-gray-900">{getDurationText()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
                    </div>

                    {patient ? (
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-900">{patient.name}</p>
                                <p className="text-sm text-gray-500">{patient.phone} • {patient.gender}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Patient information not available (ID: {appointment.patientId})</p>
                    )}
                </div>

                {/* Schedule/Doctor Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 md:col-span-2">
                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Schedule & Doctor Details</h3>
                    </div>

                    {schedule ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Schedule ID</p>
                                <p className="font-medium text-gray-900">#{schedule.id}</p>
                             </div>
                             <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Doctor</p>
                                <p className="font-medium text-gray-900">{doctor ? doctor.name : (schedule.doctorName || `Doctor ID: ${schedule.doctorId || schedule.userId || 'N/A'}`)}</p>
                             </div>
                             <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Availability</p>
                                <p className="font-medium text-gray-900">{getAvailabilityText()}</p>
                             </div>
                             <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Fee</p>
                                <p className="font-medium text-gray-900">{doctor && doctor.consultationFee ? `LKR ${doctor.consultationFee}` : (schedule.fee ? `LKR ${schedule.fee}` : 'N/A')}</p>
                             </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Schedule information not available (ID: {appointment.scheduleId})</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailsPage;
