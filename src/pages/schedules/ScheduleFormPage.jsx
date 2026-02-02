import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createSchedule, updateSchedule, getAllSchedules } from '../../api/schedules.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllClinics } from '../../api/clinics.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const ScheduleFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        doctorId: '',
        clinicId: '',
        startDateTime: '',
        endDateTime: '',
        maxPatients: ''
    });
    const [doctors, setDoctors] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            setInitialLoading(true);
            const [doctorsData, clinicsData, schedulesData] = await Promise.all([
                getAllDoctors(),
                getAllClinics(),
                isEditMode ? getAllSchedules() : Promise.resolve([])
            ]);
            
            setDoctors(doctorsData);
            setClinics(clinicsData);

            if (isEditMode) {
                if (!Array.isArray(schedulesData)) {
                    throw new Error('Invalid response from server');
                }
                
                const schedule = schedulesData.find(s => s.id === parseInt(id) || s.id === id);
                
                if (schedule) {
                    const parseDate = (d) => {
                        if (!d) return '';
                        let dateObj;
                        if (Array.isArray(d)) {
                            const [year, month, day, hour, minute, second = 0] = d;
                            dateObj = new Date(year, month - 1, day, hour, minute, second);
                        } else {
                            dateObj = new Date(d);
                        }
                        
                        // Handle timezone offset to ensures it shows correct local time in input
                        // datetime-local expects YYYY-MM-DDThh:mm
                        const pad = (num) => String(num).padStart(2, '0');
                        return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
                    }

                    setFormData({
                        doctorId: schedule.doctorId || '',
                        clinicId: schedule.clinicId || '',
                        startDateTime: parseDate(schedule.startDateTime),
                        endDateTime: parseDate(schedule.endDateTime),
                        maxPatients: schedule.maxPatients || ''
                    });
                } else {
                    toast({
                        title: 'Error',
                        description: 'Schedule not found',
                        variant: 'destructive'
                    });
                    navigate('/schedules');
                }
            } else {
                // Auto-select first doctor and clinic if they exist (Alternative to placeholder)
                setFormData(prev => ({
                    ...prev,
                    doctorId: doctorsData.length > 0 ? doctorsData[0].id : '',
                    clinicId: clinicsData.length > 0 ? clinicsData[0].id : ''
                }));
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
            toast({
                title: 'Error',
                description: 'Failed to load data',
                variant: 'destructive'
            });
            if (isEditMode) navigate('/schedules');
        } finally {
            setInitialLoading(false);
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
        if (!formData.doctorId) newErrors.doctorId = 'Doctor is required';
        if (!formData.clinicId) newErrors.clinicId = 'Clinic is required';
        if (!formData.startDateTime) newErrors.startDateTime = 'Start time is required';
        if (!formData.endDateTime) newErrors.endDateTime = 'End time is required';
        if (!formData.maxPatients) newErrors.maxPatients = 'Max patients is required';
        else if (parseInt(formData.maxPatients) <= 0) newErrors.maxPatients = 'Max patients must be greater than 0';
        
        if (formData.startDateTime && formData.endDateTime) {
            if (new Date(formData.startDateTime) >= new Date(formData.endDateTime)) {
                newErrors.endDateTime = 'End time must be after start time';
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
            
            // Format datetime for LocalDateTime (Java) - Send as "YYYY-MM-DDTHH:mm:ss"
            // We append ':00' to the datetime-local value (which is YYYY-MM-DDTHH:mm)
            const formatForLocalDateTime = (dateStr) => {
                if (!dateStr) return null;
                return dateStr.length === 16 ? `${dateStr}:00` : dateStr;
            };

            const dataToSubmit = {
                clinicId: parseInt(formData.clinicId),
                doctorId: parseInt(formData.doctorId),
                maxPatients: parseInt(formData.maxPatients),
                startDateTime: formatForLocalDateTime(formData.startDateTime),
                endDateTime: formatForLocalDateTime(formData.endDateTime)
            };
            
            if (isEditMode) {
                await updateSchedule(id, dataToSubmit);
                toast({
                    title: 'Success',
                    description: 'Schedule updated successfully',
                    variant: 'success'
                });
            } else {
                await createSchedule(dataToSubmit);
                toast({
                    title: 'Success',
                    description: 'Schedule created successfully',
                    variant: 'success'
                });
            }
            navigate('/schedules');
        } catch (err) {
            console.error('Failed to save schedule', err);
            
            let errorMessage = err.response?.data?.message || (isEditMode ? 'Failed to update schedule' : 'Failed to create schedule');

            // Handle Field Validation Errors (e.g. Spring Boot)
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                // If errors is list of objects with defaultMessage
                const validationMessages = err.response.data.errors
                    .map(e => e.defaultMessage || e.message)
                    .filter(Boolean);
                
                if (validationMessages.length > 0) {
                     errorMessage = validationMessages.join(', ');
                }
            }
            
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <Spinner fullScreen />;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/schedules')}>
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Schedule' : 'New Schedule'}
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative z-10 overflow-visible">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Doctor <span className="text-red-500">*</span>
                            </label>
                            <Select
                                name="doctorId"
                                value={formData.doctorId}
                                onChange={handleChange}
                                className={errors.doctorId ? 'border-red-300 focus:ring-red-500' : ''}
                                required
                            >
                                <option value="">Select Doctor</option>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </Select>
                            {errors.doctorId && <p className="mt-1 text-sm text-red-500">{errors.doctorId}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Clinic <span className="text-red-500">*</span>
                            </label>
                            <Select
                                name="clinicId"
                                value={formData.clinicId}
                                onChange={handleChange}
                                className={errors.clinicId ? 'border-red-300 focus:ring-red-500' : ''}
                                required
                            >
                                <option value="">Select Clinic</option>
                                {clinics.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </Select>
                             {errors.clinicId && <p className="mt-1 text-sm text-red-500">{errors.clinicId}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date & Time <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="datetime-local"
                                name="startDateTime"
                                value={formData.startDateTime}
                                onChange={handleChange}
                                className={errors.startDateTime ? 'border-red-300 focus:ring-red-500' : ''}
                                required
                            />
                            {errors.startDateTime && <p className="mt-1 text-sm text-red-500">{errors.startDateTime}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date & Time <span className="text-red-500">*</span>
                            </label>
                             <Input
                                type="datetime-local"
                                name="endDateTime"
                                value={formData.endDateTime}
                                onChange={handleChange}
                                className={errors.endDateTime ? 'border-red-300 focus:ring-red-500' : ''}
                                required
                            />
                            {errors.endDateTime && <p className="mt-1 text-sm text-red-500">{errors.endDateTime}</p>}
                        </div>

                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Patients <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                name="maxPatients"
                                value={formData.maxPatients}
                                onChange={handleChange}
                                className={errors.maxPatients ? 'border-red-300 focus:ring-red-500' : ''}
                                placeholder="e.g. 20"
                                min="1"
                                required
                            />
                             {errors.maxPatients && <p className="mt-1 text-sm text-red-500">{errors.maxPatients}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/schedules')}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            icon={Save}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Schedule'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleFormPage;