import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { createBooking } from '../services/bookingService';
import { getResources } from '../services/facilitiesService';
import { Calendar, Clock, Users, FileText, ArrowLeft, Send } from 'lucide-react';

const BookingForm = ({ user }) => {
    const { resourceId } = useParams();
    const navigate = useNavigate();
    const [resource, setResource] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Default to today, or tomorrow if it's late
    const today = new Date().toISOString().split('T')[0];
    
    const [formData, setFormData] = useState({
        date: today,
        startTime: '08:00',
        endTime: '10:00',
        purpose: '',
        attendeesCount: 1
    });

    useEffect(() => {
        const fetchResource = async () => {
            try {
                // To display resource info, we can fetch it. 
                // Currently facilitiesService returns all resources.
                const res = await getResources();
                const found = res.data.find(r => r.id === parseInt(resourceId));
                if (found) {
                    setResource(found);
                    if (found.availabilityStart) {
                        setFormData(prev => ({ ...prev, startTime: found.availabilityStart.substring(0, 5) }));
                    }
                }
            } catch (err) {
                console.error("Could not fetch resource info", err);
            }
        };
        fetchResource();
    }, [resourceId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.purpose.trim()) {
            return toast.error("Purpose is required");
        }
        if (formData.startTime >= formData.endTime) {
            return toast.error("End time must be after start time");
        }
        if (formData.attendeesCount < 1) {
            return toast.error("At least 1 attendee is required");
        }
        
        if (resource && formData.attendeesCount > resource.capacity) {
            return toast.error(`Attendees exceed capacity of ${resource.capacity}`);
        }

        const startDateTime = `${formData.date}T${formData.startTime}:00`;
        const endDateTime = `${formData.date}T${formData.endTime}:00`;

        const payload = {
            userId: user.id,
            resourceId: parseInt(resourceId),
            startTime: startDateTime,
            endTime: endDateTime,
            purpose: formData.purpose,
            attendeesCount: formData.attendeesCount
        };

        setIsSubmitting(true);
        try {
            await createBooking(payload);
            toast.success("Booking request submitted successfully!");
            setTimeout(() => navigate('/bookings'), 1500);
        } catch (err) {
            if (err.response?.status === 409 || err.response?.data?.message?.includes('conflict') || err.response?.data?.includes('conflict')) {
                toast.error("Scheduling Conflict: Resource is already booked for this time.");
            } else {
                toast.error(err.response?.data?.message || "Failed to submit booking. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-10 bg-slate-950 min-h-screen text-white flex justify-center items-start pt-20">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
                }}
            />
            
            <div className="w-full max-w-2xl glass rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
                
                <button 
                    onClick={() => navigate('/facilities')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-medium text-sm"
                >
                    <ArrowLeft size={16} /> Back to Facilities
                </button>

                <div className="mb-8 relative z-10">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Book Resource
                    </h1>
                    {resource && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl">
                                🏢
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">{resource.name}</h3>
                                <p className="text-sm text-slate-400">{resource.location} • Capacity: {resource.capacity}</p>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Calendar size={14} /> Date
                            </label>
                            <input
                                type="date"
                                required
                                min={today}
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-[#111827] border border-slate-700 focus:border-indigo-500 p-3.5 rounded-xl outline-none text-sm transition-all"
                            />
                        </div>

                        {/* Attendees */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Users size={14} /> Expected Attendees
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                max={resource?.capacity || 1000}
                                value={formData.attendeesCount}
                                onChange={(e) => setFormData({ ...formData, attendeesCount: parseInt(e.target.value) })}
                                className="w-full bg-[#111827] border border-slate-700 focus:border-indigo-500 p-3.5 rounded-xl outline-none text-sm transition-all"
                            />
                        </div>

                        {/* Start Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Clock size={14} /> Start Time
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full bg-[#111827] border border-slate-700 focus:border-indigo-500 p-3.5 rounded-xl outline-none text-sm transition-all"
                            />
                        </div>

                        {/* End Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Clock size={14} /> End Time
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full bg-[#111827] border border-slate-700 focus:border-indigo-500 p-3.5 rounded-xl outline-none text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Purpose */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} /> Purpose of Booking
                        </label>
                        <textarea
                            required
                            rows="3"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder="Briefly describe what this booking is for..."
                            className="w-full bg-[#111827] border border-slate-700 focus:border-indigo-500 p-3.5 rounded-xl outline-none text-sm transition-all resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Request
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-4">
                            Your booking will be reviewed by an administrator.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingForm;
