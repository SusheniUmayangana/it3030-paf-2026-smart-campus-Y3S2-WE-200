import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getUserNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService';
import { Bell, CheckCircle, XCircle, Calendar, Trash2, CheckCheck, X, Inbox } from 'lucide-react';

const Notifications = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, READ

    const loadNotifications = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await getUserNotifications(user.id);
            setNotifications(res.data || []);
        } catch (err) {
            toast.error("Failed to load notifications");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, [user?.id]);

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            toast.error("Failed to mark as read");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success("All notifications marked as read");
        } catch (err) {
            toast.error("Failed to mark all as read");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success("Notification deleted");
        } catch (err) {
            toast.error("Failed to delete notification");
        }
    };

    const getRelativeTime = (isoString) => {
        const now = new Date();
        const date = new Date(isoString);
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay === 1) return 'Yesterday';
        if (diffDay < 7) return `${diffDay}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'BOOKING_CREATED':
                return {
                    icon: <Calendar size={20} />,
                    color: 'text-blue-400',
                    bgColor: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/20',
                    barColor: 'bg-blue-500',
                    label: 'New Booking'
                };
            case 'BOOKING_APPROVED':
                return {
                    icon: <CheckCircle size={20} />,
                    color: 'text-emerald-400',
                    bgColor: 'bg-emerald-500/10',
                    borderColor: 'border-emerald-500/20',
                    barColor: 'bg-emerald-500',
                    label: 'Approved'
                };
            case 'BOOKING_REJECTED':
                return {
                    icon: <XCircle size={20} />,
                    color: 'text-rose-400',
                    bgColor: 'bg-rose-500/10',
                    borderColor: 'border-rose-500/20',
                    barColor: 'bg-rose-500',
                    label: 'Rejected'
                };
            default:
                return {
                    icon: <Bell size={20} />,
                    color: 'text-slate-400',
                    bgColor: 'bg-slate-500/10',
                    borderColor: 'border-slate-500/20',
                    barColor: 'bg-slate-500',
                    label: 'Notification'
                };
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'UNREAD') return !n.read;
        if (filter === 'READ') return n.read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-10 bg-slate-950 min-h-screen text-white">
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } }} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Notifications
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up!'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                        {['ALL', 'UNREAD', 'READ'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    filter === f
                                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {f === 'ALL' ? `All (${notifications.length})` :
                                 f === 'UNREAD' ? `Unread (${unreadCount})` :
                                 `Read (${notifications.length - unreadCount})`}
                            </button>
                        ))}
                    </div>

                    {/* Mark all as read */}
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                            <CheckCheck size={14} /> Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="glass border-dashed border-slate-800 rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Inbox className="text-slate-500" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">
                        {filter === 'UNREAD' ? 'No unread notifications' : filter === 'READ' ? 'No read notifications' : 'No notifications yet'}
                    </h3>
                    <p className="text-slate-500 text-sm">
                        {filter === 'ALL' ? "You'll receive notifications when bookings are created, approved, or rejected." : 'Try changing the filter above.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map((notification) => {
                        const config = getTypeConfig(notification.type);
                        return (
                            <div
                                key={notification.id}
                                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                className={`group relative glass rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                    notification.read
                                        ? 'bg-slate-900/20 border-slate-800/50 hover:border-slate-700'
                                        : 'bg-slate-900/60 border-slate-700 hover:border-slate-600 shadow-lg shadow-indigo-500/5'
                                }`}
                            >
                                {/* Left color bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.barColor} ${notification.read ? 'opacity-30' : 'opacity-100'}`}></div>

                                <div className="flex items-start gap-4 p-5 pl-6">
                                    {/* Icon */}
                                    <div className={`shrink-0 w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center ${config.color} mt-0.5`}>
                                        {config.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${config.bgColor} ${config.color} ${config.borderColor}`}>
                                                {config.label}
                                            </span>
                                            {!notification.read && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                            )}
                                        </div>
                                        <h4 className={`text-sm font-bold mb-1 ${notification.read ? 'text-slate-400' : 'text-white'}`}>
                                            {notification.title}
                                        </h4>
                                        <p className={`text-sm leading-relaxed ${notification.read ? 'text-slate-500' : 'text-slate-300'}`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {getRelativeTime(notification.createdAt)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-all"
                                                title="Mark as read"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Notifications;