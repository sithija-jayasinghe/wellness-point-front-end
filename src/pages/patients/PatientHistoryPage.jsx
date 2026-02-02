import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, User } from 'lucide-react';
import { getPatientHistory, getAllPatients } from '../../api/patients.api';
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
            
            // Need patient details first
            const patients = await getAllPatients();
            const patientData = patients.find(p => p.id === parseInt(id) || p.id === id);
            
            if (patientData) {
                setPatient(patientData);
                // Fetch history
                const historyData = await getPatientHistory(id);
                setHistory(historyData || []);
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
                <h3 className="text-lg font-semibold text-gray-900">Consultation History</h3>
                
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
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>{record.date || 'Unknown Date'}</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">{record.diagnosis || 'Diagnosis'}</h4>
                                        <p className="text-gray-600">{record.treatment || 'Treatment details'}</p>
                                        
                                        {record.notes && (
                                            <div className="mt-2 bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                                                <span className="font-medium text-gray-900">Notes: </span>
                                                {record.notes}
                                            </div>
                                        )}
                                    </div>
                                    {record.doctorName && (
                                        <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full whitespace-nowrap self-start">
                                            Dr. {record.doctorName}
                                        </div>
                                    )}
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
