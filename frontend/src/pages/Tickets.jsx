import React, { useEffect, useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Filter, RefreshCw, Ticket, AlertCircle } from 'lucide-react';
import { getTickets } from '../services/ticketsService';
import TicketCard from '../components/TicketCard';
import CreateTicketModal from '../components/CreateTicketModal';
import TicketDetailModal from '../components/TicketDetailModal';

const STATUS_OPTIONS = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const PRIORITY_OPTIONS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function Tickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const canCreateTicket = !isTechnician; // User, Admin, Super Admin can create (Technician cannot)
  const PAGE_SIZE = 10;

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTickets({
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        page,
        size: PAGE_SIZE,
      });
      setTickets(data.tickets || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error(err?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-100 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Ticket className="w-5 h-5 text-white" />
            </span>
            Incident Tickets
          </h1>
          <p className="text-surface-400 mt-1">
            {isAdmin ? 'Manage all campus incident reports' : 
             isTechnician ? 'Tickets assigned to you' : 
             'Your submitted incident reports'}
          </p>
        </div>
        {/* Create Ticket - Only for Users, Admins, Super Admins (not Technicians) */}
        {canCreateTicket && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold shadow-lg hover:shadow-primary-500/30 hover:from-primary-500 hover:to-primary-400 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-surface-400" />
        <select
          value={filterStatus}
          onChange={handleFilterChange(setFilterStatus)}
          className="bg-surface-800/60 border border-surface-700/50 text-surface-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={handleFilterChange(setFilterPriority)}
          className="bg-surface-800/60 border border-surface-700/50 text-surface-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25"
        >
          {PRIORITY_OPTIONS.map(p => (
            <option key={p} value={p}>{p || 'All Priorities'}</option>
          ))}
        </select>
        <button
          onClick={loadTickets}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <span className="text-surface-500 text-sm">{totalElements} ticket{totalElements !== 1 ? 's' : ''}</span>
      </div>

      {/* Ticket Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-surface-700/50 rounded mb-3 w-3/4" />
              <div className="h-3 bg-surface-700/30 rounded mb-2 w-full" />
              <div className="h-3 bg-surface-700/30 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-400 text-lg">No tickets found</p>
          <p className="text-surface-600 text-sm mt-1">
            {filterStatus || filterPriority ? 'Try adjusting your filters' : 'Create your first ticket to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-surface-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-xl text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadTickets(); }}
        />
      )}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          user={user}
          onClose={() => setSelectedTicket(null)}
          onUpdated={() => { setSelectedTicket(null); loadTickets(); }}
        />
      )}
    </div>
  );
}