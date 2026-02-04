import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { registerUser, updateUser, getAllUsers } from '../../api/users.api';
import { createDoctor } from '../../api/doctors.api';
import { getAllClinics } from '../../api/clinics.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const UserFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: '',
        status: 'ACTIVE',
        clinicId: '',
        specialization: '',
        consultationFee: ''
    });

    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    // Available roles - hardcoded for now as API might be placeholder
    const roles = [
        { id: 'ADMIN', name: 'Admin' },
        { id: 'DOCTOR', name: 'Doctor' },
        { id: 'PATIENT', name: 'Patient' },
        { id: 'RECEPTIONIST', name: 'Receptionist' }
    ];

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setInitialLoading(true);
            
            // Allow failing to load clinics gracefully
            try {
                const clinicsData = await getAllClinics();
                setClinics(clinicsData);
            } catch (e) {
                console.warn("Failed to load clinics", e);
            }

            if (isEditMode) {
                // Since there is no getUserById in backend provided, we fetch all and find
                // Or we can assume list page passed state, but better to fetch fresh.
                // NOTE: Backend getAllUsers does NOT return role or clinicId based on provided snippets.
                // This means data might be incomplete for editing these fields.
                const users = await getAllUsers();
                const user = users.find(u => u.userId === parseInt(id));
                
                if (user) {
                    setFormData({
                        username: user.username || '',
                        email: user.email || '',
                        password: '', // Don't populate password
                        role: user.role || '', // User entity likely doesn't have this
                        status: user.status || 'ACTIVE',
                        clinicId: '' // User entity likely doesn't have this
                    });
                    if (!user.role || !user.clinicId) {
                         // Optional: Warn user or handle API limitation
                         console.warn("User role/clinic might be missing in fetch response");
                    }
                } else {
                    toast({ title: 'Error', description: 'User not found', variant: 'destructive' });
                    navigate('/users');
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
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        
        if (!isEditMode && !formData.password) newErrors.password = 'Password is required';
        if (!isEditMode && !formData.role) newErrors.role = 'Role is required';
        if (!isEditMode && !formData.clinicId) newErrors.clinicId = 'Clinic is required';

        if (formData.role === 'DOCTOR') {
            if (!formData.specialization) newErrors.specialization = 'Specialization is required for doctors';
            if (!formData.consultationFee) newErrors.consultationFee = 'Consultation fee is required for doctors';
        }

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
                clinicId: formData.clinicId ? parseInt(formData.clinicId) : null
            };
            
            // Remove extra fields that are not part of user schema
            delete payload.specialization;
            delete payload.consultationFee;

            // Remove password if empty in edit mode
            if (isEditMode && !payload.password) {
                delete payload.password;
            }

            if (isEditMode) {
                await updateUser(id, payload);
                toast({ title: 'Success', description: 'User updated successfully', variant: 'success' });
            } else {
                await registerUser(payload);
                
                if (payload.role === 'DOCTOR') {
                    const doctorData = {
                        name: payload.username, // Using username as name
                        specialization: formData.specialization,
                        consultationFee: Number(formData.consultationFee),
                        status: 'ACTIVE'
                    };
                    try {
                        await createDoctor(doctorData);
                    } catch (docErr) {
                        console.error('Failed to create doctor record', docErr);
                        toast({ 
                            title: 'Warning', 
                            description: `User created but failed to create doctor record: ${docErr.response?.data?.message || docErr.message}`, 
                            variant: 'warning' 
                        });
                    }
                }
                
                toast({ title: 'Success', description: 'User registered successfully', variant: 'success' });
            }
            navigate('/users');
        } catch (err) {
            console.error('Failed to save user', err);
            const msg = err.response?.data?.message || 'Failed to save user'; 
            toast({
                title: 'Error',
                description: msg,
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
                title={isEditMode ? 'Edit User' : 'Register User'} 
                description={isEditMode ? 'Update user details.' : 'Register a new user in the system.'}
                actions={
                    <Button variant="ghost" onClick={() => navigate('/users')} icon={ArrowLeft}>
                        Back to List
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                        
                        <div className="grid grid-cols-1 gap-6">
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Username <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="jdoe"
                                        className={errors.username ? 'border-red-300 focus:ring-red-500' : ''}
                                    />
                                    {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className={errors.email ? 'border-red-300 focus:ring-red-500' : ''}
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password {isEditMode && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>} {!isEditMode && <span className="text-red-500">*</span>}
                                </label>
                                <Input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={isEditMode ? "••••••••" : "Enter password"}
                                    className={errors.password ? 'border-red-300 focus:ring-red-500' : ''}
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                            </div>

                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                         <h3 className="text-lg font-medium text-gray-900 mb-4">Role & Access</h3>
                         <div className="grid grid-cols-1 gap-6">
                            
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role {isEditMode && <span className="text-gray-400 font-normal">(Updates ignored by backend)</span>} {!isEditMode && <span className="text-red-500">*</span>}
                                    </label>
                                    <Select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className={errors.role ? 'border-red-300 focus:ring-red-500' : ''}
                                        options={[
                                            { value: "", label: "Select Role" },
                                            ...roles.map(r => ({ value: r.id, label: r.name }))
                                        ]}
                                    />
                                    {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Clinic {isEditMode && <span className="text-gray-400 font-normal">(Updates ignored by backend)</span>} {!isEditMode && <span className="text-red-500">*</span>}
                                    </label>
                                    <Select
                                        name="clinicId"
                                        value={formData.clinicId}
                                        onChange={handleChange}
                                        className={errors.clinicId ? 'border-red-300 focus:ring-red-500' : ''}
                                        options={[
                                            { value: "", label: "Select Clinic" },
                                            ...clinics.map(c => ({ value: c.id, label: c.name }))
                                        ]}
                                    />
                                    {errors.clinicId && <p className="mt-1 text-sm text-red-500">{errors.clinicId}</p>}
                                </div>
                            </div>

                            {formData.role === 'DOCTOR' && !isEditMode && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="sm:col-span-2">
                                        <h4 className="text-sm font-medium text-blue-900 mb-2">Doctor Details</h4>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Specialization <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            placeholder="e.g. Cardiology"
                                            className={errors.specialization ? 'border-red-300 focus:ring-red-500' : ''}
                                        />
                                        {errors.specialization && <p className="mt-1 text-sm text-red-500">{errors.specialization}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Consultation Fee <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            name="consultationFee"
                                            value={formData.consultationFee}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className={errors.consultationFee ? 'border-red-300 focus:ring-red-500' : ''}
                                        />
                                        {errors.consultationFee && <p className="mt-1 text-sm text-red-500">{errors.consultationFee}</p>}
                                    </div>
                                </div>
                            )}

                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    options={[
                                        { value: "ACTIVE", label: "Active" },
                                        { value: "INACTIVE", label: "Inactive" }
                                    ]}
                                />
                            </div>

                         </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => navigate('/users')}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            icon={loading ? undefined : Save}
                        >
                            {loading ? 'Saving...' : 'Save User'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormPage;
