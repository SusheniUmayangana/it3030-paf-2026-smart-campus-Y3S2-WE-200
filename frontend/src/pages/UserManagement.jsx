import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const ROLE_OPTIONS_ADMIN = ['USER', 'MANAGER', 'TECHNICIAN'];
const ROLE_OPTIONS_SUPER = ['USER', 'MANAGER', 'TECHNICIAN', 'ADMIN'];

export default function UserManagement({ user }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const roleOptions = isSuperAdmin ? ROLE_OPTIONS_SUPER : ROLE_OPTIONS_ADMIN;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/users`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to load users.' });
        }
        setLoading(false);
    };

    // ========== FILTER ==========
    const filtered = users.filter((u) => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                           u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === 'ALL' || u.role === filterRole;
        return matchSearch && matchRole;
    });

    // ========== EDIT ==========
    const openEdit = (u) => {
        setEditUser(u);
        setEditForm({ name: u.name, email: u.email, role: u.role });
        setMessage({ type: '', text: '' });
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleEditSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/users/${editUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'User updated successfully!' });
                setEditUser(null);
                fetchUsers();
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update user.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Cannot connect to server.' });
        }
        setSaving(false);
    };

    // ========== DELETE ==========
    const handleDelete = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/users/${deleteTarget.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'User deleted successfully!' });
                setDeleteTarget(null);
                fetchUsers();
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to delete user.' });
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
        <div className="animate-fade-in max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-surface-100">User Management</h1>
                    <p className="text-surface-500 text-sm mt-1">{users.length} total users</p>
                </div>
            </div>

            {/* Messages */}
            {message.text && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm border transition-all ${
                    message.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="glass rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        id="search-users"
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900/50 border border-surface-700/50 text-surface-200 placeholder-surface-600 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                    />
                </div>
                <div className="relative">
                    <select
                        id="filter-role"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-surface-900/50 border border-surface-700/50 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all appearance-none cursor-pointer pr-10"
                    >
                        <option value="ALL" className="bg-surface-900">All Roles</option>
                        <option value="USER" className="bg-surface-900">User</option>
                        <option value="MANAGER" className="bg-surface-900">Manager</option>
                        <option value="TECHNICIAN" className="bg-surface-900">Technician</option>
                        <option value="ADMIN" className="bg-surface-900">Admin</option>
                        <option value="SUPER_ADMIN" className="bg-surface-900">Super Admin</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-800/50">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">User</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Email</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Role</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Provider</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-surface-500 text-sm">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((u) => (
                                    <tr key={u.id} className="border-b border-surface-800/30 hover:bg-surface-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {u.profilePicture ? (
                                                    <img src={u.profilePicture} alt={u.name} className="w-9 h-9 rounded-xl ring-2 ring-surface-700/50" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-sm font-bold text-white">
                                                        {u.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-surface-200">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-400">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${getRoleBadgeClasses(u.role)}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-surface-400 capitalize">{u.provider}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(u)}
                                                    className="p-2 rounded-lg text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                                                    title="Edit user"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(u)}
                                                    className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                    title="Delete user"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== EDIT MODAL ===== */}
            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)} />
                    <div className="relative glass rounded-2xl p-6 w-full max-w-md animate-fade-in shadow-2xl">
                        <h2 className="text-lg font-bold text-surface-100 mb-5">Edit User</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-surface-700/50 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-surface-700/50 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Role</label>
                                <div className="relative">
                                    <select
                                        name="role"
                                        value={editForm.role}
                                        onChange={handleEditChange}
                                        className="w-full px-4 py-3 rounded-xl bg-surface-900/50 border border-surface-700/50 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all appearance-none cursor-pointer"
                                    >
                                        {roleOptions.map((r) => (
                                            <option key={r} value={r} className="bg-surface-900">{r}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {!isSuperAdmin && (
                                    <p className="text-xs text-surface-600 mt-1.5">Only Super Admin can assign Admin role.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-surface-800/50">
                            <button
                                onClick={() => setEditUser(null)}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={saving}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative glass rounded-2xl p-6 w-full max-w-sm animate-fade-in shadow-2xl">
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-surface-100 mb-2">Delete User</h2>
                            <p className="text-surface-400 text-sm mb-1">Are you sure you want to delete</p>
                            <p className="text-surface-200 font-semibold text-sm mb-6">{deleteTarget.name} ({deleteTarget.email})?</p>
                        </div>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={saving}
                                className="px-5 py-2.5 rounded-xl bg-red-500/90 text-white font-semibold text-sm hover:bg-red-500 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                {saving ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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