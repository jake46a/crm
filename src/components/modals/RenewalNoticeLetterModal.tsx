import React, { useState } from 'react';
import { FileText, Printer, Copy, Check, Send, X, Mail } from 'lucide-react';
import { LeaseRenewal, Property, Room } from '../../types';

interface RenewalNoticeLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  renewal: LeaseRenewal | null;
  properties: Property[];
  rooms: Room[];
  onMarkNoticeSent: (renewal: LeaseRenewal) => void;
}

export const RenewalNoticeLetterModal: React.FC<RenewalNoticeLetterModalProps> = ({
  isOpen,
  onClose,
  renewal,
  properties,
  rooms,
  onMarkNoticeSent
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [sentNotice, setSentNotice] = useState<boolean>(false);

  if (!isOpen || !renewal) return null;

  const prop = properties.find(p => p.id === renewal.propertyId);
  const room = rooms.find(r => r.id === renewal.roomId);

  const delta = renewal.proposedMonthlyRent - renewal.currentMonthlyRent;
  const pct = ((delta / renewal.currentMonthlyRent) * 100).toFixed(1);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const fullLetterText = `MOYER PROPERTY MANAGEMENT
Coliving & Room Rental Operations
1000 Speer Blvd, Suite 400, Denver, CO 80204
Office: (303) 555-0100 | portal@moyerpropertymanagement.com

NOTICE OF LEASE EXPIRATION & RENEWAL OFFER

Date: ${formattedDate}

TENANT INFORMATION:
Name: ${renewal.tenantName}
Premises: ${renewal.propertyName} - ${renewal.roomName}
Current Lease Expiration Date: ${renewal.currentLeaseEndDate}

Dear ${renewal.tenantName},

Thank you for being a valued resident with Moyer Property Management at ${renewal.propertyName}. We hope you have enjoyed living in our coliving community.

As your current lease term is scheduled to conclude on ${renewal.currentLeaseEndDate}, we are pleased to offer you the opportunity to renew your room rental agreement.

PROPOSED RENEWAL TERMS:
• Renewal Room / Unit: ${renewal.roomName} (${room?.bathroomType || 'Private Ensuite'})
• Current Monthly Rent: $${renewal.currentMonthlyRent}.00
• Proposed New Monthly Rent: $${renewal.proposedMonthlyRent}.00 (an adjustment of +$${delta}.00 / +${pct}%)
• All-Inclusive Inclusions: High-speed Fiber Wi-Fi, Water/Gas/Electricity, Bi-weekly common area housekeeping, and trash removal.
• Proposed Lease Term: ${renewal.proposedTermMonths} Months (Starting ${renewal.currentLeaseEndDate})
• Security Deposit: Retained in full escrow ($${room?.securityDeposit || renewal.currentMonthlyRent}.00).

NEXT STEPS & ACTION REQUIRED:
To accept this renewal offer and lock in your room rate, please reply in writing or digitally sign through your resident portal on or before ${renewal.decisionDeadline}.

If you plan to vacate at the end of your term, written 30-day notice is required to initiate turnover scheduling.

Sincerely,

Jake Moyer
Principal Property Manager
Moyer Property Management LLC`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    setSentNotice(true);
    onMarkNoticeSent(renewal);
    setTimeout(() => {
      setSentNotice(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                Formal Lease Renewal Notice Letter
              </h2>
              <p className="text-[11px] text-zinc-400">Recipient: {renewal.tenantName} ({renewal.propertyName})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        {/* Letter Preview Frame */}
        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto bg-zinc-100">
          <div className="bg-white p-8 rounded-md shadow-xs border border-zinc-200 text-xs font-sans leading-relaxed text-zinc-800 space-y-4">
            {/* Header Letterhead */}
            <div className="border-b border-zinc-200 pb-4 flex justify-between items-start">
              <div>
                <h1 className="font-black text-base text-zinc-900 tracking-tight">MOYER PROPERTY MANAGEMENT</h1>
                <p className="text-[11px] text-zinc-500 font-medium">Coliving & Room Rental Specialists</p>
                <p className="text-[11px] text-zinc-400">1000 Speer Blvd, Suite 400, Denver, CO 80204</p>
              </div>
              <div className="text-right text-[11px] text-zinc-500">
                <p className="font-bold text-zinc-700">Date: {formattedDate}</p>
                <p>(303) 555-0100</p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center py-2">
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900">
                Notice of Lease Expiration & Renewal Offer
              </h2>
            </div>

            {/* Tenant Block */}
            <div className="bg-zinc-50 p-3 rounded-md border border-zinc-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Resident:</span>
                <strong className="text-zinc-900">{renewal.tenantName}</strong>
                <p className="text-zinc-500 text-[11px]">{renewal.tenantEmail}</p>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Premises:</span>
                <strong className="text-zinc-900">{renewal.propertyName}</strong>
                <p className="text-zinc-600 text-[11px]">{renewal.roomName}</p>
              </div>
            </div>

            {/* Body */}
            <p>
              Dear {renewal.tenantName},
            </p>
            <p>
              Thank you for making {renewal.propertyName} your home. As your current lease term expires on <strong>{renewal.currentLeaseEndDate}</strong>, we are pleased to extend an offer to renew your room rental agreement.
            </p>

            {/* Renewal Terms Grid */}
            <div className="border border-zinc-200 rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-zinc-100">
                  <tr className="bg-zinc-50">
                    <td className="px-3 py-2 font-medium text-zinc-600">Current Monthly Rent:</td>
                    <td className="px-3 py-2 font-bold font-mono text-zinc-800">${renewal.currentMonthlyRent}.00/mo</td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="px-3 py-2 font-bold text-emerald-900">Proposed Renewal Rate:</td>
                    <td className="px-3 py-2 font-black font-mono text-emerald-800 text-sm">
                      ${renewal.proposedMonthlyRent}.00/mo <span className="text-[11px] font-normal text-emerald-600">(+${delta}/mo / +${pct}%)</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-zinc-600">Proposed Term:</td>
                    <td className="px-3 py-2 font-semibold text-zinc-800">{renewal.proposedTermMonths} Months</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-zinc-600">Decision Deadline:</td>
                    <td className="px-3 py-2 font-bold text-rose-700">{renewal.decisionDeadline}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-zinc-600">Utilities Included:</td>
                    <td className="px-3 py-2 text-zinc-700">Fiber Wi-Fi, Water, Gas, Electric, Bi-weekly House Cleaning</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-zinc-600">
              Please confirm your decision by replying to this letter or signing via the Moyer Resident Portal before <strong>{renewal.decisionDeadline}</strong>.
            </p>

            {/* Signature Area */}
            <div className="pt-4 border-t border-zinc-200 flex justify-between items-end">
              <div>
                <p className="font-bold text-zinc-900">Jake Moyer</p>
                <p className="text-[11px] text-zinc-500">Moyer Property Management LLC</p>
              </div>
              <div className="border-t border-zinc-300 pt-1 w-44 text-center">
                <span className="text-[10px] text-zinc-400">Tenant Signature & Date</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-600" />
              <span>Print Letter</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-semibold transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-600" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {sentNotice && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                ✓ Sent & Status Updated!
              </span>
            )}
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Notice & Mark "Notice Sent"</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
