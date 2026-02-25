import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { bookAppointment, updateAppointment, getAppointmentById } from '../../api/appointments.api';
import { getAllPatients, createPatient, updatePatient } from '../../api/patients.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllClinics } from '../../api/clinics.api';
import { getUser } from '../../auth/authStorage';
import { getAllSchedules } from '../../api/schedules.api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import SearchableSelect from '../../components/SearchableSelect';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const AppointmentFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();
    const { user } = useAuth();
    const isPatient = user?.role === 'PATIENT';

    // Default status changed to UPPERCASE 'BOOKED' to match Backend Enum (BOOKED, CANCELLED, COMPLETED)
    const [formData, setFormData] = useState({
        scheduleId: '',
        patientId: '',
        appointmentTime: null,
        status: 'BOOKED'
    });

    // New Patient Modal State
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [newPatientData, setNewPatientData] = useState({
        name: '',
        nic: '',
        phone: '',
        email: '',
        dob: '',
        gender: 'MALE',
        clinics: [] // Add clinics for new patient
    });
    const [newPatientErrors, setNewPatientErrors] = useState({});
    const [creatingPatient, setCreatingPatient] = useState(false);
    const [emailNotificationSent, setEmailNotificationSent] = useState(false);

    const [patients, setPatients] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [clinics, setClinics] = useState([]); // Store fetched clinics

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadDropdownData();
    }, []);

    useEffect(() => {
        if (!initialLoading && isEditMode) {
            fetchAppointment();
        } else if (!initialLoading && !isEditMode) {
            setFormData({
                scheduleId: '',
                patientId: '',
                appointmentTime: null,
                status: 'BOOKED'
            });
        }
    }, [initialLoading, isEditMode, id]);

    const loadDropdownData = async () => {
        try {
            const [patientsData, schedulesData, doctorsData, clinicsData] = await Promise.all([
                getAllPatients(),
                getAllSchedules().catch(() => []),
                getAllDoctors().catch(() => []),
                getAllClinics().catch(() => [])
            ]);
            setPatients(patientsData || []);
            setSchedules(schedulesData || []);
            setDoctors(doctorsData || []);
            setClinics(clinicsData || []);

            // Auto-set patientId for logged-in patient
            if (isPatient && user && patientsData) {
                const currentPatient = patientsData.find(p =>
                    (p.userId && (String(p.userId) === String(user.id))) ||
                    (p.email && p.email === user.email) ||
                    (p.name && user.name && p.name.toLowerCase() === user.name.toLowerCase())
                );
                if (currentPatient) {
                    setFormData(prev => ({ ...prev, patientId: currentPatient.id }));
                }
            }
        } catch (error) {
            console.error("Failed to load dropdown data", error);
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchAppointment = async () => {
        try {
            const appointment = await getAppointmentById(id);

            if (appointment) {
                // 24-hour edit guard for patients based on schedule start time
                if (isPatient && appointment.scheduleId) {
                    const schedule = schedules.find(s => s.id === appointment.scheduleId);
                    const startData = schedule?.startDateTime;
                    let scheduleStart = null;
                    if (startData) {
                        if (Array.isArray(startData)) {
                            const [year, month, day, hour, minute, second = 0] = startData;
                            scheduleStart = new Date(year, month - 1, day, hour, minute, second);
                        } else {
                            scheduleStart = new Date(startData);
                        }
                    }
                    if (scheduleStart && !isNaN(scheduleStart.getTime())) {
                        const hoursUntilStart = (scheduleStart - new Date()) / (1000 * 60 * 60);
                        if (hoursUntilStart <= 24) {
                            toast({
                                title: 'Edit Unavailable',
                                description: 'The editing time for this appointment has expired. Appointments can only be edited up to 24 hours before the scheduled start time.',
                                variant: 'destructive'
                            });
                            navigate('/appointments');
                            return;
                        }
                    }
                }

                // Helper to safely parse date from Array or String
                const parseDate = (d) => {
                    if (!d) return null;
                    if (Array.isArray(d)) {
                        const [year, month, day, hour, minute, second = 0] = d;
                        return new Date(year, month - 1, day, hour, minute, second);
                    }
                    return new Date(d);
                };

                setFormData({
                    scheduleId: appointment.scheduleId || '',
                    patientId: appointment.patientId || '',
                    appointmentTime: parseDate(appointment.appointmentTime),
                    status: (appointment.status || 'BOOKED').toUpperCase()
                });
            } else {
                toast({ title: 'Error', description: 'Appointment not found', variant: 'destructive' });
                navigate('/appointments');
            }
        } catch (err) {
            console.error('Failed to fetch appointment', err);
            toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' });
            navigate('/appointments');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleDateChange = (name, date) => {
        setFormData(prev => ({ ...prev, [name]: date }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // New Patient Handlers
    const handleNewPatientChange = (e) => {
        const { name, value } = e.target;
        setNewPatientData(prev => ({ ...prev, [name]: value }));
        if (newPatientErrors[name]) {
            setNewPatientErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateNewPatient = () => {
        const errs = {};
        if (!newPatientData.name.trim()) errs.name = 'Name is required';
        if (!newPatientData.nic.trim()) errs.nic = 'NIC is required';
        if (!newPatientData.phone.trim()) errs.phone = 'Phone number is required';
        if (!newPatientData.dob) errs.dob = 'Date of birth is required';
        setNewPatientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmitNewPatient = async () => {
        if (!validateNewPatient()) return;

        try {
            setCreatingPatient(true);

            // Format data for backend
            // Only include email/dob if provided — backend @Valid rejects empty strings for these fields
            const { email: patientEmail, dob: patientDob, ...restPatientData } = newPatientData;
            const payload = {
                ...restPatientData,
                ...(patientEmail && patientEmail.trim() ? { email: patientEmail.trim() } : {}),
                ...(patientDob && patientDob.trim() ? { dob: patientDob.trim() } : {}),
                // Ensure clinics is mapped to object array required by backend
                clinics: newPatientData.clinics && newPatientData.clinics.length > 0
                    ? newPatientData.clinics.map(id => ({ id }))
                    : []
            };

            // 1. Create Patient (Backend now handles User creation automatically)
            await createPatient(payload);

            toast({ title: 'Success', description: 'Patient created successfully', variant: 'success' });

            // Refresh patient list
            const patientsList = await getAllPatients();
            setPatients(patientsList);

            // Select the new patient (Find by NIC to auto-select)
            const createdPatient = patientsList.find(p => p.nic === payload.nic);
            if (createdPatient) {
                setFormData(prev => ({ ...prev, patientId: createdPatient.id }));
            }

            // Reset and close
            setNewPatientData({ name: '', nic: '', phone: '', email: '', dob: '', gender: 'MALE', clinics: [] });
            setIsPatientModalOpen(false);
        } catch (err) {
            console.error('Failed to create patient', err);
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to create patient',
                variant: 'destructive'
            });
        } finally {
            setCreatingPatient(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.scheduleId) newErrors.scheduleId = 'Schedule is required';
        if (!formData.patientId) newErrors.patientId = 'Patient is required';
        if (!formData.appointmentTime) newErrors.appointmentTime = 'Date & Time is required';

        // Backend Validation: @Future check
        if (formData.appointmentTime) {
            const selectedDate = formData.appointmentTime;
            const now = new Date();
            if (selectedDate <= now) {
                newErrors.appointmentTime = 'Appointment time must be in the future';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);

            // Format Time properly: Appending ':00' to match standard LocalDatetime format
            const formatTime = (date) => {
                if (!date) return null;
                const pad = (n) => String(n).padStart(2, '0');
                return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
            }

            const formattedTime = formatTime(formData.appointmentTime);
            if (!formattedTime) {
                toast({ title: 'Error', description: 'Invalid date selected', variant: 'destructive' });
                setLoading(false);
                return;
            }

            const payload = {
                // Sending ID directly as DTO expects "private Long scheduleId;"
                scheduleId: parseInt(formData.scheduleId),
                patientId: parseInt(formData.patientId),
                appointmentTime: formattedTime,
                status: formData.status ? formData.status.toUpperCase() : 'BOOKED'
            };

            // Note: DTO doesn't have an ID field in RequestBody usually, but if needed for update
            if (isEditMode) {
                payload.id = parseInt(id);
                await updateAppointment(id, payload);
                toast({ title: 'Success', description: 'Appointment updated successfully', variant: 'success' });
                navigate('/appointments');
            } else {
                await bookAppointment(payload);
                toast({ title: 'Success', description: 'Appointment booked successfully', variant: 'success' });
                setEmailNotificationSent(true);
                setFormData({
                    scheduleId: '',
                    patientId: '',
                    appointmentTime: null,
                    status: 'BOOKED'
                });
                setErrors({});
            }
        } catch (err) {
            console.error('Failed to save appointment', err);

            let description = err.response?.data?.message || 'Failed to save appointment';
            const user = getUser();

            if (err.response?.status === 403) {
                description = `Access Denied (403). Your role: ${user?.role || 'Unknown'}. Check backend permissions.`;
            }

            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                const validationMessages = err.response.data.errors
                    .map(e => e.defaultMessage || e.message)
                    .filter(Boolean);
                if (validationMessages.length > 0) {
                    description = validationMessages.join(', ');
                }
            }

            toast({
                title: 'Error',
                description: description,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const activeSchedules = schedules.filter(s => {
        // If editing and this schedule is selected, keep it visible
        if (isEditMode && String(s.id) === String(formData.scheduleId)) return true;

        let endDate;
        if (Array.isArray(s.endDateTime)) {
            const [year, month, day, hour, minute] = s.endDateTime;
            endDate = new Date(year, month - 1, day, hour, minute);
        } else {
            endDate = new Date(s.endDateTime);
        }

        // Return true if schedule ends in the future
        return endDate > new Date();
    });

    if (initialLoading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title={isEditMode ? 'Edit Appointment' : 'Book Appointment'}
                description={isEditMode ? 'Update appointment details.' : 'Schedule a new appointment.'}
                actions={
                    <Button
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => navigate('/appointments')}
                        icon={ArrowLeft}
                    >
                        Back to List
                    </Button>
                }
            />

            {/* Email Notification Confirmation Banner */}
            {emailNotificationSent && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <div>
                        <p className="font-medium">Email notifications sent!</p>
                        <p className="text-green-700 mt-0.5">A confirmation email was dispatched to the patient, and the doctor was notified of the new appointment.</p>
                    </div>
                    <button onClick={() => setEmailNotificationSent(false)} className="ml-auto text-green-600 hover:text-green-800 shrink-0" title="Dismiss">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Patient <span className="text-red-500">*</span>
                            </label>
                            {isPatient ? (
                                <div className="flex h-10 w-full items-center rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                    {(() => {
                                        const p = patients.find(pt => pt.id === formData.patientId);
                                        return p ? `${p.name} (${p.phone})` : 'Loading...';
                                    })()}
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <SearchableSelect
                                                name="patientId"
                                                value={formData.patientId}
                                                onChange={handleChange}
                                                placeholder="Select Patient..."
                                                className={errors.patientId ? 'border-red-300 focus:ring-red-500' : ''}
                                                options={patients.map(p => ({
                                                    value: p.id,
                                                    label: `${p.id} - ${p.name} (${p.phone})`
                                                }))}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => setIsPatientModalOpen(true)}
                                            icon={Plus}
                                            variant="outline"
                                            className="shrink-0"
                                        >
                                            New Patient
                                        </Button>
                                    </div>
                                    {errors.patientId && <p className="mt-1 text-sm text-red-500">{errors.patientId}</p>}
                                </>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Schedule/Doctor <span className="text-red-500">*</span>
                            </label>
                            <Select
                                name="scheduleId"
                                value={formData.scheduleId}
                                onChange={handleChange}
                                className={errors.scheduleId ? 'border-red-300 focus:ring-red-500' : ''}
                            >
                                <option value="">Select Schedule</option>
                                {activeSchedules.map(s => {
                                    const doctor = doctors.find(d => d.id === s.doctorId);
                                    const doctorName = doctor ? doctor.name : `Doctor ID: ${s.doctorId || 'N/A'}`;

                                    // Helper to format date consistent with backend response
                                    const formatDateTime = (dt) => {
                                        if (!dt) return '';
                                        let dateObj;
                                        // Handle array format [yyyy, mm, dd, hh, mm]
                                        if (Array.isArray(dt)) {
                                            const [year, month, day, hour, minute] = dt;
                                            dateObj = new Date(year, month - 1, day, hour, minute);
                                        } else {
                                            dateObj = new Date(dt);
                                        }

                                        if (isNaN(dateObj.getTime())) return '';

                                        return dateObj.toLocaleString([], {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    };

                                    const startStr = formatDateTime(s.startDateTime);
                                    const endStr = formatDateTime(s.endDateTime);
                                    const displayStr = endStr ? `${startStr} - ${endStr}` : startStr;

                                    return (
                                        <option key={s.id} value={s.id}>
                                            #{s.id} - {doctorName} ({displayStr})
                                        </option>
                                    );
                                })}
                            </Select>
                            {activeSchedules.length === 0 && <p className="text-xs text-gray-400 mt-1">No active schedules found.</p>}
                            {errors.scheduleId && <p className="mt-1 text-sm text-red-500">{errors.scheduleId}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date & Time <span className="text-red-500">*</span>
                                </label>
                                <div className="w-full">
                                    <DatePicker
                                        selected={formData.appointmentTime}
                                        onChange={(date) => handleDateChange('appointmentTime', date)}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={15}
                                        dateFormat="yyyy-MM-dd HH:mm"
                                        className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${errors.appointmentTime ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        placeholderText="Select date & time"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                                {errors.appointmentTime && <p className="mt-1 text-sm text-red-500">{errors.appointmentTime}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    {/* Updated to match Backend Enums: [BOOKED, CANCELLED, COMPLETED] */}
                                    <option value="BOOKED">Booked</option>
                                    <option
                                        value="COMPLETED"
                                        disabled={formData.appointmentTime && new Date(formData.appointmentTime) > new Date()}
                                        title={formData.appointmentTime && new Date(formData.appointmentTime) > new Date() ? "Cannot complete future appointments" : ""}
                                    >
                                        Completed
                                    </option>
                                    <option value="CANCELLED">Cancelled</option>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate('/appointments')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            icon={loading ? undefined : Save}
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Appointment' : 'Book Appointment')}
                        </Button>
                    </div>
                </form>
            </div>

            {/* New Patient Modal */}
            {isPatientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-visible ring-1 ring-black ring-opacity-5">
                        <div className="p-6 border-b border-gray-100 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-gray-900">Add New Patient</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="name"
                                    value={newPatientData.name}
                                    onChange={handleNewPatientChange}
                                    className={newPatientErrors.name ? 'border-red-300 focus:ring-red-500' : ''}
                                    placeholder="e.g. John Doe"
                                />
                                {newPatientErrors.name && <p className="mt-1 text-sm text-red-500">{newPatientErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        NIC <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        name="nic"
                                        value={newPatientData.nic}
                                        onChange={handleNewPatientChange}
                                        className={newPatientErrors.nic ? 'border-red-300 focus:ring-red-500' : ''}
                                        placeholder="National ID"
                                    />
                                    {newPatientErrors.nic && <p className="mt-1 text-sm text-red-500">{newPatientErrors.nic}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        name="phone"
                                        value={newPatientData.phone}
                                        onChange={handleNewPatientChange}
                                        className={newPatientErrors.phone ? 'border-red-300 focus:ring-red-500' : ''}
                                        placeholder="Mobile Number"
                                    />
                                    {newPatientErrors.phone && <p className="mt-1 text-sm text-red-500">{newPatientErrors.phone}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                    <span className="ml-1 text-xs text-gray-400">(for email notifications)</span>
                                </label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={newPatientData.email}
                                    onChange={handleNewPatientChange}
                                    placeholder="e.g. patient@example.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Birth <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        name="dob"
                                        value={newPatientData.dob}
                                        onChange={handleNewPatientChange}
                                        className={newPatientErrors.dob ? 'border-red-300 focus:ring-red-500' : ''}
                                    />
                                    {newPatientErrors.dob && <p className="mt-1 text-sm text-red-500">{newPatientErrors.dob}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gender
                                    </label>
                                    <Select
                                        name="gender"
                                        value={newPatientData.gender}
                                        onChange={handleNewPatientChange}
                                    >
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign Clinics
                                </label>
                                <SearchableSelect
                                    name="clinics"
                                    value={newPatientData.clinics || []}
                                    onChange={handleNewPatientChange}
                                    options={clinics.map(c => ({
                                        value: c.id,
                                        label: c.name
                                    }))}
                                    placeholder="Select clinics..."
                                    multiple
                                    direction="up"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Select the clinics this patient is associated with.
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-2 rounded-b-xl">
                            <Button
                                onClick={handleSubmitNewPatient}
                                disabled={creatingPatient}
                                icon={creatingPatient ? Spinner : undefined}
                            >
                                {creatingPatient ? 'Creating...' : 'Create Patient'}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsPatientModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentFormPage;