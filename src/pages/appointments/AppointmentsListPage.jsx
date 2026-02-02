import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, Check, X, Trash2, Eye, Edit, RefreshCw } from 'lucide-react';
import { getAllAppointments, cancelAppointment, completeAppointment, deleteAppointment } from '../../api/appointments.api';
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

const AppointmentsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [actionId, setActionId] = useState(null);
    const [actionType, setActionType] = useState(null); // 'delete', 'cancel', 'complete'
    const [processing, setProcessing] = useState(false);

    // Helper to format Java LocalDateTime array or string
    const formatDateTime = (dateData) => {
        if (!dateData) return 'N/A';
        
        let dateObj;
        if (Array.isArray(dateData)) {
            const [year, month, day, hour, minute, second = 0] = dateData;
            // Note: Java month is 1-12, JS Date month is 0-11
            dateObj = new Date(year, month - 1, day, hour, minute, second);
        } else {
            dateObj = new Date(dateData);
        }

        return isNaN(dateObj.getTime()) ? 'Invalid Date' : dateObj.toLocaleString();
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await getAllAppointments();
            setAppointments(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch appointments', err);
            setError('Failed to load appointments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!actionId || !actionType) return;
        
        try {
            setProcessing(true);
            if (actionType === 'delete') {
                await deleteAppointment(actionId);
                toast({ title: 'Success', description: 'Appointment deleted', variant: 'success' });
                setAppointments(prev => prev.filter(item => item.id !== actionId));
            } else if (actionType === 'cancel') {
                await cancelAppointment(actionId);
                toast({ title: 'Success', description: 'Appointment cancelled', variant: 'success' });
                // Optimistic update
                 setAppointments(prev => prev.map(item => item.id === actionId ? { ...item, status: 'CANCELLED' } : item));
                 // Refresh to be sure
                 fetchAppointments();
            } else if (actionType === 'complete') {
                await completeAppointment(actionId);
                toast({ title: 'Success', description: 'Appointment completed', variant: 'success' });
                // Optimistic update
                 setAppointments(prev => prev.map(item => item.id === actionId ? { ...item, status: 'COMPLETED' } : item));
                 fetchAppointments();
            }
        } catch (err) {
            console.error(`Failed to ${actionType} appointment`, err);
            toast({
                title: 'Error',
                description: `Failed to ${actionType} appointment`,
                variant: 'destructive'
            });
        } finally {
            setProcessing(false);
            setActionId(null);
            setActionType(null);
        }
    };
    
    const openConfirm = (id, type) => {
        setActionId(id);
        setActionType(type);
    };

    const filteredAppointments = appointments.filter(apt => {
        // Safe check for properties as backend response structure might vary
        const search = searchTerm.toLowerCase();
        // Assuming some typical fields or adjusting based on requirements
        // The requirements only listed: { scheduleId, patientId, appointmentTime, status }
        // But listing page usually shows names. 
        // If the API returns raw IDs, searching by name won't work unless we enrich data.
        // For now, search by ID or Status
        return String(apt.id).includes(search) || 
               String(apt.status).toLowerCase().includes(search) ||
               String(apt.patientId).includes(search) ||
               String(apt.scheduleId).includes(search);
    });

    if (loading) return <Spinner fullScreen />;
    
    if (error) return (
        <div className="p-8">
            <ErrorState 
                title="Something went wrong" 
                message={error} 
                onRetry={fetchAppointments} 
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Appointments" 
                description="Manage patient appointments."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={fetchAppointments} title="Refresh List" icon={RefreshCw}>
                            Refresh
                        </Button>
                        <Button onClick={() => navigate('/appointments/new')} icon={Plus}>
                            Book Appointment
                        </Button>
                    </div>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search ID, Status..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredAppointments.length === 0 ? (
                    <div className="p-12">
                        <EmptyState 
                            title={searchTerm ? "No appointments found" : "No appointments yet"}
                            description={searchTerm ? "Try adjusting your search terms" : "Get started by booking a new appointment"}
                            icon={Calendar}
                            action={!searchTerm && (
                                <Button onClick={() => navigate('/appointments/new')} variant="outline">
                                    Book Appointment
                                </Button>
                            )}
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Schedule ID</TableHead>
                                <TableHead>Patient ID</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAppointments.map((apt) => (
                                <TableRow key={apt.id}>
                                    <td className="p-4 font-medium text-gray-900">#{apt.id}</td>
                                    <td className="p-4 text-gray-500">{apt.scheduleId}</td>
                                    <td className="p-4 text-gray-500">{apt.patientId}</td>
                                    <td className="p-4 text-gray-500">
                                        {formatDateTime(apt.appointmentTime)}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            (apt.status && apt.status.toUpperCase() === 'COMPLETED') ? 'bg-green-100 text-green-800' :
                                            (apt.status && apt.status.toUpperCase() === 'CANCELLED') ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/appointments/${apt.id}`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/appointments/${apt.id}/edit`)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => openConfirm(apt.id, 'complete')}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                                                title="Mark as Complete"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => openConfirm(apt.id, 'cancel')}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-orange-600"
                                                title="Cancel"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => openConfirm(apt.id, 'delete')}
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
                open={!!actionId} 
                title={
                    actionType === 'delete' ? "Delete Appointment" :
                    actionType === 'cancel' ? "Cancel Appointment" : "Complete Appointment"
                }
                message={
                    actionType === 'delete' ? "Are you sure you want to delete this appointment? This action cannot be undone." :
                    actionType === 'cancel' ? "Are you sure you want to cancel this appointment?" :
                    "Are you sure you want to mark this appointment as completed?"
                }
                onConfirm={handleAction}
                onCancel={() => { setActionId(null); setActionType(null); }}
                confirmText={processing ? 'Processing...' : (actionType === 'delete' ? 'Delete' : 'Confirm')}
                variant={actionType === 'delete' ? "danger" : (actionType === 'cancel' ? "warning" : "default")}
            />
        </div>
    );
};

export default AppointmentsListPage;
