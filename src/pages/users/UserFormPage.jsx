import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { registerUser, updateUser, getAllUsers } from '../../api/users.api';
import { createDoctor, updateDoctor, getAllDoctors } from '../../api/doctors.api';
import { getAllClinics } from '../../api/clinics.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import SearchableSelect from '../../components/SearchableSelect';
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
        clinicIds: [],
        specialization: '',
        consultationFee: ''
    });

    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    // Available roles
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

            try {
                const clinicsData = await getAllClinics();
                setClinics(clinicsData);
            } catch (e) {
                console.warn("Failed to load clinics", e);
            }

            if (isEditMode) {
                const users = await getAllUsers();
                const user = users.find(u => u.userId === parseInt(id));

                if (user) {
                    setFormData({
                        username: user.username || '',
                        email: user.email || '',
                        password: '',
                        role: user.role || '',
                        status: user.status || 'ACTIVE',
                        clinicIds: []
                    });

                    // If user is a doctor, fetch doctor details to populate fields and get doctorId
                    if (user.role === 'DOCTOR') {
                        try {
                            const doctors = await getAllDoctors();
                            // Find the doctor linked to this user
                            // Checking if doctor object has nested user object matching ID
                            const linkedDoctor = doctors.find(d => d.user?.userId === user.userId || d.user?.id === user.userId);

                            if (linkedDoctor) {
                                const currentClinicIds = linkedDoctor.clinics && linkedDoctor.clinics.length > 0 
                                    ? linkedDoctor.clinics.map(c => c.id) 
                                    : [];
                                
                                setFormData(prev => ({
                                    ...prev,
                                    specialization: linkedDoctor.specialization || '',
                                    consultationFee: linkedDoctor.consultationFee || '',
                                    clinicIds: currentClinicIds,
                                    doctorId: linkedDoctor.id // Store doctorId for updates
                                }));
                            }
                        } catch (err) {
                            console.error("Failed to fetch linked doctor details", err);
                        }
                    }
                } else {
                    toast({ title: 'Error', description: 'User not found', variant: 'destructive' });
                    navigate('/admin/users');
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
        if (!isEditMode && (!formData.clinicIds || formData.clinicIds.length === 0)) newErrors.clinicIds = 'At least one clinic is required';

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
                clinicId: (formData.clinicIds && formData.clinicIds.length > 0) ? parseInt(formData.clinicIds[0]) : null
            };

            // Store doctor-specific fields before deletion
            const specialization = payload.specialization;
            const consultationFee = payload.consultationFee;
            const clinicIds = formData.clinicIds || [];

            delete payload.specialization;
            delete payload.clinicIds; 
            delete payload.consultationFee;

            if (isEditMode && !payload.password) {
                delete payload.password;
            }

            if (isEditMode) {
                await updateUser(id, payload);

                // If role is DOCTOR, also update the linked Doctor entity
                if (payload.role === 'DOCTOR' && formData.doctorId) {
                    const doctorPayload = {
                        name: payload.username,
                        specialization: specialization,
                        consultationFee: Number(consultationFee),
                        status: payload.status,
                        clinics: clinicIds.map(id => ({ id: Number(id) }))
                    };
                    await updateDoctor(formData.doctorId, doctorPayload);
                }

                toast({ title: 'Success', description: 'User and Doctor details updated successfully', variant: 'success' });
            } else {
                // 1. Register the User AND Capture Response (Backend updated to return this)
                const createdUser = await registerUser(payload);

                // 2. If Doctor, Create Doctor Profile
                if (payload.role === 'DOCTOR') {
                    // Safety check: ensure we handle if registerUser wraps response or returns direct data
                    // Check for both userId and id, and in data wrapper
                    let userId = createdUser?.userId || createdUser?.id || createdUser?.data?.userId || createdUser?.data?.id;

                    // Fallback: If ID is not returned, try to fetch user by username
                    if (!userId) {
                        try {
                            console.log("User ID not found in response, attempting to fetch by username...");
                            const allUsers = await getAllUsers();
                            const foundUser = allUsers.find(u => u.username === payload.username);
                            if (foundUser) {
                                userId = foundUser.userId || foundUser.id;
                                console.log("User found by lookup:", userId);
                            }
                        } catch (lookupErr) {
                            console.error("Failed to lookup user after creation", lookupErr);
                        }
                    }

                    if (userId) {
                        const doctorData = {
                            name: payload.username,
                            specialization: formData.specialization,
                            consultationFee: Number(formData.consultationFee),
                            status: 'ACTIVE',
                            clinics: clinicIds.map(id => ({ id: Number(id) })),
                            user: { userId: userId }
                        };

                        try {
                            // Check if a doctor profile was already automatically created by the backend trigger
                            const allDoctors = await getAllDoctors();
                            const existingDoctor = allDoctors.find(d => 
                                (d.user?.userId === userId || d.user?.id === userId)
                            );

                            if (existingDoctor) {
                                console.log("Doctor profile auto-created by backend. Updating with full details...");
                                await updateDoctor(existingDoctor.id, doctorData);
                            } else {
                                await createDoctor(doctorData);
                            }
                        } catch (docErr) {
                            console.error('Failed to create/update doctor record', docErr);
                            toast({
                                title: 'Warning',
                                description: `User Link Failed: ${docErr.response?.data?.message || docErr.message}`,
                                variant: 'warning'
                            });
                        }
                    } else {
                        console.warn("Created user ID missing, skipping doctor profile creation", createdUser);
                        toast({
                            title: 'Warning',
                            description: 'User created but Doctor profile could not be created (User ID missing)',
                            variant: 'warning'
                        });
                    }
                }

                toast({ title: 'Success', description: 'User registered successfully', variant: 'success' });
            }
            navigate('/admin/users');
        } catch (err) {
            console.error('Failed to save user', err);
            let msg = err.response?.data?.message || 'Failed to save user';
            if (err.response?.status === 409 && !err.response?.data?.message) {
                msg = 'Username or email already exists.';
            }
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
                    <Button 
                        variant="outline" 
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" 
                        onClick={() => navigate('/admin/users')} 
                        icon={ArrowLeft}
                    >
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
                                        Clinics {isEditMode && <span className="text-gray-400 font-normal">(Updates ignored by backend)</span>} {!isEditMode && <span className="text-red-500">*</span>}
                                    </label>
                                    <SearchableSelect
                                        name="clinicIds"
                                        value={formData.clinicIds}
                                        onChange={handleChange}
                                        className={errors.clinicIds ? 'border-red-500' : ''}
                                        options={clinics.map(c => ({ value: c.id, label: c.name }))}
                                        placeholder="Select Clinics"
                                        multiple={true}
                                    />
                                    {errors.clinicIds && <p className="mt-1 text-sm text-red-500">{errors.clinicIds}</p>}
                                </div>
                            </div>

                            {formData.role === 'DOCTOR' && (
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
                            onClick={() => navigate('/admin/users')}
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
