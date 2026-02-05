import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createDoctor, updateDoctor, getAllDoctors } from '../../api/doctors.api';
import { getAllClinics } from '../../api/clinics.api';
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
        clinicId: '',
        specialization: '',
        consultationFee: '',
        status: 'ACTIVE'
    });
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const clinicsData = await getAllClinics();
                setClinics(clinicsData || []);

                if (isEditMode) {
                    await fetchDoctor();
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setInitialLoading(false);
            }
        };
        loadData();
    }, [isEditMode, id]);

    const fetchDoctor = async () => {
        try {
            const doctors = await getAllDoctors();
            const doctor = doctors.find(d => d.id === parseInt(id) || d.id === id);

            if (doctor) {
                const currentClinicId = doctor.clinics && doctor.clinics.length > 0
                    ? doctor.clinics[0].id
                    : '';

                setFormData({
                    name: doctor.name || '',
                    clinicId: currentClinicId, // Map back to singular ID for the dropdown
                    specialization: doctor.specialization || '',
                    consultationFee: doctor.consultationFee || '',
                    status: doctor.status || 'ACTIVE'
                });
            }
            else {
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
        if (!formData.clinicId) newErrors.clinicId = 'Clinic is required';
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

            // FIX: Create a clinics array with the selected clinic object
            // We assume basic object structure is enough for ID linking
            const selectedClinicId = Number(formData.clinicId);
            // FIX: Revert to 'id' as per strict backend requirement
            const clinicsPayload = selectedClinicId ? [{ id: selectedClinicId }] : [];

            // Auto-prepend 'Dr.' if missing
            let formattedName = formData.name.trim();
            if (!formattedName.startsWith('Dr.')) {
                formattedName = `Dr. ${formattedName}`;
            }

            const dataToSubmit = {
                ...formData,
                name: formattedName,
                consultationFee: Number(formData.consultationFee),
                clinics: clinicsPayload,
            };

            console.log('Submitting Payload:', JSON.stringify(dataToSubmit, null, 2));

            // Remove flat clinicId if the API strictly rejects unknown fields, 
            // otherwise it's harmless to leave it, but 'clinics' is what matters.
            delete dataToSubmit.clinicId;

            if (isEditMode) {
                await updateDoctor(id, dataToSubmit);
                toast({ title: 'Success', description: 'Doctor updated successfully', variant: 'success' });
            } else {
                await createDoctor(dataToSubmit);
                toast({ title: 'Success', description: 'Doctor created successfully', variant: 'success' });
            }
            navigate('/doctors');
        } catch (err) {
            // ... existing error handling
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

                    <Select
                        label="Clinic"
                        name="clinicId"
                        value={formData.clinicId}
                        onChange={handleChange}
                        error={errors.clinicId}
                        required
                    >
                        <option value="">Select Clinic</option>
                        {clinics.map(clinic => (
                            <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                        ))}
                    </Select>
                    {errors.clinicId && <p className="mt-1 text-sm text-red-500">{errors.clinicId}</p>}

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
                            { value: 'ACTIVE', label: 'Active' },
                            { value: 'INACTIVE', label: 'Inactive' }
                        ]}
                    />

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            icon={Save}
                            isLoading={loading}
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
