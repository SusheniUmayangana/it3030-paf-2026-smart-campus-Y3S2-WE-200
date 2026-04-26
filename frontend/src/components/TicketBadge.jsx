import React from 'react';

const STATUS_COLORS = {
  OPEN: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ASSIGNED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  IN_PROGRESS: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  RESOLVED: 'bg-green-500/15 text-green-400 border-green-500/30',
  CLOSED: 'bg-surface-700/40 text-surface-400 border-surface-600/30',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const PRIORITY_COLORS = {
  LOW: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  MEDIUM: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function TicketBadge({ type, value }) {
  const colorMap = type === 'priority' ? PRIORITY_COLORS : STATUS_COLORS;
  const classes = colorMap[value] || 'bg-surface-700/40 text-surface-400 border-surface-600/30';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
      {value?.replace('_', ' ')}
    </span>
  );
}