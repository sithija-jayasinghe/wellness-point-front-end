import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createClinic, updateClinic, getAllClinics } from '../../api/clinics.api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const ClinicFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        status: 'Active'
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchClinic = async () => {
            try {
                const clinics = await getAllClinics();
                const clinic = clinics.find(c => c.id === parseInt(id) || c.id === id);

                if (clinic) {
                    setFormData({
                        name: clinic.name || '',
                        address: clinic.address || '',
                        phone: clinic.phone || '',
                        status: clinic.status || 'Active'
                    });
                } else {
                    toast({
                        title: 'Error',
                        description: 'Clinic not found',
                        variant: 'destructive'
                    });
                    navigate('/clinics');
                }
            } catch (err) {
                console.error('Failed to fetch clinic details', err);
                toast({
                    title: 'Error',
                    description: 'Failed to load clinic details',
                    variant: 'destructive'
                });
                navigate('/clinics');
            } finally {
                setInitialLoading(false);
            }
        };

        if (isEditMode) {
            fetchClinic();
        } else {
            setInitialLoading(false);
        }
    }, [isEditMode, id, navigate, toast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Clinic name is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);
            if (isEditMode) {
                await updateClinic(id, formData);
                toast({
                    title: 'Success',
                    description: 'Clinic updated successfully',
                    variant: 'success'
                });
            } else {
                await createClinic(formData);
                toast({
                    title: 'Success',
                    description: 'Clinic created successfully',
                    variant: 'success'
                });
            }
            navigate('/clinics');
        } catch (err) {
            console.error('Failed to save clinic', err);
            toast({
                title: 'Error',
                description: 'Failed to save clinic. Please try again.',
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
                    onClick={() => navigate('/clinics')}
                >
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Clinic' : 'Add New Clinic'}
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Clinic Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="e.g. City Health Center"
                        required
                    />

                    <Input
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        error={errors.address}
                        placeholder="e.g. 123 Main St, New York, NY"
                        required
                    />

                    <Input
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        error={errors.phone}
                        placeholder="e.g. +1 (555) 123-4567"
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
                            isLoading={loading}
                            disabled={loading}
                        >
                            {isEditMode ? 'Update Clinic' : 'Create Clinic'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default ClinicFormPage;