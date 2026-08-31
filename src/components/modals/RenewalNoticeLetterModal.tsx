import React, { useState } from 'react';
import { FileText, Printer, Copy, Check, Send, X, Mail, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { LeaseRenewal, Property, Room } from '../../types';
import { printHtmlDocument } from '../../utils/printUtils';
import { 
  calculateAnnualReviewMilestones, 
  generateAnnualRateAdjustmentNoticeText,
  generate21DayVacateNoticeText
} from '../../utils/leaseEngine';

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
  const [noticeType, setNoticeType] = useState<'anniversary-rate-increase' | '21-day-vacate'>('anniversary-rate-increase');

  if (!isOpen || !renewal) return null;

  const prop = properties.find(p => p.id === renewal.propertyId);
  const room = rooms.find(r => r.id === renewal.roomId);

  const delta = renewal.proposedMonthlyRent - renewal.currentMonthlyRent;
  const pct = ((delta / renewal.currentMonthlyRent) * 100).toFixed(1);

  const milestones = calculateAnnualReviewMilestones(renewal.leaseStartDate || '2025-10-01', renewal.currentMonthlyRent);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const fullLetterText = noticeType === 'anniversary-rate-increase'
    ? generateAnnualRateAdjustmentNoticeText({
        tenantName: renewal.tenantName,
        propertyName: renewal.propertyName,
        roomName: renewal.roomName,
        currentRent: renewal.currentMonthlyRent,
        proposedRent: renewal.proposedMonthlyRent,
        anniversaryDate: renewal.anniversaryDate || milestones.anniversaryDate,
        decisionDeadline: renewal.decisionDeadline || milestones.decisionDeadline,
        managerName: 'Jake Moyer'
      })
    : generate21DayVacateNoticeText({
        tenantName: renewal.tenantName,
        propertyName: renewal.propertyName,
        roomName: renewal.roomName,
        noticeDate: renewal.noticeToVacate?.noticeDate || new Date().toISOString().split('T')[0],
        effectiveVacateDate: renewal.noticeToVacate?.effectiveVacateDate || renewal.currentLeaseEndDate,
        totalNoticeDays: renewal.noticeToVacate?.totalNoticeDays || 21,
        givenBy: renewal.noticeToVacate?.givenBy || 'Tenant',
        reason: renewal.noticeToVacate?.reason,
        managerName: 'Jake Moyer'
      });

  const handlePrint = () => {
    const letterHtml = noticeType === 'anniversary-rate-increase' ? `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; font-size: 13px; line-height: 1.6; color: #18181b;">
        <div style="border-bottom: 2px solid #18181b; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 18px; font-weight: 900; margin: 0; color: #09090b;">MOYER PROPERTY MANAGEMENT</h1>
            <p style="font-size: 11px; color: #71717a; margin: 2px 0 0 0;">Coliving & Room Rental Operations</p>
            <p style="font-size: 10px; color: #a1a1aa; margin: 2px 0 0 0;">1000 Speer Blvd, Suite 400, Denver, CO 80204 • (303) 555-0100</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #52525b;">
            <p style="font-weight: bold; margin: 0;">Date: ${formattedDate}</p>
          </div>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <h2 style="font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; color: #1e1b4b;">
            Notice of 1-Year Lease Anniversary Rent Adjustment
          </h2>
          <p style="font-size: 11px; color: #64748b; margin-top: 4px;">Continuous Month-to-Month Coliving Agreement</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-between;">
          <div>
            <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b;">Resident:</span>
            <div style="font-weight: bold; font-size: 13px;">${renewal.tenantName}</div>
            <div style="font-size: 11px; color: #64748b;">${renewal.tenantEmail}</div>
          </div>
          <div>
            <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b;">Premises:</span>
            <div style="font-weight: bold; font-size: 13px;">${renewal.propertyName}</div>
            <div style="font-size: 11px; color: #64748b;">${renewal.roomName}</div>
          </div>
        </div>

        <p style="margin-bottom: 12px;">Dear ${renewal.tenantName},</p>
        <p style="margin-bottom: 16px;">
          Thank you for being a valued resident at ${renewal.propertyName}. Under our month-to-month coliving policy, all room rentals auto-renew each month, and rate adjustments occur on your 1-year lease anniversary. In accordance with our 2-month advance review schedule, we are pleased to present your upcoming rate terms:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e4e4e7; font-size: 12px;">
          <tbody>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 12px; font-weight: 500; color: #52525b;">Current Monthly Rent:</td>
              <td style="padding: 8px 12px; font-weight: bold; font-family: monospace;">$${renewal.currentMonthlyRent}.00/mo</td>
            </tr>
            <tr style="background-color: #ecfdf5; border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 12px; font-weight: bold; color: #065f46;">Proposed 1-Year Anniversary Rate:</td>
              <td style="padding: 8px 12px; font-weight: 900; font-family: monospace; color: #065f46; font-size: 14px;">
                $${renewal.proposedMonthlyRent}.00/mo (+${pct}%)
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 12px; font-weight: 500; color: #52525b;">Lease Structure:</td>
              <td style="padding: 8px 12px; font-weight: bold;">Continuous Month-to-Month (Auto-Renewing)</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 12px; font-weight: 500; color: #52525b;">Rate Effective Date:</td>
              <td style="padding: 8px 12px; font-weight: bold; font-family: monospace; color: #4338ca;">${renewal.anniversaryDate || milestones.anniversaryDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 12px; font-weight: 500; color: #52525b;">Decision Deadline (12th Month):</td>
              <td style="padding: 8px 12px; font-weight: bold; color: #9f1239;">${renewal.decisionDeadline || milestones.decisionDeadline}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 500; color: #52525b;">Notice to Vacate Requirement:</td>
              <td style="padding: 8px 12px;">Minimum 21 days notice required for month-end vacating</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-bottom: 24px; font-size: 12px; color: #3f3f46;">
          To accept this rate adjustment and maintain continuous tenancy, please sign below or confirm in the resident portal on or before <strong>${renewal.decisionDeadline || milestones.decisionDeadline}</strong>.
        </p>

        <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
          <div>
            <p style="font-weight: bold; margin: 0;">Jake Moyer</p>
            <p style="font-size: 11px; color: #71717a; margin: 2px 0 0 0;">Moyer Property Management LLC</p>
          </div>
          <div style="border-top: 1px solid #71717a; width: 200px; text-align: center; padding-top: 4px;">
            <span style="font-size: 10px; color: #71717a;">Tenant Signature & Date</span>
          </div>
        </div>
      </div>
    ` : `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; font-size: 13px; line-height: 1.6; color: #18181b;">
        <div style="border-bottom: 2px solid #18181b; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 18px; font-weight: 900; margin: 0; color: #09090b;">MOYER PROPERTY MANAGEMENT</h1>
            <p style="font-size: 11px; color: #71717a; margin: 2px 0 0 0;">Coliving & Room Rental Operations</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #52525b;">
            <p style="font-weight: bold; margin: 0;">Date: ${formattedDate}</p>
          </div>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <h2 style="font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; color: #991b1b;">
            Official Notice to Vacate & Move-Out Confirmation
          </h2>
          <p style="font-size: 11px; color: #64748b; margin-top: 4px;">21-Day Calendar Notice & Month-End Realignment</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e4e4e7; font-size: 12px;">
          <tbody>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 12px; font-weight: 500;">Resident Name:</td>
              <td style="padding: 8px 12px; font-weight: bold;">${renewal.tenantName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 12px; font-weight: 500;">Rental Premises:</td>
              <td style="padding: 8px 12px; font-weight: bold;">${renewal.propertyName} - ${renewal.roomName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 12px; font-weight: 500;">Notice Date Received:</td>
              <td style="padding: 8px 12px; font-family: monospace;">${renewal.noticeToVacate?.noticeDate || new Date().toISOString().split('T')[0]}</td>
            </tr>
            <tr style="background-color: #fef2f2; border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 12px; font-weight: bold; color: #991b1b;">Effective Move-Out (Month End):</td>
              <td style="padding: 8px 12px; font-weight: 900; font-family: monospace; color: #991b1b; font-size: 14px;">
                ${renewal.noticeToVacate?.effectiveVacateDate || renewal.currentLeaseEndDate}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 500;">Total Notice Provided:</td>
              <td style="padding: 8px 12px; font-weight: bold;">${renewal.noticeToVacate?.totalNoticeDays || 21} Calendar Days</td>
            </tr>
          </tbody>
        </table>

        <div style="border-top: 1px solid #e4e4e7; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
          <div>
            <p style="font-weight: bold; margin: 0;">Jake Moyer</p>
            <p style="font-size: 11px; color: #71717a;">Moyer Property Management LLC</p>
          </div>
          <div style="border-top: 1px solid #71717a; width: 200px; text-align: center; padding-top: 4px;">
            <span style="font-size: 10px; color: #71717a;">Tenant Signature & Date</span>
          </div>
        </div>
      </div>
    `;
    printHtmlDocument(`Lease Notice - ${renewal.tenantName}`, letterHtml);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendNotice = () => {
    onMarkNoticeSent(renewal);
    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-zinc-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                Formal Lease Notice Generator
              </h2>
              <p className="text-[11px] text-zinc-400">
                Resident: {renewal.tenantName} • {renewal.propertyName} ({renewal.roomName})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">✕</button>
        </div>

        {/* Notice Type Selector Tabs */}
        <div className="bg-zinc-100 p-2 border-b border-zinc-200 flex gap-2 text-xs">
          <button
            onClick={() => setNoticeType('anniversary-rate-increase')}
            className={`flex-1 py-1.5 px-3 rounded-sm font-bold uppercase tracking-tight transition-colors ${
              noticeType === 'anniversary-rate-increase'
                ? 'bg-white text-indigo-700 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            1-Year Rate Adjustment Notice
          </button>
          <button
            onClick={() => setNoticeType('21-day-vacate')}
            className={`flex-1 py-1.5 px-3 rounded-sm font-bold uppercase tracking-tight transition-colors ${
              noticeType === '21-day-vacate'
                ? 'bg-white text-rose-700 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            21-Day Notice to Vacate Confirmation
          </button>
        </div>

        {/* Modal Body: Document Preview */}
        <div className="p-5 max-h-[550px] overflow-y-auto space-y-4">
          <div className="bg-zinc-50 rounded-md border border-zinc-200 p-4 font-mono text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed">
            {fullLetterText}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-600" />
              <span>Print Letter</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-600" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-md text-xs font-semibold"
            >
              Close
            </button>

            <button
              onClick={handleSendNotice}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sentNotice ? 'Notice Marked as Sent' : 'Mark Notice as Dispatched'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
