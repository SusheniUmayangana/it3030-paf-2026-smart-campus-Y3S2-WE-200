import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadCount } from '../services/notificationService';

export default function Navbar({ user, onLogout }) {
    const navigate = useNavigate();
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!user?.id) return;

        const fetchUnread = async () => {
            try {
                const res = await getUnreadCount(user.id);
                setUnread(res.data?.count || 0);
            } catch (err) {
                // Silently fail — bell just won't show a count
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, [user?.id]);

    return (
        <nav className="relative z-10 glass !rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <span className="text-lg font-bold tracking-tight">
                    <span className="gradient-text">Smart</span>
                    <span className="text-surface-200"> Campus</span>
                </span>
            </div>

            {user && (
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <button
                        id="notification-bell-btn"
                        onClick={() => navigate('/notifications')}
                        className="relative p-2 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all"
                        title="Notifications"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-1 shadow-lg shadow-rose-500/30 animate-pulse">
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </button>

                    <div className="flex items-center gap-2.5 glass-light rounded-full py-1.5 px-3 pr-4">
                        {user.picture ? (
                            <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full ring-2 ring-primary-500/30" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-xs font-bold text-white">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="text-sm font-medium text-surface-200">{user.name}</span>
                    </div>
                    <button
                        id="logout-btn"
                        onClick={onLogout}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all"
                    >
                        Sign out
                    </button>
                </div>
            )}
        </nav>
    );
}