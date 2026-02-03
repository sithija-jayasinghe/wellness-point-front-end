import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/useToast';
import { getAllRoles, addRole, addPermissionToRole } from '../../api/roles.api';
import { getAllPermissions } from '../../api/permissions.api';

const RolesListPage = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddRole, setShowAddRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    
    // Assignment state
    const [assigningRole, setAssigningRole] = useState(null);
    const [selectedPermission, setSelectedPermission] = useState('');

    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesData, permissionsData] = await Promise.all([
                getAllRoles(),
                getAllPermissions()
            ]);
            // Assuming rolesData is strict array of roles
            setRoles(rolesData || []);
            setPermissions(permissionsData || []);
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to fetch data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateRole = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        try {
            await addRole({ name: newRoleName });
            toast({ title: 'Role created successfully', variant: 'success' });
            setNewRoleName('');
            setShowAddRole(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to create role', variant: 'destructive' });
        }
    };

    const handleAssignPermission = async () => {
        if (!assigningRole || !selectedPermission) return;

        try {
            await addPermissionToRole(assigningRole.name, selectedPermission);
            toast({ title: `Permission assigned to ${assigningRole.name}`, variant: 'success' });
            setAssigningRole(null);
            setSelectedPermission('');
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to assign permission', variant: 'destructive' });
        }
    };

    if (loading && roles.length === 0) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Roles" 
                description="Manage user roles and assign permissions to them."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.location.href = '/permissions'}>
                            Manage Permissions
                        </Button>
                        <Button onClick={() => setShowAddRole(!showAddRole)}>
                            {showAddRole ? 'Cancel' : 'Add Role'}
                        </Button>
                    </div>
                } 
            />

            {showAddRole && (
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-w-md">
                    <h3 className="text-lg font-medium mb-4">Create New Role</h3>
                    <form onSubmit={handleCreateRole} className="space-y-4">
                        <Input 
                            label="Role Name" 
                            value={newRoleName} 
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="e.g. ADMIN_USER"
                            required
                        />
                        <div className="flex justify-end gap-2">
                             <Button type="button" variant="ghost" onClick={() => setShowAddRole(false)}>Cancel</Button>
                             <Button type="submit">Create Role</Button>
                        </div>
                    </form>
                </div>
            )}

            {assigningRole && (
                <div className="bg-white p-4 rounded-lg border border-cyan-200 bg-cyan-50 shadow-sm max-w-xl">
                    <h3 className="text-lg font-medium mb-4">Assign Permission to <span className="font-bold">{assigningRole.name}</span></h3>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Permission</label>
                            <Select 
                                value={selectedPermission} 
                                onChange={(e) => setSelectedPermission(e.target.value)}
                            >
                                <option value="">-- Choose Permission --</option>
                                {permissions.map(p => (
                                    <option key={p.code || p.id} value={p.code}>
                                        {p.code} - {p.description}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setAssigningRole(null)}>Cancel</Button>
                            <Button onClick={handleAssignPermission} disabled={!selectedPermission}>Assign</Button>
                        </div>
                    </div>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Role Name</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                                No roles found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        roles.map((role) => (
                            <TableRow key={role.id || role.name}>
                                <TableCell className="font-medium">{role.name}</TableCell>
                                <TableCell>
                                    {role.permissions && role.permissions.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.map((p, idx) => (
                                                <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                    {typeof p === 'string' ? p : p.code}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">No permissions</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            setAssigningRole(role);
                                            setShowAddRole(false);
                                            // Scroll to top or assignment area
                                        }}
                                    >
                                        Assign Permission
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default RolesListPage;
