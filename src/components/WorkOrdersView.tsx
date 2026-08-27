import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  AlertCircle, 
  Phone, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Filter, 
  LayoutGrid, 
  List, 
  User, 
  Building, 
  Tag,
  Key,
  MessageSquare
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderCategory, Property, Room, Contact } from '../types';
import { PriorityBadge, WorkOrderStatusBadge } from './common/Badges';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  properties: Property[];
  rooms: Room[];
  contacts: Contact[];
  onUpdateWorkOrder: (workOrder: WorkOrder) => void;
  onOpenNewWorkOrderModal: (defaultRoom?: Room) => void;
  onOpenEditWorkOrderModal: (workOrder: WorkOrder) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  properties,
  rooms,
  contacts,
  onUpdateWorkOrder,
  onOpenNewWorkOrderModal,
  onOpenEditWorkOrderModal
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Contractors list from contacts
  const contractors = contacts.filter(c => c.type === 'Vendor / Contractor');

  // Filtered work orders
  const filteredWorkOrders = workOrders.filter(wo => {
    if (priorityFilter !== 'all' && wo.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && wo.category !== categoryFilter) return false;
    if (propertyFilter !== 'all' && wo.propertyId !== propertyFilter) return false;
    if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        wo.title.toLowerCase().includes(q) ||
        wo.ticketNumber.toLowerCase().includes(q) ||
        wo.propertyName.toLowerCase().includes(q) ||
        (wo.roomName && wo.roomName.toLowerCase().includes(q)) ||
        (wo.assignedVendorName && wo.assignedVendorName.toLowerCase().includes(q)) ||
        wo.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI calculations
  const totalOpen = workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled').length;
  const emergencyCount = workOrders.filter(w => w.priority === 'Emergency' && w.status !== 'Completed').length;
  const highCount = workOrders.filter(w => w.priority === 'High' && w.status !== 'Completed').length;
  const completedCount = workOrders.filter(w => w.status === 'Completed').length;
  const totalCostEstimated = workOrders.reduce((sum, w) => sum + (w.estimatedCost || 0), 0);
  const totalCostActual = workOrders.reduce((sum, w) => sum + (w.actualCost || w.estimatedCost || 0), 0);

  // Kanban columns
  const KANBAN_COLUMNS: { id: WorkOrderStatus; title: string; color: string }[] = [
    { id: 'New', title: 'New Tickets', color: 'border-purple-300 bg-purple-50/40 text-purple-900' },
    { id: 'In Progress', title: 'In Progress', color: 'border-blue-300 bg-blue-50/40 text-blue-900' },
    { id: 'Assigned', title: 'Assigned / Dispatched', color: 'border-indigo-300 bg-indigo-50/40 text-indigo-900' },
    { id: 'Scheduled', title: 'Scheduled Work', color: 'border-cyan-300 bg-cyan-50/40 text-cyan-900' },
    { id: 'Awaiting Parts', title: 'Awaiting Parts', color: 'border-amber-300 bg-amber-50/40 text-amber-900' },
    { id: 'Completed', title: 'Resolved & Closed', color: 'border-emerald-300 bg-emerald-50/40 text-emerald-900' }
  ];

  const handleAdvanceStatus = (wo: WorkOrder, nextStatus: WorkOrderStatus) => {
    onUpdateWorkOrder({
      ...wo,
      status: nextStatus,
      ...(nextStatus === 'Completed' ? { dateCompleted: new Date().toISOString().split('T')[0] } : {})
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <h1 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Maintenance Work Orders & Dispatch
            </h1>
            {emergencyCount > 0 && (
              <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight">
                {emergencyCount} Emergency
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage plumbing, HVAC, electrical, room turnover repairs, and vendor dispatches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-sm border border-zinc-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-tight transition-colors ${
                viewMode === 'list' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => onOpenNewWorkOrderModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ New Work Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-zinc-400">Active Work Orders</span>
          <p className="text-3xl font-light text-zinc-900 mt-2">{totalOpen}</p>
          <p className="text-xs text-zinc-500 mt-1">{emergencyCount} emergency • {highCount} high priority</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-rose-600">Emergency Tickets</span>
          <p className="text-3xl font-light text-rose-600 mt-2">{emergencyCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Requires immediate contractor dispatch</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-emerald-600">Completed & Closed</span>
          <p className="text-3xl font-light text-emerald-600 mt-2">{completedCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Resolved work orders</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-amber-600">Maintenance Costs</span>
          <p className="text-3xl font-light text-amber-600 mt-2 font-mono">${totalCostActual.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">Estimated: ${totalCostEstimated.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-sm p-4 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-zinc-500 uppercase tracking-tight text-[11px] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="Emergency">🚨 Emergency Only</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="Plumbing">Plumbing</option>
            <option value="HVAC / Heating">HVAC / Heating</option>
            <option value="Electrical">Electrical</option>
            <option value="Appliance">Appliance</option>
            <option value="Locks & Access">Locks & Access</option>
            <option value="Common Area">Common Area</option>
            <option value="Room Fixtures">Room Fixtures</option>
          </select>

          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Assigned">Assigned</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Awaiting Parts">Awaiting Parts</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search ticket #, title, or room..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-3 py-1.5 text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-56"
        />
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
          {KANBAN_COLUMNS.map(col => {
            const colTickets = filteredWorkOrders.filter(w => w.status === col.id);

            return (
              <div key={col.id} className="bg-zinc-100/70 rounded-sm p-3 border border-zinc-200 min-h-[500px] flex flex-col">
                <div className="px-3 py-2 rounded-sm border border-zinc-200 bg-white font-bold text-xs flex items-center justify-between mb-3 shadow-xs">
                  <span className="uppercase tracking-tight text-zinc-800">{col.title}</span>
                  <span className="bg-zinc-100 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold text-zinc-700">
                    {colTickets.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                  {colTickets.length === 0 ? (
                    <div className="p-4 text-center text-zinc-400 text-xs border border-dashed border-zinc-300 rounded-sm">
                      No tickets
                    </div>
                  ) : (
                    colTickets.map(wo => (
                      <div
                        key={wo.id}
                        onClick={() => onOpenEditWorkOrderModal(wo)}
                        className={`bg-white rounded-sm p-3.5 border shadow-xs hover:border-zinc-400 transition-colors cursor-pointer space-y-2.5 ${
                          wo.priority === 'Emergency' ? 'border-rose-400' : 'border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-zinc-600">{wo.ticketNumber}</span>
                          <PriorityBadge priority={wo.priority} />
                        </div>

                        <h4 className="font-bold text-zinc-900 text-xs leading-snug">{wo.title}</h4>

                        <div className="text-[11px] text-zinc-500 space-y-0.5">
                          <p className="truncate"><strong className="text-zinc-700">{wo.propertyName}</strong></p>
                          <p className="text-zinc-600 truncate">{wo.roomName || 'Common Area'}</p>
                        </div>

                        {/* Category & Cost */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                          <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded-sm text-[10px] font-medium uppercase tracking-tight">
                            {wo.category}
                          </span>
                          <span className="font-medium text-zinc-800 font-mono">
                            ${wo.estimatedCost} est
                          </span>
                        </div>

                        {/* Photo indicator & Vendor Assignment */}
                        <div className="flex items-center justify-between text-[11px] bg-zinc-50 p-1.5 rounded-sm border border-zinc-200 text-zinc-600">
                          <span className="font-medium text-zinc-800 truncate">
                            {wo.assignedVendorName ? `🔧 ${wo.assignedVendorName}` : 'Unassigned'}
                          </span>
                          {wo.photos && wo.photos.length > 0 && (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1 rounded-sm font-semibold flex items-center gap-0.5">
                              📷 {wo.photos.length}
                            </span>
                          )}
                        </div>

                        {/* Quick Action advance */}
                        <div className="flex items-center justify-between pt-1 text-[11px]" onClick={(e) => e.stopPropagation()}>
                          <span className="text-zinc-400 font-mono text-[10px]">{wo.dateReported}</span>
                          {col.id !== 'Completed' && (
                            <select
                              value={wo.status}
                              onChange={(e) => handleAdvanceStatus(wo, e.target.value as WorkOrderStatus)}
                              className="text-[10px] bg-zinc-100 border border-zinc-200 rounded-sm px-1.5 py-0.5 text-zinc-700 font-medium uppercase tracking-tight"
                            >
                              <option value="New">Move &rarr; New</option>
                              <option value="In Progress">Move &rarr; In Progress</option>
                              <option value="Assigned">Move &rarr; Assigned</option>
                              <option value="Scheduled">Move &rarr; Scheduled</option>
                              <option value="Awaiting Parts">Move &rarr; Parts</option>
                              <option value="Completed">Move &rarr; Complete</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-white rounded-sm border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Title & Location</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Vendor</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredWorkOrders.map(wo => (
                  <tr key={wo.id} className="hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => onOpenEditWorkOrderModal(wo)}>
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-700">{wo.ticketNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-zinc-900">{wo.title}</p>
                      <p className="text-[11px] text-zinc-500">{wo.propertyName} • {wo.roomName || 'Common Area'}</p>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={wo.priority} /></td>
                    <td className="px-4 py-3 font-medium text-zinc-700">{wo.category}</td>
                    <td className="px-4 py-3"><WorkOrderStatusBadge status={wo.status} /></td>
                    <td className="px-4 py-3 text-zinc-700 font-medium">{wo.assignedVendorName || 'Unassigned'}</td>
                    <td className="px-4 py-3 font-mono font-semibold">${wo.actualCost || wo.estimatedCost}</td>
                    <td className="px-4 py-3 text-zinc-500 font-mono">{wo.dateReported}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenEditWorkOrderModal(wo); }}
                        className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-sm font-medium text-[11px] uppercase tracking-tight"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
