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
 * POST /api/tickets (multipart/form-data)
 * Creates a new ticket with optional image attachments
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
 * PATCH /api/tickets/:id/assign (Admin only)
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
 * PATCH /api/tickets/:id/status (Admin or assigned Technician)
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
 * GET /api/tickets/:id
 */
export async function getTicket(ticketId) {
  const res = await fetch(`${BASE_URL}/${ticketId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch ticket details');
  return res.json();
}

/**
 * PUT /api/tickets/comments/:commentId
 */
export async function editComment(commentId, content) {
  const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to edit comment');
  return res.json();
}

/**
 * DELETE /api/tickets/comments/:commentId
 */
export async function deleteComment(commentId) {
  const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete comment');
  return res.json();
}