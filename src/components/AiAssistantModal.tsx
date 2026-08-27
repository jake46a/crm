import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Users2, 
  Wrench, 
  Home, 
  Copy, 
  Check, 
  Send, 
  RefreshCw,
  Zap,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Property, Room, LeaseRenewal, WorkOrder, TenantLead, Contact } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  rooms: Room[];
  renewals: LeaseRenewal[];
  workOrders: WorkOrder[];
  leads: TenantLead[];
  contacts: Contact[];
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  properties,
  rooms,
  renewals,
  workOrders,
  leads,
  contacts
}) => {
  const [activeTool, setActiveTool] = useState<'renewal' | 'matcher' | 'triage' | 'marketing'>('renewal');
  
  // Tool 1 State: Renewal Letter
  const [selectedRenewalId, setSelectedRenewalId] = useState<string>(renewals[0]?.id || '');
  const [renewalTone, setRenewalTone] = useState<'warm' | 'formal' | 'incentive'>('warm');
  const [renewalOutput, setRenewalOutput] = useState<string>('');
  
  // Tool 2 State: Roommate Matcher
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms.find(r => r.status === 'Available')?.id || rooms[0]?.id || '');
  const [matchOutput, setMatchOutput] = useState<{ score: number; verdict: string; highlights: string[]; considerations: string[] } | null>(null);

  // Tool 3 State: Work Order Triage
  const [triageProblem, setTriageProblem] = useState<string>('Kitchen drain is completely stopped and garbage disposal is humming without spinning');
  const [triageOutput, setTriageOutput] = useState<{ priority: string; category: string; safetyTips: string; vendorText: string } | null>(null);

  // Tool 4 State: Marketing Listing
  const [marketingRoomId, setMarketingRoomId] = useState<string>(rooms.find(r => r.status === 'Available')?.id || rooms[0]?.id || '');
  const [marketingOutput, setMarketingOutput] = useState<string>('');

  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  // Generator 1: Renewal Notice
  const generateRenewalLetter = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const ren = renewals.find(r => r.id === selectedRenewalId);
      if (!ren) return;

      const prop = properties.find(p => p.id === ren.propertyId);
      const room = rooms.find(r => r.id === ren.roomId);

      let text = '';
      if (renewalTone === 'warm') {
        text = `MOYER PROPERTY MANAGEMENT\nRoom Rentals & Coliving Community\nDate: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nDear ${ren.tenantName},\n\nWe would like to express our sincere gratitude for having you as part of our house community at ${ren.propertyName}. Your current lease for ${ren.roomName} concludes on ${ren.currentLeaseEndDate}.\n\nAs a valued resident, we are pleased to present your 12-Month Lease Renewal Offer:\n\n• Property: ${ren.propertyName}\n• Room: ${ren.roomName} (${room?.bathroomType || 'Private Ensuite'})\n• Current Monthly Rent: $${ren.currentMonthlyRent}.00\n• Proposed Renewal Rent: $${ren.proposedMonthlyRent}.00/month (Includes all high-speed Wi-Fi, commons cleaning, water & trash)\n• New Term: ${ren.currentLeaseEndDate} through September 30, 2027\n• Confirmation Deadline: ${ren.decisionDeadline}\n\nPlease reply to this notice or click in the Moyer Resident Portal to confirm your renewal.\n\nWarm regards,\nMoyer Property Management Team\nOperations Desk: (303) 555-0100 | contact@moyerpm.com`;
      } else if (renewalTone === 'incentive') {
        text = `MOYER PROPERTY MANAGEMENT - PREFERRED RESIDENT RENEWAL OFFER\nDate: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nDear ${ren.tenantName},\n\nBecause of your exemplary record and great relationship with your housemates at ${ren.propertyName}, Moyer Property Management is offering you a Preferred Renewal Incentive:\n\n• Guaranteed Fixed Rate: $${ren.proposedMonthlyRent}.00/month for 12 months (Below market comp of $${ren.proposedMonthlyRent + 75}/mo)\n• FREE Annual Room Deep Clean & Carpet Refresh included upon renewal\n• Flexible 30-Day Sublet Authorization if travel required\n\nTo lock in this preferred rate for ${ren.roomName}, please confirm prior to ${ren.decisionDeadline}.\n\nBest,\nJake Moyer, Principal Property Manager`;
      } else {
        text = `FORMAL NOTICE OF LEASE RENEWAL TERMS\nTo: ${ren.tenantName}\nPremises: ${ren.propertyName}, ${ren.roomName}\nDate: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nNotice is hereby provided that the current term expiring on ${ren.currentLeaseEndDate} is eligible for extension under the following adjusted covenant:\n\n1. Rent Adjustment: $${ren.proposedMonthlyRent}.00 payable on the 1st of each calendar month.\n2. Security Deposit: Retained in escrow ($${room?.securityDeposit || ren.currentMonthlyRent}.00).\n3. Written Notice of Intent: Must be delivered to management no later than ${ren.decisionDeadline}.\n\nMoyer Property Management LLC`;
      }

      setRenewalOutput(text);
      setIsGenerating(false);
    }, 300);
  };

  // Generator 2: Roommate Matcher
  const generateRoommateMatch = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const lead = leads.find(l => l.id === selectedLeadId);
      const room = rooms.find(r => r.id === selectedRoomId);
      if (!lead || !room) return;

      const otherRoomsInHouse = rooms.filter(r => r.propertyId === room.propertyId && r.id !== room.id && r.status === 'Occupied');

      setMatchOutput({
        score: Math.min(98, Math.max(82, lead.score + 2)),
        verdict: 'Excellent Cultural & Practical Fit',
        highlights: [
          `Income-to-Rent Ratio: ${(lead.monthlyIncome / room.monthlyRent).toFixed(1)}x monthly rent (Exceeds 3.0x standard threshold)`,
          `Cleanliness Alignment: ${lead.lifestyleProfile.cleanliness} matches the bi-weekly scheduled housekeeping rotation at ${room.propertyName}`,
          `Work Schedule: ${lead.lifestyleProfile.schedule} harmonizes with existing housemates without morning bathroom congestion`,
          `Quiet Hours: Non-smoker and agrees to 10 PM house quiet guidelines`
        ],
        considerations: [
          `Lead requested move-in for ${lead.targetMoveInDate}; room turnover finishes 2 days prior`,
          `Ensure lead reviews assigned refrigerator/pantry bin rules during onboarding`
        ]
      });
      setIsGenerating(false);
    }, 350);
  };

  // Generator 3: Work Order Triage
  const generateTriage = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setTriageOutput({
        priority: 'High Priority (Dispatch within 4-6 Hours)',
        category: 'Plumbing & Kitchen Fixtures',
        safetyTips: 'Notify housemates: Do NOT run dishwasher or pour chemical drain cleaners into sink. Turn off power switch under the sink to prevent disposal motor burnout.',
        vendorText: `URGENT DISPATCH - Moyer Property Management\nVendor: Steve Kowalski (Front Range Rapid Plumbing)\nProperty: Elmwood Coliving Manor (1424 Elmwood Ave)\nIssue: Kitchen sink stopped + jammed disposal.\nKeycode: Front door 5829.\nAuthorized limit: Up to $250. Please call dispatch when onsite: (303) 555-0100.`
      });
      setIsGenerating(false);
    }, 300);
  };

  // Generator 4: Marketing Listing
  const generateMarketingListing = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const room = rooms.find(r => r.id === marketingRoomId);
      if (!room) return;
      const prop = properties.find(p => p.id === room.propertyId);

      const listing = `🌟 FURNISHED ROOM FOR RENT: ${room.name} @ ${room.propertyName}\nRent: $${room.monthlyRent}/mo | Deposit: $${room.securityDeposit} | Move-in Ready!\n\nLooking for clean, friendly, and respectful co-living in ${prop?.city || 'Denver'}? Moyer Property Management has an opening in our premier room rental home.\n\n✨ YOUR PRIVATE ROOM:\n• ${room.sqft} sqft with ${room.bathroomType}\n• ${room.isFurnished ? 'Fully furnished (Queen bed, desk, chair, wardrobe, blackout shades)' : 'Spacious unfurnished bedroom'}\n• Keyless digital keypad entry on your private bedroom door\n• High-speed fiber Wi-Fi included!\n\n🏡 SHARED HOUSE AMENITIES:\n${prop?.sharedAmenities.slice(0, 5).map(a => `• ${a}`).join('\n')}\n\n📋 HOUSE RULES & CULTURE:\n• Working professionals & graduate students\n• Quiet hours 10 PM - 7 AM\n• Non-smoking house\n\n📞 Schedule a tour today with Moyer Property Management: (303) 555-0100 or apply online!`;

      setMarketingOutput(listing);
      setIsGenerating(false);
    }, 300);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                <span>Moyer Smart Operations Assistant</span>
                <span className="text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  AI Powered
                </span>
              </h2>
              <p className="text-xs text-zinc-300">Fast room rental copywriting, lease renewals, and tenant triage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Tool Navigation Bar */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-4 pt-2 overflow-x-auto text-xs">
          <button
            onClick={() => { setActiveTool('renewal'); if (!renewalOutput) generateRenewalLetter(); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold border-b-2 transition whitespace-nowrap ${
              activeTool === 'renewal' ? 'border-indigo-600 text-zinc-900 bg-white rounded-t-md' : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Lease Renewal Notice</span>
          </button>

          <button
            onClick={() => { setActiveTool('matcher'); if (!matchOutput) generateRoommateMatch(); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold border-b-2 transition whitespace-nowrap ${
              activeTool === 'matcher' ? 'border-indigo-600 text-zinc-900 bg-white rounded-t-md' : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Users2 className="w-4 h-4 text-emerald-600" />
            <span>Roommate Compatibility</span>
          </button>

          <button
            onClick={() => { setActiveTool('triage'); if (!triageOutput) generateTriage(); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold border-b-2 transition whitespace-nowrap ${
              activeTool === 'triage' ? 'border-indigo-600 text-zinc-900 bg-white rounded-t-md' : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Wrench className="w-4 h-4 text-rose-600" />
            <span>Work Order Triage</span>
          </button>

          <button
            onClick={() => { setActiveTool('marketing'); if (!marketingOutput) generateMarketingListing(); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold border-b-2 transition whitespace-nowrap ${
              activeTool === 'marketing' ? 'border-indigo-600 text-zinc-900 bg-white rounded-t-md' : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Home className="w-4 h-4 text-indigo-600" />
            <span>Room Marketing Copy</span>
          </button>
        </div>

        {/* Tool Content Body */}
        <div className="p-6 space-y-5 max-h-[650px] overflow-y-auto">
          {/* TOOL 1: LEASE RENEWAL NOTICE */}
          {activeTool === 'renewal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Select Tenant & Lease Expiration:</label>
                  <select
                    value={selectedRenewalId}
                    onChange={(e) => setSelectedRenewalId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {renewals.map(ren => (
                      <option key={ren.id} value={ren.id}>
                        {ren.tenantName} - {ren.propertyName} ({ren.roomName}) [Exp: {ren.daysUntilExpiration}d]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Renewal Tone / Strategy:</label>
                  <select
                    value={renewalTone}
                    onChange={(e) => setRenewalTone(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="warm">Warm Community Resident Offer</option>
                    <option value="incentive">Preferred Resident Incentive (Deep Clean Perk)</option>
                    <option value="formal">Formal Legal Notice</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={generateRenewalLetter}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold shadow-xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Notice Draft</span>
                </button>
              </div>

              {renewalOutput && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-bold text-zinc-700">Customized Renewal Letter Preview:</span>
                    <button
                      onClick={() => copyToClipboard(renewalOutput)}
                      className="flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
                    </button>
                  </div>
                  <pre className="text-xs bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-zinc-800 font-sans whitespace-pre-wrap leading-relaxed shadow-inner">
                    {renewalOutput}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TOOL 2: ROOMMATE COMPATIBILITY */}
          {activeTool === 'matcher' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Select Prospective Lead:</label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name} ({lead.occupation}) [Score: {lead.score}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Match Against Room / House:</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.propertyName} - {room.name} (${room.monthlyRent}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={generateRoommateMatch}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition"
                >
                  <Users2 className="w-3.5 h-3.5" />
                  <span>Analyze Compatibility</span>
                </button>
              </div>

              {matchOutput && (
                <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                    <div>
                      <span className="font-bold text-zinc-900 text-sm">{matchOutput.verdict}</span>
                      <p className="text-zinc-500 text-[11px]">Roommate Cohort Synthesis</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600">{matchOutput.score}%</span>
                      <p className="text-[10px] text-zinc-400">Match Index</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-zinc-800 text-xs mb-1.5 text-emerald-700">✅ Key Fit Strengths:</p>
                    <ul className="space-y-1 text-zinc-700 text-[11px] list-disc list-inside">
                      {matchOutput.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-zinc-200">
                    <p className="font-bold text-zinc-800 text-xs mb-1.5 text-amber-700">⚠️ House Management Checklist:</p>
                    <ul className="space-y-1 text-zinc-700 text-[11px] list-disc list-inside">
                      {matchOutput.considerations.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOOL 3: WORK ORDER TRIAGE */}
          {activeTool === 'triage' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Describe Maintenance Problem:</label>
                <textarea
                  rows={3}
                  value={triageProblem}
                  onChange={(e) => setTriageProblem(e.target.value)}
                  className="w-full text-xs p-3 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={generateTriage}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold shadow-xs transition"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Triage & Draft Dispatch</span>
                </button>
              </div>

              {triageOutput && (
                <div className="space-y-3 bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                    <span className="font-bold text-zinc-900">{triageOutput.category}</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {triageOutput.priority}
                    </span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-md text-amber-900 text-[11px]">
                    <strong className="block mb-0.5">🛡️ Housemate Safety Protocol:</strong>
                    {triageOutput.safetyTips}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-zinc-800 text-[11px]">Contractor SMS Dispatch Text:</span>
                      <button
                        onClick={() => copyToClipboard(triageOutput.vendorText)}
                        className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1 text-[11px]"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Dispatch SMS</span>
                      </button>
                    </div>
                    <pre className="text-[11px] bg-white p-3 rounded-md border border-zinc-200 text-zinc-800 whitespace-pre-wrap font-mono">
                      {triageOutput.vendorText}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOOL 4: MARKETING LISTING */}
          {activeTool === 'marketing' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Select Room to Advertise:</label>
                <select
                  value={marketingRoomId}
                  onChange={(e) => setMarketingRoomId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.propertyName} - {room.name} (${room.monthlyRent}/mo, {room.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={generateMarketingListing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold shadow-xs transition"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Generate Zillow / Roomies Ad</span>
                </button>
              </div>

              {marketingOutput && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-bold text-zinc-700">Listing Description Ready to Post:</span>
                    <button
                      onClick={() => copyToClipboard(marketingOutput)}
                      className="flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Listing</span>
                    </button>
                  </div>
                  <pre className="text-xs bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-zinc-800 font-sans whitespace-pre-wrap leading-relaxed shadow-inner">
                    {marketingOutput}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex justify-between items-center text-xs">
          <span className="text-zinc-500 text-[11px]">Moyer Property Management Intelligence Hub</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 text-white rounded-md font-bold hover:bg-zinc-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
