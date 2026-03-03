import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FlaskConical, Trash2, Edit, Eye, RefreshCw, X, ClipboardEdit } from 'lucide-react';
import { getAllLabTests, deleteLabTest, updateLabTestStatus, updateLabTestResult } from '../../api/labTests.api';
import { getAllPatients } from '../../api/patients.api';
import { getAllDoctors } from '../../api/doctors.api';
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
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = ['REQUESTED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const LabTestsListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [labTests, setLabTests] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [deleteId, setDeleteId] = useState(null);
    const [processing, setProcessing] = useState(false);

    // View / Update Result modal
    const [viewingTest, setViewingTest] = useState(null);
    const [updatingResult, setUpdatingResult] = useState(null);
    const [resultForm, setResultForm] = useState({ result: '', notes: '' });

    // Status update modal
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [labTestsData, patientsData, doctorsData] = await Promise.all([
                getAllLabTests(),
                getAllPatients().catch(() => []),
                getAllDoctors().catch(() => []),
            ]);
            setLabTests(labTestsData);
            setPatients(patientsData);
            setDoctors(doctorsData);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch lab tests', err);
            setError('Failed to load lab tests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPatientName = (patientId) => {
        if (!patientId) return '-';
        const patient = patients.find(p => String(p.id) === String(patientId));
        return patient ? (patient.name || patient.patientName || `Patient #${patientId}`) : `Patient #${patientId}`;
    };

    const getDoctorName = (doctorId) => {
        if (!doctorId) return '-';
        const doctor = doctors.find(d => String(d.id) === String(doctorId));
        if (!doctor) return `Doctor #${doctorId}`;
        const name = doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
        return name.startsWith('Dr.') ? name : `Dr. ${name}`;
    };

    const formatDate = (dateData) => {
        if (!dateData) return '-';
        try {
            if (Array.isArray(dateData)) {
                const [year, month, day, hour = 0, minute = 0] = dateData;
                const d = new Date(year, month - 1, day, hour, minute);
                return d.toLocaleString();
            }
            return new Date(dateData).toLocaleString();
        } catch {
            return String(dateData);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            REQUESTED: 'bg-yellow-100 text-yellow-700',
            SAMPLE_COLLECTED: 'bg-blue-100 text-blue-700',
            IN_PROGRESS: 'bg-purple-100 text-purple-700',
            COMPLETED: 'bg-emerald-100 text-emerald-700',
            CANCELLED: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {status?.replace(/_/g, ' ') || 'Unknown'}
            </span>
        );
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            setProcessing(true);
            await deleteLabTest(deleteId);
            toast({ title: 'Success', description: 'Lab test deleted', variant: 'success' });
            setLabTests(prev => prev.filter(item => item.id !== deleteId));
        } catch (err) {
            console.error('Failed to delete lab test', err);
            toast({ title: 'Error', description: 'Failed to delete lab test', variant: 'destructive' });
        } finally {
            setProcessing(false);
            setDeleteId(null);
        }
    };

    const handleUpdateResult = async () => {
        if (!updatingResult) return;
        try {
            setProcessing(true);
            const updated = await updateLabTestResult(updatingResult.id, resultForm.result, resultForm.notes);
            toast({ title: 'Success', description: 'Lab test result updated', variant: 'success' });
            setLabTests(prev => prev.map(t => t.id === updatingResult.id ? updated : t));
            setUpdatingResult(null);
            setResultForm({ result: '', notes: '' });
        } catch (err) {
            console.error('Failed to update result', err);
            toast({ title: 'Error', description: 'Failed to update result', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!updatingStatus || !newStatus) return;
        try {
            setProcessing(true);
            const updated = await updateLabTestStatus(updatingStatus.id, newStatus);
            toast({ title: 'Success', description: 'Status updated', variant: 'success' });
            setLabTests(prev => prev.map(t => t.id === updatingStatus.id ? updated : t));
            setUpdatingStatus(null);
            setNewStatus('');
        } catch (err) {
            console.error('Failed to update status', err);
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const filteredTests = labTests.filter(test => {
        const matchesSearch = !searchTerm ||
            (test.testName && test.testName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (test.testCode && test.testCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
            getPatientName(test.patientId).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || test.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Lab Tests"
                description="Manage laboratory tests and results"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData} icon={RefreshCw}>Refresh</Button>
                        <Button onClick={() => navigate('/lab-tests/new')} icon={FlaskConical}>New Lab Test</Button>
                    </div>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by test name, code, or patient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {filteredTests.length === 0 ? (
                <EmptyState
                    icon={FlaskConical}
                    title="No lab tests found"
                    description={searchTerm || statusFilter ? "Try adjusting your search or filter." : "Create your first lab test to get started."}
                    actionLabel="New Lab Test"
                    onAction={() => navigate('/lab-tests/new')}
                />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Test Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Requested</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTests.map((test) => (
                                    <TableRow key={test.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{test.testName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{test.testCode || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{getPatientName(test.patientId)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{getDoctorName(test.doctorId)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(test.requestedDate)}</td>
                                        <td className="px-4 py-3">{getStatusBadge(test.status)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => setViewingTest(test)}
                                                    className="p-1.5 text-gray-400 hover:text-cyan-600 rounded-lg hover:bg-gray-50"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setUpdatingResult(test);
                                                        setResultForm({ result: test.result || '', notes: test.notes || '' });
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-50"
                                                    title="Update Result"
                                                >
                                                    <ClipboardEdit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setUpdatingStatus(test);
                                                        setNewStatus(test.status || '');
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50"
                                                    title="Update Status"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => setDeleteId(test.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewingTest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewingTest(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Lab Test Details</h3>
                            <button onClick={() => setViewingTest(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div><span className="text-gray-500">Test Name:</span> <p className="font-medium">{viewingTest.testName}</p></div>
                                <div><span className="text-gray-500">Test Code:</span> <p className="font-medium">{viewingTest.testCode || '-'}</p></div>
                                <div><span className="text-gray-500">Patient:</span> <p className="font-medium">{getPatientName(viewingTest.patientId)}</p></div>
                                <div><span className="text-gray-500">Doctor:</span> <p className="font-medium">{getDoctorName(viewingTest.doctorId)}</p></div>
                                <div><span className="text-gray-500">Status:</span> <div className="mt-1">{getStatusBadge(viewingTest.status)}</div></div>
                                <div><span className="text-gray-500">Requested:</span> <p className="font-medium">{formatDate(viewingTest.requestedDate)}</p></div>
                                {viewingTest.completedDate && (
                                    <div><span className="text-gray-500">Completed:</span> <p className="font-medium">{formatDate(viewingTest.completedDate)}</p></div>
                                )}
                            </div>
                            {viewingTest.description && (
                                <div><span className="text-gray-500">Description:</span> <p className="font-medium mt-1">{viewingTest.description}</p></div>
                            )}
                            {viewingTest.result && (
                                <div><span className="text-gray-500">Result:</span> <p className="font-medium mt-1 bg-gray-50 p-3 rounded-lg">{viewingTest.result}</p></div>
                            )}
                            {viewingTest.notes && (
                                <div><span className="text-gray-500">Notes:</span> <p className="font-medium mt-1">{viewingTest.notes}</p></div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button variant="outline" onClick={() => setViewingTest(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Result Modal */}
            {updatingResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setUpdatingResult(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Update Result - {updatingResult.testName}</h3>
                            <button onClick={() => setUpdatingResult(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Result <span className="text-red-500">*</span></label>
                                <textarea
                                    value={resultForm.result}
                                    onChange={e => setResultForm(prev => ({ ...prev, result: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Enter test result..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={resultForm.notes}
                                    onChange={e => setResultForm(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setUpdatingResult(null)}>Cancel</Button>
                            <Button onClick={handleUpdateResult} disabled={!resultForm.result || processing}>
                                {processing ? 'Saving...' : 'Save Result'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {updatingStatus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setUpdatingStatus(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Update Status - {updatingStatus.testName}</h3>
                            <button onClick={() => setUpdatingStatus(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={newStatus}
                                onChange={e => setNewStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setUpdatingStatus(null)}>Cancel</Button>
                            <Button onClick={handleUpdateStatus} disabled={processing}>
                                {processing ? 'Updating...' : 'Update Status'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Lab Test"
                message="Are you sure you want to delete this lab test? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={processing}
            />
        </div>
    );
};

export default LabTestsListPage;
