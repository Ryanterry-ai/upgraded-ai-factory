export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface QueryResult<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

export class SupabaseClient {
  private config: SupabaseConfig;
  private headers: Record<string, string>;

  constructor(config: SupabaseConfig) {
    this.config = config;
    this.headers = {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
    if (config.serviceRoleKey) {
      this.headers['Authorization'] = `Bearer ${config.serviceRoleKey}`;
    }
  }

  private get baseUrl(): string {
    return `${this.config.url}/rest/v1`;
  }

  async select<T>(table: string, options?: {
    columns?: string;
    filters?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<QueryResult<T>> {
    const params = new URLSearchParams();
    if (options?.columns) params.set('select', options.columns);
    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          params.set(key, `eq.${value}`);
        }
      }
    }
    if (options?.order) {
      params.set('order', `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`);
    }
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const url = `${this.baseUrl}/${table}?${params.toString()}`;
    return this.request<T>('GET', url);
  }

  async insert<T>(table: string, data: Partial<T> | Partial<T>[]): Promise<QueryResult<T>> {
    const url = `${this.baseUrl}/${table}`;
    return this.request<T>('POST', url, data);
  }

  async update<T>(table: string, data: Partial<T>, filters: Record<string, unknown>): Promise<QueryResult<T>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        params.set(key, `eq.${value}`);
      }
    }
    const url = `${this.baseUrl}/${table}?${params.toString()}`;
    return this.request<T>('PATCH', url, data);
  }

  async delete(table: string, filters: Record<string, unknown>): Promise<QueryResult<void>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        params.set(key, `eq.${value}`);
      }
    }
    const url = `${this.baseUrl}/${table}?${params.toString()}`;
    return this.request<void>('DELETE', url);
  }

  async rpc<T>(functionName: string, params?: Record<string, unknown>): Promise<QueryResult<T>> {
    const url = `${this.baseUrl}/rpc/${functionName}`;
    return this.request<T>('POST', url, params);
  }

  private async request<T>(method: string, url: string, body?: unknown): Promise<QueryResult<T>> {
    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return { data: null, error: new Error(`Supabase error: ${response.status} - ${errorBody}`) };
      }

      if (method === 'DELETE') {
        return { data: [], error: null };
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [data], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}

export function createSupabaseClient(config?: Partial<SupabaseConfig>): SupabaseClient {
  const fullConfig: SupabaseConfig = {
    url: config?.url || process.env.SUPABASE_URL || 'http://localhost:54321',
    anonKey: config?.anonKey || process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: config?.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  return new SupabaseClient(fullConfig);
}
