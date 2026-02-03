import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/useToast';
import { getAllPermissions, addPermission } from '../../api/permissions.api';

const PermissionsListPage = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newItem, setNewItem] = useState({ code: '', description: '' });

    const { toast } = useToast();

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const data = await getAllPermissions();
            setPermissions(data || []);
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to fetch permissions', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newItem.code.trim()) return;

        try {
            await addPermission(newItem);
            toast({ title: 'Permission added successfully', variant: 'success' });
            setNewItem({ code: '', description: '' });
            setShowAdd(false);
            fetchPermissions();
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to add permission', variant: 'destructive' });
        }
    };

    if (loading && permissions.length === 0) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Permissions" 
                description="View and manage system permissions."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.location.href = '/roles'}>
                            Back to Roles
                        </Button>
                        <Button onClick={() => setShowAdd(!showAdd)}>
                            {showAdd ? 'Cancel' : 'Add Permission'}
                        </Button>
                    </div>
                } 
            />

            {showAdd && (
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-w-md">
                    <h3 className="text-lg font-medium mb-4">Add New Permission</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Input 
                            label="Permission Code" 
                            value={newItem.code} 
                            onChange={(e) => setNewItem({...newItem, code: e.target.value})}
                            placeholder="e.g. VIEW_DASHBOARD"
                            required
                        />
                        <Textarea 
                            label="Description" 
                            value={newItem.description} 
                            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                            placeholder="Description of what this permission allows..."
                        />
                        <div className="flex justify-end gap-2">
                             <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                             <Button type="submit">Save Permission</Button>
                        </div>
                    </form>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {permissions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                                No permissions found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        permissions.map((p) => (
                            <TableRow key={p.id || p.code}>
                                <TableCell className="font-medium font-mono text-xs text-cyan-700">{p.code}</TableCell>
                                <TableCell>{p.description}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default PermissionsListPage;
