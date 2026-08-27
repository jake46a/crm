import React, { useState } from 'react';
import { 
  Users2, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  ArrowRight, 
  Star, 
  Home, 
  Clock, 
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  User,
  X
} from 'lucide-react';
import { TenantLead, LeadStage, Room, Property, Contact } from '../types';
import { LeadStageBadge, BathroomTypeBadge } from './common/Badges';

interface LeadsPipelineViewProps {
  leads: TenantLead[];
  rooms: Room[];
  properties: Property[];
  contacts?: Contact[];
  onUpdateLead: (lead: TenantLead) => void;
  onOpenNewLeadModal: () => void;
  onOpenLeadDetailModal: (lead: TenantLead) => void;
  onOpenConvertLeadModal: (lead: TenantLead) => void;
  onOpenAssistant: () => void;
  onDeleteLead?: (leadId: string) => void;
  onClearAllLeads?: () => void;
}

export const LeadsPipelineView: React.FC<LeadsPipelineViewProps> = ({
  leads,
  rooms,
  properties,
  contacts = [],
  onUpdateLead,
  onOpenNewLeadModal,
  onOpenLeadDetailModal,
  onOpenConvertLeadModal,
  onOpenAssistant,
  onDeleteLead,
  onClearAllLeads
}) => {
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Delete confirmation modal states
  const [leadToDelete, setLeadToDelete] = useState<TenantLead | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState<boolean>(false);

  const PIPELINE_STAGES: { id: LeadStage; title: string; subtitle: string; color: string }[] = [
    { id: 'New Lead', title: '1. New Lead', subtitle: 'Inbound inquiries & web forms', color: 'border-zinc-300 bg-zinc-50 text-zinc-800' },
    { id: 'Contacted', title: '2. Contacted', subtitle: 'Screened for lifestyle & fit', color: 'border-indigo-300 bg-indigo-50 text-indigo-900' },
    { id: 'Showing Scheduled', title: '3. Showing Scheduled', subtitle: 'Room & common area tours', color: 'border-purple-300 bg-purple-50 text-purple-900' },
    { id: 'Application Received', title: '4. Application Received', subtitle: 'ID, credit & income check', color: 'border-amber-300 bg-amber-50 text-amber-900' },
    { id: 'Lease Signed', title: '5. Lease Signed', subtitle: 'Month-to-Month lease executed', color: 'border-emerald-300 bg-emerald-50 text-emerald-950' }
  ];

  // Extract all leasing agents from contacts
  const leasingAgentContacts = contacts.filter(c => c.type === 'Leasing Agent');

  // Filtered leads
  const filteredLeads = leads.filter(lead => {
    if (stageFilter !== 'all' && lead.stage !== stageFilter) return false;
    if (propertyFilter !== 'all' && !lead.preferredPropertyIds.includes(propertyFilter)) return false;
    if (agentFilter !== 'all') {
      const assigned = lead.assignedAgent || '';
      if (!assigned.toLowerCase().includes(agentFilter.toLowerCase())) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.occupation.toLowerCase().includes(q) ||
        (lead.assignedAgent && lead.assignedAgent.toLowerCase().includes(q)) ||
        lead.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI stats
  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => l.stage !== 'Lease Signed' && l.stage !== 'Signed / Converted' && l.stage !== 'Lost / Archived');
  const qualifiedScore90 = leads.filter(l => l.score >= 90).length;
  const inApplication = leads.filter(l => l.stage === 'Application Received' || l.stage === 'Application Submitted' || l.stage === 'Screening & Background').length;
  const leaseSignedCount = leads.filter(l => l.stage === 'Lease Signed' || l.stage === 'Signed / Converted').length;

  const handleStageChange = (lead: TenantLead, newStage: LeadStage) => {
    onUpdateLead({
      ...lead,
      stage: newStage,
      activityHistory: [
        {
          id: 'act-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'stage_change',
          title: `Moved to ${newStage}`,
          content: `Lead pipeline stage updated to ${newStage}.`,
          agent: lead.assignedAgent || 'Jake Moyer'
        },
        ...lead.activityHistory
      ]
    });
  };

  const handleConfirmDeleteSingleLead = () => {
    if (leadToDelete && onDeleteLead) {
      onDeleteLead(leadToDelete.id);
      setLeadToDelete(null);
    }
  };

  const handleConfirmClearAllLeads = () => {
    if (onClearAllLeads) {
      onClearAllLeads();
      setIsConfirmingClearAll(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-indigo-600" />
            <h1 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Tenant Leads & Roommate Matching Pipeline
            </h1>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight">
              {activeLeads.length} Active Prospects
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Track inquiries, background checks, roommate lifestyle compatibility, and convert applicants to tenants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Roommate Matcher</span>
          </button>

          {leads.length > 0 && onClearAllLeads && (
            <button
              onClick={() => setIsConfirmingClearAll(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors"
              title="Delete all leads in pipeline"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Leads</span>
            </button>
          )}

          <button
            onClick={onOpenNewLeadModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Tenant Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-zinc-400">Total Prospects</span>
          <p className="text-3xl font-light text-zinc-900 mt-2">{totalLeads}</p>
          <p className="text-xs text-zinc-500 mt-1">{activeLeads.length} active in pipeline</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-emerald-600">Top-Tier Qualified (★90+)</span>
          <p className="text-3xl font-light text-emerald-600 mt-2">{qualifiedScore90}</p>
          <p className="text-xs text-zinc-500 mt-1">High credit & verified income</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-amber-600">Applications Received</span>
          <p className="text-3xl font-light text-amber-600 mt-2">{inApplication}</p>
          <p className="text-xs text-zinc-500 mt-1">Paystubs & IDs in verification</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-zinc-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-indigo-600">Lease Signed / Converted</span>
          <p className="text-3xl font-light text-indigo-600 mt-2">{leaseSignedCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Month-to-Month room agreements</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-sm p-4 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-zinc-500 uppercase tracking-tight text-[11px] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Stages ({leads.length})</option>
            {PIPELINE_STAGES.map(st => (
              <option key={st.id} value={st.id}>{st.title} ({leads.filter(l => l.stage === st.id).length})</option>
            ))}
          </select>

          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Houses</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="all">All Leasing Agents</option>
            {leasingAgentContacts.map(ag => (
              <option key={ag.id} value={ag.name}>
                Agent: {ag.name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Search name, agent, email, or career..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs bg-zinc-50 border border-zinc-300 rounded-sm px-3 py-1.5 text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-64"
        />
      </div>

      {/* Visual Pipeline Funnel Columns (5 Stages) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {PIPELINE_STAGES.map(stage => {
          // Filter matching leads, also handling legacy aliases if present
          const stageLeads = filteredLeads.filter(l => {
            if (stage.id === 'New Lead') return l.stage === 'New Lead' || l.stage === 'New Inquiry';
            if (stage.id === 'Showing Scheduled') return l.stage === 'Showing Scheduled' || l.stage === 'Tour Scheduled' || l.stage === 'Tour Completed';
            if (stage.id === 'Application Received') return l.stage === 'Application Received' || l.stage === 'Application Submitted' || l.stage === 'Screening & Background' || l.stage === 'Approved';
            if (stage.id === 'Lease Signed') return l.stage === 'Lease Signed' || l.stage === 'Lease Sent' || l.stage === 'Signed / Converted';
            return l.stage === stage.id;
          });

          return (
            <div key={stage.id} className="bg-zinc-100/70 rounded-lg p-3 border border-zinc-200 min-h-[550px] flex flex-col">
              {/* Column Header */}
              <div className="px-3 py-2.5 rounded-md border border-zinc-200 bg-white font-bold text-xs flex flex-col gap-1 mb-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-tight text-zinc-800 text-[11px] font-extrabold">{stage.title}</span>
                  <span className="bg-zinc-100 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold text-zinc-700">
                    {stageLeads.length}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-normal truncate">{stage.subtitle}</span>
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                {stageLeads.length === 0 ? (
                  <div className="p-4 text-center text-zinc-400 text-[11px] border border-dashed border-zinc-300 rounded-md bg-white/40">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map(lead => {
                    const matchedAgent = leasingAgentContacts.find(
                      c => c.name.toLowerCase() === (lead.assignedAgent || '').toLowerCase() ||
                           (lead.assignedAgent || '').startsWith(c.name)
                    );

                    return (
                      <div
                        key={lead.id}
                        onClick={() => onOpenLeadDetailModal(lead)}
                        className="bg-white rounded-lg p-3.5 border border-zinc-200 hover:border-indigo-400 hover:shadow-xs transition cursor-pointer space-y-2.5 text-xs group relative"
                      >
                        {/* Name, Score, and Delete Action */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-zinc-900 text-xs block leading-tight truncate">{lead.name}</span>
                            <span className="text-[10px] text-zinc-500 block truncate">{lead.occupation}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                              ★ {lead.score}
                            </span>
                            {onDeleteLead && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLeadToDelete(lead);
                                }}
                                className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title={`Delete lead ${lead.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Assigned Agent Pill */}
                        <div className="bg-zinc-50 p-2 rounded border border-zinc-200 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-400 font-medium uppercase tracking-tight flex items-center gap-1">
                              <User className="w-2.5 h-2.5" /> Agent:
                            </span>
                            <span className="font-bold text-indigo-700 truncate max-w-[140px]" title={matchedAgent?.roleOrSpecialty || lead.assignedAgent}>
                              {lead.assignedAgent || 'Jake Moyer'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Budget:</span>
                            <strong className="text-zinc-900 font-mono">${lead.maxBudget}/mo</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Target Move-in:</span>
                            <strong className="text-zinc-800 font-mono">{lead.targetMoveInDate}</strong>
                          </div>
                        </div>

                        {/* Roommate Profile Tags & Communication History Count */}
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-medium">
                              {lead.lifestyleProfile?.cleanliness?.split('/')[0] || 'Standard'}
                            </span>
                            <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-medium">
                              {lead.lifestyleProfile?.schedule?.split('/')[0] || 'Day'}
                            </span>
                          </div>
                          <span className="text-zinc-400 font-medium">
                            💬 {lead.activityHistory?.length || 0} msgs
                          </span>
                        </div>

                        {/* 1-Click Convert or Advance Action */}
                        <div className="pt-2 border-t border-zinc-100" onClick={(e) => e.stopPropagation()}>
                          {lead.stage === 'Signed / Converted' ? (
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5 text-[10px] font-bold text-emerald-800">
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Active Room Tenant
                              </span>
                              <span className="font-mono text-[9px] bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded">
                                Converted
                              </span>
                            </div>
                          ) : (stage.id === 'Lease Signed' || lead.stage === 'Lease Signed') ? (
                            <button
                              onClick={() => onOpenConvertLeadModal(lead)}
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Convert to Room Tenant</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={lead.stage}
                                onChange={(e) => handleStageChange(lead, e.target.value as LeadStage)}
                                className="flex-1 text-[10px] bg-zinc-50 border border-zinc-300 rounded px-1.5 py-1 text-zinc-700 font-semibold uppercase tracking-tight"
                              >
                                <option value="New Lead">&rarr; 1. New Lead</option>
                                <option value="Contacted">&rarr; 2. Contacted</option>
                                <option value="Showing Scheduled">&rarr; 3. Showing Scheduled</option>
                                <option value="Application Received">&rarr; 4. Application Received</option>
                                <option value="Lease Signed">&rarr; 5. Lease Signed</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Single Lead Delete Confirmation */}
      {leadToDelete && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 text-sm">Delete Tenant Lead</h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete lead <strong className="text-zinc-900">{leadToDelete.name}</strong>? All inquiry records and communication logs will be removed.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-3.5 py-1.5 border border-zinc-300 text-zinc-700 rounded-md text-xs font-semibold hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingleLead}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold shadow-xs transition"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Clear All Leads Confirmation */}
      {isConfirmingClearAll && (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 text-sm">Clear All Pipeline Leads</h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Are you sure you want to remove all <strong>{leads.length}</strong> tenant leads from the pipeline? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(false)}
                className="px-3.5 py-1.5 border border-zinc-300 text-zinc-700 rounded-md text-xs font-semibold hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllLeads}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold shadow-xs transition"
              >
                Clear All Leads
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

