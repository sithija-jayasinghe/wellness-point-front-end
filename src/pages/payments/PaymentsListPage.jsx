import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, DollarSign, Trash2, Edit, RefreshCw } from 'lucide-react';
import { getAllPayments, deletePayment } from '../../api/payments.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
} from '../../components/Table';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

const PaymentsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [deleteId, setDeleteId] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const data = await getAllPayments();
            setPayments(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch payments', err);
            setError('Failed to load payments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            setProcessing(true);
            await deletePayment(deleteId);
            toast({ title: 'Success', description: 'Payment deleted', variant: 'success' });
            setPayments(prev => prev.filter(item => item.paymentId !== deleteId));
        } catch (err) {
            console.error('Failed to delete payment', err);
            toast({ title: 'Error', description: 'Failed to delete payment', variant: 'destructive' });
        } finally {
            setProcessing(false);
            setDeleteId(null);
        }
    };

    const filteredPayments = payments.filter(p => {
        const search = searchTerm.toLowerCase();
        return (
            String(p.paymentId).includes(search) ||
            String(p.appointmentId).includes(search) ||
            String(p.paymentMethod).toLowerCase().includes(search) ||
            String(p.status).toLowerCase().includes(search)
        );
    });

    if (loading) return <Spinner fullScreen />;

    if (error) return (
        <div className="p-8">
            <ErrorState title="Something went wrong" message={error} onRetry={fetchPayments} />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payments"
                description="Manage patient payments."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={fetchPayments} title="Refresh List" icon={RefreshCw}>
                            Refresh
                        </Button>
                        <Button onClick={() => navigate('/payments/new')} icon={Plus}>
                            Add Payment
                        </Button>
                    </div>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search ID, Method, Status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredPayments.length === 0 ? (
                    <div className="p-12">
                         <EmptyState
                            title={searchTerm ? "No payments found" : "No payments yet"}
                            description={searchTerm ? "Try adjusting your search terms" : "Record a new payment to get started"}
                            icon={DollarSign}
                            action={!searchTerm && (
                                <Button onClick={() => navigate('/payments/new')} variant="outline">
                                    Add Payment
                                </Button>
                            )}
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Appointment ID</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.map((p) => (
                                <TableRow key={p.paymentId}>
                                    <td className="p-4 font-medium text-gray-900">#{p.paymentId}</td>
                                    <td className="p-4 text-gray-500">{p.appointmentId}</td>
                                    <td className="p-4 text-gray-900 font-medium">
                                        ${p.amount?.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-gray-500">{p.paymentDate}</td>
                                    <td className="p-4 text-gray-500">{p.paymentMethod}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            (p.status && p.status.toUpperCase() === 'PAID') ? 'bg-green-100 text-green-800' :
                                            (p.status && p.status.toUpperCase() === 'REFUNDED') ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/payments/${p.paymentId}/edit`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteId(p.paymentId)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteId}
                title="Delete Payment"
                message="Are you sure you want to delete this payment? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                confirmText={processing ? 'Deleting...' : 'Delete'}
                variant="danger"
            />
        </div>
    );
};

export default PaymentsListPage;
