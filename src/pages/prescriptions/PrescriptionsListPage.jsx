import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Trash2, Edit, X, RefreshCw } from 'lucide-react';
import { getAllPrescriptions, deletePrescription } from '../../api/prescriptions.api';
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

const PrescriptionsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [deleteId, setDeleteId] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const data = await getAllPrescriptions();
            setPrescriptions(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch prescriptions', err);
            setError('Failed to load prescriptions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            setProcessing(true);
            await deletePrescription(deleteId);
            toast({ title: 'Success', description: 'Prescription deleted', variant: 'success' });
            setPrescriptions(prev => prev.filter(item => item.prescriptionId !== deleteId));
        } catch (err) {
            console.error('Failed to delete prescription', err);
            toast({ title: 'Error', description: 'Failed to delete prescription', variant: 'destructive' });
        } finally {
            setProcessing(false);
            setDeleteId(null);
        }
    };

    const filteredPrescriptions = prescriptions.filter(p => {
        const search = searchTerm.toLowerCase();
        return (
            String(p.prescriptionId).includes(search) ||
            String(p.consultationId).includes(search) ||
            (p.issuedDate && p.issuedDate.includes(search))
        );
    });

    if (loading) return <Spinner fullScreen />;

    if (error) return (
        <div className="p-8">
            <ErrorState title="Something went wrong" message={error} onRetry={fetchPrescriptions} />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Prescriptions"
                description="Manage patient prescriptions."
                actions={
                    <div className="flex items-center gap-2">
                         <Button variant="outline" onClick={fetchPrescriptions} title="Refresh List" icon={RefreshCw}>
                            Refresh
                        </Button>
                    </div>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search ID, Consultation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredPrescriptions.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title={searchTerm ? "No prescriptions found" : "No prescriptions yet"}
                            description={searchTerm ? "Try adjusting your search terms" : "Create a new prescription to get started"}
                            icon={FileText}
                            action={null}
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Consultation ID</TableHead>
                                <TableHead>Issued Date</TableHead>
                                <TableHead>Medicines</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPrescriptions.map((p) => (
                                <TableRow key={p.prescriptionId}>
                                    <td className="p-4 font-medium text-gray-900">#{p.prescriptionId}</td>
                                    <td className="p-4 text-gray-500">{p.consultationId}</td>
                                    <td className="p-4 text-gray-500">{p.issuedDate}</td>
                                    <td className="p-4 text-gray-500">
                                        {p.prescriptionItems?.length || 0} items
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/prescriptions/${p.prescriptionId}/edit`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteId(p.prescriptionId)}
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
                title="Delete Prescription"
                message="Are you sure you want to delete this prescription? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                confirmText={processing ? 'Deleting...' : 'Delete'}
                variant="danger"
            />
        </div>
    );
};

export default PrescriptionsListPage;
