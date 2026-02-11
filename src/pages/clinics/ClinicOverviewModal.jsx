import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Activity, Stethoscope, Users, User, DollarSign, Loader2 } from 'lucide-react';
import { getAllDoctors } from '../../api/doctors.api';
import { getAllPatients } from '../../api/patients.api';
import { cn } from '../../utils';

const ClinicOverviewModal = ({ clinic, open, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(false);

    useEffect(() => {
        if (open && clinic) {
            setActiveTab('overview');
            fetchClinicDoctors();
            fetchClinicPatients();
        }
        if (!open) {
            setDoctors([]);
            setPatients([]);
        }
    }, [open, clinic]);

    const fetchClinicDoctors = async () => {
        try {
            setLoadingDoctors(true);
            const allDoctors = await getAllDoctors();
            setDoctors(allDoctors.filter(doc =>
                doc.clinics && doc.clinics.some(c => c.id === clinic.id)
            ));
        } catch (err) {
            console.error('Failed to fetch doctors', err);
            setDoctors([]);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const fetchClinicPatients = async () => {
        try {
            setLoadingPatients(true);
            const allPatients = await getAllPatients();
            setPatients(allPatients.filter(p =>
                p.clinics && p.clinics.some(c => c.id === clinic.id)
            ));
        } catch (err) {
            console.error('Failed to fetch patients', err);
            setPatients([]);
        } finally {
            setLoadingPatients(false);
        }
    };

    if (!open || !clinic) return null;

    const tabs = [
        { key: 'overview', label: 'Overview', icon: Building2 },
        { key: 'doctors', label: `Doctors (${loadingDoctors ? '…' : doctors.length})`, icon: Stethoscope },
        { key: 'patients', label: `Patients (${loadingPatients ? '…' : patients.length})`, icon: Users },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-cyan-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">{clinic.name}</h2>
                            <p className="text-xs text-gray-500">Clinic Overview</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6 bg-gray-50/50">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                                activeTab === tab.key
                                    ? 'border-cyan-500 text-cyan-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            )}
                        >
                            <tab.icon className={cn('h-4 w-4', activeTab === tab.key ? 'text-cyan-500' : 'text-gray-400')} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'overview' && (
                        <OverviewTab
                            clinic={clinic}
                            doctorCount={doctors.length}
                            patientCount={patients.length}
                            loading={loadingDoctors || loadingPatients}
                        />
                    )}
                    {activeTab === 'doctors' && <DoctorsTab doctors={doctors} loading={loadingDoctors} />}
                    {activeTab === 'patients' && <PatientsTab patients={patients} loading={loadingPatients} />}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ───── Overview Tab ───── */
const OverviewTab = ({ clinic, doctorCount, patientCount, loading }) => (
    <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
            <StatCard
                icon={Building2}
                label="Status"
                value={
                    <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        clinic.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    )}>
                        {clinic.status || 'Active'}
                    </span>
                }
            />
            <StatCard icon={Stethoscope} label="Doctors" value={loading ? '…' : doctorCount} />
            <StatCard icon={Users} label="Patients" value={loading ? '…' : patientCount} />
        </div>

        {/* Details */}
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 bg-white">
            <DetailRow icon={Building2} label="Clinic Name" value={clinic.name} />
            <DetailRow icon={MapPin} label="Address" value={clinic.address} />
            <DetailRow icon={Phone} label="Phone" value={clinic.phone} />
            <DetailRow icon={Activity} label="Status" value={clinic.status || 'Active'} />
        </div>
    </div>
);

const StatCard = ({ icon: Icon, label, value }) => (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
        <Icon className="h-5 w-5 text-cyan-500 mx-auto mb-2" />
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <div className="mt-1 text-xl font-bold text-gray-900">{value}</div>
    </div>
);

const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 px-4 py-3">
        <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-500 w-28 flex-shrink-0">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
);

/* ───── Doctors Tab ───── */
const DoctorsTab = ({ doctors, loading }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading doctors...</span>
            </div>
        );
    }

    if (doctors.length === 0) {
        return (
            <div className="text-center py-16">
                <Stethoscope className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No doctors assigned</p>
                <p className="text-xs text-gray-400 mt-1">Doctors linked to this clinic will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {doctors.map((doctor) => {
                const displayName = doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
                const isActive = doctor.status === 'ACTIVE' || doctor.status === 'Active';

                return (
                    <div
                        key={doctor.id}
                        className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-cyan-100 flex items-center justify-center">
                                <Stethoscope className="h-4 w-4 text-cyan-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-500">{doctor.specialization || 'General'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {doctor.consultationFee != null && (
                                <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                   <p>LKR</p>
                                    {Number(doctor.consultationFee).toLocaleString()}
                                </span>
                            )}
                            <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            )}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ───── Patients Tab ───── */
const PatientsTab = ({ patients, loading }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading patients...</span>
            </div>
        );
    }

    if (patients.length === 0) {
        return (
            <div className="text-center py-16">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No patients registered</p>
                <p className="text-xs text-gray-400 mt-1">Patients linked to this clinic will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {patients.map((patient) => (
                <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-cyan-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-cyan-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                            <p className="text-xs text-gray-500">{patient.nic || 'No NIC'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {patient.phone && (
                            <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                <Phone className="h-3 w-3" />
                                {patient.phone}
                            </span>
                        )}
                        {patient.gender && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700">
                                {patient.gender}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClinicOverviewModal;
