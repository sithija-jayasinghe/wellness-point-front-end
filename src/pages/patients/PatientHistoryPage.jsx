import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, User, Pill, Activity, Stethoscope } from 'lucide-react';
import { getAllPatients } from '../../api/patients.api';
import { getAllAppointments } from '../../api/appointments.api';
import { getAllConsultations } from '../../api/consultations.api';
import { getAllPrescriptions } from '../../api/prescriptions.api';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllSchedules } from '../../api/schedules.api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

const PatientHistoryPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();

    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch all required data
            const [
                patientsData, 
                appointmentsData, 
                consultationsData, 
                prescriptionsData, 
                doctorsData, 
                schedulesData
            ] = await Promise.all([
                getAllPatients(),
                getAllAppointments(),
                getAllConsultations(),
                getAllPrescriptions(),
                getAllDoctors(),
                getAllSchedules()
            ]);

            const patientData = patientsData.find(p => p.id === parseInt(id) || p.id === id);
            
            if (patientData) {
                setPatient(patientData);
                
                // Process medical history
                // 1. Get all appointments for this patient
                const patientAppointments = appointmentsData.filter(apt => 
                    apt.patientId === patientData.id || apt.patientId === String(patientData.id)
                );

                // 2. Map appointments to history records
                const fullHistory = patientAppointments.map(apt => {
                    // Resolve Doctor Name
                    let doctorName = 'Unknown Doctor';
                    if (apt.doctor && apt.doctor.name) {
                        doctorName = apt.doctor.name;
                    } else if (apt.scheduleId) {
                        const schedule = schedulesData.find(s => s.id === apt.scheduleId);
                        if (schedule && schedule.doctorId) {
                            const doctor = doctorsData.find(d => d.id === schedule.doctorId);
                            if (doctor) doctorName = doctor.name;
                        }
                    }

                    // Find Consultation
                    const consultation = consultationsData.find(c => c.appointmentId === apt.id);
                    
                    // Find Prescription (linked to consultation)
                    let prescription = null;
                    if (consultation) {
                        prescription = prescriptionsData.find(p => p.consultationId === consultation.consultationId);
                    }

                    // Format date (handle array or string)
                    let dateStr = apt.appointmentTime;
                    if (Array.isArray(apt.appointmentTime)) {
                        const [year, month, day] = apt.appointmentTime;
                        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    }

                    return {
                        id: apt.id,
                        date: dateStr,
                        doctorName,
                        consultation,
                        prescription,
                        status: apt.status
                    };
                });
                
                // Sort by date descending
                fullHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

                setHistory(fullHistory);
            } else {
                toast({
                    title: 'Error',
                    description: 'Patient not found',
                    variant: 'destructive'
                });
                navigate('/patients');
            }
        } catch (err) {
            console.error('Failed to fetch patient data', err);
            toast({
                title: 'Error',
                description: 'Failed to load medical history',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!patient) return null;

    return (
        <div className="space-y-6">
             <PageHeader
                title="Medical History" 
                description={`Medical records for ${patient.name}`}
                actions={
                    <Button variant="ghost" onClick={() => navigate('/patients')} icon={ArrowLeft}>
                        Back to List
                    </Button>
                }
            />

            {/* Patient Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{patient.name}</h2>
                        <div className="text-sm text-gray-500 space-x-2">
                             <span>NIC: {patient.nic}</span>
                             <span>•</span>
                             <span>{patient.gender}</span>
                             <span>•</span>
                             <span>{patient.phone}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Medical History</h3>
                
                {history.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                         <EmptyState 
                            title="No medical history" 
                            description="No medical records found for this patient." 
                            icon={FileText}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((record, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                                <div className="flex flex-col gap-4">
                                    
                                    {/* Header: Date, Doctor, Status */}
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                                            <span className="text-gray-300">|</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                record.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                record.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {record.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                <Stethoscope className="h-3 w-3" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">Dr. {record.doctorName}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        {/* Consultation Details */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                                <Activity className="h-4 w-4 text-orange-500" />
                                                <h4>Consultation</h4>
                                            </div>
                                            
                                            {record.consultation ? (
                                                <div className="bg-orange-50/50 rounded-lg p-3 space-y-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 block text-xs uppercase tracking-wide">Diagnosis</span>
                                                        <span className="font-medium text-gray-900">{record.consultation.diagnosis || 'No diagnosis recorded'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block text-xs uppercase tracking-wide">Notes</span>
                                                        <p className="text-gray-700 mt-1">{record.consultation.notes || 'No notes available'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500 italic px-2">
                                                    No consultation record found.
                                                </div>
                                            )}
                                        </div>

                                        {/* Prescription Details */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                                <Pill className="h-4 w-4 text-emerald-500" />
                                                <h4>Prescription</h4>
                                            </div>

                                            {record.prescription ? (
                                                <div className="bg-emerald-50/50 rounded-lg p-3 space-y-3">
                                                    {record.prescription.prescriptionItems && record.prescription.prescriptionItems.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {record.prescription.prescriptionItems.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-start text-sm border-b border-emerald-100 last:border-0 pb-2 last:pb-0">
                                                                    <div>
                                                                        <span className="font-medium text-gray-900">{item.medicineName}</span>
                                                                        <div className="text-xs text-gray-500">{item.dosage} • {item.duration}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">No medicines listed.</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500 italic px-2">
                                                    No prescription issued.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientHistoryPage;
