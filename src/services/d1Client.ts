import { D1StatusResponse, D1SyncDataset } from '../types';

export class D1ClientService {
  /**
   * Check Cloudflare D1 database connection and table readiness
   */
  static async checkStatus(): Promise<D1StatusResponse> {
    try {
      const res = await fetch('/api/d1/status');
      const data: D1StatusResponse = await res.json();
      return data;
    } catch (err: any) {
      return {
        configured: false,
        connected: false,
        error: err.message || 'Unable to connect to CRM server'
      };
    }
  }

  /**
   * Initialize or upgrade Cloudflare D1 SQL tables & indices
   */
  static async initSchema(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/d1/init-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to initialize D1 schema'
      };
    }
  }

  /**
   * Pull all CRM data from Cloudflare D1
   */
  static async pullDataset(): Promise<{ success: boolean; data?: D1SyncDataset; error?: string }> {
    try {
      const res = await fetch('/api/d1/sync/pull');
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to pull dataset from Cloudflare D1'
      };
    }
  }

  /**
   * Push all current CRM data to Cloudflare D1
   */
  static async pushDataset(dataset: D1SyncDataset): Promise<{
    success: boolean;
    message?: string;
    syncedCounts?: Record<string, number>;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/d1/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataset)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to push dataset to Cloudflare D1'
      };
    }
  }

  /**
   * Run custom SQL query directly on Cloudflare D1
   */
  static async runQuery(sql: string, params: any[] = []): Promise<{
    success: boolean;
    rows?: any[];
    meta?: any;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/d1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to execute query'
      };
    }
  }
}
