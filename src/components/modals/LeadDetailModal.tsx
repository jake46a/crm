import React, { useState } from 'react';
import { 
  Users2, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Star, 
  ShieldCheck, 
  MessageSquare, 
  Plus, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  User, 
  Building,
  Trash2
} from 'lucide-react';
import { TenantLead, LeadStage, LeadActivity, Property } from '../../types';
import { LeadStageBadge, MonthToMonthBadge } from '../common/Badges';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: TenantLead | null;
  properties: Property[];
  onUpdateLead: (lead: TenantLead) => void;
  onConvertLead: (lead: TenantLead) => void;
  onDeleteLead?: (leadId: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  isOpen,
  onClose,
  lead,
  properties,
  onUpdateLead,
  onConvertLead,
  onDeleteLead
}) => {
  const [newNote, setNewNote] = useState<string>('');
  const [newNoteType, setNewNoteType] = useState<'note' | 'call' | 'email' | 'showing' | 'sms' | 'tour'>('note');
  const [activeAgent, setActiveAgent] = useState<string>(lead?.assignedAgent || 'Jake Moyer (Lead Broker)');

  if (!isOpen || !lead) return null;

  const AGENTS_LIST = [
    'Jake Moyer (Lead Broker)',
    'Sarah Jenkins (Leasing Agent)',
    'Alex Rivera (Property Manager)',
    'Elena Rostova (Coliving Specialist)'
  ];

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const activityTitles: Record<string, string> = {
      call: 'Phone Call Logged',
      showing: 'Private Showing Conducted',
      tour: 'House Tour Conducted',
      email: 'Email Correspondence Sent',
      sms: 'SMS Text Message',
      note: 'Internal Staff Note'
    };

    const activity: LeadActivity = {
      id: `act-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: newNoteType,
      title: activityTitles[newNoteType] || 'Communication Logged',
      content: newNote,
      agent: lead.assignedAgent || activeAgent || 'Jake Moyer'
    };

    onUpdateLead({
      ...lead,
      activityHistory: [activity, ...lead.activityHistory]
    });
    setNewNote('');
  };

  const handleStageUpdate = (newStage: LeadStage) => {
    onUpdateLead({
      ...lead,
      stage: newStage,
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'stage_change',
          title: `Stage Changed to ${newStage}`,
          content: `Lead updated from ${lead.stage} to ${newStage}`,
          agent: lead.assignedAgent || 'Jake Moyer'
        },
        ...lead.activityHistory
      ]
    });
  };

  const handleAgentChange = (newAgent: string) => {
    setActiveAgent(newAgent);
    onUpdateLead({
      ...lead,
      assignedAgent: newAgent,
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'note',
          title: `Assigned to ${newAgent}`,
          content: `Lead ownership assigned to ${newAgent}`,
          agent: 'Operations'
        },
        ...lead.activityHistory
      ]
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete lead ${lead.name}?`)) {
      if (onDeleteLead) {
        onDeleteLead(lead.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {lead.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">{lead.name}</h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  ★ Score: {lead.score}
                </span>
                <MonthToMonthBadge />
              </div>
              <p className="text-xs text-zinc-300">{lead.occupation} • Source: {lead.source}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[650px] overflow-y-auto text-xs">
          {/* Quick Info & Funnel Stage Strip */}
          <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-zinc-700">Funnel Stage:</span>
              <LeadStageBadge stage={lead.stage} />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={lead.stage}
                onChange={(e) => handleStageUpdate(e.target.value as LeadStage)}
                className="bg-white border border-zinc-300 rounded-md px-2.5 py-1 text-zinc-700 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="New Lead">1. New Lead</option>
                <option value="Contacted">2. Contacted</option>
                <option value="Showing Scheduled">3. Showing Scheduled</option>
                <option value="Application Received">4. Application Received</option>
                <option value="Lease Signed">5. Lease Signed</option>
              </select>

              {(lead.stage === 'Lease Signed' || lead.stage === 'Application Received' || lead.stage === 'Approved' || lead.stage === 'Lease Sent') && (
                <button
                  onClick={() => { onClose(); onConvertLead(lead); }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition shadow-xs"
                >
                  Convert to Resident
                </button>
              )}
            </div>
          </div>

          {/* Assigned Agent Control */}
          <div className="bg-indigo-50/50 p-3 rounded-md border border-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-zinc-800">Assigned Leasing Agent:</span>
            </div>
            <select
              value={lead.assignedAgent || activeAgent}
              onChange={(e) => handleAgentChange(e.target.value)}
              className="bg-white border border-indigo-300 rounded-md px-2.5 py-1 text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {AGENTS_LIST.map((ag) => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
          </div>

          {/* Contact and Preferences Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-zinc-200 rounded-md p-3.5 space-y-2">
              <span className="font-bold text-zinc-800 text-xs block border-b border-zinc-200 pb-1">Contact & Financials</span>
              <div className="space-y-1 text-zinc-600">
                <p>Phone: <a href={`tel:${lead.phone}`} className="font-mono text-zinc-900 font-semibold hover:text-indigo-600">{lead.phone}</a></p>
                <p>Email: <a href={`mailto:${lead.email}`} className="text-zinc-900 font-semibold hover:text-indigo-600">{lead.email}</a></p>
                <p>Monthly Income: <strong className="text-zinc-900 font-mono">${lead.monthlyIncome}/mo</strong></p>
                <p>Max Budget: <strong className="text-emerald-700 font-mono">${lead.maxBudget}/mo</strong></p>
                <p>Credit Profile: <strong className="text-zinc-900">{lead.creditScoreRange || 'Verified'}</strong></p>
              </div>
            </div>

            <div className="border border-zinc-200 rounded-md p-3.5 space-y-2">
              <span className="font-bold text-zinc-800 text-xs block border-b border-zinc-200 pb-1">Roommate Lifestyle Survey</span>
              <div className="space-y-1 text-zinc-600">
                <p>Cleanliness: <strong className="text-zinc-900">{lead.lifestyleProfile.cleanliness}</strong></p>
                <p>Work Schedule: <strong className="text-zinc-900">{lead.lifestyleProfile.schedule}</strong></p>
                <p>Social Style: <strong className="text-zinc-900">{lead.lifestyleProfile.socialLevel}</strong></p>
                <p>Bath Preference: <strong className="text-zinc-900">{lead.preferredBathroom}</strong></p>
                <p>Target Move-in: <strong className="text-zinc-900">{lead.targetMoveInDate}</strong></p>
              </div>
            </div>
          </div>

          {/* Notes summary */}
          {lead.notes && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-700">
              <span className="font-bold text-zinc-800 block mb-0.5">Prospect Notes:</span>
              <p>{lead.notes}</p>
            </div>
          )}

          {/* Activity & Communication History Log */}
          <div className="space-y-3">
            <span className="font-bold text-zinc-900 text-xs block">Communication History & Audit Log ({lead.activityHistory?.length || 0})</span>

            {/* Add note / log form */}
            <form onSubmit={handleAddActivity} className="bg-zinc-50 p-3 rounded-md border border-zinc-200 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value as any)}
                  className="bg-white border border-zinc-300 rounded-md px-2 py-1 text-zinc-700 text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="note">📝 Internal Note</option>
                  <option value="call">📞 Phone Call</option>
                  <option value="showing">🏠 Showing / Tour</option>
                  <option value="email">✉️ Email</option>
                  <option value="sms">💬 SMS Message</option>
                </select>
                <input
                  type="text"
                  placeholder="Log call summary, showing feedback, or lead email..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 bg-white border border-zinc-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-zinc-900 text-white font-bold rounded-md hover:bg-zinc-800 text-xs shadow-xs transition"
                >
                  Log Entry
                </button>
              </div>
            </form>

            {/* Timeline */}
            <div className="space-y-2">
              {lead.activityHistory.map(act => (
                <div key={act.id} className="bg-white p-3 rounded-md border border-zinc-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                    <span className="font-bold text-zinc-800">{act.title}</span>
                    <span>{act.date} • <strong className="text-indigo-700">{act.agent || 'Staff'}</strong></span>
                  </div>
                  <p className="text-zinc-700 leading-relaxed">{act.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent rounded-md font-bold transition text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Lead</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 text-white rounded-md font-bold hover:bg-zinc-800 transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
