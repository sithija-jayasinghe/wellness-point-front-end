import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { getAllConsultations, deleteConsultation } from '../../api/consultations.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/Table';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

const ConsultationsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [deleteId, setDeleteId] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchConsultations();
    }, []);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const data = await getAllConsultations();
            setConsultations(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch consultations', err);
            setError('Failed to load consultations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        
        console.log('Attempting to delete consultation with ID:', deleteId);

        try {
            setProcessing(true);
            await deleteConsultation(deleteId);
            toast({ title: 'Success', description: 'Consultation deleted', variant: 'success' });
            setConsultations(prev => prev.filter(item => item.consultationId !== deleteId));
        } catch (err) {
            console.error('Failed to delete consultation', err);
            // safe error message extraction
            const errorMsg = err.response?.data?.message || err.response?.data || err.message || 'Failed to delete consultation';
            let displayMsg = typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg);
            
            // User friendly error mapping
            if (displayMsg.includes('foreign key constraint fails')) {
                if (displayMsg.includes('prescription')) {
                    displayMsg = 'Cannot delete this consultation because it has linked prescriptions. Please delete the prescriptions first.';
                } else {
                    displayMsg = 'Cannot delete this record because it is referenced by other data in the system.';
                }
            }
            
            toast({
                title: 'Deletion Failed',
                description: displayMsg,
                variant: 'destructive'
            });
        } finally {
            setProcessing(false);
            setDeleteId(null);
        }
    };

    const filteredConsultations = consultations.filter(consultation => 
        consultation.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.appointmentId?.toString().includes(searchTerm)
    );

    if (loading) return <Spinner />;
    if (error) return <ErrorState message={error} onRetry={fetchConsultations} />;

    return (
        <div>
            <PageHeader 
                title="Consultations" 
                action={
                    <Button onClick={() => navigate('/consultations/new')}>
                        <Plus size={20} className="mr-2" />
                        New Consultation
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input 
                            placeholder="Search by diagnosis, notes or appointment ID..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {consultations.length === 0 ? (
                    <EmptyState 
                        title="No consultations found" 
                        description="Get started by creating a new consultation record." 
                        icon={FileText}
                        action={
                            <Button onClick={() => navigate('/consultations/new')}>
                                <Plus size={20} className="mr-2" />
                                Create Consultation
                            </Button>
                        }
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Appointment ID</TableHead>
                                <TableHead>Diagnosis</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredConsultations.map((consultation) => (
                                <TableRow key={consultation.consultationId}>
                                    <TableCell className="font-medium text-gray-900">#{consultation.consultationId}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Appt #{consultation.appointmentId}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={consultation.diagnosis}>{consultation.diagnosis}</TableCell>
                                    <TableCell className="max-w-xs truncate text-gray-500" title={consultation.notes}>{consultation.notes || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => navigate(`/consultations/${consultation.consultationId}/edit`)}
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            <Button 
                                                variant="destructive" 
                                                size="sm"
                                                onClick={() => setDeleteId(consultation.consultationId)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <ConfirmDialog 
                open={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Consultation"
                message="Are you sure you want to delete this consultation record? This action cannot be undone."
                confirmText={processing ? "Deleting..." : "Delete"}
                variant="danger"
            />
        </div>
    );
};

export default ConsultationsListPage;
