import React, { useState, useEffect } from 'react';
import { X, FlaskConical, Send, Loader2 } from 'lucide-react';
import { createLabTest } from '../../api/labTests.api';
import { getAllPatients } from '../../api/patients.api';
import { getAllUsers } from '../../api/users.api';
import { sendNotification } from '../../api/notifications.api';
import { useToast } from '../../components/useToast';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

const RequestLabReportModal = ({ open, onClose, onSuccess }) => {
    const { toast } = useToast();
    const { user } = useAuth();

    const [patients, setPatients] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        patientId: '',
        testName: '',
        testCode: '',
        description: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;
        setForm({ patientId: '', testName: '', testCode: '', description: '' });
        setErrors({});
        loadPatients();
    }, [open]);

    const loadPatients = async () => {
        try {
            setLoadingData(true);
            const data = await getAllPatients().catch(() => []);
            setPatients(data);
        } finally {
            setLoadingData(false);
        }
    };

    const validate = () => {
        const errs = {};
        if (!form.patientId) errs.patientId = 'Patient is required';
        if (!form.testName.trim()) errs.testName = 'Test name is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSubmitting(true);

            const selectedPatient = patients.find(p => String(p.id) === String(form.patientId));
            const patientName = selectedPatient?.name || `Patient #${form.patientId}`;
            const doctorName = user?.name || user?.username || `Doctor #${user?.id}`;
            const displayDoctorName = doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`;

            // 1. Create lab test record
            const created = await createLabTest({
                patientId: parseInt(form.patientId),
                doctorId: user?.id ? parseInt(user.id) : null,
                labOperatorId: null,
                testName: form.testName.trim(),
                testCode: form.testCode.trim() || null,
                description: form.description.trim() || null,
                notes: null,
            });

            // 2. Notify all lab operators
            try {
                const allUsers = await getAllUsers();
                const labUsers = allUsers.filter(u =>
                    u.role && (
                        u.role.toUpperCase().includes('LAB_OPERATOR') ||
                        u.role.toUpperCase().includes('LAB')
                    )
                );

                const message = `📋 Lab report requested for ${patientName}: "${form.testName.trim()}". Requested by ${displayDoctorName}. Please process at your earliest convenience.`;

                await Promise.allSettled(
                    labUsers.map(labUser =>
                        sendNotification({
                            userId: labUser.id,
                            message,
                            sentAt: new Date().toISOString(),
                        })
                    )
                );
            } catch (notifErr) {
                // Notification failure is non-critical
                console.warn('Could not send lab notifications:', notifErr);
            }

            toast({
                title: 'Lab Report Requested',
                description: `Request for "${form.testName}" sent successfully. Lab has been notified.`,
                variant: 'success',
            });

            onSuccess?.(created);
            onClose();
        } catch (err) {
            console.error('Failed to request lab report', err);
            const msg = err.response?.data?.message || 'Failed to submit lab report request.';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-cyan-100 flex items-center justify-center">
                            <FlaskConical className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Request Lab Report</h2>
                            <p className="text-xs text-gray-500">The lab will be notified automatically</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Patient */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Patient <span className="text-red-500">*</span>
                        </label>
                        {loadingData ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading patients…
                            </div>
                        ) : (
                            <select
                                name="patientId"
                                value={form.patientId}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.patientId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                            >
                                <option value="">Select patient…</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name || p.patientName || `Patient #${p.id}`}
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.patientId && (
                            <p className="mt-1 text-xs text-red-500">{errors.patientId}</p>
                        )}
                    </div>

                    {/* Test Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Test Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="testName"
                            value={form.testName}
                            onChange={handleChange}
                            placeholder="e.g. Complete Blood Count (CBC)"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${errors.testName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                        />
                        {errors.testName && (
                            <p className="mt-1 text-xs text-red-500">{errors.testName}</p>
                        )}
                    </div>

                    {/* Test Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Test Code <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            name="testCode"
                            value={form.testCode}
                            onChange={handleChange}
                            placeholder="e.g. CBC-001"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    {/* Description / Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason / Instructions <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describe the clinical reason or any special instructions for the lab…"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        />
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-2 rounded-lg bg-cyan-50 border border-cyan-100 px-4 py-3 text-xs text-cyan-700">
                        <Send className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>All lab operators will receive an instant notification about this request.</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || loadingData} icon={submitting ? undefined : Send}>
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                                </span>
                            ) : (
                                'Submit Request'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestLabReportModal;
