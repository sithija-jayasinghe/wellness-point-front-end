import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createClinic, updateClinic, getAllClinics } from '../../api/clinics.api';
import PageHeader from '../../components/PageHeader';
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
        if (isEditMode) {
            fetchClinic();
        } else {
            // Reset form when switching to create mode
            setFormData({
                name: '',
                address: '',
                phone: '',
                status: 'Active'
            });
            setErrors({});
            setInitialLoading(false);
        }
    }, [isEditMode, id]);

    const fetchClinic = async () => {
        try {
            // Since we don't have a getById endpoint in the requirements, 
            // we'll fetch all and find the one we need.
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Clinic name is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) return;

        try {
            setLoading(true);
            if (isEditMode) {
                await updateClinic(id, formData);
                toast({
                    title: 'Success',
                    description: 'Clinic updated successfully',
                    variant: 'success'
                });
                navigate('/clinics');
            } else {
                await createClinic(formData);
                toast({
                    title: 'Success',
                    description: 'Clinic created successfully',
                    variant: 'success'
                });
                // Clear form to allow adding another entry
                setFormData({
                    name: '',
                    address: '',
                    phone: '',
                    status: 'Active'
                });
                setErrors({});
            }
        } catch (err) {
            console.error('Failed to save clinic', err);
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to save clinic. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title={isEditMode ? 'Edit Clinic' : 'Add New Clinic'} 
                description={isEditMode ? 'Update clinic details.' : 'Create a new clinic location.'}
                actions={
                    <Button variant="ghost" onClick={() => navigate('/clinics')} icon={ArrowLeft}>
                        Back to List
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Clinic Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Wellness Point Central"
                                className={errors.name ? 'border-red-300 focus:ring-red-500' : ''}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Full address"
                                className={errors.address ? 'border-red-300 focus:ring-red-500' : ''}
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="e.g. +1 234 567 890"
                                    className={errors.phone ? 'border-red-300 focus:ring-red-500' : ''}
                                />
                                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
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
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Maintenance">Maintenance</option>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => navigate('/clinics')}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            icon={loading ? undefined : Save}
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Clinic' : 'Create Clinic')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClinicFormPage;
