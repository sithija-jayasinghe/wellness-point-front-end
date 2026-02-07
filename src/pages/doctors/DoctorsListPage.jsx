import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, RefreshCw, User } from 'lucide-react';
import { getAllDoctors, updateDoctor } from '../../api/doctors.api';
import { getAllClinics } from '../../api/clinics.api';
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
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

const DoctorsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [doctors, setDoctors] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [doctorsData, clinicsData] = await Promise.all([
                getAllDoctors(),
                getAllClinics()
            ]);
            setDoctors(doctorsData);
            setClinics(clinicsData);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch data', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (doctor) => {
        try {
            setUpdatingId(doctor.id);
            const newStatus = doctor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            
            // Prepare payload similar to form submission
            // Ensure clinics are mapped correctly to { id: ... } objects
            const clinicsPayload = doctor.clinics ? doctor.clinics.map(c => ({ id: c.id })) : [];
            
            const payload = {
                ...doctor,
                status: newStatus,
                consultationFee: Number(doctor.consultationFee),
                clinics: clinicsPayload,
                // Ensure name is preserved properly (though it should be in ...doctor)
            };

            await updateDoctor(doctor.id, payload);
            
            // Update local state
            setDoctors(doctors.map(d => 
                d.id === doctor.id ? { ...d, status: newStatus } : d
            ));

            toast({
                title: 'Success',
                description: `Doctor status updated to ${newStatus}`,
                variant: 'success'
            });
        } catch (err) {
            console.error('Failed to update doctor status', err);
            toast({
                title: 'Error',
                description: 'Failed to update doctor status',
                variant: 'destructive'
            });
        } finally {
            setUpdatingId(null);
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
            onRetry={fetchData}
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
                                <TableHead>Clinics</TableHead>
                                <TableHead>Specialization</TableHead>
                                <TableHead>Consultation Fee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDoctors.map((doctor) => {
                                // Display 'Dr.' if name doesn't start with it
                                const displayName = doctor.name.startsWith('Dr.') 
                                    ? doctor.name 
                                    : `Dr. ${doctor.name}`;
                                
                                return (
                                    <TableRow key={doctor.id}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{displayName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex flex-wrap gap-1">
                                                {doctor.clinics && doctor.clinics.length > 0 ? (
                                                    doctor.clinics.map(clinic => {
                                                        const currentClinic = clinics.find(c => c.id === clinic.id);
                                                        const status = currentClinic ? currentClinic.status : clinic.status;
                                                        const isInactive = status === 'Inactive' || status === 'INACTIVE';
                                                        
                                                        return (
                                                            <span
                                                                key={clinic.id}
                                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                                                    isInactive 
                                                                        ? 'bg-gray-100 text-gray-500 border-gray-200 opacity-60' 
                                                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                                                }`}
                                                            >
                                                                {clinic.name} {isInactive && "(Inactive)"}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {doctor.specialization}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            LKR {Number(doctor.consultationFee).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                doctor.status === 'ACTIVE' || doctor.status === 'Active'
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
                                                    title="Edit Doctor"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(doctor)}
                                                    disabled={updatingId === doctor.id}
                                                    className={`h-8 w-8 p-0 ${
                                                        updatingId === doctor.id ? 'opacity-50 cursor-not-allowed' : ''
                                                    } ${
                                                        doctor.status === 'ACTIVE' || doctor.status === 'Active'
                                                        ? 'text-green-600 hover:text-green-700' 
                                                        : 'text-gray-400 hover:text-gray-600'
                                                    }`}
                                                    title={doctor.status === 'ACTIVE' || doctor.status === 'Active' ? 'Deactivate Doctor' : 'Activate Doctor'}
                                                >
                                                    {updatingId === doctor.id ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <RefreshCw className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
};

export default DoctorsListPage;