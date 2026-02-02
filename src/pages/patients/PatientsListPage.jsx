import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, User, FileText } from 'lucide-react';
import { getAllPatients, deletePatient } from '../../api/patients.api';
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

const PatientsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const data = await getAllPatients();
            setPatients(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch patients', err);
            setError('Failed to load patients. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        
        try {
            setDeleting(true);
            await deletePatient(deleteId);
            setPatients(patients.filter(p => p.id !== deleteId));
            toast({
                title: 'Success',
                description: 'Patient deleted successfully',
                variant: 'success'
            });
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete patient', err);
            toast({
                title: 'Error',
                description: 'Failed to delete patient. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredPatients = patients.filter(patient => 
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.nic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm)
    );

    if (loading) return <Spinner fullScreen />;
    
    if (error) return (
        <div className="p-8">
            <ErrorState 
                title="Something went wrong" 
                message={error} 
                onRetry={fetchPatients} 
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Patients" 
                description="Manage patient records and medical history."
                actions={
                    <Button onClick={() => navigate('/patients/new')} icon={Plus}>
                        Add Patient
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search by name, NIC, or phone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredPatients.length === 0 ? (
                    <div className="p-12">
                        <EmptyState 
                            title={searchTerm ? "No patients found" : "No patients yet"}
                            description={searchTerm ? "Try adjusting your search terms" : "Get started by registering a new patient"}
                            icon={User}
                            action={!searchTerm && (
                                <Button onClick={() => navigate('/patients/new')} variant="outline">
                                    Add Patient
                                </Button>
                            )}
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>NIC</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPatients.map((patient) => (
                                <TableRow key={patient.id}>
                                    <td className="p-4 font-medium text-gray-900">{patient.name}</td>
                                    <td className="p-4 text-gray-500">{patient.nic}</td>
                                    <td className="p-4 text-gray-500">{patient.phone}</td>
                                    <td className="p-4 text-gray-500">{patient.gender}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/patients/${patient.id}/history`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                title="Medical History"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/patients/${patient.id}/edit`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setDeleteId(patient.id)}
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
                title="Delete Patient"
                message="Are you sure you want to delete this patient? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                confirmText={deleting ? 'Deleting...' : 'Delete'}
                variant="danger"
            />
        </div>
    );
};

export default PatientsListPage;
