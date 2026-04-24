import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getUserBookings, getAllBookings, approveBooking, rejectBooking, cancelBooking, deleteBooking } from '../services/bookingService';
import { Calendar, Clock, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Filter, X } from 'lucide-react';
import { getResources } from '../services/facilitiesService';

const Bookings = ({ user }) => {
    const userRole = user?.role?.toUpperCase() || 'USER';
    const [bookings, setBookings] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Edit modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [editFormData, setEditFormData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        attendeesCount: 1
    });

    // Helper to check if admin
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'SUPER ADMIN';

    const loadData = async () => {
        setLoading(true);
        try {
            // Load resources for mapping names
            const resData = await getResources();
            setResources(resData.data);

            // Load bookings based on role
            let bData;
            if (isAdmin) {
                const statusQuery = statusFilter === 'ALL' ? null : statusFilter;
                bData = await getAllBookings(statusQuery);
            } else {
                bData = await getUserBookings(user.id);
            }
            setBookings(bData.data || []);
        } catch (err) {
            toast.error("Failed to load bookings");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Reload when filter changes (for admin)
    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const getResourceName = (resId) => {
        const res = resources.find(r => r.id === resId);
        return res ? res.name : `Resource #${resId}`;
    };

    const handleApprove = async (id) => {
        try {
            await approveBooking(id);
            toast.success("Booking approved");
            loadData();
        } catch (err) {
            toast.error("Failed to approve booking");
        }
    };

    const handleRejectClick = (id) => {
        setRejectingId(id);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const submitReject = async () => {
        if (!rejectionReason.trim()) {
            return toast.error("Rejection reason is required");
        }
        try {
            await rejectBooking(rejectingId, rejectionReason);
            toast.success("Booking rejected");
            setShowRejectModal(false);
            loadData();
        } catch (err) {
            toast.error("Failed to reject booking");
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm("Are you sure you want to cancel this booking?")) {
            try {
                await cancelBooking(id);
                toast.success("Booking cancelled");
                loadData();
            } catch (err) {
                toast.error("Failed to cancel booking");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this pending request?")) {
            try {
                await deleteBooking(id);
                toast.success("Booking request deleted");
                loadData();
            } catch (err) {
                toast.error("Failed to delete booking");
            }
        }
    };

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    };

    const handleEditClick = (booking) => {
        // Extract date and time for the form
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        
        setEditFormData({
            date: start.toISOString().split('T')[0],
            startTime: start.toTimeString().substring(0, 5),
            endTime: end.toTimeString().substring(0, 5),
            purpose: booking.purpose,
            attendeesCount: booking.attendeesCount
        });
        setEditingBooking(booking);
        setShowEditModal(true);
    };

    const submitEdit = async (e) => {
        e.preventDefault();
        if (editFormData.startTime >= editFormData.endTime) {
            return toast.error("End time must be after start time");
        }

        const payload = {
            userId: user.id,
            resourceId: editingBooking.resourceId,
            startTime: `${editFormData.date}T${editFormData.startTime}:00`,
            endTime: `${editFormData.date}T${editFormData.endTime}:00`,
            purpose: editFormData.purpose,
            attendeesCount: editFormData.attendeesCount
        };

        try {
            // Import updateBooking dynamically or ensure it is exported in bookingService.js
            const { updateBooking } = await import('../services/bookingService');
            await updateBooking(editingBooking.id, payload);
            toast.success("Booking request updated!");
            setShowEditModal(false);
            loadData();
        } catch (err) {
            if (err.response?.status === 409 || err.response?.data?.message?.includes('conflict')) {
                toast.error("Scheduling Conflict: Resource is booked for this time.");
            } else {
                toast.error("Failed to update booking");
            }
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'REJECTED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case 'CANCELLED': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    // Filter user view locally since API returns all for user
    const displayedBookings = isAdmin ? bookings : 
        (statusFilter === 'ALL' ? bookings : bookings.filter(b => b.status === statusFilter));

    return (
        <div className="p-10 bg-slate-950 min-h-screen text-white">
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } }} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        {isAdmin ? 'Booking Management' : 'My Bookings'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {isAdmin ? 'Review and manage all resource requests' : 'Track your facility reservations'}
                    </p>
                </div>
                
                {/* Filter */}
                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                    <Filter size={16} className="text-slate-400 ml-2" />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm font-medium text-slate-200 p-2 cursor-pointer"
                    >
                        <option value="ALL" className="bg-slate-900">All Statuses</option>
                        <option value="PENDING" className="bg-slate-900">Pending</option>
                        <option value="APPROVED" className="bg-slate-900">Approved</option>
                        <option value="REJECTED" className="bg-slate-900">Rejected</option>
                        <option value="CANCELLED" className="bg-slate-900">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass p-8 w-full max-w-md border border-slate-700 shadow-2xl relative rounded-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlertCircle className="text-rose-500" /> Reject Booking
                            </h2>
                            <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Reason for Rejection</label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a reason..."
                                    className="w-full bg-[#111827] border border-slate-700 p-3 rounded-xl outline-none text-sm focus:border-rose-500 transition-all resize-none h-32"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={submitReject} className="flex-1 bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-bold text-sm transition-all text-white">
                                    Confirm Rejection
                                </button>
                                <button onClick={() => setShowRejectModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm transition-all text-white">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal for Users */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass p-8 w-full max-w-md border border-slate-700 shadow-2xl relative rounded-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit className="text-indigo-400" /> Edit Request
                            </h2>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Date</label>
                                    <input type="date" required min={new Date().toISOString().split('T')[0]} value={editFormData.date} onChange={(e) => setEditFormData({...editFormData, date: e.target.value})} className="w-full bg-[#111827] border border-slate-700 p-3 rounded-xl outline-none text-sm focus:border-indigo-500 transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Attendees</label>
                                    <input type="number" required min="1" value={editFormData.attendeesCount} onChange={(e) => setEditFormData({...editFormData, attendeesCount: parseInt(e.target.value)})} className="w-full bg-[#111827] border border-slate-700 p-3 rounded-xl outline-none text-sm focus:border-indigo-500 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Start Time</label>
                                    <input type="time" required value={editFormData.startTime} onChange={(e) => setEditFormData({...editFormData, startTime: e.target.value})} className="w-full bg-[#111827] border border-slate-700 p-3 rounded-xl outline-none text-sm focus:border-indigo-500 transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">End Time</label>
                                    <input type="time" required value={editFormData.endTime} onChange={(e) => setEditFormData({...editFormData, endTime: e.target.value})} className="w-full bg-[#111827] border border-slate-700 p-3 rounded-xl outline-none text-sm focus:border-indigo-500 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Purpose</label>
                                <textarea required value={editFormData.purpose} onChange={(e) => setEditFormData({...editFormData, purpose: e.target.value})} className="w-full bg-[#111827] border border-slate-700 p-3 rounded-xl outline-none text-sm focus:border-indigo-500 transition-all resize-none h-24" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm transition-all text-white">
                                    Save Changes
                                </button>
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm transition-all text-white">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bookings List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            ) : displayedBookings.length === 0 ? (
                <div className="glass border-dashed border-slate-800 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="text-slate-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No bookings found</h3>
                    <p className="text-slate-500 text-sm">There are no bookings matching the current criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedBookings.map(booking => (
                        <div key={booking.id} className="glass bg-slate-900/40 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all flex flex-col relative overflow-hidden">
                            {/* Color Bar indicator */}
                            <div className={`absolute top-0 left-0 w-full h-1 ${
                                booking.status === 'APPROVED' ? 'bg-emerald-500' :
                                booking.status === 'PENDING' ? 'bg-amber-500' :
                                booking.status === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-500'
                            }`}></div>

                            {/* Header: Resource Name & Status */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white line-clamp-1">
                                        {getResourceName(booking.resourceId)}
                                    </h3>
                                    {isAdmin && (
                                        <p className="text-xs text-slate-400 mt-1">User ID: {booking.userId}</p>
                                    )}
                                </div>
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border ${getStatusStyle(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-6 flex-grow">
                                <div className="flex items-start gap-3 text-sm text-slate-300">
                                    <Clock size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-medium text-white">{formatDateTime(booking.startTime)}</div>
                                        <div className="text-xs text-slate-500">to {formatDateTime(booking.endTime)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <span className="text-indigo-400 shrink-0 px-1">👤</span>
                                    <span>{booking.attendeesCount} Attendees expected</span>
                                </div>
                                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-sm text-slate-400 italic">
                                    "{booking.purpose}"
                                </div>
                                {booking.status === 'REJECTED' && booking.rejectionReason && (
                                    <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                        <p className="text-xs font-bold text-rose-400 mb-1">Reason for Rejection:</p>
                                        <p className="text-xs text-rose-300">{booking.rejectionReason}</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className="mt-auto pt-4 border-t border-slate-800/50 flex gap-2">
                                {isAdmin ? (
                                    <>
                                        {booking.status === 'PENDING' && (
                                            <>
                                                <button 
                                                    onClick={() => handleApprove(booking.id)}
                                                    className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1"
                                                >
                                                    <CheckCircle size={14} /> Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectClick(booking.id)}
                                                    className="flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1"
                                                >
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </>
                                        )}
                                        {booking.status === 'APPROVED' && (
                                            <button 
                                                onClick={() => handleCancel(booking.id)}
                                                className="flex-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/20 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1"
                                            >
                                                <XCircle size={14} /> Force Cancel
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    // User Actions
                                    <>
                                        {booking.status === 'PENDING' && (
                                            <>
                                                <button 
                                                    onClick={() => handleEditClick(booking)}
                                                    className="flex-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1"
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(booking.id)}
                                                    className="flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </>
                                        )}
                                        {booking.status === 'APPROVED' && (
                                            <button 
                                                onClick={() => handleCancel(booking.id)}
                                                className="flex-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/20 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1"
                                            >
                                                <XCircle size={14} /> Cancel Booking
                                            </button>
                                        )}
                                        {/* If Rejected or Cancelled, no user actions typically needed, maybe delete history */}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Bookings;