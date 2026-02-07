import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addPayment, updatePayment, getPaymentById } from '../../api/payments.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const PaymentFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        appointmentId: '',
        amount: '',
        paymentDate: new Date(),
        paymentMethod: 'CASH',
        status: 'PENDING'
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode) {
            fetchPayment();
        } else {
            setInitialLoading(false);
        }
    }, [isEditMode, id]);

    const fetchPayment = async () => {
        try {
            const data = await getPaymentById(id);
            if (data) {
                let pDate = new Date();
                if (data.paymentDate) {
                     if (Array.isArray(data.paymentDate)) {
                         const [y, m, d] = data.paymentDate;
                         pDate = new Date(y, m - 1, d);
                     } else {
                         pDate = new Date(data.paymentDate);
                     }
                }

                setFormData({
                    appointmentId: data.appointmentId || '',
                    amount: data.amount || '',
                    paymentDate: pDate,
                    paymentMethod: data.paymentMethod || 'CASH',
                    status: data.status || 'PENDING'
                });
            }
        } catch (err) {
            console.error('Failed to fetch payment', err);
            toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' });
            navigate('/payments');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleDateChange = (name, date) => {
        setFormData(prev => ({ ...prev, [name]: date }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.appointmentId) newErrors.appointmentId = 'Appointment ID is required';
        if (!formData.amount) newErrors.amount = 'Amount is required';
        if (!formData.paymentDate) newErrors.paymentDate = 'Date is required';
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Method is required';
        if (!formData.status) newErrors.status = 'Status is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            
            const formatDate = (d) => {
                 if (!d) return null;
                 const pad = n => String(n).padStart(2, '0');
                 return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            };

            const payload = {
                ...formData,
                appointmentId: parseInt(formData.appointmentId),
                amount: parseFloat(formData.amount),
                paymentDate: formatDate(formData.paymentDate)
            };

            if (isEditMode) {
                await updatePayment(id, payload);
                toast({ title: 'Success', description: 'Payment updated', variant: 'success' });
            } else {
                await addPayment(payload);
                toast({ title: 'Success', description: 'Payment recorded', variant: 'success' });
            }
            navigate('/payments');
        } catch (err) {
            console.error('Failed to save payment', err);
            const msg = err.response?.data?.message || 'Failed to save payment';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PageHeader
                title={isEditMode ? 'Edit Payment' : 'New Payment'}
                description={isEditMode ? 'Update payment record.' : 'Record a new payment.'}
                actions={
                    <Button 
                        variant="outline" 
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" 
                        onClick={() => navigate('/payments')} 
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
                                Appointment ID <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                name="appointmentId"
                                value={formData.appointmentId}
                                onChange={handleChange}
                                placeholder="Enter Appointment ID"
                                className={errors.appointmentId ? 'border-red-300' : ''}
                            />
                            {errors.appointmentId && <p className="mt-1 text-sm text-red-500">{errors.appointmentId}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount (LKR) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className={errors.amount ? 'border-red-300' : ''}
                                />
                                {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Date <span className="text-red-500">*</span>
                                </label>
                                <div className="w-full">
                                    <DatePicker
                                        selected={formData.paymentDate}
                                        onChange={(date) => handleDateChange('paymentDate', date)}
                                        dateFormat="yyyy-MM-dd"
                                        className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${errors.paymentDate ? 'border-red-300' : ''}`}
                                        placeholderText="Select date"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                                {errors.paymentDate && <p className="mt-1 text-sm text-red-500">{errors.paymentDate}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className={errors.paymentMethod ? 'border-red-300' : ''}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="ONLINE">Online</option>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={errors.status ? 'border-red-300' : ''}
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="PAID">Paid</option>
                                    <option value="REFUNDED">Refunded</option>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={() => navigate('/payments')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} icon={loading ? undefined : Save}>
                            {loading ? 'Saving...' : (isEditMode ? 'Update Payment' : 'Record Payment')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentFormPage;
