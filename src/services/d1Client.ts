import { D1StatusResponse, D1SyncDataset } from '../types';

async function parseFetchResponse<T>(res: Response, fallbackError: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const rawText = await res.text();
    if (!rawText) {
      return { data: null, error: `Empty response from server (HTTP ${res.status})` };
    }

    const trimmed = rawText.trim();
    if (trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype') || trimmed.toLowerCase().includes('<html')) {
      return {
        data: null,
        error: `Server is initializing or returned HTML (HTTP ${res.status}). Please retry in a moment.`
      };
    }

    const parsed = JSON.parse(trimmed);
    return { data: parsed as T, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || fallbackError
    };
  }
}

export class D1ClientService {
  /**
   * Check Cloudflare D1 database connection and table readiness
   */
  static async checkStatus(): Promise<D1StatusResponse> {
    try {
      const res = await fetch('/api/d1/status');
      const { data, error } = await parseFetchResponse<D1StatusResponse>(res, 'Unable to parse status response');

      if (error || !data) {
        return {
          configured: false,
          connected: false,
          error: error || 'Unable to connect to CRM server'
        };
      }

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
      const { data, error } = await parseFetchResponse<{ success: boolean; message?: string; error?: string }>(
        res,
        'Failed to initialize D1 schema'
      );

      if (error || !data) {
        return { success: false, error: error || 'Failed to initialize D1 schema' };
      }
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
      const { data, error } = await parseFetchResponse<{ success: boolean; data?: D1SyncDataset; error?: string }>(
        res,
        'Failed to pull dataset from Cloudflare D1'
      );

      if (error || !data) {
        return { success: false, error: error || 'Failed to pull dataset from Cloudflare D1' };
      }
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
      const { data, error } = await parseFetchResponse<{
        success: boolean;
        message?: string;
        syncedCounts?: Record<string, number>;
        error?: string;
      }>(res, 'Failed to push dataset to Cloudflare D1');

      if (error || !data) {
        return { success: false, error: error || 'Failed to push dataset to Cloudflare D1' };
      }
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
      const { data, error } = await parseFetchResponse<{
        success: boolean;
        rows?: any[];
        meta?: any;
        error?: string;
      }>(res, 'Failed to execute query');

      if (error || !data) {
        return { success: false, error: error || 'Failed to execute query' };
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to execute query'
      };
    }
  }
}
