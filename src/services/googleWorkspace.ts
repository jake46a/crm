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

export interface GoogleWorkspaceUser {
  email: string;
  name?: string;
  picture?: string;
  connectedAt: string;
}

export interface DocumentTemplateConfig {
  id: string;
  name: string;
  type: 'lease' | 'late_notice' | 'eviction' | 'utility_statement';
  googleDocId: string; // The ID of the Google Doc template in Drive
  description: string;
  placeholders: string[];
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
    if (!clientId.trim()) {
      localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    } else {
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
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
        return JSON.parse(saved);
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
   * Copy a file in Google Drive
   */
  static async copyDriveFile(fileId: string, newTitle: string, token: string): Promise<any> {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/copy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newTitle,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to copy Google Drive file (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Create a brand new Google Doc with starter formatted text
   */
  static async createGoogleDoc(title: string, contentText: string, token: string): Promise<{ documentId: string; title: string }> {
    // 1. Create document using Docs API
    const res = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create Google Doc (${res.status})`);
    }

    const doc = await res.json();
    const documentId = doc.documentId;

    // 2. Insert text content into document
    if (contentText && contentText.trim()) {
      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: contentText,
              },
            },
          ],
        }),
      });
    }

    return { documentId, title };
  }

  /**
   * Perform batch text replacement in a Google Doc
   */
  static async replaceAllPlaceholders(
    documentId: string,
    replacements: Record<string, string>,
    token: string
  ): Promise<void> {
    const requests = Object.entries(replacements).map(([search, replace]) => ({
      replaceAllText: {
        containsText: {
          text: search,
          matchCase: true,
        },
        replaceText: replace || '',
      },
    }));

    if (requests.length === 0) return;

    const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,webContentLink,owners,modifiedTime`,
      {
        headers: { Authorization: `Bearer ${token}` },
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
  static getStarterTemplateContent(type: 'lease' | 'late_notice' | 'eviction' | 'utility_statement'): string {
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
    }
  }
}
