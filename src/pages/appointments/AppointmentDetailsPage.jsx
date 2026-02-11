import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Clock, Activity, CheckCircle, XCircle, Trash2, CreditCard, Stethoscope, Pill, FileText, Save, Plus } from 'lucide-react';
import { getAllAppointments, deleteAppointment } from '../../api/appointments.api'; 
import { getAllPatients } from '../../api/patients.api';
import { getAllSchedules } from '../../api/schedules.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllConsultations, createConsultation } from '../../api/consultations.api';
import { getAllPrescriptions, createPrescription } from '../../api/prescriptions.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/useToast';
import { useAuth } from '../../context/AuthContext';

const AppointmentDetailsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [appointment, setAppointment] = useState(null);
    const [patient, setPatient] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const isDoctor = user?.role === 'DOCTOR';

    // Consultation & Prescription form state (doctor only)
    const [consultationForm, setConsultationForm] = useState({ diagnosis: '', notes: '' });
    const [prescriptionItems, setPrescriptionItems] = useState([{ medicineName: '', dosage: '', duration: '' }]);
    const [consultationErrors, setConsultationErrors] = useState({});
    const [savingConsultation, setSavingConsultation] = useState(false);
    const [existingConsultation, setExistingConsultation] = useState(null);

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
        if (user) {
            fetchData();
        }
    }, [id, user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch All Data needed
            const [appointments, patients, schedules, doctors, consultations, prescriptions] = await Promise.all([
                 getAllAppointments(),
                 getAllPatients(),
                 getAllSchedules().catch(() => []), 
                 getAllDoctors().catch(() => []),
                 getAllConsultations().catch(() => []),
                 getAllPrescriptions().catch(() => [])
            ]);

            const apt = appointments.find(a => a.id === parseInt(id) || a.id === id);
            
            if (!apt) {
                toast({ title: 'Error', description: 'Appointment not found', variant: 'destructive' });
                navigate('/appointments');
                return;
            }

            // Find related data first to perform checks
            let pat = null;
            if (apt.patientId) {
                pat = patients.find(p => p.id === apt.patientId);
            }

            // RBAC Check: If Patient, ensure they own the appointment
            if (user?.role === 'PATIENT') {
                // If patient not found OR patient userId doesn't match logged in user
                if (!pat || String(pat.userId) !== String(user.id)) {
                    navigate('/unauthorized');
                    return;
                }
            }

            // RBAC Check: If Doctor, ensure the appointment belongs to their schedule
            if (user?.role === 'DOCTOR') {
                const currentUserId = user.id || user.userId;
                const currentDoctor = doctors.find(d => {
                    const docUserId = d.user?.id || d.user?.userId;
                    if (currentUserId && docUserId) {
                        return String(currentUserId) === String(docUserId);
                    }
                    return (d.name && d.name === user.username) ||
                           (d.username && d.username === user.username) ||
                           (d.email && d.email === user.email);
                });
                if (currentDoctor && apt.scheduleId) {
                    const aptSchedule = schedules.find(s => s.id === apt.scheduleId);
                    if (!aptSchedule || aptSchedule.doctorId !== currentDoctor.id) {
                        navigate('/unauthorized');
                        return;
                    }
                }
            }

            setAppointment(apt);
            setPatient(pat);

            // Check if consultation already exists for this appointment
            if (isDoctor) {
                const existingCons = consultations.find(c => c.appointmentId === apt.id);
                if (existingCons) {
                    setExistingConsultation(existingCons);
                }
            }

            if (apt.scheduleId) {
                const sch = schedules.find(s => s.id === apt.scheduleId);
                setSchedule(sch);
                
                if (sch && sch.doctorId) {
                    const doc = doctors.find(d => d.id === sch.doctorId);
                    setDoctor(doc);
                }
            }

            // Build patient medical history (for doctors)
            if (isDoctor && pat) {
                const patientAppointments = appointments.filter(a =>
                    a.patientId === pat.id || a.patientId === String(pat.id)
                );

                const history = patientAppointments.map(a => {
                    let doctorName = 'Unknown Doctor';
                    if (a.doctor && a.doctor.name) {
                        doctorName = a.doctor.name;
                    } else if (a.scheduleId) {
                        const s = schedules.find(sc => sc.id === a.scheduleId);
                        if (s && s.doctorId) {
                            const d = doctors.find(dc => dc.id === s.doctorId);
                            if (d) doctorName = d.name;
                        }
                    }

                    const consultation = consultations.find(c => c.appointmentId === a.id);
                    let prescription = null;
                    if (consultation) {
                        prescription = prescriptions.find(p => p.consultationId === consultation.consultationId);
                    }

                    let dateStr = a.appointmentTime;
                    if (Array.isArray(a.appointmentTime)) {
                        const [year, month, day] = a.appointmentTime;
                        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    }

                    return {
                        id: a.id,
                        date: dateStr,
                        doctorName,
                        consultation,
                        prescription,
                        status: a.status
                    };
                });

                history.sort((a, b) => new Date(b.date) - new Date(a.date));
                setPatientHistory(history);
            }

        } catch (err) {
            console.error('Failed to load appointment details', err);
            toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this appointment?')) return;
        
        try {
            setActionLoading(true);
            await deleteAppointment(id);
            toast({ title: 'Success', description: 'Appointment deleted successfully', variant: 'success' });
            navigate('/appointments');
        } catch (error) {
            console.error('Failed to delete appointment', error);
            toast({ title: 'Error', description: 'Failed to delete appointment', variant: 'destructive' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleProcessPayment = () => {
        // Navigate to payment creation with pre-filled data
        navigate(`/payments/new?appointmentId=${id}&amount=${doctor?.consultationFee || 0}&patientId=${patient?.id || ''}`);
    };

    // --- Consultation & Prescription form handlers (doctor only) ---
    const handleConsultationChange = (e) => {
        const { name, value } = e.target;
        setConsultationForm(prev => ({ ...prev, [name]: value }));
        if (consultationErrors[name]) {
            setConsultationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handlePrescriptionItemChange = (index, field, value) => {
        const newItems = [...prescriptionItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setPrescriptionItems(newItems);
    };

    const addPrescriptionItem = () => {
        setPrescriptionItems(prev => [...prev, { medicineName: '', dosage: '', duration: '' }]);
    };

    const removePrescriptionItem = (index) => {
        if (prescriptionItems.length === 1) return;
        setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveConsultation = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!consultationForm.diagnosis.trim()) newErrors.diagnosis = 'Diagnosis is required';
        setConsultationErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setSavingConsultation(true);

            // 1. Create consultation
            const consultationPayload = {
                appointmentId: parseInt(id),
                diagnosis: consultationForm.diagnosis,
                notes: consultationForm.notes,
            };
            const createdConsultation = await createConsultation(consultationPayload);

            // 2. Create prescription if any medicine items are filled
            const filledItems = prescriptionItems.filter(i => i.medicineName.trim() !== '');
            if (filledItems.length > 0) {
                const consultationId =
                    createdConsultation?.consultationId ||
                    createdConsultation?.id ||
                    createdConsultation?.data?.consultationId ||
                    createdConsultation?.data?.id;

                if (consultationId) {
                    const prescriptionPayload = {
                        consultationId: consultationId,
                        issuedDate: new Date().toISOString().split('T')[0],
                        prescriptionItems: filledItems,
                    };
                    await createPrescription(prescriptionPayload);
                    toast({ title: 'Success', description: 'Consultation & Prescription saved!', variant: 'success' });
                } else {
                    toast({ title: 'Warning', description: 'Consultation saved, but prescription failed (ID missing).', variant: 'warning' });
                }
            } else {
                toast({ title: 'Success', description: 'Consultation saved successfully', variant: 'success' });
            }

            // Refresh data to show the new consultation in history
            await fetchData();
        } catch (err) {
            console.error('Failed to save consultation', err);
            let description = err.response?.data?.message || 'Failed to save consultation';
            if (description.includes('Consultation allowed only for BOOKED')) {
                description = "Cannot create consultation. The appointment must be in 'BOOKED' status.";
            }
            toast({ title: 'Error', description, variant: 'destructive' });
        } finally {
            setSavingConsultation(false);
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
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" onClick={() => navigate('/appointments')} icon={ArrowLeft}>
                            Back to List
                        </Button>
                        
                        {user?.role === 'ADMIN' && (
                            <Button 
                                variant="destructive" 
                                onClick={handleDelete} 
                                icon={Trash2}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Deleting...' : 'Delete'}
                            </Button>
                        )}

                        {user?.role === 'RECEPTIONIST' && appointment.status === 'Completed' && (
                            <Button 
                                className="bg-green-600 hover:bg-green-700 text-white" 
                                onClick={handleProcessPayment} 
                                icon={CreditCard}
                            >
                                Process Payment
                            </Button>
                        )}
                    </div>
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

            {/* Doctor: Create Consultation & Prescription */}
            {isDoctor && appointment && appointment.status !== 'CANCELLED' && appointment.status !== 'Cancelled' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Consultation & Prescription</h3>

                    {existingConsultation ? (
                        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-800">Consultation already recorded for this appointment</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">Diagnosis</span>
                                    <span className="font-medium text-gray-900">{existingConsultation.diagnosis || '-'}</span>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">Notes</span>
                                    <span className="text-gray-700">{existingConsultation.notes || '-'}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSaveConsultation} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                            {/* Diagnosis Section */}
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-orange-500" />
                                    Diagnosis Details
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Diagnosis <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="diagnosis"
                                            value={consultationForm.diagnosis}
                                            onChange={handleConsultationChange}
                                            placeholder="e.g. Common Cold, Hypertension"
                                            className={consultationErrors.diagnosis ? 'border-red-300 focus:ring-red-500' : ''}
                                        />
                                        {consultationErrors.diagnosis && <p className="mt-1 text-sm text-red-500">{consultationErrors.diagnosis}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <Textarea
                                            name="notes"
                                            value={consultationForm.notes}
                                            onChange={handleConsultationChange}
                                            rows={3}
                                            placeholder="Clinical notes, observations..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Prescription Section */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <Pill className="h-4 w-4 text-emerald-500" />
                                    Prescribe Medication
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                                    {prescriptionItems.map((item, index) => (
                                        <div key={index} className="flex gap-3 items-start">
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Medicine Name (e.g. Paracetamol)"
                                                    value={item.medicineName}
                                                    onChange={(e) => handlePrescriptionItemChange(index, 'medicineName', e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="w-1/4">
                                                <Input
                                                    placeholder="Dosage (e.g. 500mg)"
                                                    value={item.dosage}
                                                    onChange={(e) => handlePrescriptionItemChange(index, 'dosage', e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="w-1/4">
                                                <Input
                                                    placeholder="Duration (e.g. 3 days)"
                                                    value={item.duration}
                                                    onChange={(e) => handlePrescriptionItemChange(index, 'duration', e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removePrescriptionItem(index)}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md mt-0.5"
                                                disabled={prescriptionItems.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={addPrescriptionItem} icon={Plus}>
                                        Add Another Medicine
                                    </Button>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                <Button type="submit" disabled={savingConsultation} icon={savingConsultation ? undefined : Save}>
                                    {savingConsultation ? 'Saving...' : 'Save Consultation & Prescription'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Patient Medical History (Doctor View) */}
            {isDoctor && patient && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Patient Medical History</h3>
                    
                    {patientHistory.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                            <EmptyState 
                                title="No medical history" 
                                description="No medical records found for this patient." 
                                icon={FileText}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {patientHistory.map((record, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                                    <div className="flex flex-col gap-4">
                                        {/* Header: Date, Doctor, Status */}
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="h-4 w-4 text-blue-500" />
                                                <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    record.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    record.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {record.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <Stethoscope className="h-3 w-3" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">Dr. {record.doctorName}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            {/* Consultation Details */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                                    <Activity className="h-4 w-4 text-orange-500" />
                                                    <h4>Consultation</h4>
                                                </div>
                                                {record.consultation ? (
                                                    <div className="bg-orange-50/50 rounded-lg p-3 space-y-2 text-sm">
                                                        <div>
                                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Diagnosis</span>
                                                            <span className="font-medium text-gray-900">{record.consultation.diagnosis || 'No diagnosis recorded'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Notes</span>
                                                            <p className="text-gray-700 mt-1">{record.consultation.notes || 'No notes available'}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500 italic px-2">No consultation record found.</div>
                                                )}
                                            </div>

                                            {/* Prescription Details */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                                    <Pill className="h-4 w-4 text-emerald-500" />
                                                    <h4>Prescription</h4>
                                                </div>
                                                {record.prescription ? (
                                                    <div className="bg-emerald-50/50 rounded-lg p-3 space-y-3">
                                                        {record.prescription.prescriptionItems && record.prescription.prescriptionItems.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {record.prescription.prescriptionItems.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-start text-sm border-b border-emerald-100 last:border-0 pb-2 last:pb-0">
                                                                        <div>
                                                                            <span className="font-medium text-gray-900">{item.medicineName}</span>
                                                                            <div className="text-xs text-gray-500">{item.dosage} • {item.duration}</div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">No medicines listed.</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500 italic px-2">No prescription issued.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AppointmentDetailsPage;
