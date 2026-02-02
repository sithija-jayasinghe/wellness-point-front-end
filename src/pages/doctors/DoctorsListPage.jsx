import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, User } from 'lucide-react';
import { getAllDoctors, deleteDoctor } from '../../api/doctors.api';
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

const DoctorsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await getAllDoctors();
            setDoctors(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch doctors', err);
            setError('Failed to load doctors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        
        try {
            setDeleting(true);
            await deleteDoctor(deleteId);
            setDoctors(doctors.filter(d => d.id !== deleteId));
            toast({
                title: 'Success',
                description: 'Doctor deleted successfully',
                variant: 'success'
            });
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete doctor', err);
            toast({
                title: 'Error',
                description: 'Failed to delete doctor. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredDoctors = doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Spinner fullScreen />;
    
    if (error) return (
        <ErrorState 
            title="Something went wrong" 
            description={error} 
            onRetry={fetchDoctors} 
        />
    );

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Doctors" 
                subtitle="Manage doctor records"
                action={
                    <Button onClick={() => navigate('/doctors/new')} icon={Plus}>
                        Add Doctor
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="max-w-md">
                        <Input
                            placeholder="Search doctors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={Search}
                        />
                    </div>
                </div>

                {filteredDoctors.length === 0 ? (
                    <EmptyState 
                        title="No doctors found" 
                        description={searchTerm ? "Try adjusting your search terms" : "Get started by adding a new doctor"}
                        icon={User}
                        action={!searchTerm && (
                            <Button onClick={() => navigate('/doctors/new')} icon={Plus}>
                                Add Doctor
                            </Button>
                        )}
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Specialization</TableHead>
                                <TableHead>Consultation Fee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDoctors.map((doctor) => (
                                <TableRow key={doctor.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{doctor.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {doctor.specialization}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        ${Number(doctor.consultationFee).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            doctor.status === 'Active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {doctor.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/doctors/${doctor.id}/edit`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setDeleteId(doctor.id)}
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
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Doctor"
                message="Are you sure you want to delete this doctor? This action cannot be undone."
                confirmText={deleting ? "Deleting..." : "Delete"}
                variant="danger"
            />
        </div>
    );
};

export default DoctorsListPage;