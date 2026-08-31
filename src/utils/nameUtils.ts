/**
 * Utility functions for handling tenant and contact first/last names.
 */

export interface SplitName {
  firstName: string;
  lastName: string;
}

/**
 * Splits a full name string into distinct firstName and lastName fields.
 */
export function splitFullName(fullName?: string | null): SplitName {
  const trimmed = (fullName || '').trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

/**
 * Formats a full name from separate firstName and lastName strings with fallback support.
 */
export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  fallback: string = ''
): string {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return (fallback || '').trim();
}

/**
 * Resolves the display name for a tenant, prospect lead, or contact,
 * gracefully prioritizing firstName + lastName before falling back to name/currentTenantName.
 */
export function getTenantFullName(entity?: {
  firstName?: string;
  lastName?: string;
  name?: string;
  currentTenantFirstName?: string;
  currentTenantLastName?: string;
  currentTenantName?: string;
  tenantFirstName?: string;
  tenantLastName?: string;
  tenantName?: string;
} | null): string {
  if (!entity) return '';

  if (entity.currentTenantFirstName || entity.currentTenantLastName) {
    return formatFullName(entity.currentTenantFirstName, entity.currentTenantLastName, entity.currentTenantName || '');
  }

  if (entity.tenantFirstName || entity.tenantLastName) {
    return formatFullName(entity.tenantFirstName, entity.tenantLastName, entity.tenantName || '');
  }

  if (entity.firstName || entity.lastName) {
    return formatFullName(entity.firstName, entity.lastName, entity.name || '');
  }

  return entity.currentTenantName || entity.tenantName || entity.name || '';
}
