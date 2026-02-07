import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Edit, Trash2 } from 'lucide-react';
import { getAllConsultations, deleteConsultation } from '../../api/consultations.api';
import { getAllAppointments } from '../../api/appointments.api';
import { getAllSchedules } from '../../api/schedules.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllPatients } from '../../api/patients.api';
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

const ConsultationsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [consultations, setConsultations] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchConsultations();
    }, []);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const [consultationsData, appointmentsData, schedulesData, doctorsData, patientsData] = await Promise.all([
                getAllConsultations(),
                getAllAppointments().catch(() => []),
                getAllSchedules().catch(() => []),
                getAllDoctors().catch(() => []),
                getAllPatients().catch(() => [])
            ]);
            
            setConsultations(consultationsData);
            setAppointments(appointmentsData);
            setSchedules(schedulesData);
            setDoctors(doctorsData);
            setPatients(patientsData);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch data', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper Functions
    const getAppointment = (id) => appointments.find(a => a.id === id);

    const getDoctorName = (appointmentId) => {
        const apt = getAppointment(appointmentId);
        if (!apt) return 'Unknown';
        
        if (apt.doctor && apt.doctor.name) return apt.doctor.name;
        
        if (apt.scheduleId) {
            const schedule = schedules.find(s => s.id === apt.scheduleId);
            if (schedule && schedule.doctorId) {
                const doctor = doctors.find(d => d.id === schedule.doctorId);
                if (doctor) return doctor.name;
            }
        }
        return 'Unknown';
    };

    const getPatientName = (appointmentId) => {
        const apt = getAppointment(appointmentId);
        if (!apt || !apt.patientId) return 'Unknown';
        
        const patient = patients.find(p => p.id === apt.patientId);
        return patient ? patient.name : `ID: ${apt.patientId}`;
    };

    const getFormattedDate = (appointmentId) => {
        const apt = getAppointment(appointmentId);
        if (!apt || !apt.appointmentTime) return 'N/A';
        
        let dateObj;
        if (Array.isArray(apt.appointmentTime)) {
             const [year, month, day, hour, minute] = apt.appointmentTime;
             dateObj = new Date(year, month - 1, day, hour, minute);
        } else {
            dateObj = new Date(apt.appointmentTime);
        }
        
        return isNaN(dateObj.getTime()) ? 'Invalid Date' : dateObj.toLocaleString();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        
        try {
            setDeleting(true);
            await deleteConsultation(deleteId);
            setConsultations(prev => prev.filter(item => (item.consultationId || item.id) !== deleteId));
            toast({
                title: 'Success',
                description: 'Consultation deleted successfully',
                variant: 'success'
            });
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete consultation', err);
            toast({
                title: 'Error',
                description: 'Failed to delete consultation',
                variant: 'destructive'
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredConsultations = consultations.filter(item => {
        const search = searchTerm.toLowerCase();
        const doctorName = getDoctorName(item.appointmentId).toLowerCase();
        const patientName = getPatientName(item.appointmentId).toLowerCase();
        
        return (
            String(item.consultationId).includes(search) ||
            String(item.appointmentId).includes(search) ||
            (item.diagnosis && item.diagnosis.toLowerCase().includes(search)) ||
            doctorName.includes(search) ||
            patientName.includes(search)
        );
    });

    if (loading) return <Spinner fullScreen />;
    
    if (error) return (
        <div className="p-8">
            <ErrorState 
                title="Something went wrong" 
                message={error} 
                onRetry={fetchConsultations} 
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Consultations" 
                description="Manage patient consultations and diagnoses."
                actions={
                    <Button onClick={() => navigate('/consultations/new')} icon={Plus}>
                        New Consultation
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search Diagnosis, Doctor, Patient..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredConsultations.length === 0 ? (
                    <div className="p-12">
                        <EmptyState 
                            title={searchTerm ? "No consultations found" : "No consultations yet"}
                            description={searchTerm ? "Try adjusting your search terms" : "Get started by creating a new consultation"}
                            icon={FileText}
                            action={!searchTerm && (
                                <Button onClick={() => navigate('/consultations/new')} variant="outline">
                                    New Consultation
                                </Button>
                            )}
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Diagnosis</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredConsultations.map((item) => (
                                <TableRow key={item.consultationId}>
                                    <td className="p-4 font-medium text-gray-900">#{item.consultationId}</td>
                                    <td className="p-4 text-gray-500 whitespace-nowrap">{getFormattedDate(item.appointmentId)}</td>
                                    <td className="p-4 text-gray-900">{getDoctorName(item.appointmentId)}</td>
                                    <td className="p-4 text-gray-500">{getPatientName(item.appointmentId)}</td>
                                    <td className="p-4 text-gray-900 font-medium">{item.diagnosis || '-'}</td>
                                    <td className="p-4 text-gray-500 max-w-xs truncate">{item.notes || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/consultations/${item.consultationId}/edit`)}
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
                                                    setDeleteId(item.consultationId || item.id);
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
                title="Delete Consultation"
                message="Are you sure you want to delete this consultation? This action cannot be undone."
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

export default ConsultationsListPage;
