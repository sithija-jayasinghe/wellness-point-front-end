import React, { useState, useEffect } from 'react';
import { Bell, Search, Send, Trash2, User, RefreshCw, Mail } from 'lucide-react';
import { getAllNotifications, getNotificationsByUserId, sendNotification, deleteNotification } from '../../api/notifications.api';
import { getUser } from '../../auth/authStorage';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useToast } from '../../components/useToast';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { cn } from '../../utils';

const NotificationsPage = () => {
    const { toast } = useToast();
    const user = getUser();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState('my'); // 'my' or 'all'
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Send Form State
    const [showSendForm, setShowSendForm] = useState(false);
    const [formData, setFormData] = useState({ userId: '', message: '' });
    const [sending, setSending] = useState(false);

    // Helper to format Java LocalDateTime array or string
    const parseDate = (dateData) => {
        if (!dateData) return new Date();
        
        if (Array.isArray(dateData)) {
            const [year, month, day, hour, minute, second = 0] = dateData;
            return new Date(year, month - 1, day, hour, minute, second);
        }
        return new Date(dateData);
    };

    useEffect(() => {
        fetchNotifications();
    }, [activeTab]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            let data = [];
            if (activeTab === 'all' && isAdmin) {
                data = await getAllNotifications();
            } else {
                // Determine User ID (fallback to 1 if testing without auth)
                // Check both userId (API login) and id properties
                const userId = user?.userId || user?.id || 1; 
                data = await getNotificationsByUserId(userId);
            }
            
            // Fix: Ensure data is an array before sorting
            if (!Array.isArray(data)) {
                 // Try to handle potential wrapper object (e.g. { content: [...] }) or just default to empty
                 data = data?.content || [];
            }
            
            if (Array.isArray(data)) {
                 // Sort by date desc (if not sorted by backend)
                 data.sort((a, b) => parseDate(b.sentAt) - parseDate(a.sentAt));
                 setNotifications(data);
            } else {
                 setNotifications([]); // Safety fallback
            }
            
            setError(null);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
            setError('Failed to load notifications.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        try {
            await deleteNotification(id);
            toast({ title: 'Success', description: 'Notification deleted', variant: 'success' });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete', err);
            toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!formData.userId || !formData.message) {
            toast({ title: 'Error', description: 'User ID and Message are required', variant: 'destructive' });
            return;
        }

        try {
            setSending(true);
            await sendNotification({
                userId: parseInt(formData.userId),
                message: formData.message,
                sentAt: new Date().toISOString()
            });
            toast({ title: 'Success', description: 'Notification sent successfully', variant: 'success' });
            setFormData({ userId: '', message: '' });
            setShowSendForm(false);
            if (activeTab === 'all') fetchNotifications();
        } catch (err) {
            console.error('Failed to send', err);
            toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
        } finally {
            setSending(false);
        }
    };

    const filteredNotifications = notifications.filter(n => 
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(n.userId).includes(searchTerm)
    );

    const formatTime = (dateData) => {
        const date = parseDate(dateData);
        return isNaN(date.getTime()) ? 'Just now' : date.toLocaleString();
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="Notifications"
                description="View and manage system alerts."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={fetchNotifications} title="Refresh" icon={RefreshCw}>
                            Refresh
                        </Button>
                        {isAdmin && (
                            <Button 
                                onClick={() => setShowSendForm(!showSendForm)} 
                                variant={showSendForm ? "secondary" : "default"}
                                icon={showSendForm ? undefined : Send}
                            >
                                {showSendForm ? 'Cancel' : 'Send Notification'}
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Admin Tabs */}
            {isAdmin && (
                <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'my' ? "bg-white text-cyan-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                        )}
                    >
                        My Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'all' ? "bg-white text-cyan-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                        )}
                    >
                        All System Alerts
                    </button>
                </div>
            )}

            {/* Send Notification Form (Collapsible) */}
            {showSendForm && (
                <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Send className="h-4 w-4 text-blue-500" /> Send New Notification
                    </h3>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target User ID</label>
                            <Input 
                                type="number" 
                                placeholder="Enter User ID (e.g. 101)"
                                value={formData.userId}
                                onChange={e => setFormData({...formData, userId: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea 
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none min-h-[100px]"
                                placeholder="Type your message here..."
                                value={formData.message}
                                onChange={e => setFormData({...formData, message: e.target.value})}
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={sending} icon={sending ? undefined : Send}>
                                {sending ? 'Sending...' : 'Send Message'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notifications List */}
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder={activeTab === 'all' ? "Search message or User ID..." : "Search messages..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center"><Spinner /></div>
                ) : error ? (
                    <ErrorState message={error} onRetry={fetchNotifications} />
                ) : filteredNotifications.length === 0 ? (
                    <EmptyState 
                        title="No notifications" 
                        description="You're all caught up! No recent alerts." 
                        icon={Bell} 
                    />
                ) : (
                    <div className="grid gap-3">
                        {filteredNotifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 group"
                            >
                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-gray-900 truncate">
                                            {activeTab === 'all' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                                                    User #{notification.userId}
                                                </span>
                                            )}
                                            System Notification
                                        </h4>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {formatTime(notification.sentAt)}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {notification.message}
                                    </p>
                                </div>
                                {(isAdmin || activeTab === 'my') && (
                                    <button 
                                        onClick={() => handleDelete(notification.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
