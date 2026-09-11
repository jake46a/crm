// Google Workspace (Docs & Drive) Integration Service
// Supports both Firebase Auth (recommended for custom domains/Cloudflare) and Google Identity Services (GIS)
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
];

export const DEFAULT_OAUTH_CLIENT_ID = '689729380510-3t4c9eghg2unsrh8e8d5iaoinadh5s09.apps.googleusercontent.com';

const STORAGE_KEY_TOKEN = 'moyer_crm_gworkspace_token';
const STORAGE_KEY_EXPIRES = 'moyer_crm_gworkspace_expires_at';
const STORAGE_KEY_EMAIL = 'moyer_crm_gworkspace_email';
const STORAGE_KEY_USER_NAME = 'moyer_crm_gworkspace_name';
const STORAGE_KEY_TEMPLATES = 'moyer_crm_gworkspace_templates';
const STORAGE_KEY_CLIENT_ID = 'moyer_crm_custom_google_client_id';
const STORAGE_KEY_DRIVE_PDFS = 'moyer_crm_drive_pdfs';

export interface GoogleWorkspaceUser {
  email: string;
  name?: string;
  picture?: string;
  connectedAt: string;
}

export type DocumentTemplateType =
  | 'lease'
  | 'late_notice'
  | 'eviction'
  | 'utility_statement'
  | 'addendum'
  | 'checklist'
  | 'custom'
  | string;

export interface DocumentTemplateConfig {
  id: string;
  name: string;
  type: DocumentTemplateType;
  googleDocId: string; // The ID of the Google Doc template in Drive
  description: string;
  placeholders: string[];
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Extracts a Google Doc or Drive File ID from various URL formats or raw ID strings.
 * Examples supported:
 * - https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing
 * - https://docs.google.com/document/u/0/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/
 * - https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view
 * - https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 * - 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 */
export function extractGoogleDocId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();

  // Pattern 1: /d/([a-zA-Z0-9_-]+)
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  // Pattern 2: id=([a-zA-Z0-9_-]+)
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // Pattern 3: raw doc ID or stripped url
  const stripped = trimmed
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/\/edit.*$/, '')
    .replace(/\/view.*$/, '')
    .replace(/[?#].*$/, '')
    .trim();

  if (/^[a-zA-Z0-9_-]{15,}$/.test(stripped)) {
    return stripped;
  }

  return trimmed;
}

/**
 * Formats a clean web edit URL for a Google Doc given its ID
 */
export function getGoogleDocUrl(docId: string): string {
  const cleanId = extractGoogleDocId(docId);
  return cleanId ? `https://docs.google.com/document/d/${cleanId}/edit` : '';
}

/**
 * Validates if a string looks like a valid Google Doc ID
 */
export function isValidGoogleDocId(docId: string): boolean {
  const clean = extractGoogleDocId(docId);
  return Boolean(clean && /^[a-zA-Z0-9_-]{15,100}$/.test(clean));
}

export interface GeneratedDocRecord {
  id: string;
  templateType: string;
  documentId: string;
  documentTitle: string;
  webViewLink: string;
  tenantName: string;
  tenantId?: string;
  roomName?: string;
  propertyName?: string;
  createdAt: string;
  status: 'created' | 'saved_to_drive';
}

export interface DrivePdfRecord {
  id: string; // Local / Drive file ID
  driveFileId: string;
  name: string; // Current filename in Drive
  originalName: string;
  propertyId?: string;
  propertyName?: string;
  roomId?: string;
  roomName?: string;
  tenantName?: string;
  tenantId?: string;
  docCategory?: string; // 'lease' | 'checklist' | 'id_scan' | 'receipt' | 'addendum' | 'notice' | 'court_form' | 'other'
  notes?: string;
  webViewLink?: string;
  webContentLink?: string;
  sizeBytes?: number;
  uploadedAt: string;
  lastRenamedAt?: string;
  status?: 'uploaded' | 'renamed' | 'copied' | 'in_acrobat' | 'filled_and_saved' | 'printed' | 'local' | 'error';
  isMasterTemplate?: boolean;
  masterSourceId?: string;
  masterSourceName?: string;
  isFilled?: boolean;
  lastPrintedAt?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export class GoogleWorkspaceService {
  /**
   * Get active token from localStorage if not expired
   */
  static getActiveToken(): string | null {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEY_EXPIRES);
    if (!token || !expiresAt) return null;

    if (Date.now() > Number(expiresAt)) {
      this.disconnect();
      return null;
    }
    return token;
  }

  /**
   * Get connected Google Workspace user profile
   */
  static getConnectedUser(): GoogleWorkspaceUser | null {
    const email = localStorage.getItem(STORAGE_KEY_EMAIL);
    if (!email) return null;
    return {
      email,
      name: localStorage.getItem(STORAGE_KEY_USER_NAME) || email.split('@')[0],
      connectedAt: new Date().toISOString(),
    };
  }

  /**
   * Save access token and expiresAt
   */
  static saveToken(token: string, expiresInSeconds: number = 3600, emailHint?: string) {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_EXPIRES, String(Date.now() + (expiresInSeconds - 60) * 1000));
    if (emailHint) {
      localStorage.setItem(STORAGE_KEY_EMAIL, emailHint);
    }
  }

  /**
   * Disconnect Workspace access
   */
  static disconnect() {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (token && window.google?.accounts?.oauth2?.revoke) {
      try {
        window.google.accounts.oauth2.revoke(token, () => {});
      } catch (e) {
        console.warn('Revoke failed:', e);
      }
    }
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRES);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    localStorage.removeItem(STORAGE_KEY_USER_NAME);
  }

  /**
   * Get custom or default Google OAuth Client ID
   */
  static getClientId(): string {
    return localStorage.getItem(STORAGE_KEY_CLIENT_ID) || DEFAULT_OAUTH_CLIENT_ID;
  }

  /**
   * Save custom Google OAuth Client ID
   */
  static saveClientId(clientId: string) {
    const cleanId = (clientId || '').trim();
    if (!cleanId) {
      localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    } else {
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, cleanId);
    }
  }

  /**
   * Request Access Token via Firebase Auth popup with Google Workspace scopes.
   * Recommended for Cloudflare / custom domains because the OAuth exchange is handled
   * via Firebase's authorized authDomain, avoiding Google Identity Services origin_mismatch errors.
   */
  static async requestAccessTokenViaFirebaseAuth(
    loginHint?: string
  ): Promise<{ accessToken: string; user?: GoogleWorkspaceUser }> {
    const provider = new GoogleAuthProvider();
    // Add Google Docs & Drive scopes
    SCOPES.forEach(scope => provider.addScope(scope));

    // Prompt consent so access tokens and offline scopes are granted
    provider.setCustomParameters({
      prompt: 'consent',
      login_hint: loginHint || 'info@1070yankstreet.com',
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error(
          'Google authentication completed, but no OAuth access token was returned for Docs/Drive. Please ensure third-party cookies/popups are enabled.'
        );
      }

      const token = credential.accessToken;
      this.saveToken(token, 3600, result.user.email || loginHint);

      const profile: GoogleWorkspaceUser = {
        email: result.user.email || loginHint || 'Connected Account',
        name: result.user.displayName || result.user.email?.split('@')[0] || 'Google User',
        picture: result.user.photoURL || undefined,
        connectedAt: new Date().toISOString(),
      };

      if (profile.email) localStorage.setItem(STORAGE_KEY_EMAIL, profile.email);
      if (profile.name) localStorage.setItem(STORAGE_KEY_USER_NAME, profile.name);

      return { accessToken: token, user: profile };
    } catch (err: any) {
      console.error('Firebase Workspace Auth error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        throw new Error(
          `Domain "${currentDomain}" is not yet added to Firebase Auth Authorized Domains. Add "${currentDomain}" in Firebase Console -> Authentication -> Settings -> Authorized domains, or use Google Identity Services with your OAuth Client ID.`
        );
      }
      throw err;
    }
  }

  /**
   * Request Access Token via Google Identity Services popup
   */
  static requestAccessToken(
    loginHint: string = 'jake@1070yankstreet.com',
    clientId: string = DEFAULT_OAUTH_CLIENT_ID
  ): Promise<{ accessToken: string; user?: GoogleWorkspaceUser }> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        return reject(
          new Error('Google Identity Services library is not loaded. Please ensure you have internet connection and reload.')
        );
      }

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES.join(' '),
          hint: loginHint || undefined,
          callback: async (response: any) => {
            if (response.error) {
              return reject(new Error(response.error_description || response.error));
            }
            if (!response.access_token) {
              return reject(new Error('No access token returned from Google.'));
            }

            const expiresIn = Number(response.expires_in) || 3600;
            this.saveToken(response.access_token, expiresIn, loginHint);

            // Attempt to fetch profile info with the token
            let profile: GoogleWorkspaceUser = {
              email: loginHint || 'Connected Account',
              name: loginHint?.split('@')[0] || 'Google User',
              connectedAt: new Date().toISOString(),
            };

            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (userInfoRes.ok) {
                const info = await userInfoRes.json();
                if (info.email) {
                  profile = {
                    email: info.email,
                    name: info.name || info.email.split('@')[0],
                    picture: info.picture,
                    connectedAt: new Date().toISOString(),
                  };
                  localStorage.setItem(STORAGE_KEY_EMAIL, info.email);
                  if (info.name) localStorage.setItem(STORAGE_KEY_USER_NAME, info.name);
                }
              }
            } catch (err) {
              console.warn('Could not fetch userinfo, using loginHint:', err);
            }

            resolve({ accessToken: response.access_token, user: profile });
          },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * Get configured document templates or initial defaults
   */
  static getTemplates(): DocumentTemplateConfig[] {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved templates:', e);
      }
    }

    // Default template configurations
    return [
      {
        id: 'tpl_lease',
        name: 'Standard Room Rental Lease Agreement',
        type: 'lease',
        googleDocId: '',
        description: 'Comprehensive month-to-month or fixed-term room lease agreement with house rules, utilities addendum, and quiet hours.',
        placeholders: [
          '{{tenant_name}}',
          '{{tenant_email}}',
          '{{tenant_phone}}',
          '{{property_name}}',
          '{{property_address}}',
          '{{room_name}}',
          '{{monthly_rent}}',
          '{{security_deposit}}',
          '{{lease_start_date}}',
          '{{lease_end_date}}',
          '{{payment_due_day}}',
          '{{late_fee_amount}}',
          '{{utility_terms}}',
          '{{house_rules}}',
          '{{manager_name}}',
          '{{today_date}}',
        ],
      },
      {
        id: 'tpl_late_notice',
        name: 'Late Rent Notice & Demand for Payment',
        type: 'late_notice',
        googleDocId: '',
        description: 'Formal 3-day notice demanding past-due rent and accrued late fees before further legal eviction action.',
        placeholders: [
          '{{tenant_name}}',
          '{{property_address}}',
          '{{room_name}}',
          '{{past_due_amount}}',
          '{{late_fee_amount}}',
          '{{total_owed}}',
          '{{due_date}}',
          '{{payment_deadline}}',
          '{{payment_method}}',
          '{{manager_name}}',
          '{{manager_phone}}',
          '{{today_date}}',
        ],
      },
      {
        id: 'tpl_eviction',
        name: 'Notice to Vacate / Demand for Possession',
        type: 'eviction',
        googleDocId: '',
        description: 'Official notice demanding possession of the room and premises due to lease expiration or non-compliance.',
        placeholders: [
          '{{tenant_name}}',
          '{{property_address}}',
          '{{room_name}}',
          '{{violation_reason}}',
          '{{vacate_deadline_date}}',
          '{{key_return_instructions}}',
          '{{manager_name}}',
          '{{manager_phone}}',
          '{{today_date}}',
        ],
      },
      {
        id: 'tpl_utility_statement',
        name: 'Monthly Shared Utility Split Statement',
        type: 'utility_statement',
        googleDocId: '',
        description: 'Itemized billing statement detailing electric, gas, water/sewer, and divisor calculation per resident.',
        placeholders: [
          '{{tenant_name}}',
          '{{property_name}}',
          '{{room_name}}',
          '{{billing_period}}',
          '{{electric_total}}',
          '{{gas_total}}',
          '{{water_total}}',
          '{{combined_utilities_total}}',
          '{{utility_divisor}}',
          '{{tenant_share_amount}}',
          '{{payment_due_date}}',
          '{{today_date}}',
        ],
      },
    ];
  }

  /**
   * Save template configurations
   */
  static saveTemplates(templates: DocumentTemplateConfig[]) {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  }

  /**
   * Add a new template configuration
   */
  static addTemplate(newTemplate: DocumentTemplateConfig): DocumentTemplateConfig[] {
    const current = GoogleWorkspaceService.getTemplates();
    const updated = [...current, newTemplate];
    GoogleWorkspaceService.saveTemplates(updated);
    return updated;
  }

  /**
   * Update an existing template configuration
   */
  static updateTemplate(id: string, updates: Partial<DocumentTemplateConfig>): DocumentTemplateConfig[] {
    const current = GoogleWorkspaceService.getTemplates();
    const updated = current.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    GoogleWorkspaceService.saveTemplates(updated);
    return updated;
  }

  /**
   * Delete a template configuration
   */
  static deleteTemplate(id: string): DocumentTemplateConfig[] {
    const current = GoogleWorkspaceService.getTemplates();
    const updated = current.filter(t => t.id !== id);
    GoogleWorkspaceService.saveTemplates(updated);
    return updated;
  }

  /**
   * Reset templates to baseline default configurations
   */
  static resetTemplatesToDefault(): DocumentTemplateConfig[] {
    localStorage.removeItem(STORAGE_KEY_TEMPLATES);
    return GoogleWorkspaceService.getTemplates();
  }

  /**
   * Copy a file in Google Drive
   */
  static async copyDriveFile(fileId: string, newTitle: string, token: string): Promise<any> {
    const cleanFileId = (fileId || '').trim();
    if (!cleanFileId) {
      throw new Error('No template Google Doc ID provided to copy.');
    }
    const cleanTitle = (newTitle || 'New Document').trim();
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      throw new Error('Google Workspace OAuth access token is required.');
    }

    try {
      const res = await fetch('/api/google/copy-file', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: cleanFileId,
          name: cleanTitle,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return data;
      }
      throw new Error(data.error || `Failed to copy Google Drive file (${res.status})`);
    } catch (err: any) {
      // Fallback to direct call if proxy fails
      const directRes = await fetch(`https://www.googleapis.com/drive/v3/files/${cleanFileId}/copy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanTitle,
        }),
      });

      if (!directRes.ok) {
        const directErr = await directRes.json().catch(() => ({}));
        throw new Error(directErr.error?.message || err.message || `Failed to copy Google Drive file (${directRes.status})`);
      }

      return await directRes.json();
    }
  }

  /**
   * Create a brand new Google Doc with starter formatted text
   */
  static async createGoogleDoc(title: string, contentText: string, token: string): Promise<{ documentId: string; title: string }> {
    const cleanTitle = (title || 'New Document').trim();
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      throw new Error('Google Workspace OAuth access token is required.');
    }

    // 1. Create document using Docs API
    const res = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: cleanTitle,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create Google Doc (${res.status})`);
    }

    const doc = await res.json();
    const documentId = doc?.documentId;
    if (!documentId) {
      throw new Error('Google Docs API created the document, but did not return a valid documentId.');
    }

    // 2. Insert text content into document
    const cleanContent = (contentText || '').trim();
    if (cleanContent) {
      const batchRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: cleanContent,
              },
            },
          ],
        }),
      });
      if (!batchRes.ok) {
        const batchErr = await batchRes.json().catch(() => ({}));
        console.warn('Initial text insert failed:', batchErr);
      }
    }

    return { documentId, title: cleanTitle };
  }

  /**
   * Perform batch text replacement in a Google Doc
   */
  static async replaceAllPlaceholders(
    documentId: string,
    replacements: Record<string, string>,
    token: string
  ): Promise<void> {
    const cleanDocId = (documentId || '').trim();
    if (!cleanDocId) {
      throw new Error('No documentId provided for placeholder replacement.');
    }
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      throw new Error('Google Workspace OAuth access token is required.');
    }

    const requests = Object.entries(replacements || {}).map(([search, replace]) => ({
      replaceAllText: {
        containsText: {
          text: String(search || ''),
          matchCase: true,
        },
        replaceText: String(replace ?? ''),
      },
    }));

    if (requests.length === 0) return;

    const res = await fetch(`https://docs.googleapis.com/v1/documents/${cleanDocId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to replace placeholders in Google Doc (${res.status})`);
    }
  }

  /**
   * Get metadata and web link for a Drive file
   */
  static async getDriveFile(fileId: string, token: string): Promise<any> {
    const cleanFileId = (fileId || '').trim();
    if (!cleanFileId) {
      throw new Error('No fileId provided to get Drive file.');
    }
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      throw new Error('Google Workspace OAuth access token is required.');
    }

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${cleanFileId}?fields=id,name,mimeType,webViewLink,webContentLink,owners,modifiedTime`,
      {
        headers: { Authorization: `Bearer ${cleanToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to get Google Drive file (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Generate Starter Template Body Text for each document type
   */
  static getStarterTemplateContent(type: DocumentTemplateType): string {
    switch (type) {
      case 'lease':
        return `RESIDENTIAL ROOM RENTAL LEASE AGREEMENT
Property Address: {{property_address}}
Property Name: {{property_name}}
Designated Room: {{room_name}}

1. PARTIES
This Lease Agreement is entered into on {{today_date}} between Moyer Property Management / {{manager_name}} ("Landlord") and {{tenant_name}} ("Tenant").
Tenant Contact: {{tenant_phone}} | {{tenant_email}}

2. PREMISES & OCCUPANCY
Tenant is granted the exclusive use of {{room_name}} and shared non-exclusive access to common areas (kitchen, living areas, hallways, designated bathrooms). Maximum occupancy is ONE (1) individual.

3. TERM OF LEASE
This lease begins on {{lease_start_date}} and terminates on {{lease_end_date}}.

4. RENT & PAYMENT TERMS
Monthly Rent: {{monthly_rent}}
Security Deposit: {{security_deposit}} (Held in escrow).
Rent is strictly due on the {{payment_due_day}} day of each calendar month.
Late Fee: A fee of {{late_fee_amount}} will be assessed if rent is not received within the statutory grace period.

5. UTILITY PROVISIONS
{{utility_terms}}
Tenants are not charged for internet or trash. Shared variable utilities (Electric, Gas, Water & Sewer) are divided equally among residents per house policy.

6. HOUSE RULES & CONDUCT
{{house_rules}}
Quiet hours are strictly enforced between 10:00 PM and 7:00 AM daily. Smoking and unauthorized pets are strictly prohibited.

SIGNATURES:
Landlord / Authorized Agent: ____________________ Date: {{today_date}}
Tenant: ____________________ Date: {{today_date}}
`;

      case 'late_notice':
        return `DEMAND FOR PAYMENT OF PAST-DUE RENT & LATE NOTICE
Date of Notice: {{today_date}}

TO TENANT: {{tenant_name}}
PREMISES: {{room_name}}, {{property_address}}

PLEASE TAKE NOTICE that your rent payment is delinquent as detailed below:
Past Due Rent: {{past_due_amount}}
Accrued Late Fee: {{late_fee_amount}}
TOTAL BALANCE OWED: {{total_owed}}
Originally Due Date: {{due_date}}

DEMAND FOR PAYMENT:
Demand is hereby made that you pay the total balance of {{total_owed}} on or before {{payment_deadline}}.

Payment may be completed via your Square tenant invoice online link or by contacting management:
Management: {{manager_name}}
Phone: {{manager_phone}}

Failure to tender payment in full by {{payment_deadline}} may result in the commencement of legal proceedings for possession and eviction.

Issued by:
{{manager_name}}, Property Management
Date: {{today_date}}
`;

      case 'eviction':
        return `NOTICE TO VACATE & DEMAND FOR POSSESSION
Date: {{today_date}}

TO: {{tenant_name}}
AND ALL OCCUPANTS OF: {{room_name}}, {{property_address}}

YOU ARE HEREBY NOTIFIED to vacate and deliver possession of the above-described premises to the Landlord on or before:
VACATE DEADLINE: {{vacate_deadline_date}}

REASON FOR NOTICE:
{{violation_reason}}

SURRENDER INSTRUCTIONS:
{{key_return_instructions}}
All personal property must be removed by {{vacate_deadline_date}}. Any personal property remaining after this date will be deemed abandoned and disposed of in accordance with state law.

Landlord / Agent:
{{manager_name}}
Phone: {{manager_phone}}
Date: {{today_date}}
`;

      case 'utility_statement':
        return `MONTHLY SHARED UTILITIES STATEMENT
Billing Period: {{billing_period}}
Property: {{property_name}}
Room: {{room_name}}
Tenant: {{tenant_name}}
Date: {{today_date}}

HOUSE BILL TOTALS (Trash and Internet Excluded per policy):
- Electric: {{electric_total}}
- Gas / Heating: {{gas_total}}
- Water & Sewer: {{water_total}}
------------------------------------------------
TOTAL COMBINED BILL: {{combined_utilities_total}}
DIVISOR: {{utility_divisor}}

TENANT SHARE CALCULATION:
{{combined_utilities_total}} / {{utility_divisor}} = {{tenant_share_amount}}

AMOUNT DUE: {{tenant_share_amount}}
PAYMENT DUE DATE: {{payment_due_date}}

Invoiced automatically via Square Payment Portal.
Thank you for your prompt payment!
`;

      case 'addendum':
        return `LEASE ADDENDUM & HOUSE RULES ACKNOWLEDGMENT
Property Address: {{property_address}}
Property Name: {{property_name}}
Designated Room: {{room_name}}
Resident: {{tenant_name}}
Date: {{today_date}}

1. ADDENDUM PROVISIONS
This Addendum supplements and modifies the Residential Room Rental Agreement between {{manager_name}} ("Management") and {{tenant_name}} ("Resident") for {{room_name}} at {{property_address}}.

2. SHARED COMMUNITY EXPECTATIONS
- Quiet Hours: Strictly observed 10:00 PM to 7:00 AM daily.
- Utilities: Variable utilities are divided by house divisor {{utility_divisor}}. High-speed Wi-Fi and trash are included.
- Common Areas: Resident agrees to clean up immediately following kitchen and shared area use.
- Guest Policy: Overnight guests may not exceed 3 consecutive nights without prior written approval.

3. ACKNOWLEDGMENT & AGREEMENT
The parties agree to the terms set forth herein as of {{today_date}}.

Resident Signature: ______________________ Date: {{today_date}}
Management Signature: ____________________ Date: {{today_date}}
`;

      case 'checklist':
        return `ROOM INSPECTION & MOVE-IN / MOVE-OUT CONDITION REPORT
Property: {{property_name}} - {{property_address}}
Room: {{room_name}}
Resident: {{tenant_name}} (Phone: {{tenant_phone}} | Email: {{tenant_email}})
Move-In Date: {{lease_start_date}} | Move-Out Date: {{lease_end_date}}
Inspection Date: {{today_date}}

ROOM INVENTORY & CONDITION CHECKLIST:
[ ] Entry Door, Deadbolt & Key Operation: [ Satisfactory ]
[ ] Walls, Baseboards & Ceiling: [ Clean, No Damage ]
[ ] Flooring / Carpet: [ Clean, Swept / Vacuumed ]
[ ] Window, Lock & Screen: [ Intact & Functional ]
[ ] Window Blinds / Coverings: [ Operational ]
[ ] Electrical Outlets & Light Fixtures: [ Tested Working ]
[ ] Heating / Cooling Vent: [ Clear & Clean ]
[ ] Smoke / CO Detector in Unit: [ Tested & Functional ]

KEYS & ACCESS CODES ISSUED:
- Bedroom Key: [ ] Issued
- House Main Door Key / Code: [ ] Provided
- Mailbox Key: [ ] Issued

COMMENTS & OBSERVATIONS:
___________________________________________________________________

SIGNATURES:
Resident: _____________________________ Date: {{today_date}}
Inspector / Property Manager: __________ Date: {{today_date}}
`;

      default:
        return `DOCUMENT AGREEMENT
Property: {{property_name}} ({{property_address}})
Resident: {{tenant_name}} ({{room_name}})
Date: {{today_date}}

TERMS & DETAILS:
This document records the agreement between {{manager_name}} and {{tenant_name}} regarding {{room_name}} at {{property_address}}.

Monthly Rent: {{monthly_rent}} | Security Deposit: {{security_deposit}}
Lease Period: {{lease_start_date}} through {{lease_end_date}}

SIGNATURES:
Resident: _____________________________ Date: {{today_date}}
Management: ___________________________ Date: {{today_date}}
`;
    }
  }

  // ==========================================
  // GOOGLE DRIVE PDF OPERATIONS & WORKFLOW
  // ==========================================

  /**
   * Uploads a PDF file directly to Google Drive via server proxy (bypassing browser CORS).
   */
  static async uploadPdfToDrive(
    file: File,
    name: string,
    token: string
  ): Promise<{ id: string; name: string; webViewLink?: string; webContentLink?: string; size?: string }> {
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      throw new Error('Google Workspace OAuth access token is required to upload to Drive.');
    }

    const cleanName = (name || file.name).trim();

    // Read file as base64 string
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (e) => reject(new Error('Failed to read PDF file for upload.'));
      reader.readAsDataURL(file);
    });

    let res: Response;
    try {
      res = await fetch('/api/google/upload-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          base64Data,
          mimeType: file.type || 'application/pdf',
        }),
      });
    } catch (networkErr: any) {
      console.warn('Proxy fetch network error:', networkErr);
      throw new Error(
        `Network error communicating with upload service: ${networkErr.message || networkErr}. Please verify your connection.`
      );
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(
          'Google Workspace OAuth session has expired or is unauthorized. Please click "Connect Google Drive" to re-authenticate.'
        );
      }
      throw new Error(data.error || `Failed to upload PDF to Google Drive (${res.status})`);
    }

    return data;
  }

  /**
   * Renames an existing file in Google Drive to reflect Unit and Tenant.
   */
  static async renameDriveFile(
    fileId: string,
    newName: string,
    token: string
  ): Promise<{ id: string; name: string; webViewLink?: string }> {
    const cleanFileId = (fileId || '').trim();
    if (!cleanFileId) throw new Error('File ID is required to rename in Google Drive.');
    const cleanToken = (token || '').trim();
    if (!cleanToken) throw new Error('Google OAuth token is required.');

    let targetName = newName.trim();
    if (!targetName.toLowerCase().endsWith('.pdf')) {
      targetName = `${targetName}.pdf`;
    }

    try {
      const res = await fetch('/api/google/rename-file', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId: cleanFileId, newName: targetName }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return data;
      }
      if (res.status === 401) {
        throw new Error('Google token expired. Please reconnect your Google account.');
      }
      throw new Error(data.error || `Failed to rename in Google Drive (${res.status})`);
    } catch (err: any) {
      // Direct fallback if proxy is unavailable
      const directRes = await fetch(`https://www.googleapis.com/drive/v3/files/${cleanFileId}?fields=id,name,webViewLink,webContentLink`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: targetName }),
      });

      if (!directRes.ok) {
        const directErr = await directRes.json().catch(() => ({}));
        throw new Error(directErr.error?.message || err.message || `Failed to rename file in Google Drive (${directRes.status})`);
      }

      return await directRes.json();
    }
  }

  /**
   * Deletes a file from Google Drive
   */
  static async deleteDriveFile(fileId: string, token: string): Promise<void> {
    const cleanFileId = (fileId || '').trim();
    if (!cleanFileId) return;
    const cleanToken = (token || '').trim();
    if (!cleanToken) return;

    try {
      await fetch('/api/google/delete-file', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cleanToken}` },
        body: JSON.stringify({ fileId: cleanFileId }),
      });
    } catch (err) {
      console.warn('Proxy delete failed, trying direct:', err);
      await fetch(`https://www.googleapis.com/drive/v3/files/${cleanFileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cleanToken}` },
      }).catch(() => {});
    }
  }

  /**
   * Searches user's Google Drive for PDF documents (e.g. Master templates, court forms)
   */
  static async searchDrivePdfs(token: string, keyword?: string): Promise<any[]> {
    const cleanToken = (token || '').trim();
    if (!cleanToken) return [];

    try {
      const url = keyword
        ? `/api/google/search-drive-pdfs?keyword=${encodeURIComponent(keyword)}`
        : '/api/google/search-drive-pdfs';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.files || [];
      }
      throw new Error(`Drive search returned status ${res.status}`);
    } catch (err) {
      console.warn('Proxy search failed, falling back to direct:', err);
      try {
        let q = "mimeType = 'application/pdf' and trashed = false";
        if (keyword) {
          const escaped = keyword.replace(/'/g, "\\'");
          q += ` and name contains '${escaped}'`;
        }
        const directRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink,webContentLink,size,createdTime,modifiedTime)&pageSize=30&orderBy=modifiedTime desc`,
          { headers: { Authorization: `Bearer ${cleanToken}` } }
        );
        if (directRes.ok) {
          const directData = await directRes.json();
          return directData.files || [];
        }
      } catch (directErr) {
        console.warn('Direct search failed:', directErr);
      }
      return [];
    }
  }

  /**
   * Replaces an existing Google Drive PDF file's content with newly filled PDF data.
   */
  static async replaceDrivePdfContent(
    fileId: string,
    file: File | Blob,
    token: string
  ): Promise<any> {
    const cleanFileId = (fileId || '').trim();
    if (!cleanFileId) throw new Error('File ID is required to replace content.');
    const cleanToken = (token || '').trim();
    if (!cleanToken) throw new Error('Google OAuth token is required.');

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read filled PDF file.'));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/google/replace-file-content', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId: cleanFileId,
        base64Data,
        mimeType: 'application/pdf',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Failed to replace PDF content in Google Drive (${res.status})`);
    }

    return data;
  }

  /**
   * Formats a standardized filename reflecting property, unit/room, tenant, and document type.
   * e.g. "[1070 Yank - Room 2] [John Doe] Signed Lease Agreement.pdf"
   */
  static formatStandardPdfName(options: {
    propertyName?: string;
    roomName?: string;
    tenantName?: string;
    docType?: string;
    customSuffix?: string;
  }): string {
    const parts: string[] = [];

    // Unit / Property segment
    const unitParts: string[] = [];
    if (options.propertyName) {
      // Shorten 1070 Yank Street to 1070 Yank if present
      const shortProp = options.propertyName.replace(/\s+Street/i, ' St').replace(/\s+Ave/i, ' Ave');
      unitParts.push(shortProp);
    }
    if (options.roomName) {
      unitParts.push(options.roomName);
    }
    if (unitParts.length > 0) {
      parts.push(`[${unitParts.join(' - ')}]`);
    }

    // Tenant segment
    if (options.tenantName && options.tenantName.trim()) {
      parts.push(`[${options.tenantName.trim()}]`);
    }

    // Document label
    const label = options.docType || 'Document';
    parts.push(label);

    if (options.customSuffix && options.customSuffix.trim()) {
      parts.push(`- ${options.customSuffix.trim()}`);
    }

    let fullName = parts.join(' ').trim();
    if (!fullName) fullName = 'Property Document';
    if (!fullName.toLowerCase().endsWith('.pdf')) {
      fullName = `${fullName}.pdf`;
    }

    return fullName;
  }

  /**
   * Retrieves saved Drive PDF records from localStorage
   */
  static getSavedDrivePdfs(): DrivePdfRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DRIVE_PDFS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Saves a new Drive PDF record
   */
  static saveDrivePdf(record: DrivePdfRecord): DrivePdfRecord[] {
    const list = this.getSavedDrivePdfs();
    const existingIndex = list.findIndex(r => r.driveFileId === record.driveFileId || r.id === record.id);
    let updated: DrivePdfRecord[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...updated[existingIndex], ...record };
    } else {
      updated = [record, ...list];
    }
    localStorage.setItem(STORAGE_KEY_DRIVE_PDFS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Updates an existing Drive PDF record
   */
  static updateDrivePdfRecord(id: string, updates: Partial<DrivePdfRecord>): DrivePdfRecord[] {
    const list = this.getSavedDrivePdfs();
    const updated = list.map(item => (item.id === id || item.driveFileId === id ? { ...item, ...updates } : item));
    localStorage.setItem(STORAGE_KEY_DRIVE_PDFS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Deletes a Drive PDF record from local tracking
   */
  static deleteDrivePdfRecord(id: string): DrivePdfRecord[] {
    const list = this.getSavedDrivePdfs();
    const updated = list.filter(item => item.id !== id && item.driveFileId !== id);
    localStorage.setItem(STORAGE_KEY_DRIVE_PDFS, JSON.stringify(updated));
    return updated;
  }
}
