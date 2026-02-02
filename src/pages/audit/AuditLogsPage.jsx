import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { getAllLogs, getLogsByUserId } from '../../api/auditLogs.api';
import { getUser } from '../../auth/authStorage';
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
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const user = getUser();
    const isAdmin = user?.role === 'ADMIN';

    console.log('Current User:', user);
    console.log('Is Admin:', isAdmin);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            let data = [];
            if (isAdmin) {
                console.log('Fetching ALL logs...');
                data = await getAllLogs();
            } else if (user?.userId || user?.id) {
                const uid = user.userId || user.id;
                console.log(`Fetching logs for user ${uid}...`);
                data = await getLogsByUserId(uid);
            } else {
                console.warn('No user ID found, and not admin. Cannot fetch logs.');
            }

            console.log('Fetched Logs:', data);
            setLogs(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
            setError('Failed to load audit logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    const safeLogs = Array.isArray(logs) ? logs : [];
    const filteredLogs = safeLogs.filter(log => 
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId?.toString().includes(searchTerm)
    );

    if (loading) return <Spinner fullScreen />;
    
    if (error) return (
        <ErrorState 
            title="Something went wrong" 
            description={error} 
            onRetry={fetchLogs} 
        />
    );

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Audit Logs" 
                subtitle={isAdmin ? "View all system activities" : "View your activities"}
                action={
                    <Button onClick={fetchLogs} icon={RefreshCw} variant="outline">
                        Refresh
                    </Button>
                }
            />

            <div className="flex justify-between items-center gap-4">
                <div className="w-72">
                    <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={Search}
                    />
                </div>
            </div>

            {filteredLogs.length === 0 ? (
                <EmptyState
                    title="No audit logs found"
                    description={searchTerm ? "Try adjusting your search terms" : "No activity recorded yet"}
                />
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Entity ID</TableHead>
                            {isAdmin && <TableHead>User ID</TableHead>}
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.map((log) => (
                            <TableRow key={log.id}>
                                <td className="p-4 align-middle font-medium">{log.id}</td>
                                <td className="p-4 align-middle">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 align-middle">{log.entity}</td>
                                <td className="p-4 align-middle">{log.entityId}</td>
                                {isAdmin && <td className="p-4 align-middle">{log.userId}</td>}
                                <td className="p-4 align-middle text-gray-500">
                                    {formatDate(log.timestamp)}
                                </td>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};

export default AuditLogsPage;
