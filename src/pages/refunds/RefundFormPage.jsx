import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createRefund, updateRefund, getRefundById } from '../../api/refunds.api';
import { getAllPayments, updatePayment } from '../../api/payments.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';

const RefundFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        paymentId: '',
        amount: '',
        refundDate: new Date().toISOString().split('T')[0], // Default to today
        reason: ''
    });

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setInitialLoading(true);
            // Assuming getAllPayments is available
             let paymentsData = [];
             try {
                 paymentsData = await getAllPayments();
             } catch (e) {
                 console.warn("Could not load payments, might be unimplemented", e);
             }
            
            setPayments(paymentsData);

            if (isEditMode) {
                const refund = await getRefundById(id);
                if (refund) {
                    // Handle date array or string
                    let dateStr = '';
                    if (Array.isArray(refund.refundDate)) {
                         const [y, m, d] = refund.refundDate;
                         const pad = n => String(n).padStart(2, '0');
                         dateStr = `${y}-${pad(m)}-${pad(d)}`;
                    } else {
                         dateStr = refund.refundDate;
                    }

                    setFormData({
                        paymentId: refund.paymentId || (refund.payment ? refund.payment.paymentId : ''),
                        amount: refund.amount || '',
                        refundDate: dateStr,
                        reason: refund.reason || ''
                    });
                } else {
                    toast({ title: 'Error', description: 'Refund not found', variant: 'destructive' });
                    navigate('/refunds');
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
        if (!formData.paymentId) newErrors.paymentId = 'Payment is required';
        if (!formData.amount) newErrors.amount = 'Amount is required';
        else if (parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
        if (!formData.refundDate) newErrors.refundDate = 'Date is required';
        if (!formData.reason) newErrors.reason = 'Reason is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const payload = {
                refundId: isEditMode ? parseInt(id) : null,
                amount: parseFloat(formData.amount),
                refundDate: formData.refundDate,
                reason: formData.reason,
                payment: { paymentId: parseInt(formData.paymentId) },
                // Backend requires full payment object sometimes if DTO has "private Payment payment;"
                // but usually, ID inside object is enough for Entity mapping through jackson if configured right.
                // However, let's ensure we are sending what matched the DTO structure.
            };

            if (isEditMode) {
                await updateRefund(id, payload);
                
                // Update new payment status if changed
                const selectedPayment = payments.find(p => p.paymentId === parseInt(formData.paymentId));
                if (selectedPayment && selectedPayment.status !== "REFUNDED") {
                    try {
                        const updatedPayment = { ...selectedPayment, status: "REFUNDED" };
                        await updatePayment(selectedPayment.paymentId, updatedPayment);
                    } catch (updateErr) {
                        console.error("Failed to update payment status", updateErr);
                        // Don't block success flow, but maybe warn?
                    }
                }

                toast({ title: 'Success', description: 'Refund updated successfully', variant: 'success' });
            } else {
                await createRefund(payload);
                
                // Update payment status to REFUNDED
                const selectedPayment = payments.find(p => p.paymentId === parseInt(formData.paymentId));
                if (selectedPayment) {
                     try {
                        const updatedPayment = { ...selectedPayment, status: "REFUNDED" };
                        await updatePayment(selectedPayment.paymentId, updatedPayment);
                     } catch (updateErr) {
                        console.error("Failed to update payment status", updateErr);
                     }
                }

                toast({ title: 'Success', description: 'Refund created successfully', variant: 'success' });
            }
            navigate('/refunds');
        } catch (err) {
            console.error('Failed to save refund', err);
            
            let description = err.response?.data?.message || 'Failed to save refund';
            
            // Handle backend specific error messages
            if (err.response?.data?.message?.includes("Allowed only for cancelled")) {
                description = "Refunds are allowed only for cancelled appointments.";
            }

            toast({
                title: 'Error',
                description: description,
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
                title={isEditMode ? 'Edit Refund' : 'Process Refund'} 
                description={isEditMode ? 'Update refund details.' : 'Process a new refund for a payment.'}
                actions={
                    <Button 
                        variant="outline" 
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" 
                        onClick={() => navigate('/refunds')} 
                        icon={ArrowLeft}
                    >
                        Back to List
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Refund Details</h3>
                        <div className="grid grid-cols-1 gap-6">
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Original Payment <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    name="paymentId"
                                    value={formData.paymentId}
                                    onChange={handleChange}
                                    className={errors.paymentId ? 'border-red-300 focus:ring-red-500' : ''}
                                    disabled={isEditMode}
                                >
                                    <option value="">Select Payment</option>
                                    {payments.map(pay => (
                                        <option key={pay.paymentId} value={pay.paymentId}>
                                            #{pay.paymentId} - LKR {pay.amount} ({pay.date ? new Date(pay.date).toLocaleDateString() : 'No Date'})
                                        </option>
                                    ))}
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">Note: Refund will check if linked appointment is CANCELLED.</p>
                                {errors.paymentId && <p className="mt-1 text-sm text-red-500">{errors.paymentId}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Refund Amount (LKR) <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={errors.amount ? 'border-red-300 focus:ring-red-500' : ''}
                                    />
                                    {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Refund Date <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        name="refundDate"
                                        value={formData.refundDate}
                                        onChange={handleChange}
                                        className={errors.refundDate ? 'border-red-300 focus:ring-red-500' : ''}
                                    />
                                    {errors.refundDate && <p className="mt-1 text-sm text-red-500">{errors.refundDate}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Reason for refund..."
                                    className={errors.reason ? 'border-red-300 focus:ring-red-500' : ''}
                                />
                                {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
                            </div>

                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => navigate('/refunds')}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            icon={loading ? undefined : Save}
                        >
                            {loading ? 'Processing...' : 'Process Refund'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RefundFormPage;
