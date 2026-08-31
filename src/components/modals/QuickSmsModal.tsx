import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  X, 
  Send, 
  CheckCircle2, 
  Sparkles,
  Phone
} from 'lucide-react';
import { formatFullName } from '../../utils/nameUtils';
import { cleanPhoneNumber, openGoogleVoice, openNativeSms, SMS_TEMPLATES } from '../../utils/smsUtils';

export interface QuickSmsRecipient {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone: string;
  email?: string;
  roleOrType?: string;
  propertyName?: string;
  roomName?: string;
  proposedRent?: number;
  effectiveDate?: string;
  workOrderTitle?: string;
  ticketNumber?: string;
}

interface QuickSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: QuickSmsRecipient | null;
  defaultTemplateId?: string;
  defaultMessage?: string;
  onLogSent?: (recipient: QuickSmsRecipient, message: string) => void;
}

export const QuickSmsModal: React.FC<QuickSmsModalProps> = ({
  isOpen,
  onClose,
  recipient,
  defaultTemplateId = 'general',
  defaultMessage,
  onLogSent
}) => {
  const [message, setMessage] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultTemplateId);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [loggedNotice, setLoggedNotice] = useState<boolean>(false);

  const recipientFullName = recipient 
    ? formatFullName(recipient.firstName, recipient.lastName, recipient.name)
    : '';
  const recipientFirstName = recipient?.firstName || recipientFullName.split(' ')[0] || 'Resident';

  // Initialize or update message when modal opens or recipient changes
  useEffect(() => {
    if (isOpen && recipient) {
      setCopiedText(false);
      setCopiedPhone(false);
      setLoggedNotice(false);

      if (defaultMessage) {
        setMessage(defaultMessage);
      } else {
        const tmpl = SMS_TEMPLATES.find(t => t.id === defaultTemplateId) || SMS_TEMPLATES[0];
        setSelectedTemplate(tmpl.id);
        const generated = tmpl.generateText({
          recipientFirstName,
          recipientName: recipientFullName,
          propertyName: recipient.propertyName,
          roomName: recipient.roomName,
          proposedRent: recipient.proposedRent,
          effectiveDate: recipient.effectiveDate,
          workOrderTitle: recipient.workOrderTitle,
          ticketNumber: recipient.ticketNumber
        });
        setMessage(generated);
      }
    }
  }, [isOpen, recipient, defaultTemplateId, defaultMessage]);

  if (!isOpen || !recipient) return null;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = SMS_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      const generated = tmpl.generateText({
        recipientFirstName,
        recipientName: recipientFullName,
        propertyName: recipient.propertyName,
        roomName: recipient.roomName,
        proposedRent: recipient.proposedRent,
        effectiveDate: recipient.effectiveDate,
        workOrderTitle: recipient.workOrderTitle,
        ticketNumber: recipient.ticketNumber
      });
      setMessage(generated);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(recipient.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2500);
    } catch (err) {
      console.error('Failed to copy phone', err);
    }
  };

  const handleLaunchGoogleVoice = () => {
    openGoogleVoice(recipient.phone, message);
    setCopiedText(true);
    if (onLogSent) {
      onLogSent(recipient, message);
    }
    setLoggedNotice(true);
    setTimeout(() => {
      setCopiedText(false);
    }, 4000);
  };

  const handleLaunchNativeSms = () => {
    openNativeSms(recipient.phone, message);
    if (onLogSent) {
      onLogSent(recipient, message);
    }
    setLoggedNotice(true);
  };

  const handleLogManualSent = () => {
    if (onLogSent) {
      onLogSent(recipient, message);
    }
    setLoggedNotice(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Character and standard 160-char SMS segment count calculation
  const charCount = message.length;
  const segmentCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-md max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-zinc-900 px-5 py-4 flex items-center justify-between text-white border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Send SMS to {recipientFullName}</span>
                {recipient.roleOrType && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-normal border border-zinc-700">
                    {recipient.roleOrType}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Direct SMS Dispatch via Google Voice or Mobile Device
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Recipient Quick Card */}
          <div className="bg-zinc-50 rounded-md border border-zinc-200 p-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Recipient Phone</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-zinc-900 text-sm">{recipient.phone}</span>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 flex items-center gap-1 transition"
                  title="Copy Phone Number"
                >
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {(recipient.propertyName || recipient.roomName) && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Assigned Unit</span>
                <span className="font-semibold text-zinc-800 text-xs truncate max-w-[180px] block">
                  {recipient.propertyName} {recipient.roomName ? `• ${recipient.roomName}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Quick Template Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-zinc-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Message Template</span>
              </label>
              <span className="text-[11px] text-zinc-400">Select preset or edit below</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SMS_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleTemplateChange(tmpl.id)}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded border text-left truncate transition ${
                    selectedTemplate === tmpl.id
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-zinc-700">SMS Content</label>
              <div className="text-[11px] text-zinc-500 font-mono">
                {charCount} chars • {segmentCount} SMS {segmentCount > 1 ? 'segments' : 'segment'}
              </div>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type SMS text..."
              className="w-full p-3 bg-white border border-zinc-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed text-zinc-900"
            />
          </div>

          {/* Notice Feedback Banner */}
          {loggedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>SMS dispatched and recorded in property management log!</span>
            </div>
          )}

          {copiedText && !loggedNotice && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-md text-xs flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Message copied to clipboard! Paste directly into Google Voice with Ctrl+V / Cmd+V.</span>
            </div>
          )}

          {/* Integration Actions */}
          <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-tight text-zinc-600 block">
              Direct Dispatch Methods (No Carrier Fees)
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Google Voice Button */}
              <button
                type="button"
                onClick={handleLaunchGoogleVoice}
                className="w-full px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                title="Opens Google Voice in a new tab with message pre-copied to clipboard"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-200" />
                <span>Open Google Voice</span>
                <ExternalLink className="w-3 h-3 text-emerald-200 ml-auto" />
              </button>

              {/* Native SMS App / iMessage */}
              <button
                type="button"
                onClick={handleLaunchNativeSms}
                className="w-full px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                title="Opens native SMS app (iMessage, Android Messages, Phone Link) with message pre-filled"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-200" />
                <span>Open Native SMS App</span>
                <Send className="w-3 h-3 text-indigo-200 ml-auto" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2.5 py-1 text-[11px] font-semibold text-zinc-700 bg-white border border-zinc-300 rounded hover:bg-zinc-100 flex items-center gap-1.5 transition"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                <span>{copiedText ? 'Text Copied!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleLogManualSent}
                className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:underline"
              >
                Mark as Sent in Activity Log
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-100 border-t border-zinc-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-zinc-300 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
