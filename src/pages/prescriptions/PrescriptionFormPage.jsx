import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { createPrescription, updatePrescription, getPrescriptionById } from '../../api/prescriptions.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const PrescriptionFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        consultationId: '',
        issuedDate: new Date().toISOString().split('T')[0],
        prescriptionItems: [
            { medicineName: '', dosage: '', duration: '' }
        ]
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode) {
            fetchPrescription();
        } else {
            setInitialLoading(false);
        }
    }, [isEditMode, id]);

    const fetchPrescription = async () => {
        try {
            const data = await getPrescriptionById(id);
            if (data) {
                setFormData({
                    consultationId: data.consultationId || '',
                    issuedDate: data.issuedDate || '',
                    prescriptionItems: data.prescriptionItems && data.prescriptionItems.length > 0
                        ? data.prescriptionItems
                        : [{ medicineName: '', dosage: '', duration: '' }]
                });
            }
        } catch (err) {
            console.error('Failed to fetch prescription', err);
            toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' });
            navigate('/prescriptions');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.prescriptionItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, prescriptionItems: newItems }));
        
        // Clear error for this item field if exists
        const errorKey = `items_${index}_${field}`;
        if(errors[errorKey]) {
             setErrors(prev => ({ ...prev, [errorKey]: null }));
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            prescriptionItems: [...prev.prescriptionItems, { medicineName: '', dosage: '', duration: '' }]
        }));
    };

    const removeItem = (index) => {
        if (formData.prescriptionItems.length === 1) return;
        setFormData(prev => ({
            ...prev,
            prescriptionItems: prev.prescriptionItems.filter((_, i) => i !== index)
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.consultationId) newErrors.consultationId = 'Consultation ID is required';
        if (!formData.issuedDate) newErrors.issuedDate = 'Issued Date is required';

        formData.prescriptionItems.forEach((item, index) => {
            if (!item.medicineName) newErrors[`items_${index}_medicineName`] = 'Required';
            if (!item.dosage) newErrors[`items_${index}_dosage`] = 'Required';
            if (!item.duration) newErrors[`items_${index}_duration`] = 'Required';
        });

        if (formData.prescriptionItems.length === 0) {
             newErrors.items = "At least one medicine is required";
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
                consultationId: parseInt(formData.consultationId),
                issuedDate: formData.issuedDate,
                prescriptionItems: formData.prescriptionItems
            };

            if (isEditMode) {
                // If ID is included in payload for update
                // payload.prescriptionId = parseInt(id); 
                await updatePrescription(id, payload);
                toast({ title: 'Success', description: 'Prescription updated', variant: 'success' });
            } else {
                await createPrescription(payload);
                toast({ title: 'Success', description: 'Prescription created', variant: 'success' });
            }
            navigate('/prescriptions');
        } catch (err) {
            console.error('Failed to save prescription', err);
            const msg = err.response?.data?.message || 'Failed to save prescription';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader
                title={isEditMode ? 'Edit Prescription' : 'New Prescription'}
                description={isEditMode ? 'Update prescription details.' : 'Create a new prescription.'}
                actions={
                    <Button 
                        variant="outline" 
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => navigate('/prescriptions')} 
                        icon={ArrowLeft}
                    >
                        Back to List
                    </Button>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Consultation ID <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                name="consultationId"
                                value={formData.consultationId}
                                onChange={handleChange}
                                placeholder="Enter Consultation ID"
                                className={errors.consultationId ? 'border-red-300' : ''}
                            />
                            {errors.consultationId && <p className="mt-1 text-sm text-red-500">{errors.consultationId}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issued Date <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                name="issuedDate"
                                value={formData.issuedDate}
                                onChange={handleChange}
                                className={errors.issuedDate ? 'border-red-300' : ''}
                            />
                            {errors.issuedDate && <p className="mt-1 text-sm text-red-500">{errors.issuedDate}</p>}
                        </div>
                    </div>
                </div>

                {/* Medicines */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Medicines</h3>
                        <Button type="button" size="sm" onClick={addItem} icon={Plus} variant="outline">
                            Add Item
                        </Button>
                    </div>

                    {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}

                    <div className="space-y-3">
                        {formData.prescriptionItems.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-sm font-bold text-gray-400 w-6 pt-2 md:pt-0">#{index + 1}</span>
                                
                                <div className="flex-1 w-full">
                                    <Input
                                        placeholder="Medicine Name"
                                        value={item.medicineName}
                                        onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                                        className={errors[`items_${index}_medicineName`] ? 'border-red-300' : ''}
                                    />
                                    {errors[`items_${index}_medicineName`] && <span className="text-xs text-red-500">Required</span>}
                                </div>
                                
                                <div className="w-full md:w-1/4">
                                    <Input
                                        placeholder="Dosage (e.g. 500mg)"
                                        value={item.dosage}
                                        onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                                        className={errors[`items_${index}_dosage`] ? 'border-red-300' : ''}
                                    />
                                    {errors[`items_${index}_dosage`] && <span className="text-xs text-red-500">Required</span>}
                                </div>

                                <div className="w-full md:w-1/4">
                                    <Input
                                        placeholder="Duration (e.g. 5 days)"
                                        value={item.duration}
                                        onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                                        className={errors[`items_${index}_duration`] ? 'border-red-300' : ''}
                                    />
                                     {errors[`items_${index}_duration`] && <span className="text-xs text-red-500">Required</span>}
                                </div>

                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeItem(index)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={formData.prescriptionItems.length === 1}
                                    title="Remove Item"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading} icon={loading ? undefined : Save}>
                        {loading ? 'Saving...' : (isEditMode ? 'Update Prescription' : 'Create Prescription')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default PrescriptionFormPage;
