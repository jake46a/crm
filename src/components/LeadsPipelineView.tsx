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
  Trash2
} from 'lucide-react';
import { TenantLead, LeadStage, Room, Property, Contact } from '../types';
import { LeadStageBadge, BathroomTypeBadge } from './common/Badges';

interface LeadsPipelineViewProps {
  leads: TenantLead[];
  rooms: Room[];
  properties: Property[];
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
  const [searchQuery, setSearchQuery] = useState<string>('');

  const PIPELINE_STAGES: { id: LeadStage; title: string; subtitle: string; color: string }[] = [
    { id: 'New Lead', title: '1. New Lead', subtitle: 'Inbound inquiries & web forms', color: 'border-slate-300 bg-slate-50 text-slate-800' },
    { id: 'Contacted', title: '2. Contacted', subtitle: 'Screened for lifestyle & fit', color: 'border-blue-300 bg-blue-50 text-blue-900' },
    { id: 'Showing Scheduled', title: '3. Showing Scheduled', subtitle: 'Room & common area tours', color: 'border-purple-300 bg-purple-50 text-purple-900' },
    { id: 'Application Received', title: '4. Application Received', subtitle: 'ID, credit & income check', color: 'border-amber-300 bg-amber-50 text-amber-900' },
    { id: 'Lease Signed', title: '5. Lease Signed', subtitle: 'Month-to-Month lease executed', color: 'border-emerald-300 bg-emerald-50 text-emerald-950' }
  ];

  // Filtered leads
  const filteredLeads = leads.filter(lead => {
    if (stageFilter !== 'all' && lead.stage !== stageFilter) return false;
    if (propertyFilter !== 'all' && !lead.preferredPropertyIds.includes(propertyFilter)) return false;
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

  const handleDeleteSingleLead = (e: React.MouseEvent, lead: TenantLead) => {
    e.stopPropagation();
    if (window.confirm(`Delete lead "${lead.name}"?`)) {
      if (onDeleteLead) {
        onDeleteLead(lead.id);
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Delete all tenant leads from the pipeline and database?')) {
      if (onClearAllLeads) {
        onClearAllLeads();
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-blue-600" />
            <h1 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tenant Leads & Roommate Matching Pipeline
            </h1>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight">
              {activeLeads.length} Active Prospects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track inquiries, background checks, roommate lifestyle compatibility, and convert applicants to tenants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Roommate Matcher</span>
          </button>

          {leads.length > 0 && onClearAllLeads && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors"
              title="Delete all leads in pipeline"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Leads</span>
            </button>
          )}

          <button
            onClick={onOpenNewLeadModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Tenant Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-slate-400">Total Prospects</span>
          <p className="text-3xl font-light text-slate-900 mt-2">{totalLeads}</p>
          <p className="text-xs text-slate-500 mt-1">{activeLeads.length} active in pipeline</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-emerald-600">Top-Tier Qualified (★90+)</span>
          <p className="text-3xl font-light text-emerald-600 mt-2">{qualifiedScore90}</p>
          <p className="text-xs text-slate-500 mt-1">High credit & verified income</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-amber-600">Applications Received</span>
          <p className="text-3xl font-light text-amber-600 mt-2">{inApplication}</p>
          <p className="text-xs text-slate-500 mt-1">Paystubs & IDs in verification</p>
        </div>

        <div className="bg-white rounded-sm p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-tight text-blue-600">Lease Signed / Converted</span>
          <p className="text-3xl font-light text-blue-600 mt-2">{leaseSignedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Month-to-Month room agreements</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-tight text-[11px] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Stage:
          </span>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Stages ({leads.length})</option>
            {PIPELINE_STAGES.map(st => (
              <option key={st.id} value={st.id}>{st.title} ({leads.filter(l => l.stage === st.id).length})</option>
            ))}
          </select>

          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Desired Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Search name, agent, email, or career..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-sm px-3 py-1.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-64"
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
            <div key={stage.id} className="bg-slate-100/70 rounded-lg p-3 border border-slate-200 min-h-[550px] flex flex-col">
              {/* Column Header */}
              <div className="px-3 py-2.5 rounded-md border border-slate-200 bg-white font-bold text-xs flex flex-col gap-1 mb-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-tight text-slate-800 text-[11px] font-extrabold">{stage.title}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold text-slate-700">
                    {stageLeads.length}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal truncate">{stage.subtitle}</span>
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-0.5">
                {stageLeads.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-[11px] border border-dashed border-slate-300 rounded-md bg-white/40">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => onOpenLeadDetailModal(lead)}
                      className="bg-white rounded-lg p-3.5 border border-slate-200 hover:border-blue-400 hover:shadow-sm transition cursor-pointer space-y-2.5 text-xs group relative"
                    >
                      {/* Name, Score, and Actions */}
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="font-bold text-slate-900 text-xs block leading-tight">{lead.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{lead.occupation}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono shrink-0">
                            ★ {lead.score}
                          </span>
                          {onDeleteLead && (
                            <button
                              onClick={(e) => handleDeleteSingleLead(e, lead)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                              title="Delete lead"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Assigned Agent Pill */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium uppercase tracking-tight">Assigned Agent:</span>
                          <span className="font-semibold text-blue-700 truncate max-w-[130px]">
                            {lead.assignedAgent || 'Jake Moyer'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Budget:</span>
                          <strong className="text-slate-900 font-mono">${lead.maxBudget}/mo</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Move-in:</span>
                          <strong className="text-slate-800 font-mono">{lead.targetMoveInDate}</strong>
                        </div>
                      </div>

                      {/* Roommate Profile Tags & Communication History Count */}
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {lead.lifestyleProfile?.cleanliness?.split('/')[0] || 'Standard'}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {lead.lifestyleProfile?.schedule?.split('/')[0] || 'Day'}
                          </span>
                        </div>
                        <span className="text-slate-400 font-medium">
                          💬 {lead.activityHistory?.length || 0} msgs
                        </span>
                      </div>

                      {/* 1-Click Convert or Advance Action */}
                      <div className="pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                        {stage.id === 'Lease Signed' || lead.stage === 'Lease Signed' ? (
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
                              className="flex-1 text-[10px] bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-slate-700 font-semibold uppercase tracking-tight"
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
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
