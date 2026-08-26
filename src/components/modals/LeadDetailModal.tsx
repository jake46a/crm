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
  Building
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
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  isOpen,
  onClose,
  lead,
  properties,
  onUpdateLead,
  onConvertLead
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

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
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
              <p className="text-xs text-slate-300">{lead.occupation} • Source: {lead.source}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[650px] overflow-y-auto text-xs">
          {/* Quick Info & Funnel Stage Strip */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">Funnel Stage:</span>
              <LeadStageBadge stage={lead.stage} />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={lead.stage}
                onChange={(e) => handleStageUpdate(e.target.value as LeadStage)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-semibold"
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
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-xs"
                >
                  Convert to Resident
                </button>
              )}
            </div>
          </div>

          {/* Assigned Agent Control */}
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">Assigned Leasing Agent:</span>
            </div>
            <select
              value={lead.assignedAgent || activeAgent}
              onChange={(e) => handleAgentChange(e.target.value)}
              className="bg-white border border-blue-300 rounded-lg px-2.5 py-1 text-blue-900 font-bold focus:outline-none"
            >
              {AGENTS_LIST.map((ag) => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
          </div>

          {/* Contact and Preferences Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
              <span className="font-bold text-slate-800 text-xs block border-b pb-1">Contact & Financials</span>
              <div className="space-y-1 text-slate-600">
                <p>Phone: <a href={`tel:${lead.phone}`} className="font-mono text-slate-900 font-semibold">{lead.phone}</a></p>
                <p>Email: <a href={`mailto:${lead.email}`} className="text-slate-900 font-semibold">{lead.email}</a></p>
                <p>Monthly Income: <strong className="text-slate-900 font-mono">${lead.monthlyIncome}/mo</strong></p>
                <p>Max Budget: <strong className="text-emerald-700 font-mono">${lead.maxBudget}/mo</strong></p>
                <p>Credit Profile: <strong className="text-slate-900">{lead.creditScoreRange || 'Verified'}</strong></p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
              <span className="font-bold text-slate-800 text-xs block border-b pb-1">Roommate Lifestyle Survey</span>
              <div className="space-y-1 text-slate-600">
                <p>Cleanliness: <strong className="text-slate-900">{lead.lifestyleProfile.cleanliness}</strong></p>
                <p>Work Schedule: <strong className="text-slate-900">{lead.lifestyleProfile.schedule}</strong></p>
                <p>Social Style: <strong className="text-slate-900">{lead.lifestyleProfile.socialLevel}</strong></p>
                <p>Bath Preference: <strong className="text-slate-900">{lead.preferredBathroom}</strong></p>
                <p>Target Move-in: <strong className="text-slate-900">{lead.targetMoveInDate}</strong></p>
              </div>
            </div>
          </div>

          {/* Notes summary */}
          {lead.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
              <span className="font-bold text-slate-800 block mb-0.5">Prospect Notes:</span>
              <p>{lead.notes}</p>
            </div>
          )}

          {/* Activity & Communication History Log */}
          <div className="space-y-3">
            <span className="font-bold text-slate-900 text-xs block">Communication History & Audit Log ({lead.activityHistory?.length || 0})</span>

            {/* Add note / log form */}
            <form onSubmit={handleAddActivity} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 text-[11px]"
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
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 text-xs"
                >
                  Log Entry
                </button>
              </div>
            </form>

            {/* Timeline */}
            <div className="space-y-2">
              {lead.activityHistory.map(act => (
                <div key={act.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-bold text-slate-800">{act.title}</span>
                    <span>{act.date} • <strong className="text-blue-700">{act.agent || 'Staff'}</strong></span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{act.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

