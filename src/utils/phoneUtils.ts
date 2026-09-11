/**
 * Utility functions for formatting, parsing, and normalizing phone numbers.
 */

/**
 * Strips all non-digit characters except an optional leading '+'.
 */
export function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits;
}

/**
 * Formats a phone number string into standard US format: (XXX) XXX-XXXX.
 * Gracefully preserves international or extension details when appropriate.
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';

  // Separate any extension (e.g., ext, x, extension)
  const extMatch = trimmed.match(/(?:ext\.?|x|extension)\s*(\d+)/i);
  const extension = extMatch ? ` ext. ${extMatch[1]}` : '';
  const mainPart = extMatch ? trimmed.slice(0, extMatch.index).trim() : trimmed;

  // Extract digits
  let digits = mainPart.replace(/\D/g, '');

  // If 11 digits starting with 1 (US country code), remove leading 1
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  // Standard 10-digit US phone
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}${extension}`;
  }

  // 7-digit local number
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}${extension}`;
  }

  // If international number starting with +
  if (mainPart.startsWith('+')) {
    return `${mainPart}${extension}`;
  }

  // Return original trimmed string if it doesn't match standard US digits
  return trimmed;
}

/**
 * Interactive input mask for phone number inputs.
 * Formats digits on the fly as user types:
 * - 1-3 digits: (XXX
 * - 4-6 digits: (XXX) XXX
 * - 7-10 digits: (XXX) XXX-XXXX
 */
export function formatPhoneInput(value: string): string {
  if (!value) return '';

  // Extract all digits
  let digits = value.replace(/\D/g, '');

  // If user pastes/enters 11 digits starting with 1, strip country code for standard US form
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  // Cap at 10 digits
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  if (digits.length === 0) {
    return '';
  }

  if (digits.length <= 3) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Returns a tel: URI href for click-to-call links.
 */
export function getPhoneTelHref(phone?: string | null): string {
  if (!phone) return 'tel:';
  const cleaned = cleanPhoneNumber(phone);
  return `tel:${cleaned || phone.replace(/\s+/g, '')}`;
}

/**
 * Validates whether a phone string contains at least 10 valid digits.
 */
export function isValidPhoneNumber(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}
