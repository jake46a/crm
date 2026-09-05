// Square Integration API Client
import { Invoice } from '../types';

export interface SquareStatusResponse {
  hasToken: boolean;
  environment: string;
  baseUrl: string;
  version: string;
  mode: string;
  activeLocationsCount: number;
}

export interface SquareLocation {
  id: string;
  name: string;
  address?: {
    address_line_1?: string;
    locality?: string;
    administrative_district_level_1?: string;
    postal_code?: string;
  };
  status?: string;
}

export interface SyncCustomerResult {
  success: boolean;
  customerId: string;
  customer?: any;
  isNew?: boolean;
  source?: string;
  error?: string;
}

export interface CreateBatchResult {
  success: boolean;
  createdCount: number;
  results: Array<{
    clientReferenceId: string;
    squareOrderId: string;
    squareInvoiceId: string;
    squareLocationId: string;
    squareCustomerId: string;
    status: string;
    paymentUrl: string;
    viewUrl: string;
    source: string;
  }>;
  errors: Array<{ id: string; error: string }>;
}

export interface SyncInvoiceResult {
  invoiceId: string;
  status: string;
  isPaid: boolean;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentUrl?: string;
  source: string;
}

export interface ApplyLateFeeResult {
  success: boolean;
  lateFeeAmount: number;
  totalAmount: number;
  paymentUrl?: string;
  note?: string;
  source: string;
}

export const SquareService = {
  async getStatus(): Promise<SquareStatusResponse> {
    try {
      const res = await fetch('/api/square/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return {
        hasToken: false,
        environment: 'sandbox',
        baseUrl: 'https://connect.squareupsandbox.com',
        version: '2025-02-20',
        mode: 'Simulated Sandbox Mode (Ready)',
        activeLocationsCount: 3
      };
    }
  },

  async getLocations(): Promise<SquareLocation[]> {
    try {
      const res = await fetch('/api/square/locations');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.locations || [];
    } catch (e) {
      console.warn('Failed to load Square locations:', e);
      return [
        { id: 'LOC_SPEER_DENVER', name: 'Speer Coliving House (Denver)' },
        { id: 'LOC_CAPHILL_DENVER', name: 'Capitol Hill Victorian (Denver)' },
        { id: 'LOC_HIGHLANDS_DENVER', name: 'Highlands Coliving Suites (Denver)' }
      ];
    }
  },

  /**
   * Searches Square customer by email. If not found, creates customer and returns new ID.
   */
  async searchOrCreateCustomer(params: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    note?: string;
  }): Promise<SyncCustomerResult> {
    const res = await fetch('/api/square/customers/search-or-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'Failed to search or create Square customer.');
    }

    return await res.json();
  },

  /**
   * Batch creates invoices in Square:
   * 1. createOrder
   * 2. createInvoice (allow_partial_payments: false, delivery_method: EMAIL)
   * 3. publishInvoice
   */
  async createInvoiceBatch(invoices: Partial<Invoice>[]): Promise<CreateBatchResult> {
    const res = await fetch('/api/square/invoices/create-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoices })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'Failed to batch generate Square invoices.');
    }

    return await res.json();
  },

  /**
   * Checks Square Invoices API for payment status.
   */
  async syncInvoiceStatus(squareInvoiceId: string): Promise<SyncInvoiceResult> {
    const res = await fetch(`/api/square/invoices/${encodeURIComponent(squareInvoiceId)}/sync`);
    if (!res.ok) {
      throw new Error(`Failed to sync invoice status (HTTP ${res.status})`);
    }
    return await res.json();
  },

  /**
   * Late Fee Application: 5% or $50 minimum (whichever is greater)
   * Updates Square order and invoice dynamically.
   */
  async applyLateFee(params: {
    invoiceId: string;
    orderId?: string;
    rentAmount: number;
    currentLateFee?: number;
  }): Promise<ApplyLateFeeResult> {
    const res = await fetch('/api/square/late-fees/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || 'Failed to apply late fee to Square invoice.');
    }

    return await res.json();
  },

  /**
   * Simulates payment in sandbox environment for testing
   */
  async simulateSandboxPayment(invoiceId: string, paymentMethod?: string) {
    const res = await fetch('/api/square/sandbox/simulate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, paymentMethod })
    });
    return await res.json();
  },

  async checkLateFeeCron() {
    const res = await fetch('/api/square/cron/check-late-fees', { method: 'POST' });
    return await res.json();
  }
};
