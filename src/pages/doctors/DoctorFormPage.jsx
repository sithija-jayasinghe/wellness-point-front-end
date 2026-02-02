import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createDoctor, updateDoctor, getAllDoctors } from '../../api/doctors.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const DoctorFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        specialization: '',
        consultationFee: '',
        status: 'Active'
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode) {
            fetchDoctor();
        } else {
            setInitialLoading(false);
        }
    }, [isEditMode, id]);

    const fetchDoctor = async () => {
        try {
            const doctors = await getAllDoctors();
            const doctor = doctors.find(d => d.id === parseInt(id) || d.id === id);
            
            if (doctor) {
                setFormData({
                    name: doctor.name || '',
                    specialization: doctor.specialization || '',
                    consultationFee: doctor.consultationFee || '',
                    status: doctor.status || 'Active'
                });
            } else {
                toast({
                    title: 'Error',
                    description: 'Doctor not found',
                    variant: 'destructive'
                });
                navigate('/doctors');
            }
        } catch (err) {
            console.error('Failed to fetch doctor details', err);
            toast({
                title: 'Error',
                description: 'Failed to load doctor details',
                variant: 'destructive'
            });
            navigate('/doctors');
        } finally {
            setInitialLoading(false);
        }
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

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
        if (!formData.consultationFee) newErrors.consultationFee = 'Consultation fee is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        try {
            setLoading(true);
            const dataToSubmit = {
                ...formData,
                consultationFee: Number(formData.consultationFee)
            };

            if (isEditMode) {
                await updateDoctor(id, dataToSubmit);
                toast({
                    title: 'Success',
                    description: 'Doctor updated successfully',
                    variant: 'success'
                });
            } else {
                await createDoctor(dataToSubmit);
                toast({
                    title: 'Success',
                    description: 'Doctor created successfully',
                    variant: 'success'
                });
            }
            navigate('/doctors');
        } catch (err) {
            console.error('Failed to save doctor', err);
            toast({
                title: 'Error',
                description: 'Failed to save doctor. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <Spinner fullScreen />;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button 
                    variant="ghost" 
                    icon={ArrowLeft} 
                    onClick={() => navigate('/doctors')}
                >
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Doctor' : 'New Doctor'}
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Doctor Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="e.g. Dr. John Doe"
                        required
                    />

                    <Input
                        label="Specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        error={errors.specialization}
                        placeholder="e.g. Cardiology"
                        required
                    />

                    <Input
                        label="Consultation Fee"
                        name="consultationFee"
                        type="number"
                        value={formData.consultationFee}
                        onChange={handleChange}
                        error={errors.consultationFee}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                    />

                    <Select
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={[
                            { value: 'Active', label: 'Active' },
                            { value: 'Inactive', label: 'Inactive' }
                        ]}
                    />

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            icon={Save}
                            loading={loading}
                            disabled={loading}
                        >
                            {isEditMode ? 'Update Doctor' : 'Create Doctor'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoctorFormPage;
