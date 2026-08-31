/**
 * SMS and Messaging Utility Functions
 * Supports Google Voice dispatch, native sms: URI schemes, and text formatting.
 */

export interface SmsTemplate {
  id: string;
  label: string;
  generateText: (data: {
    recipientFirstName?: string;
    recipientName?: string;
    propertyName?: string;
    roomName?: string;
    proposedRent?: number;
    effectiveDate?: string;
    workOrderTitle?: string;
    ticketNumber?: string;
    senderName?: string;
  }) => string;
}

export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'general',
    label: 'General Notice',
    generateText: ({ recipientFirstName, propertyName, senderName = 'Jake with Moyer Property Management' }) => 
      `Hi ${recipientFirstName || 'there'}, this is ${senderName} regarding your room at ${propertyName || 'the property'}. Please let me know when you have a quick moment to connect. Thanks!`
  },
  {
    id: 'anniversary_rate',
    label: '1-Year Rate Adjustment',
    generateText: ({ recipientFirstName, propertyName, proposedRent, effectiveDate, senderName = 'Jake at Moyer PM' }) => 
      `Hi ${recipientFirstName || 'there'}! This is ${senderName}. As part of your upcoming 1-year lease anniversary at ${propertyName || 'our property'}, your monthly rate is scheduled to adjust to $${proposedRent || '---'}/mo starting on ${effectiveDate || 'your anniversary'}. Please let us know if you have any questions or to confirm. Thank you!`
  },
  {
    id: 'maintenance_update',
    label: 'Work Order Update',
    generateText: ({ recipientFirstName, ticketNumber, workOrderTitle, senderName = 'Moyer Maintenance Dispatch' }) => 
      `Hi ${recipientFirstName || 'there'}, update from ${senderName} regarding ${ticketNumber ? `[${ticketNumber}] ` : ''}"${workOrderTitle || 'your maintenance request'}": Our contractor is scheduled. Please let us know if you have any access restrictions.`
  },
  {
    id: 'showing_tour',
    label: 'Showing / Tour Confirm',
    generateText: ({ recipientFirstName, propertyName, roomName, senderName = 'Moyer Leasing' }) => 
      `Hi ${recipientFirstName || 'there'}, this is ${senderName} confirming your upcoming room showing at ${propertyName || 'the property'}${roomName ? ` (${roomName})` : ''}. Please reply to confirm or let us know if you need to reschedule!`
  },
  {
    id: 'rent_reminder',
    label: 'Rent Reminder',
    generateText: ({ recipientFirstName, senderName = 'Moyer Management' }) => 
      `Hi ${recipientFirstName || 'there'}, friendly reminder from ${senderName} that monthly room rent is due on the 1st. Please submit via your resident portal. Reach out if you need anything!`
  }
];

export function cleanPhoneNumber(phone: string): string {
  // Remove non-digit characters except leading +
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  // If 10 digits US, add +1
  if (digits.length === 10) return `+1${digits}`;
  // If 11 digits starting with 1
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits || phone;
}

export function openGoogleVoice(phone?: string, text?: string): void {
  // If text is provided, copy to clipboard for convenience
  if (text && typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  // Google Voice web message link
  window.open('https://voice.google.com/u/0/messages', '_blank', 'noopener,noreferrer');
}

export function openNativeSms(phone: string, text: string): void {
  const cleaned = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  // Using standard sms: protocol with ?body=
  const smsUrl = `sms:${cleaned}?body=${encodedText}`;
  window.location.href = smsUrl;
}
