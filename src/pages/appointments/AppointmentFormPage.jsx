import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { bookAppointment, updateAppointment, getAppointmentById } from '../../api/appointments.api';
import { getAllPatients } from '../../api/patients.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getUser } from '../../auth/authStorage'; 
import { getAllSchedules } from '../../api/schedules.api'; 
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const AppointmentFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    // Default status changed to UPPERCASE 'BOOKED' to match Backend Enum (BOOKED, CANCELLED, COMPLETED)
    const [formData, setFormData] = useState({
        scheduleId: '',
        patientId: '',
        appointmentTime: '',
        status: 'BOOKED' 
    });
    
    const [patients, setPatients] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [doctors, setDoctors] = useState([]);

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
                appointmentTime: '',
                status: 'BOOKED'
            });
        }
    }, [initialLoading, isEditMode, id]);

    const loadDropdownData = async () => {
        try {
            const [patientsData, schedulesData, doctorsData] = await Promise.all([
                getAllPatients(),
                getAllSchedules().catch(() => []), 
                getAllDoctors().catch(() => [])
            ]);
            setPatients(patientsData || []);
            setSchedules(schedulesData || []);
            setDoctors(doctorsData || []);
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
                // Helper to safely parse date from Array or String
                const parseDate = (d) => {
                    if (!d) return '';
                    if (Array.isArray(d)) {
                         const [year, month, day, hour, minute, second = 0] = d;
                         // Month is 0-indexed in JS Date
                         // const date = new Date(year, month - 1, day, hour, minute, second);
                         // Handle timezone offset manually or just string format for input
                         const pad = (n) => String(n).padStart(2, '0');
                         return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
                    }
                    // If it's a string, try standard parsing
                     try {
                        return new Date(d).toISOString().slice(0, 16);
                     } catch (e) {
                        return '';
                     }
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

    const validate = () => {
        const newErrors = {};
        if (!formData.scheduleId) newErrors.scheduleId = 'Schedule is required';
        if (!formData.patientId) newErrors.patientId = 'Patient is required';
        if (!formData.appointmentTime) newErrors.appointmentTime = 'Date & Time is required';
        
        // Backend Validation: @Future check
        if (formData.appointmentTime) {
            const selectedDate = new Date(formData.appointmentTime);
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
            
            // Format Time properly: Appending ':00' to match standard LocalDatetime format if needed
            let formattedTime = formData.appointmentTime;
            if (formattedTime.length === 16) {
                formattedTime = `${formattedTime}:00`;
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
                setFormData({
                    scheduleId: '',
                    patientId: '',
                    appointmentTime: '',
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

    if (initialLoading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title={isEditMode ? 'Edit Appointment' : 'Book Appointment'} 
                description={isEditMode ? 'Update appointment details.' : 'Schedule a new appointment.'}
                actions={
                    <Button variant="ghost" onClick={() => navigate('/appointments')} icon={ArrowLeft}>
                        Back to List
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Patient <span className="text-red-500">*</span>
                            </label>
                            <Select
                                name="patientId"
                                value={formData.patientId}
                                onChange={handleChange}
                                className={errors.patientId ? 'border-red-300 focus:ring-red-500' : ''}
                            >
                                <option value="">Select Patient</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                                ))}
                            </Select>
                            {errors.patientId && <p className="mt-1 text-sm text-red-500">{errors.patientId}</p>}
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
                                {schedules.map(s => {
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

                                    const displayStr = formatDateTime(s.startDateTime);

                                    return (
                                        <option key={s.id} value={s.id}>
                                            #{s.id} - {doctorName} ({displayStr})
                                        </option>
                                    );
                                })}
                            </Select>
                             {schedules.length === 0 && <p className="text-xs text-gray-400 mt-1">No schedules found. Please create a schedule first.</p>}
                            {errors.scheduleId && <p className="mt-1 text-sm text-red-500">{errors.scheduleId}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date & Time <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="datetime-local"
                                    name="appointmentTime"
                                    value={formData.appointmentTime}
                                    onChange={handleChange}
                                    className={errors.appointmentTime ? 'border-red-300 focus:ring-red-500' : ''}
                                />
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
                                    <option value="COMPLETED">Completed</option>
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
        </div>
    );
};

export default AppointmentFormPage;