import React from 'react';
import { RoomStatus, LeaseRenewalStatus, WorkOrderPriority, WorkOrderStatus, LeadStage } from '../../types';

export const RoomStatusBadge: React.FC<{ status: RoomStatus }> = ({ status }) => {
  const styles: Record<RoomStatus, string> = {
    'Occupied': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Available': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Under Turnover': 'bg-amber-50 text-amber-700 border-amber-200',
    'Reserved': 'bg-zinc-100 text-zinc-700 border-zinc-300'
  };

  const dots: Record<RoomStatus, string> = {
    'Occupied': 'bg-emerald-500',
    'Available': 'bg-indigo-500',
    'Under Turnover': 'bg-amber-500',
    'Reserved': 'bg-zinc-500'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tight border ${styles[status] || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || 'bg-zinc-400'}`}></span>
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: WorkOrderPriority }> = ({ priority }) => {
  const styles: Record<WorkOrderPriority, string> = {
    'Emergency': 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    'High': 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    'Medium': 'bg-indigo-50 text-indigo-800 border-indigo-200 font-medium',
    'Low': 'bg-zinc-100 text-zinc-700 border-zinc-200 font-medium'
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tight border ${styles[priority]}`}>
      {priority === 'Emergency' && '● '}
      {priority}
    </span>
  );
};

export const WorkOrderStatusBadge: React.FC<{ status: WorkOrderStatus }> = ({ status }) => {
  const styles: Record<WorkOrderStatus, string> = {
    'New': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Assigned': 'bg-violet-50 text-violet-700 border-violet-200',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
    'Awaiting Parts': 'bg-orange-50 text-orange-700 border-orange-200',
    'Scheduled': 'bg-sky-50 text-sky-700 border-sky-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-zinc-100 text-zinc-500 border-zinc-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-tight border ${styles[status] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
      {status}
    </span>
  );
};

export const RenewalStatusBadge: React.FC<{ status: LeaseRenewalStatus }> = ({ status }) => {
  const styles: Record<LeaseRenewalStatus, string> = {
    'Review Pending': 'bg-zinc-100 text-zinc-700 border-zinc-200',
    'Notice Sent': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Negotiating Terms': 'bg-amber-50 text-amber-700 border-amber-200',
    'Tenant Accepted': 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    'Tenant Declined (Vacating)': 'bg-rose-50 text-rose-700 border-rose-200',
    'Renewed Signed': 'bg-teal-50 text-teal-800 border-teal-300 font-bold'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-tight border ${styles[status]}`}>
      {status}
    </span>
  );
};

export const LeadStageBadge: React.FC<{ stage: LeadStage }> = ({ stage }) => {
  const styles: Record<string, string> = {
    'New Lead': 'bg-zinc-100 text-zinc-700 border-zinc-300 font-semibold',
    'Contacted': 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
    'Showing Scheduled': 'bg-violet-50 text-violet-700 border-violet-200 font-semibold',
    'Application Received': 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    'Lease Signed': 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    // Legacy aliases
    'New Inquiry': 'bg-zinc-100 text-zinc-700 border-zinc-200',
    'Tour Scheduled': 'bg-violet-50 text-violet-700 border-violet-200',
    'Tour Completed': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Application Submitted': 'bg-amber-50 text-amber-800 border-amber-300',
    'Screening & Background': 'bg-amber-50 text-amber-700 border-amber-200',
    'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Lease Sent': 'bg-sky-50 text-sky-700 border-sky-200 font-semibold',
    'Signed / Converted': 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    'Lost / Archived': 'bg-zinc-100 text-zinc-400 border-zinc-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-tight border ${styles[stage] || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
      {stage}
    </span>
  );
};

export const MonthToMonthBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-sm uppercase tracking-tight ${className}`}>
    Month-to-Month
  </span>
);

export const BathroomTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  if (type.includes('Private Ensuite') || type.includes('Private')) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-tight">
        Private Ensuite
      </span>
    );
  }
  if (type.includes('1 Shared')) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-tight">
        1 Shared Bath
      </span>
    );
  }
  if (type.includes('2 Shared')) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-tight">
        2 Shared Baths
      </span>
    );
  }
  if (type.includes('Jack & Jill')) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-tight">
        Jack & Jill
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-tight">
      {type || 'Shared Bath'}
    </span>
  );
};
