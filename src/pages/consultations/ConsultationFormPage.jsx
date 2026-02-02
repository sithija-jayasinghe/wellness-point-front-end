import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createConsultation, updateConsultation, getConsultationById } from '../../api/consultations.api';
import { getAllAppointments } from '../../api/appointments.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
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
    }, [id]);

    const loadData = async () => {
        try {
            setInitialLoading(true);
            const appointmentsData = await getAllAppointments();
            
            // Filter appointments. 
            // In creation mode, only show BOOKED appointments because the backend rule: "Consultation allowed only for BOOKED appointments"
            // In edit mode, we might need to see the linked appointment even if it's now COMPLETED (because saving it changed it to COMPLETED)
            let relevantAppointments = appointmentsData;
            
            if (!isEditMode) {
                relevantAppointments = appointmentsData.filter(apt => apt.status === 'BOOKED');
            }
            
            setAppointments(relevantAppointments);

            if (isEditMode) {
                const consultation = await getConsultationById(id);
                if (consultation) {
                    setFormData({
                        appointmentId: consultation.appointmentId || '',
                        diagnosis: consultation.diagnosis || '',
                        notes: consultation.notes || ''
                    });
                } else {
                    toast({ title: 'Error', description: 'Consultation not found', variant: 'destructive' });
                    navigate('/consultations');
                }
            }
        } catch (error) {
            console.error("Failed to load data", error);
            toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' });
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
        if (!formData.appointmentId) newErrors.appointmentId = 'Appointment is required';
        if (!formData.diagnosis) newErrors.diagnosis = 'Diagnosis is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const payload = {
                ...formData,
                appointmentId: parseInt(formData.appointmentId)
            };

            if (isEditMode) {
                await updateConsultation(id, payload);
                toast({ title: 'Success', description: 'Consultation updated successfully', variant: 'success' });
            } else {
                await createConsultation(payload);
                toast({ title: 'Success', description: 'Consultation saved successfully', variant: 'success' });
            }
            navigate('/consultations');
        } catch (err) {
            console.error('Failed to save consultation', err);
            
            let description = err.response?.data?.message || 'Failed to save consultation';
            
            if (err.response?.data?.message?.includes("Consultation allowed only for BOOKED")) {
                 description = "Cannot create consultation. The appointment must be in 'BOOKED' status.";
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
                title={isEditMode ? 'Edit Consultation' : 'New Consultation'} 
                description={isEditMode ? 'Update consultation details.' : 'Record a new diagnosis for an appointment.'}
                actions={
                    <Button variant="ghost" onClick={() => navigate('/consultations')} icon={ArrowLeft}>
                        Back to List
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnosis Details</h3>
                        <div className="grid grid-cols-1 gap-6">
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Appointment <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    name="appointmentId"
                                    value={formData.appointmentId}
                                    onChange={handleChange}
                                    className={errors.appointmentId ? 'border-red-300 focus:ring-red-500' : ''}
                                    disabled={isEditMode} // Usually shouldn't change appointment in edit mode for consultation logic
                                >
                                    <option value="">Select Appointment</option>
                                    {appointments.map(apt => {
                                        // format: #ID - Date - Status
                                        let dateDisplay = 'N/A';
                                        if (apt.appointmentTime) {
                                             if (Array.isArray(apt.appointmentTime)) {
                                                  const [y, m, d, h, min] = apt.appointmentTime;
                                                  dateDisplay = `${y}-${m}-${d} ${h}:${min}`;
                                             } else {
                                                  dateDisplay = new Date(apt.appointmentTime).toLocaleString();
                                             }
                                        }

                                        return (
                                            <option key={apt.id} value={apt.id}>
                                                #{apt.id} - {dateDisplay} ({apt.status})
                                            </option>
                                        );
                                    })}
                                </Select>
                                {isEditMode && <p className="text-xs text-gray-400 mt-1">Appointment cannot be changed during editing.</p>}
                                {!isEditMode && appointments.length === 0 && (
                                     <p className="text-xs text-orange-500 mt-1">No 'BOOKED' appointments available for consultation.</p>
                                )}
                                {errors.appointmentId && <p className="mt-1 text-sm text-red-500">{errors.appointmentId}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Diagnosis <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="diagnosis"
                                    value={formData.diagnosis}
                                    onChange={handleChange}
                                    placeholder="e.g. Common Cold, Hypertension"
                                    className={errors.diagnosis ? 'border-red-300 focus:ring-red-500' : ''}
                                />
                                {errors.diagnosis && <p className="mt-1 text-sm text-red-500">{errors.diagnosis}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <Textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Clinical notes, observations, prescription details..."
                                />
                            </div>

                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => navigate('/consultations')}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            icon={loading ? undefined : Save}
                        >
                            {loading ? 'Saving...' : 'Save Consultation'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConsultationFormPage;
