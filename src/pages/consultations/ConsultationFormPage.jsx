import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createConsultation, updateConsultation, getConsultationById, getAllConsultations } from '../../api/consultations.api';
import { getAllAppointments } from '../../api/appointments.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const ConsultationFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        appointmentId: '',
        diagnosis: '',
        notes: ''
    });
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const appointmentsData = await getAllAppointments();
            setAppointments(appointmentsData || []);

            if (isEditMode) {
                const consultation = await getConsultationById(id);
                if (consultation) {
                    setFormData({
                        appointmentId: consultation.appointmentId || '',
                        diagnosis: consultation.diagnosis || '',
                        notes: consultation.notes || ''
                    });
                }
            }
        } catch (error) {
            console.error("Failed to load data", error);
            toast({
                title: 'Error',
                description: 'Failed to load data',
                variant: 'destructive'
            });
        } finally {
            setInitialLoading(false);
        }
    };

    const validate = () => {
        const tempErrors = {};
        if (!formData.appointmentId) tempErrors.appointmentId = 'Appointment is required';
        if (!formData.diagnosis) tempErrors.diagnosis = 'Diagnosis is required';
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            if (isEditMode) {
                await updateConsultation(id, formData);
                toast({ title: 'Success', description: 'Consultation updated successfully', variant: 'success' });
            } else {
                await createConsultation(formData);
                toast({ title: 'Success', description: 'Consultation created successfully', variant: 'success' });
            }
            navigate('/consultations');
        } catch (error) {
            console.error('Failed to save consultation', error);
            toast({
                title: 'Error',
                description: 'Failed to save consultation',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatAppointmentLabel = (appt) => {
        let dateStr = 'Unknown Date';
        if (appt.appointmentTime) {
             if (Array.isArray(appt.appointmentTime)) {
                const [y, m, d, h, min] = appt.appointmentTime;
                dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
             } else {
                dateStr = new Date(appt.appointmentTime).toLocaleString();
             }
        }
        return `Appt #${appt.id} - ${dateStr}`;
    };

    if (initialLoading) return <Spinner />;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-blue-600" onClick={() => navigate('/consultations')}>
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Consultations
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Consultation' : 'New Consultation'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <Select
                    label="Appointment"
                    name="appointmentId"
                    value={formData.appointmentId}
                    onChange={handleChange}
                    error={errors.appointmentId}
                    options={appointments.map(appt => ({
                        value: appt.id,
                        label: formatAppointmentLabel(appt)
                    }))}
                    placeholder="Select Appointment"
                />

                <Textarea
                    label="Diagnosis"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    error={errors.diagnosis}
                    placeholder="Enter diagnosis details..."
                    rows={3}
                />

                <Textarea
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    error={errors.notes}
                    placeholder="Enter additional notes..."
                    rows={5}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={() => navigate('/consultations')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Spinner size="sm" className="mr-2" />}
                        <Save size={18} className="mr-2" />
                        Save Consultation
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ConsultationFormPage;
