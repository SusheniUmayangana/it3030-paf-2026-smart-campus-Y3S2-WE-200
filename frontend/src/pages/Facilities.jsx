import React, { useEffect, useState } from 'react';
import { getResources, deleteResource, createResource, updateResource } from '../services/facilitiesService';
import { Building2, Plus, X, Edit, Trash2 } from 'lucide-react';

const Facilities = () => {
    const [list, setList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: '',
        type: 'HALL',
        status: 'ACTIVE'
    });

    const loadData = async () => {
        const res = await getResources();
        setList(res.data);
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingId) {
                // UPDATE existing resource
                await updateResource(editingId, formData);
            } else {
                // CREATE new resource
                await createResource(formData);
            }

            closeModal();
            loadData(); // Refresh the grid
        } catch (err) {
            console.error(err);
            alert(editingId ? "Error updating resource!" : "Error adding resource!");
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
            status: item.status
        });
        setEditingId(item.id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', location: '', capacity: '', type: 'HALL', status: 'ACTIVE' });
    };

    return (
        <div className="p-10 bg-slate-950 min-h-screen text-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                        Campus Facilities
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Resource Management Hub</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 p-3 rounded-lg flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={20} /> Add Resource
                </button>
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

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Facility Name</label>
                                <input
                                    type="text" placeholder="e.g. Auditorium A" required
                                    value={formData.name}
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:border-indigo-500 transition-colors"
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Location</label>
                                <input
                                    type="text" placeholder="e.g. Block 04 - Level 2" required
                                    value={formData.location}
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:border-indigo-500 transition-colors"
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Capacity</label>
                                <input
                                    type="number" placeholder="Total Seats" required
                                    value={formData.capacity}
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:border-indigo-500 transition-colors"
                                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-indigo-600 p-3 rounded-lg font-bold hover:bg-indigo-500 transition-all mt-4 flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20"
                            >
                                {isSaving ? 'Processing...' : (editingId ? 'Update Facility' : 'Save Facility')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.length > 0 ? list.map(item => (
                    <div key={item.id} className="glass p-6 border border-slate-800 hover:border-indigo-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                <Building2 className="text-indigo-400" size={28} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                {item.status}
                            </span>
                        </div>

                        <h2 className="text-xl font-bold text-white">{item.name}</h2>
                        <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                            <span className="opacity-50 font-medium">Loc:</span> {item.location}
                        </p>
                        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                            <span className="opacity-50 font-medium">Cap:</span> {item.capacity} seats
                        </p>

                        <div className="mt-6 pt-6 border-t border-slate-800/50 flex gap-3">
                            <button
                                onClick={() => handleEditClick(item)}
                                className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-indigo-400 border border-slate-700 transition-colors"
                            >
                                <Edit size={14} /> Edit
                            </button>
                            <button
                                onClick={() => { if (window.confirm("Delete this facility?")) deleteResource(item.id).then(loadData) }}
                                className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg hover:bg-rose-500/10 text-rose-500 text-xs font-bold border border-transparent hover:border-rose-500/20 transition-all"
                            >
                                <Trash2 size={14} /> Remove
                            </button>
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