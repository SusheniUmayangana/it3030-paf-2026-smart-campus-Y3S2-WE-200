import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getResources, deleteResource, createResource, updateResource } from '../services/facilitiesService';
import { Building2, Plus, X, Edit, Trash2, Search, Filter, Users, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Facilities = ({ user }) => {
    // comes from the parent (App.js), not LocalStorage
    const userRole = user?.role?.toUpperCase() || 'USER';
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const [list, setList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [errors, setErrors] = useState({});

    // --- SEARCH & FILTER STATES ---
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const [filterCapacity, setFilterCapacity] = useState(0);
    const [filterStatus, setFilterStatus] = useState("ALL");

    const DEFAULT_START = '08:00';
    const DEFAULT_END = '18:00';

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: 0,
        type: 'LECTURE_HALL',
        status: 'OPERATIONAL',
        availabilityStart: DEFAULT_START,
        availabilityEnd: DEFAULT_END,
        imageUrl: ''
    });

    const navigate = useNavigate();

    // Logic to decide what the user is allowed to see
    const visibleList = list.filter(item => {
        const isRoleVisible = isAdmin || item.status !== 'OFFLINE';
        // Search by Name or Location
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.location.toLowerCase().includes(searchQuery.toLowerCase());

        // Filter by Type
        const matchesType = filterType === "ALL" || item.type === filterType;

        // Filter by Capacity
        const matchesCapacity = item.capacity >= filterCapacity;

        // Filter by Status (Admin Only Logic)
        const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;

        return isRoleVisible && matchesSearch && matchesType && matchesCapacity && matchesStatus;
    });

    const validateForm = () => {
        let tempErrors = {};
        if (!formData.name.trim()) tempErrors.name = "Name is required";
        if (!formData.location.trim()) tempErrors.location = "Location is required";
        if (!formData.capacity || formData.capacity <= 0) tempErrors.capacity = "Enter a valid capacity";

        // Time Logic Check
        if (formData.availabilityStart >= formData.availabilityEnd) {
            tempErrors.time = "Closing must be after Opening";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const loadData = async () => {
        const res = await getResources();
        setList(res.data);
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        } setIsSaving(true);
        try {
            if (editingId) {
                // UPDATE existing resource
                await updateResource(editingId, formData);
                // Success Message for Update
                toast.success('Facility updated successfully!');
            } else {
                // CREATE new resource
                await createResource(formData);
                // Success Message for Create
                toast.success('New facility added!');
            }
            closeModal();
            loadData();// Refresh the grid
        } catch (err) {
            toast.error('Operation failed. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (item) => {
        setFormData({
            name: item.name,
            location: item.location,
            capacity: item.capacity,
            type: item.type,
            status: item.status,
            imageUrl: item.imageUrl || '',
            availabilityStart: item.availabilityStart || DEFAULT_START,
            availabilityEnd: item.availabilityEnd || DEFAULT_END
        });
        setEditingId(item.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this facility?")) {
            try {
                await deleteResource(id);
                // 4. Add Success Message for Delete
                toast.success('Facility removed.');
                loadData();
            } catch (err) {
                toast.error('Could not delete resource.');
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setErrors({});
        setFormData({
            name: '',
            location: '',
            capacity: 0,
            type: 'LECTURE_HALL',
            status: 'OPERATIONAL',
            imageUrl: '',
            availabilityStart: DEFAULT_START,
            availabilityEnd: DEFAULT_END
        });
    };


    return (
        <div className="p-10 bg-slate-950 min-h-screen text-white">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        border: '1px solid #334155'
                    },
                }}
            />
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                        Campus Facilities
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Resource Management Hub</p>
                </div>
                {userRole === 'ADMIN' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 p-3 rounded-lg flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg"
                    >
                        <Plus size={20} /> Add Resource
                    </button>
                )}
            </div>

            {/* --- SEARCH & FILTER BAR --- */}
            <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 mb-10`}>
                {/* Search Box */}
                <div className={`${isAdmin ? 'md:col-span-1' : 'md:col-span-2'} relative group`}>
                    <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-slate-900/50 border border-slate-800 p-3 pl-12 rounded-2xl outline-none focus:border-indigo-500/50 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Type Filter */}
                <div className="relative">
                    <Filter className="absolute left-4 top-3.5 text-slate-500" size={16} />
                    <select
                        className="w-full bg-slate-900/50 border border-slate-800 p-3 pl-12 rounded-2xl outline-none text-sm appearance-none"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="ALL">All Types</option>
                        <option value="LECTURE_HALL">Lecture Halls</option>
                        <option value="LABORATORY">Laboratories</option>
                        <option value="STUDY_AREA">Study Areas</option>
                        <option value="MEETING_ROOM">Meeting Rooms</option>
                        <option value="EQUIPMENT">Equipment</option>
                    </select>
                </div>

                {/* Capacity Filter */}
                <div className="relative">
                    <Users className="absolute left-4 top-3.5 text-slate-500" size={16} />
                    <input
                        type="number"
                        placeholder="Min Capacity"
                        className="w-full bg-slate-900/50 border border-slate-800 p-3 pl-12 rounded-2xl outline-none text-sm"
                        value={filterCapacity || ''}
                        onChange={(e) => setFilterCapacity(Number(e.target.value))}
                    />
                </div>

                {/* --- ADMIN ONLY STATUS FILTER --- */}
                {isAdmin && (
                    <div className="relative">
                        <Activity className="absolute left-4 top-3.5 text-indigo-400" size={16} />
                        <select
                            className="w-full bg-indigo-500/10 border border-indigo-500/20 p-3 pl-12 rounded-2xl outline-none text-sm appearance-none text-indigo-300"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="OPERATIONAL">OPERATIONAL</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                            <option value="OFFLINE">OFFLINE</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass p-8 w-full max-w-md border border-slate-700 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {editingId ? 'Edit Facility' : 'New Facility'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            {/* Facility Name */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Facility Name</label>
                                <input
                                    type="text" required
                                    value={formData.name}
                                    className={`w-full bg-[#111827] border ${errors.name ? 'border-rose-500' : 'border-slate-700'} p-3 rounded-xl outline-none text-sm focus:border-indigo-500 transition-all`}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Innovation Center"
                                />
                            </div>

                            {/* Location & Capacity Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Location</label>
                                    <input
                                        type="text" required
                                        value={formData.location}
                                        className={`w-full bg-[#111827] border ${errors.location ? 'border-rose-500' : 'border-slate-700'} p-3 rounded-xl outline-none text-sm`}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Block A, Level 2"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Capacity</label>
                                    <input
                                        type="number" required
                                        value={formData.capacity}
                                        className={`w-full bg-[#111827] border ${errors.capacity ? 'border-rose-500' : 'border-slate-700'} p-3 rounded-xl outline-none text-sm`}
                                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Image URL</label>
                                <input
                                    type="text"
                                    value={formData.imageUrl}
                                    className="w-full bg-[#111827] border border-slate-700 p-3 rounded-xl outline-none text-sm"
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>

                            {/* Classification & Status Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Type</label>
                                    <select
                                        value={formData.type}
                                        className="w-full bg-[#111827] border border-slate-700 p-3 rounded-xl outline-none text-sm"
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="LECTURE_HALL">Lecture Hall</option>
                                        <option value="LABORATORY">Laboratory</option>
                                        <option value="STUDY_AREA">Study Area</option>
                                        <option value="SPORTS_FACILITY">Sports Facility</option>
                                        <option value="MEETING_ROOM">Meeting Room</option>
                                        <option value="EQUIPMENT">Equipment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Status</label>
                                    <select
                                        value={formData.status}
                                        className="w-full bg-[#111827] border border-slate-700 p-3 rounded-xl outline-none text-sm"
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="OPERATIONAL">OPERATIONAL</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                        <option value="OFFLINE">OFFLINE</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fixed Operating Hours Section */}
                            <div className={`p-4 border ${errors.time ? 'border-rose-500' : 'border-slate-700/50'} rounded-2xl bg-slate-900/40`}>
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Opens</label>
                                        <input
                                            type="time"
                                            value={formData.availabilityStart}
                                            readOnly
                                            className="bg-transparent outline-none text-indigo-400/50 font-bold cursor-not-allowed w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Closes</label>
                                        <input
                                            type="time"
                                            value={formData.availabilityEnd}
                                            readOnly
                                            className="bg-transparent outline-none text-indigo-400 font-bold cursor-not-allowed w-full"
                                        />
                                    </div>
                                </div>
                                {errors.time && <p className="text-[10px] text-rose-500 mt-2 text-center font-bold uppercase">{errors.time}</p>}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button type="submit" disabled={isSaving} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 p-3 rounded-xl font-bold text-sm transition-all uppercase">
                                    {isSaving ? 'Saving...' : (editingId ? 'Update Asset' : 'Deploy Asset')}
                                </button>
                                <button type="button" onClick={closeModal} className="flex-1 border border-slate-700 p-3 rounded-xl font-bold text-sm text-slate-400 hover:bg-slate-800 transition-all uppercase">
                                    Discard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}



            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleList.length > 0 ? visibleList.map(item => (
                    <div key={item.id} className="group bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 shadow-xl flex flex-col">

                        {/* Image Section with Gradient Overlay */}
                        <div className="relative h-48 w-full overflow-hidden">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 italic text-xs">
                                    No Preview Available
                                </div>
                            )}

                            {/* Status Badge - Floating */}
                            <div className="absolute top-4 right-4">
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-xl border backdrop-blur-md transition-all ${item.status === 'OPERATIONAL'
                                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-emerald-900/20'
                                    : item.status === 'MAINTENANCE'
                                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-amber-900/20'
                                        : 'bg-rose-500/25 text-rose-300 border-rose-500/40 shadow-rose-900/20'
                                    }`}>
                                    {/* The Indicator Dot - Now even brighter for contrast */}
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 shadow-[0_0_8px_rgba(255,255,255,0.3)] ${item.status === 'OPERATIONAL' ? 'bg-emerald-400 animate-pulse' :
                                        item.status === 'MAINTENANCE' ? 'bg-amber-400' : 'bg-rose-400'
                                        }`}></span>
                                    {item.status}
                                </span>
                            </div>

                            {/* Type Badge - Bottom Left */}
                            <div className="absolute bottom-4 left-4">
                                <span className="bg-black/50 backdrop-blur-md text-indigo-300 text-[9px] px-2 py-1 rounded-md border border-indigo-500/30 font-bold">
                                    {item.type?.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {item.name}
                            </h3>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center text-slate-400 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mr-3">
                                        <span className="text-indigo-400 text-xs">📍</span>
                                    </div>
                                    <span className="font-medium">{item.location}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Simple CSS Gauge */}
                                    <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                        <span className="text-[10px] font-bold text-emerald-400 font-mono text-center leading-tight">
                                            0%
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Occupancy</span>
                                        <span className="text-xs font-bold text-white tracking-tight">
                                            0 / {item.capacity} <span className="text-[10px] text-slate-500 font-normal ml-1">Seats Taken</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="mt-auto pt-6 flex gap-3">
                                {userRole === 'ADMIN' ? (
                                    <>
                                        {/* ADMIN VIEW: Edit and Remove */}
                                        <button
                                            onClick={() => handleEditClick(item)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 transition-all text-xs font-bold"
                                        >
                                            <Edit size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all text-xs font-bold"
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </>
                                ) : (
                                    /* USER VIEW: Book Resource Logic */
                                    <button
                                        disabled={item.status === 'MAINTENANCE'}
                                        onClick={() => {
                                            if (item.status === 'OPERATIONAL') {
                                                navigate(`/booking/${item.id}`);
                                            } else {
                                                toast.error("This facility is currently under maintenance.");
                                            }
                                        }}
                                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${item.status === 'MAINTENANCE'
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
                                            }`}
                                    >
                                        {item.status === 'MAINTENANCE' ? (
                                            <>🔒 Unavailable</>
                                        ) : (
                                            <>📅 Book Resource</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center glass border-dashed border-slate-800">
                        <p className="text-slate-500">No facilities found. Add your first resource above!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Facilities;