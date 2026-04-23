import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { getTickets } from '../services/ticketsService';
import TicketCard from '../components/TicketCard';
import CreateTicketModal from '../components/CreateTicketModal';
import TicketDetailModal from '../components/TicketDetailModal';

export default function Tickets({ user }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await getTickets();
            setTickets(res.tickets || []);
        } catch (err) {
            toast.error(err.message || 'Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-surface-100">Tickets</h1>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-500 transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" /> New Ticket
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
            ) : tickets.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center text-surface-400">
                    No tickets found.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {tickets.map(t => (
                        <TicketCard key={t.id} ticket={t} onClick={() => setSelectedTicketId(t.id)} />
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateTicketModal
                    onClose={() => setShowCreate(false)}
                    onCreated={fetchTickets}
                />
            )}

            {selectedTicketId && (
                <TicketDetailModal
                    ticketId={selectedTicketId}
                    user={user}
                    onClose={() => setSelectedTicketId(null)}
                    onUpdated={fetchTickets}
                />
            )}
        </div>
    );
}