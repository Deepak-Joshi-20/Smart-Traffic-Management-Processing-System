/**
 * Urban Pulse Neon Grid - Secure Client-Side API Gateway
 * All protected requests carry cryptographic bearer tokens with automatic expiry checks.
 */

import { AuthUser } from '../types';

const TOKEN_KEY = 'urbanpulse_auth_token';
const USER_KEY = 'urbanpulse_user';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  details: string;
  ip: string;
}

export interface AiAnalysisResult {
  provider?: string;
  summary: string;
  recommendations: string[];
  delayMitigationPercent: number;
  confidenceScore: number;
  timestamp: string;
  auditedBy?: string;
}

class ApiService {
  private token: string | null = null;
  private onAuthFailureCallback: (() => void) | null = null;

  constructor() {
    this.token = this.getStoredToken();
  }

  public setAuthFailureCallback(callback: () => void) {
    this.onAuthFailureCallback = callback;
  }

  public getStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public getStoredUser(): AuthUser | null {
    try {
      const userJson = localStorage.getItem(USER_KEY);
      if (!userJson) return null;
      const user = JSON.parse(userJson);

      // Check for expiration
      if (user.expiresAt && Date.now() > user.expiresAt) {
        this.clearSession();
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  public setSession(token: string, user: AuthUser) {
    this.token = token;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Storage unavailable
    }
  }

  public clearSession() {
    this.token = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data?: T; error?: string; code?: string; status: number }> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401 && this.onAuthFailureCallback) {
          this.clearSession();
          this.onAuthFailureCallback();
        }
        return {
          error: json.error || `HTTP error ${res.status}`,
          code: json.code || 'REQUEST_FAILED',
          status: res.status,
        };
      }

      return { data: json, status: res.status };
    } catch (err: any) {
      return {
        error: 'Network connectivity error. Could not contact operations server.',
        code: 'NETWORK_ERROR',
        status: 0,
      };
    }
  }

  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  public async login(
    email: string,
    password: string,
    requestedRole: 'Traffic Control Operator' | 'System Administrator'
  ) {
    const res = await this.request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, requestedRole }),
    });

    if (res.data) {
      this.setSession(res.data.token, res.data.user);
    }
    return res;
  }

  public async signup(
    name: string,
    email: string,
    password: string,
    termsAccepted: boolean
  ) {
    const res = await this.request<{ token: string; user: AuthUser }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, termsAccepted }),
    });

    if (res.data) {
      this.setSession(res.data.token, res.data.user);
    }
    return res;
  }

  public async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.clearSession();
  }

  public async validateSession(): Promise<boolean> {
    const res = await this.request<{ user: AuthUser }>('/api/auth/me', { method: 'GET' });
    return Boolean(res.data?.user);
  }

  // -------------------------------------------------------------
  // TRAFFIC OPERATIONS
  // -------------------------------------------------------------
  public async dispatchEmergency(junctionId: string) {
    return this.request<{ success: boolean; status: string; signalOverride: string }>(
      '/api/traffic/emergency-dispatch',
      {
        method: 'POST',
        body: JSON.stringify({ junctionId }),
      }
    );
  }

  public async ingestDataset(csvText: string, datasetName: string) {
    return this.request<{ success: boolean; recordCount: number; datasetName: string }>(
      '/api/traffic/ingest',
      {
        method: 'POST',
        body: JSON.stringify({ csvText, datasetName }),
      }
    );
  }

  // -------------------------------------------------------------
  // SERVER-SIDE AI REASONING
  // -------------------------------------------------------------
  public async analyzeCongestion(junctionTelemetry: any[]) {
    return this.request<AiAnalysisResult>('/api/ai/analyze-congestion', {
      method: 'POST',
      body: JSON.stringify({ junctionTelemetry }),
    });
  }

  // -------------------------------------------------------------
  // ADMINISTRATIVE PRIVILEGED OPERATIONS (RBAC 403 ENFORCED)
  // -------------------------------------------------------------
  public async getAuditLogs() {
    return this.request<{ total: number; logs: AuditLogItem[] }>('/api/admin/audit-logs', {
      method: 'GET',
    });
  }

  public async resetSystem() {
    return this.request<{ success: boolean; message: string; resetAt: string }>(
      '/api/admin/system-reset',
      {
        method: 'POST',
      }
    );
  }
}

export const api = new ApiService();
