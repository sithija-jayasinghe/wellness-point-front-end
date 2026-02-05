import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createPatient, updatePatient, getAllPatients } from '../../api/patients.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const PatientFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    // In edit mode if id is present
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        nic: '',
        phone: '',
        dob: '',
        gender: 'MALE',
        userId: '' // Assuming userId is optional or handled by backend if new
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode) {
            fetchPatient();
        } else {
            // Reset form when switching to create mode
             setFormData({
                name: '',
                nic: '',
                phone: '',
                dob: '',
                gender: 'MALE',
                userId: ''
            });
            setErrors({});
            setInitialLoading(false);
        }
    }, [isEditMode, id]);

    const fetchPatient = async () => {
        try {
            // Fetch all and find, assuming no getById endpoint
            const patients = await getAllPatients();

            if (!Array.isArray(patients)) {
                throw new Error('Invalid response from server');
            }

            const patient = patients.find(p => p.id === parseInt(id) || p.id === id);
            
            if (patient) {
                let formattedDob = '';
                if (patient.dob) {
                    if (typeof patient.dob === 'string') {
                        formattedDob = patient.dob.split('T')[0];
                    } else if (patient.dob instanceof Date) {
                        formattedDob = patient.dob.toISOString().split('T')[0];
                    }
                }

                setFormData({
                    name: patient.name || '',
                    nic: patient.nic || '',
                    phone: patient.phone || '',
                    dob: formattedDob,
                    gender: patient.gender || 'MALE',
                    userId: patient.userId || ''
                });
            } else {
                toast({
                    title: 'Error',
                    description: 'Patient not found',
                    variant: 'destructive'
                });
                navigate('/patients');
            }
        } catch (err) {
            console.error('Failed to fetch patient details', err);
            toast({
                title: 'Error',
                description: 'Failed to load patient details',
                variant: 'destructive'
            });
            navigate('/patients');
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
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.nic.trim()) newErrors.nic = 'NIC is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.dob) newErrors.dob = 'Date of birth is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) return;

        try {
            setLoading(true);
            if (isEditMode) {
                await updatePatient(id, formData);
                toast({
                    title: 'Success',
                    description: 'Patient updated successfully',
                    variant: 'success'
                });
                navigate('/patients');
            } else {
                await createPatient(formData);
                toast({
                    title: 'Success',
                    description: 'Patient registered successfully',
                    variant: 'success'
                });
                // Clear form to allow adding another entry
                setFormData({
                    name: '',
                    nic: '',
                    phone: '',
                    dob: '',
                    gender: 'MALE',
                    userId: ''
                });
                setErrors({});
            }
        } catch (err) {
            console.error('Failed to save patient', err);
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to save patient. Please try again.',
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
                title={isEditMode ? 'Edit Patient' : 'Register Patient'} 
                description={isEditMode ? 'Update patient details.' : 'Register a new patient.'}
                actions={
                    <Button 
                        variant="outline" 
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" 
                        onClick={() => navigate('/patients')} 
                        icon={ArrowLeft}
                    >
                        Back to List
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                className={errors.name ? 'border-red-300 focus:ring-red-500' : ''}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    NIC <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="nic"
                                    value={formData.nic}
                                    onChange={handleChange}
                                    placeholder="National ID"
                                    className={errors.nic ? 'border-red-300 focus:ring-red-500' : ''}
                                />
                                {errors.nic && <p className="mt-1 text-sm text-red-500">{errors.nic}</p>}
                            </div>

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
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className={errors.dob ? 'border-red-300 focus:ring-red-500' : ''}
                                />
                                {errors.dob && <p className="mt-1 text-sm text-red-500">{errors.dob}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gender
                                </label>
                                <Select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => navigate('/patients')}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            icon={loading ? undefined : Save}
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Patient' : 'Register Patient')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PatientFormPage;
