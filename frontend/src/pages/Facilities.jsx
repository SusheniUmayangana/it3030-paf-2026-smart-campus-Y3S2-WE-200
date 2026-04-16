import React, { useEffect, useState } from 'react';
import { getResources, deleteResource, createResource } from '../services/facilitiesService';
import { Building2, Plus, X } from 'lucide-react';

const Facilities = () => {
    const [list, setList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
            await createResource(formData);
            setShowModal(false); // Close modal
            setFormData({ name: '', location: '', capacity: '', type: 'HALL', status: 'ACTIVE' }); // Reset form
            loadData(); // Refresh list
        } catch (err) {
            alert("Error adding resource!");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-10 bg-slate-950 min-h-screen text-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight gradient-text">Campus Facilities</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 p-3 rounded-lg flex items-center gap-2 hover:bg-indigo-500 transition-all"
                >
                    <Plus size={20} /> Add Resource
                </button>
            </div>

            {/* Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass p-8 w-full max-w-md border border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">New Facility</h2>
                            <button onClick={() => setShowModal(false)}><X /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text" placeholder="Facility Name" required
                                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:border-indigo-500"
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <input
                                type="text" placeholder="Location" required
                                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:border-indigo-500"
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                            <input
                                type="number" placeholder="Capacity" required
                                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:border-indigo-500"
                                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                            />
                            <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 p-3 rounded-lg font-bold hover:bg-indigo-500 transition-all">
                                {isSaving ? 'Saving...' : 'Save Facility'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {list.map(item => (
                    <div key={item.id} className="glass p-6 border border-slate-800 hover:scale-[1.02] transition-transform">
                        <Building2 className="text-indigo-400 mb-4" size={30} />
                        <h2 className="text-xl font-bold">{item.name}</h2>
                        <p className="text-slate-400 text-sm mt-2">{item.location} • Cap: {item.capacity}</p>
                        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">{item.status}</span>
                            <button onClick={() => deleteResource(item.id).then(loadData)} className="text-rose-500 text-xs hover:underline">Remove</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Facilities;