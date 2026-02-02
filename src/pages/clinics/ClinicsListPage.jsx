import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Building } from 'lucide-react';
import { getAllClinics, deleteClinic } from '../../api/clinics.api';
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

const ClinicsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchClinics();
    }, []);

    const fetchClinics = async () => {
        try {
            setLoading(true);
            const data = await getAllClinics();
            setClinics(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch clinics', err);
            setError('Failed to load clinics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        
        try {
            setDeleting(true);
            await deleteClinic(deleteId);
            toast({
                title: 'Success',
                description: 'Clinic deleted successfully',
                variant: 'success'
            });
            setClinics(clinics.filter(c => c.id !== deleteId));
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete clinic', err);
            toast({
                title: 'Error',
                description: 'Failed to delete clinic. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredClinics = clinics.filter(clinic => 
        clinic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinic.phone?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <ErrorState message={error} onRetry={fetchClinics} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Clinics" 
                description="Manage your clinics and locations."
                actions={
                    <Button onClick={() => navigate('/clinics/new')} icon={Plus}>
                        Add Clinic
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search by name or phone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredClinics.length === 0 ? (
                    <div className="p-12">
                        <EmptyState 
                            title={searchTerm ? "No clinics found" : "No clinics yet"}
                            description={searchTerm ? "Try adjusting your search terms" : "Get started by adding your first clinic"}
                            icon={Building}
                            action={!searchTerm && (
                                <Button onClick={() => navigate('/clinics/new')} variant="outline">
                                    Add Clinic
                                </Button>
                            )}
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClinics.map((clinic) => (
                                <TableRow key={clinic.id}>
                                    <td className="p-4 font-medium text-gray-900">{clinic.name}</td>
                                    <td className="p-4 text-gray-500">{clinic.address}</td>
                                    <td className="p-4 text-gray-500">{clinic.phone}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            clinic.status === 'Active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {clinic.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/clinics/${clinic.id}/edit`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setDeleteId(clinic.id)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
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
                title="Delete Clinic"
                message="Are you sure you want to delete this clinic? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                confirmText={deleting ? 'Deleting...' : 'Delete'}
                variant="danger"
            />
        </div>
    );
};

export default ClinicsListPage;
