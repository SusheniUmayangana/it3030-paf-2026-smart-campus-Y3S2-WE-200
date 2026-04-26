import { API_BASE } from '../config';

const BASE_URL = `${API_BASE}/api/tickets`;

/**
 * GET /api/tickets
 * Fetches tickets with role-based filtering on backend
 */
export async function getTickets({ status = '', priority = '', page = 0, size = 10 } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  params.append('page', page);
  params.append('size', size);

  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch tickets');
  return res.json();
}

/**
 * GET /api/tickets/{id}
 * Fetches single ticket details
 */
export async function getTicketById(ticketId) {
  const res = await fetch(`${BASE_URL}/${ticketId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch ticket');
  return res.json();
}

/**
 * GET /api/tickets/technicians
 * Get list of all technicians for assignment dropdown
 */
export async function getTechnicians() {
  const res = await fetch(`${BASE_URL}/technicians`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch technicians');
  return res.json();
}

/**
 * POST /api/tickets (multipart/form-data)
 * Creates a new ticket with optional image attachments
 * User, Admin, Super Admin only (Technician cannot)
 */
export async function createTicket(fields, files = []) {
  const form = new FormData();
  form.append('title', fields.title);
  form.append('category', fields.category);
  form.append('description', fields.description);
  form.append('priority', fields.priority);
  if (fields.contactDetails) form.append('contactDetails', fields.contactDetails);
  if (fields.resourceId) form.append('resourceId', fields.resourceId);
  files.forEach((f) => form.append('files', f));

  const res = await fetch(BASE_URL, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create ticket');
  return res.json();
}

/**
 * PATCH /api/tickets/:id/assign (Admin & Super Admin only)
 */
export async function assignTicket(ticketId, assigneeId) {
  const res = await fetch(`${BASE_URL}/${ticketId}/assign`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigneeId }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to assign ticket');
  return res.json();
}

/**
 * PATCH /api/tickets/:id/self-assign
 * Technician self-assigns to a ticket
 */
export async function selfAssignTicket(ticketId) {
  const res = await fetch(`${BASE_URL}/${ticketId}/self-assign`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to self-assign ticket');
  return res.json();
}

/**
 * PATCH /api/tickets/:id/status
 * Admin/Super Admin: any status
 * Technician: only OPEN → IN_PROGRESS → RESOLVED on assigned tickets
 */
export async function updateTicketStatus(ticketId, status, resolutionNotes = '') {
  const body = { status };
  if (resolutionNotes) body.resolutionNotes = resolutionNotes;

  const res = await fetch(`${BASE_URL}/${ticketId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update status');
  return res.json();
}

/**
 * PATCH /api/tickets/:id/reject (Admin & Super Admin only)
 */
export async function rejectTicket(ticketId, rejectionReason) {
  const res = await fetch(`${BASE_URL}/${ticketId}/reject`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectionReason }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to reject ticket');
  return res.json();
}

/**
 * DELETE /api/tickets/:id (Super Admin only)
 */
export async function deleteTicket(ticketId) {
  const res = await fetch(`${BASE_URL}/${ticketId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete ticket');
  return res.json();
}

/**
 * POST /api/tickets/:id/comments
 */
export async function addComment(ticketId, content) {
  const res = await fetch(`${BASE_URL}/${ticketId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to add comment');
  return res.json();
}

/**
 * GET /api/tickets/:id/comments
 */
export async function getComments(ticketId) {
  const res = await fetch(`${BASE_URL}/${ticketId}/comments`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch comments');
  return res.json();
}

/**
 * PUT /api/tickets/:ticketId/comments/:commentId (Owner only)
 */
export async function editComment(ticketId, commentId, content) {
  const res = await fetch(`${BASE_URL}/${ticketId}/comments/${commentId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to edit comment');
  return res.json();
}

/**
 * DELETE /api/tickets/:ticketId/comments/:commentId
 * Owner or Admin/Super Admin can delete
 */
export async function deleteComment(ticketId, commentId) {
  const res = await fetch(`${BASE_URL}/${ticketId}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete comment');
  return res.json();
}

/**
 * POST /api/tickets/:id/attachments
 */
export async function addAttachment(ticketId, file) {
  const form = new FormData();
  form.append('file', file);
  
  const res = await fetch(`${BASE_URL}/${ticketId}/attachments`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to add attachment');
  return res.json();
}

/**
 * DELETE /api/tickets/:ticketId/attachments/:attachmentId
 */
export async function deleteAttachment(ticketId, attachmentId) {
  const res = await fetch(`${BASE_URL}/${ticketId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete attachment');
  return res.json();
}