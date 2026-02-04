import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Edit, Trash2, Ban } from 'lucide-react';
import { getAllUsers, deleteUser, updateUser } from '../../api/users.api';
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

const UsersListPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch users', err);
            if (err.response && err.response.status === 403) {
                setError('Access Denied: You do not have permission to view users. Please check your role (ADMIN is required).');
            } else {
                setError('Failed to load users. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        
        try {
            setDeleting(true);
            await deleteUser(deleteId);
            
            setUsers(prev => prev.filter(item => (item.userId || item.id) !== deleteId));

            toast({
                title: 'Success',
                description: 'User deleted successfully',
                variant: 'success'
            });
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete user', err);
            
            const backendMsg = err.response?.data?.message || "";
            // Check if foreign key error: Switch to Deactivate
            if (backendMsg.includes("foreign key") || backendMsg.includes("constraint") || err.response?.status === 500) {
                 const userToDeactivate = users.find(u => (u.userId || u.id) === deleteId);
                 if (userToDeactivate) {
                     try {
                         // Prepare strictly clean payload for update
                         // Only send fields that the `updateUser` endpoint usually expects
                         const payload = {
                             username: userToDeactivate.username,
                             email: userToDeactivate.email,
                             role: userToDeactivate.role, 
                             status: 'INACTIVE'
                         };
                         
                         // Handle clinicId specifically
                         if (userToDeactivate.clinic && typeof userToDeactivate.clinic === 'object') {
                             payload.clinicId = userToDeactivate.clinic.id;
                         } else if (userToDeactivate.clinicId) {
                             payload.clinicId = userToDeactivate.clinicId;
                         } else {
                             payload.clinicId = null;
                         }

                         // Ensure ID type match
                         if (payload.clinicId) payload.clinicId = parseInt(payload.clinicId);

                         // Attempt Soft Delete
                         await updateUser(deleteId, payload);
                         
                         setUsers(prev => prev.map(item => {
                            if ((item.userId || item.id) === deleteId) {
                                return { ...item, status: 'INACTIVE' };
                            }
                            return item;
                        }));

                         toast({
                             title: 'Deactivated',
                             description: 'User could not be deleted due to associated records, so they were deactivated instead.',
                             variant: 'warning' 
                         });
                         setDeleteId(null);
                         return;
                     } catch (updateErr) {
                         console.error("Failed to deactivate", updateErr);
                         toast({
                             title: 'Action Failed',
                             description: 'Cannot delete user due to dependencies. Please try editing the user and setting status to Inactive.',
                             variant: 'destructive'
                         });
                         // We handled the UI feedback, so return to avoid showing the generic error below
                         setDeleteId(null); 
                         return;
                     }
                 }
            }

            let description = 'Failed to delete user';

            if (backendMsg) {
                // Intercept raw database errors and show friendly message
                if (backendMsg.includes("foreign key constraint fails") || backendMsg.includes("could not execute statement")) {
                    description = "Cannot delete user. They are currently assigned to a Role or Clinic.";
                } else {
                    description = backendMsg;
                }
            } else if (err.response?.status === 400) {
                 description = "Cannot delete user. They are likely linked to other records.";
            }
            
            toast({
                title: 'Error',
                description: description,
                variant: 'destructive'
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const search = searchTerm.toLowerCase();
        return (
            user.username.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            String(user.userId).includes(search)
        );
    });

    if (loading) return <Spinner fullScreen />;
    
    if (error) return (
        <div className="p-8">
            <ErrorState 
                title="Something went wrong" 
                message={error} 
                onRetry={fetchUsers} 
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Users Management" 
                description="Manage system users and access."
                actions={
                    <Button onClick={() => navigate('/users/new')} icon={Plus}>
                        New User
                    </Button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredUsers.length === 0 ? (
                    <div className="p-12">
                        <EmptyState 
                            title={searchTerm ? "No users found" : "No users yet"}
                            description={searchTerm ? "Try adjusting your search terms" : "Get started by creating a new user"}
                            icon={Users}
                            action={!searchTerm && (
                                <Button onClick={() => navigate('/users/new')} variant="outline">
                                    New User
                                </Button>
                            )}
                        />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.userId}>
                                    <td className="p-4 font-medium text-gray-900">#{user.userId}</td>
                                    <td className="p-4 text-gray-900 font-medium">{user.username}</td>
                                    <td className="p-4 text-gray-500">{user.email}</td>
                                    <td className="p-4 text-gray-500">{user.role}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user.status === 'ACTIVE' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {user.status || 'UNKNOWN'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/users/${user.userId}/edit`)}
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
                                                    setDeleteId(user.userId || user.id);
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
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
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

export default UsersListPage;
