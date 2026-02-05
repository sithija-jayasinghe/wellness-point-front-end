import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Trash2, Edit, X, RefreshCw, Eye } from 'lucide-react';
import { getAllPrescriptions, deletePrescription } from '../../api/prescriptions.api';
import { getAllConsultations } from '../../api/consultations.api';
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

const PrescriptionsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [prescriptions, setPrescriptions] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [deleteId, setDeleteId] = useState(null);
    const [viewingPrescription, setViewingPrescription] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const [
                prescriptionsData,
                consultationsData,
                appointmentsData,
                schedulesData,
                doctorsData,
                patientsData
            ] = await Promise.all([
                getAllPrescriptions(),
                getAllConsultations(),
                getAllAppointments(),
                getAllSchedules(),
                getAllDoctors(),
                getAllPatients()
            ]);

            setPrescriptions(prescriptionsData);
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

    const formatDate = (dateData) => {
        if (!dateData) return '-';
        try {
            if (Array.isArray(dateData)) {
                const [year, month, day] = dateData;
                return new Date(year, month - 1, day).toLocaleDateString();
            }
            return new Date(dateData).toLocaleDateString();
        } catch (e) {
            return String(dateData);
        }
    };

    const getDoctorName = (prescription) => {
        try {
            // Helper for robust ID matching (handles string/number mismatch)
            const matchId = (a, b) => a && b && String(a) === String(b);

            // Get Consultation
            const consultId = prescription.consultationId || prescription.consultation?.id || prescription.consultation?.consultationId;
            if (!consultId) return 'No Consult ID';
            
            const consultation = consultations.find(c => matchId(c.consultationId, consultId) || matchId(c.id, consultId));
            if (!consultation) return 'Unknown Consult'; // Debug: Consult not found in list

            // Get Appointment
            const apptId = consultation.appointmentId || consultation.appointment?.id;
            const appointment = appointments.find(a => matchId(a.id, apptId));
            if (!appointment) return 'Unknown Appt'; // Debug: Appt not found

            // Get Schedule
            const schedId = appointment.scheduleId || appointment.schedule?.id;
            // Debugging helper
            // console.log(`Looking for Schedule ${schedId}`, schedules); 
            const schedule = schedules.find(s => matchId(s.id, schedId) || matchId(s.scheduleId, schedId));
            
            if (!schedule) return 'Unknown Sched'; 
            
            // Get Doctor
            // Schedule might have doctorId or doctor object
            const docId = schedule.doctorId || schedule.doctor?.id;
            const doctor = doctors.find(d => matchId(d.id, docId));
            
            return doctor ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Unknown Doctor';
        } catch (e) {
            console.error(e);
            return 'Error';
        }
    };

    const getPatientName = (prescription) => {
        try {
            const matchId = (a, b) => a && b && String(a) === String(b);

            // Get Consultation
            const consultId = prescription.consultationId || prescription.consultation?.id || prescription.consultation?.consultationId;
            if (!consultId) return 'No Consult ID';

            const consultation = consultations.find(c => matchId(c.consultationId, consultId) || matchId(c.id, consultId));
            if (!consultation) return 'Unknown Consult';
            
            // Get Appointment
            const apptId = consultation.appointmentId || consultation.appointment?.id;
            const appointment = appointments.find(a => matchId(a.id, apptId));
            if (!appointment) return 'Unknown Appt';
            
            // Get Patient
            // Appointment might have patientId or patient object
            const patientId = appointment.patientId || appointment.patient?.id || appointment.patientId; 
            
            // Try to find in patients list
            const patient = patients.find(p => matchId(p.id, patientId) || matchId(p.patientId, patientId));
            
            // Fallback: if appointment object itself has patient name embedded
            if (!patient && appointment.patientName) return appointment.patientName;
            
            return patient ? patient.name : 'Unknown Patient';
        } catch (e) {
            console.error(e);
            return 'Error';
        }
    };

    const filteredPrescriptions = prescriptions.filter(p => {
        const search = searchTerm.toLowerCase();
        return (
            String(p.prescriptionId).includes(search) ||
            String(p.consultationId).includes(search) ||
            (p.issuedDate && String(p.issuedDate).includes(search))
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
                                <TableHead>Doctor</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Issued Date</TableHead>
                                <TableHead>Medicines</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPrescriptions.map((p) => (
                                <TableRow key={p.prescriptionId}>
                                    <td className="p-4 font-medium text-gray-900">#{p.prescriptionId}</td>
                                    <td className="p-4 text-gray-900 font-medium">{getDoctorName(p)}</td>
                                    <td className="p-4 text-gray-500">{getPatientName(p)}</td>
                                    <td className="p-4 text-gray-500">{formatDate(p.issuedDate)}</td>
                                    <td className="p-4 text-gray-500">
                                        {p.prescriptionItems?.length || 0} items
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewingPrescription(p)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                title="View Items"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
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

            {/* View Modal */}
            {viewingPrescription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Prescription #{viewingPrescription.prescriptionId}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Issued on {formatDate(viewingPrescription.issuedDate)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingPrescription(null)}
                                className="h-8 w-8 p-0 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        <div className="p-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wider">Medicines</h4>
                            <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Medicine Name</TableHead>
                                            <TableHead>Dosage</TableHead>
                                            <TableHead>Duration</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewingPrescription.prescriptionItems && viewingPrescription.prescriptionItems.length > 0 ? (
                                            viewingPrescription.prescriptionItems.map((item, index) => (
                                                <TableRow key={index}>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {item.medicineName}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {item.dosage}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {item.duration}
                                                    </td>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">
                                                    No medicines listed
                                                </td>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end">
                            <Button onClick={() => setViewingPrescription(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrescriptionsListPage;
