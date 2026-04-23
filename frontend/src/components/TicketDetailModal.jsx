import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Send, User, Clock, Edit2, Trash2, Check } from 'lucide-react';
import TicketBadge from './TicketBadge';
import { getTicket, assignTicket, updateTicketStatus, addComment, editComment, deleteComment } from '../services/ticketsService';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
}

export default function TicketDetailModal({ ticketId, user, onClose, onUpdated }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const canManage = isAdmin || isTechnician;

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const res = await getTicket(ticketId);
      setTicket(res.ticket);
      setNewStatus(res.ticket.status);
      setResolutionNotes(res.ticket.resolutionNotes || '');
      setRejectionReason(res.ticket.rejectionReason || '');
    } catch (err) {
      toast.error(err.message || 'Failed to load ticket details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const handleAssign = async () => {
    if (!assigneeId) { toast.error('Enter a technician user ID'); return; }
    setSaving(true);
    try {
      await assignTicket(ticket.id, Number(assigneeId));
      toast.success('Ticket assigned!');
      fetchTicketDetails();
      onUpdated?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === ticket.status) return;
    setSaving(true);
    try {
      // updateTicketStatus takes ticketId, status, resolutionNotes.
      // We need to modify our api service if we want to pass rejectionReason there.
      // Wait, let's just pass rejectionReason via resolutionNotes parameter if it's rejected?
      // No, let's use the fetch directly or update ticketsService.
      
      const body = { status: newStatus };
      if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') body.resolutionNotes = resolutionNotes;
      if (newStatus === 'REJECTED') body.rejectionReason = rejectionReason;

      const res = await fetch(`http://localhost:8080/api/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to update status');

      toast.success('Status updated!');
      fetchTicketDetails();
      onUpdated?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) { toast.error('Comment cannot be empty'); return; }
    setSaving(true);
    try {
      await addComment(ticket.id, commentText.trim());
      toast.success('Comment added!');
      setCommentText('');
      fetchTicketDetails();
      onUpdated?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitEditComment = async (id) => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await editComment(id, editContent.trim());
      toast.success('Comment updated!');
      setEditingCommentId(null);
      fetchTicketDetails();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    setSaving(true);
    try {
      await deleteComment(id);
      toast.success('Comment deleted!');
      fetchTicketDetails();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  if (loading || !ticket) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
         <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass rounded-2xl p-6 shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between mb-5 shrink-0">
          <div className="flex-1 pr-4">
            <p className="text-xs text-surface-500 mb-1">Ticket #{ticket.id} {ticket.resource && `· Resource: ${ticket.resource.name}`}</p>
            <h2 className="text-xl font-bold text-surface-100">{ticket.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <TicketBadge type="status" value={ticket.status} />
              <TicketBadge type="priority" value={ticket.priority} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 mb-5 text-sm text-surface-400 shrink-0">
          {ticket.reporter && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> {ticket.reporter}
            </span>
          )}
          {ticket.assignee && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-primary-400" /> Assigned: {ticket.assignee}
            </span>
          )}
          {ticket.createdAt && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {formatDate(ticket.createdAt)}
            </span>
          )}
        </div>

        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
          {/* Description */}
          {ticket.description && (
            <div className="bg-surface-800/30 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Description</p>
              <p className="text-surface-200 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachments?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-24 h-24 rounded-xl overflow-hidden border border-surface-700/50 hover:border-primary-500/50 transition-all"
                  >
                    <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resolution notes & Rejection reason display */}
          {ticket.resolutionNotes && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">Resolution Notes</p>
              <p className="text-surface-200 text-sm whitespace-pre-wrap">{ticket.resolutionNotes}</p>
            </div>
          )}
          {ticket.rejectionReason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Rejection Reason</p>
              <p className="text-surface-200 text-sm whitespace-pre-wrap">{ticket.rejectionReason}</p>
            </div>
          )}

          <hr className="border-surface-700/50 mb-5" />

          {/* Assign Technician - Admin only */}
          {isAdmin && !ticket.assignee && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-surface-300 mb-2">Assign to Technician</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  placeholder="Technician user ID"
                  className="flex-1 bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all text-sm"
                />
                <button
                  onClick={handleAssign}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-500 transition-all disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {/* Update Status - Admin or Technician */}
          {canManage && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-surface-300 mb-2">Update Status</p>
              <div className="flex gap-2 mb-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2 text-surface-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={saving || newStatus === ticket.status}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-500 transition-all disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              {(newStatus === 'RESOLVED' || newStatus === 'CLOSED') && (
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add resolution notes (optional)..."
                  className="w-full mb-2 bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all text-sm resize-none"
                />
              )}
              {newStatus === 'REJECTED' && (
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Add rejection reason (required)..."
                  className="w-full mb-2 bg-surface-800/50 border border-red-500/30 rounded-xl px-4 py-2 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 transition-all text-sm resize-none"
                />
              )}
            </div>
          )}

          {/* Comments Section */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-surface-300 mb-3">Comments ({ticket.comments?.length || 0})</p>
            <div className="flex flex-col gap-3 mb-4">
              {ticket.comments?.map(comment => (
                <div key={comment.id} className="bg-surface-800/40 rounded-xl p-3 border border-surface-700/30">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-surface-200">
                      {comment.authorName}
                      {comment.isEdited && <span className="text-surface-500 font-normal ml-2">(edited)</span>}
                    </span>
                    <span className="text-[10px] text-surface-500">{formatDate(comment.createdAt)}</span>
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="flex-1 bg-surface-900 border border-surface-600 rounded-lg px-3 py-1.5 text-sm text-surface-100 focus:outline-none"
                      />
                      <button onClick={() => submitEditComment(comment.id)} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingCommentId(null)} className="p-1.5 rounded-lg bg-surface-700 text-surface-300 hover:bg-surface-600 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-surface-300 break-words">{comment.content}</p>
                  )}

                  {/* Comment Actions */}
                  {!editingCommentId && (comment.authorId === user?.id || isAdmin) && (
                    <div className="flex justify-end gap-2 mt-2 opacity-50 hover:opacity-100 transition-opacity">
                      {comment.authorId === user?.id && (
                        <button 
                          onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); }}
                          className="text-surface-400 hover:text-primary-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-surface-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a comment..."
                className="flex-1 bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all text-sm"
              />
              <button
                onClick={handleComment}
                disabled={saving || !commentText.trim()}
                className="px-3 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}