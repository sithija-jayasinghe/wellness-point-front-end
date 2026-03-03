import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createLabTest } from '../../api/labTests.api';
import { getAllPatients } from '../../api/patients.api';
import { getAllDoctors } from '../../api/doctors.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const LabTestFormPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        patientId: '',
        doctorId: '',
        labOperatorId: user?.id || '',
        testName: '',
        testCode: '',
        description: '',
        notes: '',
    });

    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientsData, doctorsData] = await Promise.all([
                    getAllPatients().catch(() => []),
                    getAllDoctors().catch(() => []),
                ]);
                setPatients(patientsData);
                setDoctors(doctorsData);
            } catch (err) {
                console.error('Failed to load data', err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.patientId) newErrors.patientId = 'Patient is required';
        if (!formData.testName.trim()) newErrors.testName = 'Test name is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const payload = {
                patientId: parseInt(formData.patientId),
                doctorId: formData.doctorId ? parseInt(formData.doctorId) : null,
                labOperatorId: formData.labOperatorId ? parseInt(formData.labOperatorId) : null,
                testName: formData.testName,
                testCode: formData.testCode || null,
                description: formData.description || null,
                notes: formData.notes || null,
            };

            await createLabTest(payload);
            toast({ title: 'Success', description: 'Lab test created successfully', variant: 'success' });
            navigate('/lab-tests');
        } catch (err) {
            console.error('Failed to create lab test', err);
            const msg = err.response?.data?.message || 'Failed to create lab test';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader
                title="New Lab Test"
                description="Request a new laboratory test"
                actions={
                    <Button
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => navigate('/lab-tests')}
                        icon={ArrowLeft}
                    >
                        Back to List
                    </Button>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Test Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Patient */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Patient <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="patientId"
                                value={formData.patientId}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.patientId ? 'border-red-300' : 'border-gray-200'}`}
                            >
                                <option value="">Select Patient</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name || p.patientName || `Patient #${p.id}`}
                                    </option>
                                ))}
                            </select>
                            {errors.patientId && <p className="mt-1 text-sm text-red-500">{errors.patientId}</p>}
                        </div>

                        {/* Doctor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Referring Doctor
                            </label>
                            <select
                                name="doctorId"
                                value={formData.doctorId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">Select Doctor (Optional)</option>
                                {doctors.map(d => {
                                    const name = d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim();
                                    return (
                                        <option key={d.id} value={d.id}>
                                            {name.startsWith('Dr.') ? name : `Dr. ${name}`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Test Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Test Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="testName"
                                value={formData.testName}
                                onChange={handleChange}
                                placeholder="e.g., Complete Blood Count"
                                className={errors.testName ? 'border-red-300' : ''}
                            />
                            {errors.testName && <p className="mt-1 text-sm text-red-500">{errors.testName}</p>}
                        </div>

                        {/* Test Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Test Code
                            </label>
                            <Input
                                name="testCode"
                                value={formData.testCode}
                                onChange={handleChange}
                                placeholder="e.g., CBC-001"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the test requirements..."
                            rows={3}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <Textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Additional notes..."
                            rows={2}
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate('/lab-tests')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} icon={Save}>
                        {loading ? 'Creating...' : 'Create Lab Test'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default LabTestFormPage;
