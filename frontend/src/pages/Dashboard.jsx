import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats, getUserStats } from '../services/dashboardService';

/* ───── SVG icon components ───── */
const FacilitiesIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const BookingsIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const MyBookingsIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

/* ───── Stat card component ───── */
function StatCard({ icon, label, value, color, delay, onClick }) {
    const colorMap = {
        indigo: {
            bg: 'from-indigo-500/20 to-indigo-600/5',
            border: 'border-indigo-500/20',
            iconBg: 'bg-indigo-500/15',
            iconText: 'text-indigo-400',
            value: 'text-indigo-300',
            glow: 'shadow-indigo-500/10',
        },
        emerald: {
            bg: 'from-emerald-500/20 to-emerald-600/5',
            border: 'border-emerald-500/20',
            iconBg: 'bg-emerald-500/15',
            iconText: 'text-emerald-400',
            value: 'text-emerald-300',
            glow: 'shadow-emerald-500/10',
        },
        violet: {
            bg: 'from-violet-500/20 to-violet-600/5',
            border: 'border-violet-500/20',
            iconBg: 'bg-violet-500/15',
            iconText: 'text-violet-400',
            value: 'text-violet-300',
            glow: 'shadow-violet-500/10',
        },
        amber: {
            bg: 'from-amber-500/20 to-amber-600/5',
            border: 'border-amber-500/20',
            iconBg: 'bg-amber-500/15',
            iconText: 'text-amber-400',
            value: 'text-amber-300',
            glow: 'shadow-amber-500/10',
        },
    };

    const c = colorMap[color] || colorMap.indigo;

    return (
        <div
            onClick={onClick}
            className={`
                group relative overflow-hidden rounded-2xl border ${c.border}
                bg-gradient-to-br ${c.bg} backdrop-blur-xl
                p-6 transition-all duration-300 ease-out
                hover:scale-[1.03] hover:shadow-2xl ${c.glow}
                ${onClick ? 'cursor-pointer' : ''}
            `}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Decorative shimmer */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/[0.03] rounded-full blur-2xl
                            group-hover:bg-white/[0.06] transition-all duration-500" />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
                    <p className={`text-4xl font-bold ${c.value} tabular-nums tracking-tight`}>
                        {value !== null ? value.toLocaleString() : (
                            <span className="inline-block w-16 h-9 rounded-lg bg-slate-700/50 animate-pulse" />
                        )}
                    </p>
                </div>
                <div className={`${c.iconBg} ${c.iconText} p-3 rounded-xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* ───── Main Dashboard ───── */
export default function Dashboard({ user }) {
    const navigate = useNavigate();
    const [adminStats, setAdminStats] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'SUPER ADMIN';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (isAdmin) {
                    const res = await getAdminStats();
                    setAdminStats(res.data);
                } else {
                    const res = await getUserStats(user.id);
                    setUserStats(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user, isAdmin]);

    /* Greeting based on time of day */
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="max-w-5xl mx-auto w-full animate-fade-in">
            {/* ── Header ── */}
            <div className="mb-10">
                <div className="flex items-center gap-4 mb-3">
                    {user.picture ? (
                        <img src={user.picture} alt={user.name}
                            className="w-14 h-14 rounded-2xl ring-4 ring-indigo-500/20 shadow-xl shadow-indigo-500/10" />
                    ) : (
                        <div className="w-14 h-14 rounded-2xl ring-4 ring-indigo-500/20
                                        bg-gradient-to-br from-indigo-600 to-emerald-500
                                        flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
                            {getGreeting()}, <span className="gradient-text">{user.name?.split(' ')[0]}</span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
                            {user.email}
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400
                                            text-[10px] font-semibold border border-emerald-500/20 uppercase tracking-wider">
                                {user.role?.replace('_', ' ')}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Admin / SuperAdmin Stats ── */}
            {isAdmin && (
                <section>
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Platform Overview
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <StatCard
                            icon={<FacilitiesIcon />}
                            label="Total Facilities"
                            value={adminStats?.totalFacilities ?? null}
                            color="indigo"
                            delay={0}
                            onClick={() => navigate('/facilities')}
                        />
                        <StatCard
                            icon={<BookingsIcon />}
                            label="Total Bookings"
                            value={adminStats?.totalBookings ?? null}
                            color="emerald"
                            delay={80}
                            onClick={() => navigate('/bookings')}
                        />
                        <StatCard
                            icon={<UsersIcon />}
                            label="Total Users"
                            value={adminStats?.totalUsers ?? null}
                            color="violet"
                            delay={160}
                            onClick={() => navigate('/users')}
                        />
                    </div>
                </section>
            )}

            {/* ── User / Manager / Technician Stats ── */}
            {!isAdmin && (
                <section>
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Your Activity
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg">
                        <StatCard
                            icon={<MyBookingsIcon />}
                            label="My Bookings"
                            value={userStats?.myBookings ?? null}
                            color="amber"
                            delay={0}
                            onClick={() => navigate('/bookings')}
                        />
                    </div>
                </section>
            )}

            {/* ── Quick-Links ── */}
            <section className="mt-10">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Facilities', path: '/facilities', icon: <FacilitiesIcon /> },
                        { label: 'My Bookings', path: '/bookings', icon: <BookingsIcon /> },
                        { label: 'My Profile', path: '/profile', icon: (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )},
                        { label: 'Notifications', path: '/notifications', icon: (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        )},
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className="glass hover:bg-slate-800/70 rounded-xl p-4 flex flex-col items-center gap-2
                                       transition-all duration-200 hover:scale-[1.04] group"
                        >
                            <span className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                                {item.icon}
                            </span>
                            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
