import React from 'react';
import { Paperclip, MessageSquare, ChevronRight } from 'lucide-react';
import TicketBadge from './TicketBadge';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function TicketCard({ ticket, onClick }) {
  const created = formatDate(ticket.createdAt);

  return (
    <div
      onClick={onClick}
      className="glass rounded-2xl p-5 cursor-pointer hover:border-primary-500/30 border border-transparent transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <TicketBadge type="status" value={ticket.status} />
            <TicketBadge type="priority" value={ticket.priority} />
          </div>
          <h3 className="text-surface-100 font-semibold text-sm truncate group-hover:text-primary-300 transition-colors">
            {ticket.title}
          </h3>
          <p className="text-surface-500 text-xs mt-1">
            #{ticket.id} · {created}
            {ticket.assignee && <span className="ml-2 text-primary-400">→ {ticket.assignee}</span>}
          </p>
        </div>

        {/* Right: icon indicators + chevron */}
        <div className="flex items-center gap-2 text-surface-500 shrink-0">
          {ticket.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Paperclip className="w-3.5 h-3.5" />
              {ticket.attachments.length}
            </span>
          )}
          {ticket.comments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              {ticket.comments.length}
            </span>
          )}
          <ChevronRight className="w-4 h-4 group-hover:text-primary-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}