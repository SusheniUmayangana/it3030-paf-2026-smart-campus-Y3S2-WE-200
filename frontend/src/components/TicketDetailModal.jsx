import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Send, User, Clock, Trash2, Edit2, Check, XCircle, UserPlus } from 'lucide-react';
import TicketBadge from './TicketBadge';
import { 
  assignTicket, 
  selfAssignTicket,
  updateTicketStatus, 
  rejectTicket,
  deleteTicket,
  addComment, 
  getComments,
  editComment,
  deleteComment,
  getTechnicians
} from '../services/ticketsService';

const STATUS_OPTIONS = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

// Valid status transitions for technicians
const TECHNICIAN_VALID_TRANSITIONS = {
  'OPEN': ['ASSIGNED'],
  'ASSIGNED': ['IN_PROGRESS'],
  'IN_PROGRESS': ['RESOLVED'],
  'RESOLVED': [],
  'CLOSED': [],
  'REJECTED': []
};

// Valid status transitions for Admin/Super Admin
const ADMIN_VALID_TRANSITIONS = {
  'OPEN': ['ASSIGNED', 'REJECTED'],
  'ASSIGNED': ['IN_PROGRESS', 'REJECTED'],
  'IN_PROGRESS': ['RESOLVED', 'REJECTED'],
  'RESOLVED': ['CLOSED'],
  'CLOSED': [],
  'REJECTED': []
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
}

export default function TicketDetailModal({ ticket, user, onClose, onUpdated }) {
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selfAssigning, setSelfAssigning] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const isTicketOwner = ticket.reporterId === user?.id;
  const isAssignedTech = ticket.assigneeId === user?.id;
  const isUnassigned = !ticket.assignee;
  
  // Determine available status options based on role
  const getAvailableStatusOptions = () => {
    if (isAdmin) {
      return ADMIN_VALID_TRANSITIONS[ticket.status] || [];
    } else if (isTechnician && isAssignedTech) {
      return TECHNICIAN_VALID_TRANSITIONS[ticket.status] || [];
    }
    return [];
  };

  const availableStatuses = getAvailableStatusOptions();
  
  // Check if user can update status
  const canUpdateStatus = (isAdmin) || (isTechnician && isAssignedTech && availableStatuses.length > 0);
  
  // Check if user can assign technicians (Admin only)
  const canAssign = isAdmin;
  
  // Check if technician can self-assign (only if unassigned and OPEN)
  const canSelfAssign = isTechnician && isUnassigned && ticket.status === 'OPEN';
  
  // Check if user can reject ticket (Admin only)
  const canReject = isAdmin && (ticket.status === 'OPEN' || ticket.status === 'ASSIGNED' || ticket.status === 'IN_PROGRESS');
  
  // Check if user can delete ticket (Super Admin only)
  const canDeleteTicket = isSuperAdmin;
  
  // Check if user can delete any comment (Super Admin)
  const canDeleteAnyComment = isSuperAdmin;
  
  // Check if user can edit/delete their own comments
  const canManageOwnComment = (commentAuthorId) => commentAuthorId === user?.id;

  // Handle image load error
  const handleImageError = (attachmentId) => {
    setFailedImages(prev => ({ ...prev, [attachmentId]: true }));
  };

  // Load technicians for dropdown
  const loadTechnicians = async () => {
    try {
      const data = await getTechnicians();
      setTechnicians(data.technicians || []);
    } catch (err) {
      console.error('Failed to load technicians', err);
    }
  };

  // Load comments
  const loadComments = async () => {
    try {
      const data = await getComments(ticket.id);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  };

  useEffect(() => {
    loadComments();
    if (isAdmin) {
      loadTechnicians();
    }
  }, [ticket.id, isAdmin]);

  // Admin assigns technician
  const handleAssign = async () => {
    if (!selectedTechnicianId) { toast.error('Select a technician'); return; }
    setLoading(true);
    try {
      await assignTicket(ticket.id, Number(selectedTechnicianId));
      toast.success('Ticket assigned!');
      setShowAssignModal(false);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Technician self-assign
  const handleSelfAssign = async () => {
    setSelfAssigning(true);
    try {
      await selfAssignTicket(ticket.id);
      toast.success('You have been assigned to this ticket!');
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSelfAssigning(false);
    }
  };

  // Update status
  const handleStatusUpdate = async () => {
    if (newStatus === ticket.status) return;
    setLoading(true);
    try {
      await updateTicketStatus(ticket.id, newStatus, resolutionNotes);
      toast.success(`Status updated to ${newStatus}!`);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reject ticket (Admin only)
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setLoading(true);
    try {
      await rejectTicket(ticket.id, rejectionReason);
      toast.success('Ticket rejected!');
      setShowRejectModal(false);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete ticket (Super Admin only)
  const handleDeleteTicket = async () => {
    setLoading(true);
    try {
      await deleteTicket(ticket.id);
      toast.success('Ticket deleted successfully!');
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) { toast.error('Comment cannot be empty'); return; }
    setLoading(true);
    try {
      await addComment(ticket.id, newComment.trim());
      toast.success('Comment added!');
      setNewComment('');
      loadComments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId) => {
    if (!editingContent.trim()) { toast.error('Comment cannot be empty'); return; }
    setLoading(true);
    try {
      await editComment(ticket.id, commentId, editingContent.trim());
      toast.success('Comment updated!');
      setEditingCommentId(null);
      setEditingContent('');
      loadComments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    setLoading(true);
    try {
      await deleteComment(ticket.id, commentId);
      toast.success('Comment deleted!');
      loadComments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass rounded-2xl p-6 shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 pr-4">
            <p className="text-xs text-surface-500 mb-1">Ticket #{ticket.id}</p>
            <h2 className="text-xl font-bold text-surface-100">{ticket.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <TicketBadge type="status" value={ticket.status} />
              <TicketBadge type="priority" value={ticket.priority} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canDeleteTicket && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all"
                title="Delete Ticket"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-surface-100 mb-4">Delete Ticket</h3>
              <p className="text-surface-400 mb-6">Are you sure you want to delete this ticket? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 rounded-xl bg-surface-800/50 text-surface-300 hover:bg-surface-700/50 transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteTicket} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all">
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal - Admin only */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-surface-100 mb-4">Reject Ticket</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                className="w-full bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 transition-all mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 rounded-xl bg-surface-800/50 text-surface-300 hover:bg-surface-700/50 transition-all">
                  Cancel
                </button>
                <button onClick={handleReject} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all">
                  {loading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Modal - Admin only */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-surface-100 mb-4">Assign to Technician</h3>
              <select
                value={selectedTechnicianId}
                onChange={(e) => setSelectedTechnicianId(e.target.value)}
                className="w-full bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2.5 text-surface-100 focus:outline-none focus:border-primary-500/50 transition-all mb-4"
              >
                <option value="">Select a technician...</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name} ({tech.email})</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 rounded-xl bg-surface-800/50 text-surface-300 hover:bg-surface-700/50 transition-all">
                  Cancel
                </button>
                <button onClick={handleAssign} className="flex-1 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-all">
                  {loading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 mb-5 text-sm text-surface-400">
          {ticket.reporter && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> Reported by: {ticket.reporter}
            </span>
          )}
          {ticket.assignee ? (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-primary-400" /> Assigned to: {ticket.assignee}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-yellow-400" /> Unassigned
            </span>
          )}
          {ticket.createdAt && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Created: {formatDate(ticket.createdAt)}
            </span>
          )}
          {ticket.resolvedAt && (
            <span className="flex items-center gap-1.5 text-green-400">
              <Check className="w-4 h-4" /> Resolved: {formatDate(ticket.resolvedAt)}
            </span>
          )}
        </div>

        {/* Description */}
        {ticket.description && (
          <div className="bg-surface-800/30 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-surface-200 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}

        {/* Attachments with fallback for failed images */}
        {ticket.attachments?.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {ticket.attachments.map((att, i) => (
                <div key={i} className="relative group">
                  {failedImages[att.id] ? (
                    <div className="w-24 h-24 rounded-xl bg-surface-800/50 border border-surface-700/50 flex flex-col items-center justify-center p-2">
                      <span className="text-xs text-surface-500 text-center truncate w-full">{att.fileName}</span>
                      <a 
                        href={att.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-primary-400 hover:text-primary-300 mt-1"
                      >
                        View
                      </a>
                    </div>
                  ) : (
                    <img
                      src={att.fileUrl}
                      alt={att.fileName}
                      className="w-24 h-24 object-cover rounded-xl border border-surface-700/50 hover:border-primary-500/40 transition-all cursor-pointer"
                      onError={() => handleImageError(att.id)}
                      onClick={() => window.open(att.fileUrl, '_blank')}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution notes */}
        {ticket.resolutionNotes && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">Resolution Notes</p>
            <p className="text-surface-200 text-sm whitespace-pre-wrap">{ticket.resolutionNotes}</p>
          </div>
        )}

        {/* Rejection reason */}
        {ticket.rejectionReason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Rejection Reason</p>
            <p className="text-surface-200 text-sm whitespace-pre-wrap">{ticket.rejectionReason}</p>
          </div>
        )}

        <hr className="border-surface-700/50 mb-5" />

        {/* ========== ASSIGNMENT ACTIONS ========== */}
        
        {/* Admin: Assign to Technician button */}
        {canAssign && !ticket.assignee && ticket.status !== 'REJECTED' && ticket.status !== 'CLOSED' && (
          <div className="mb-5">
            <button
              onClick={() => setShowAssignModal(true)}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary-600/20 border border-primary-500/30 text-primary-400 hover:bg-primary-600/30 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Assign to Technician
            </button>
          </div>
        )}

        {/* Technician: Self-Assign button */}
        {canSelfAssign && (
          <div className="mb-5">
            <button
              onClick={handleSelfAssign}
              disabled={selfAssigning}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {selfAssigning ? 'Assigning...' : 'Assign to Myself'}
            </button>
          </div>
        )}

        {/* Admin: Reject Button */}
        {canReject && (
          <div className="mb-5">
            <button
              onClick={() => setShowRejectModal(true)}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject Ticket
            </button>
          </div>
        )}

        {/* Update Status - Admin/Super Admin or Assigned Technician */}
        {canUpdateStatus && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-surface-300 mb-2">Update Status</p>
            <div className="flex gap-2 mb-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="flex-1 bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2 text-surface-100 focus:outline-none focus:border-primary-500/50 transition-all text-sm"
              >
                <option value={ticket.status}>{ticket.status} (current)</option>
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={loading || newStatus === ticket.status}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-500 transition-all disabled:opacity-50"
              >
                Save
              </button>
            </div>
            {((newStatus === 'RESOLVED' && (isAdmin || isAssignedTech)) || (newStatus === 'CLOSED' && isAdmin)) && (
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Add resolution notes..."
                className="w-full bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 transition-all text-sm resize-none"
              />
            )}
          </div>
        )}

        {/* ========== COMMENTS SECTION ========== */}
        <div>
          <p className="text-sm font-semibold text-surface-300 mb-2">Comments</p>
          
          {/* Comments List */}
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-4">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-surface-800/30 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary-400">{comment.author?.name}</span>
                      <span className="text-xs text-surface-500">{formatDate(comment.createdAt)}</span>
                      {comment.isEdited && <span className="text-xs text-surface-500 italic">(edited)</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {canManageOwnComment(comment.author?.id) && !comment.isDeleted && (
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingContent(comment.content);
                          }}
                          className="p-1 rounded-lg text-surface-500 hover:text-primary-400 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(canManageOwnComment(comment.author?.id) || canDeleteAnyComment) && !comment.isDeleted && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 rounded-lg text-surface-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="flex gap-2">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={2}
                        className="flex-1 bg-surface-800/50 border border-surface-700/50 rounded-xl px-3 py-2 text-surface-100 text-sm focus:outline-none focus:border-primary-500/50 transition-all resize-none"
                      />
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-1 rounded-xl bg-primary-600 text-white text-sm hover:bg-primary-500 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-3 py-1 rounded-xl bg-surface-700 text-surface-300 text-sm hover:bg-surface-600 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className={`text-surface-300 text-sm ${comment.isDeleted ? 'text-surface-500 italic line-through' : ''}`}>
                      {comment.isDeleted ? '[Deleted]' : comment.content}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Comment - All authenticated users can comment (except on closed/rejected tickets) */}
          {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Write a comment..."
                className="flex-1 bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 transition-all text-sm resize-none"
              />
              <button
                onClick={handleAddComment}
                disabled={loading || !newComment.trim()}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
          {(ticket.status === 'CLOSED' || ticket.status === 'REJECTED') && (
            <p className="text-surface-500 text-sm text-center py-2">Comments are disabled on {ticket.status.toLowerCase()} tickets.</p>
          )}
        </div>
      </div>
    </div>
  );
}