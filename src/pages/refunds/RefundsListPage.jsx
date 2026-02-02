import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RotateCcw, Edit, Trash2 } from 'lucide-react';
import { getAllRefunds, deleteRefund } from '../../api/refunds.api';
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

const RefundsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const data = await getAllRefunds();
            setRefunds(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch refunds', err);
            setError('Failed to load refunds. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        
        try {
            setDeleting(true);
            await deleteRefund(deleteId);
            setRefunds(prev => prev.filter(item => item.refundId !== deleteId));
            toast({
                title: 'Success',
                description: 'Refund deleted successfully',
                variant: 'success'
            });
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete refund', err);
            toast({
                title: 'Error',
                description: 'Failed to delete refund',
                variant: 'destructive'
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredRefunds = refunds.filter(item => {
        const search = searchTerm.toLowerCase();
        // Since DTO has "private Payment payment;", it will always be nested
        const pId = item.payment ? item.payment.paymentId : '';
        return (
            String(item.refundId).includes(search) ||
            String(item.reason).toLowerCase().includes(search) ||
            String(pId).includes(search)
        );
    });

    // Format date array or string
    const formatDate = (dateData) => {
        if (!dateData) return 'N/A';
        if (Array.isArray(dateData)) {
            const [year, month, day] = dateData;
            return new Date(year, month - 1, day).toLocaleDateString();
        }
        return new Date(dateData).toLocaleDateString();
    };

    if (loading) return <Spinner fullScreen />;
    
    if (error) return (
        <div className="p-8">
            <ErrorState 
                title="Something went wrong" 
                message={error} 
                onRetry={fetchRefunds} 
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Refunds" 
                description="Manage payment refunds."
                actions={
                    <Button onClick={() => navigate('/refunds/new')} icon={Plus}>
                        New Refund
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search by ID, Reason..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredRefunds.length === 0 ? (
                    <div className="p-12">
                        <EmptyState 
                            title={searchTerm ? "No refunds found" : "No refunds yet"}
                            description={searchTerm ? "Try adjusting your search terms" : "Get started by creating a new refund"}
                            icon={RotateCcw}
                            action={!searchTerm && (
                                <Button onClick={() => navigate('/refunds/new')} variant="outline">
                                    New Refund
                                </Button>
                            )}
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Payment ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRefunds.map((item) => (
                                <TableRow key={item.refundId}>
                                    <td className="p-4 font-medium text-gray-900">#{item.refundId}</td>
                                    <td className="p-4 text-gray-500">
                                        {item.payment ? `#${item.payment.paymentId}` : 'N/A'}
                                    </td>
                                    <td className="p-4 text-gray-500">{formatDate(item.refundDate)}</td>
                                    <td className="p-4 text-gray-900 font-medium">Rs. {Number(item.amount).toFixed(2)}</td>
                                    <td className="p-4 text-gray-500 max-w-xs truncate">{item.reason || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/refunds/${item.refundId}/edit`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteId(item.refundId);
                                                }}
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
                title="Delete Refund"
                message="Are you sure you want to delete this refund? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                isLoading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
};

export default RefundsListPage;
