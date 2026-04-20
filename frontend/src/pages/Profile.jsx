import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export default function Profile({ user, onUserUpdate }) {
    const [form, setForm] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/users/profile`, { credentials: 'include' });
            const data = await res.json();
            setForm({ name: data.name || '', email: data.email || '' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to load profile.' });
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE}/api/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Update the global user state if callback provided
                if (onUserUpdate && data.user) {
                    onUserUpdate(data.user);
                }
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Cannot connect to server.' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="animate-fade-in flex items-center justify-center py-20">
                <div className="w-8 h-8 border-[3px] border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-surface-100 mb-2">My Profile</h1>
            <p className="text-surface-500 text-sm mb-8">View and update your personal information</p>

            {/* Profile Card */}
            <div className="glass rounded-2xl p-8">
                {/* Avatar & Role Badge */}
                <div className="flex items-center gap-5 mb-8 pb-6 border-b border-surface-800/50">
                    {user?.picture ? (
                        <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-2xl ring-4 ring-primary-500/20 shadow-xl" />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-primary-500/20">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-surface-100">{user?.name}</h2>
                        <p className="text-surface-400 text-sm mb-2">{user?.email}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getRoleBadgeClasses(user?.role)}`}>
                            {user?.role}
                        </span>
                    </div>
                </div>

                {/* Messages */}
                {message.text && (
                    <div className={`mb-6 px-4 py-3 rounded-xl text-sm border ${
                        message.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Edit Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="profile-name" className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                            Full Name
                        </label>
                        <input
                            id="profile-name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-surface-700/50 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="profile-email" className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <input
                            id="profile-email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-surface-700/50 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                            Role
                        </label>
                        <div className="w-full px-4 py-3 rounded-xl bg-surface-900/30 border border-surface-800/50 text-surface-500 text-sm cursor-not-allowed">
                            {user?.role} <span className="text-surface-600 text-xs ml-1">(read-only)</span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            id="save-profile-btn"
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function getRoleBadgeClasses(role) {
    switch (role) {
        case 'SUPER_ADMIN': return 'bg-red-500/15 text-red-400 border-red-500/20';
        case 'ADMIN': return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
        case 'MANAGER': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
        case 'TECHNICIAN': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
        default: return 'bg-accent-500/15 text-accent-400 border-accent-500/20';
    }
}
