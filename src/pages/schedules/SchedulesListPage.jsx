import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Calendar } from 'lucide-react';
import { getAllSchedules, deleteSchedule } from '../../api/schedules.api';
import { getAllDoctors } from '../../api/doctors.api';
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
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

const SchedulesListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [schedules, setSchedules] = useState([]);
    const [doctors, setDoctors] = useState({});
    const [clinics, setClinics] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schedulesData, doctorsData, clinicsData] = await Promise.all([
                getAllSchedules(),
                getAllDoctors(),
                getAllClinics()
            ]);
            
            setSchedules(schedulesData);
            
            // Create lookup maps for doctors and clinics
            const doctorsMap = {};
            doctorsData.forEach(d => doctorsMap[d.id] = d.name);
            setDoctors(doctorsMap);
            
            const clinicsMap = {};
            clinicsData.forEach(c => clinicsMap[c.id] = c.name);
            setClinics(clinicsMap);
            
            setError(null);
        } catch (err) {
            console.error('Failed to fetch data', err);
            setError('Failed to load schedules. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        
        try {
            setDeleting(true);
            await deleteSchedule(deleteId);
            setSchedules(schedules.filter(s => s.id !== deleteId));
            toast({
                title: 'Success',
                description: 'Schedule deleted successfully',
                variant: 'success'
            });
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete schedule', err);
            toast({
                title: 'Error',
                description: 'Failed to delete schedule. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredSchedules = schedules.filter(schedule => {
        const doctorName = doctors[schedule.doctorId]?.toLowerCase() || '';
        const clinicName = clinics[schedule.clinicId]?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return doctorName.includes(search) || clinicName.includes(search);
    });

    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '-';
        
        let date;
        // Handle array format [yyyy, mm, dd, hh, mm, ss] from Java
        if (Array.isArray(dateTimeStr)) {
            const [year, month, day, hour, minute, second = 0] = dateTimeStr;
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            date = new Date(dateTimeStr);
        }

        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    };

    if (loading) return <Spinner fullScreen />;
    
    if (error) return (
        <div className="p-8">
            <ErrorState 
                title="Something went wrong" 
                message={error} 
                onRetry={fetchData} 
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Doctor Schedules" 
                description="Manage doctor availability and clinic schedules."
                actions={
                    <Button onClick={() => navigate('/schedules/new')} icon={Plus}>
                        Add Schedule
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search by doctor or clinic..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredSchedules.length === 0 ? (
                    <div className="p-12">
                        <EmptyState 
                            title={searchTerm ? "No schedules found" : "No schedules yet"}
                            description={searchTerm ? "Try adjusting your search terms" : "Get started by creating a new schedule"}
                            icon={Calendar}
                            action={!searchTerm && (
                                <Button onClick={() => navigate('/schedules/new')} variant="outline">
                                    Add Schedule
                                </Button>
                            )}
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Clinic</TableHead>
                                <TableHead>Start Time</TableHead>
                                <TableHead>End Time</TableHead>
                                <TableHead>Max Patients</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSchedules.map((schedule) => (
                                <TableRow key={schedule.id}>
                                    <td className="p-4 font-medium text-gray-900">{doctors[schedule.doctorId] || 'Unknown Doctor'}</td>
                                    <td className="p-4 text-gray-500">{clinics[schedule.clinicId] || 'Unknown Clinic'}</td>
                                    <td className="p-4 text-gray-500">{formatDateTime(schedule.startDateTime)}</td>
                                    <td className="p-4 text-gray-500">{formatDateTime(schedule.endDateTime)}</td>
                                    <td className="p-4 text-gray-500">{schedule.maxPatients}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/schedules/${schedule.id}/edit`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setDeleteId(schedule.id)}
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
                title="Delete Schedule"
                message="Are you sure you want to delete this schedule? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                confirmText={deleting ? 'Deleting...' : 'Delete'}
                variant="danger"
            />
        </div>
    );
};

export default SchedulesListPage;
