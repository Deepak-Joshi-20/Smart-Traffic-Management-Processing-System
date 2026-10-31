import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Terminal,
  RotateCcw,
  UserX,
  Server,
} from 'lucide-react';
import { AuthUser } from '../../types';
import { api, AuditLogItem } from '../../services/api';

interface AdminAuditViewProps {
  currentUser: AuthUser;
  onResetNetworkBaseline: () => void;
}

export const AdminAuditView: React.FC<AdminAuditViewProps> = ({
  currentUser,
  onResetNetworkBaseline,
}) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'INFO' | 'WARN' | 'CRITICAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    const res = await api.getAuditLogs();
    setIsLoading(false);

    if (res.data?.logs) {
      setLogs(res.data.logs);
    } else {
      setError(res.error || 'Failed to retrieve administrative audit logs.');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSystemReset = async () => {
    const res = await api.resetSystem();
    setResetConfirmOpen(false);
    if (res.data?.success) {
      setResetFeedback(`System parameters verified and reset at ${res.data.resetAt}`);
      onResetNetworkBaseline();
      fetchLogs();
      setTimeout(() => setResetFeedback(null), 4000);
    } else {
      setError(res.error || 'Failed to reset system.');
    }
  };

  // RBAC Access Check
  if (currentUser.role !== 'System Administrator') {
    return (
      <div className="p-8 rounded-2xl bg-[#151F24] border border-[#F06464]/40 text-center space-y-4 max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-[#F06464]/10 border border-[#F06464]/30 flex items-center justify-center text-[#F06464] mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-[#F1F5F2]">Access Prohibited — HTTP 403 Forbidden</h2>
        <p className="text-xs text-[#91A19B] max-w-md mx-auto">
          You are authenticated as <span className="text-[#F1F5F2] font-mono">{currentUser.name}</span> with role{' '}
          <span className="text-[#F2B84B] font-mono">[{currentUser.role}]</span>.
          Administrative security audit trails and system reset functions strictly require{' '}
          <span className="text-[#F06464] font-semibold">[System Administrator]</span> security clearance.
        </p>
        <div className="pt-2">
          <span className="text-[11px] font-mono text-[#64736D] bg-[#10171B] px-3 py-1.5 rounded-lg border border-[#29383A]">
            Audit Attempt Logged: UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT · Actor: {currentUser.badgeId}
          </span>
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    if (filterSeverity !== 'ALL' && log.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ip.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-[#F06464] bg-[#F06464]/10 px-2 py-0.5 rounded border border-[#F06464]/30 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>SECURITY VAULT · LEVEL 4 CLEARANCE</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#F1F5F2] tracking-tight">
            Administrative Audit &amp; System Authorization Console
          </h1>
          <p className="text-xs text-[#91A19B] mt-0.5">
            Cryptographically audited server-side session events, incident overrides, and tamper-evident access logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151F24] hover:bg-[#1B292E] border border-[#29383A] text-xs font-medium text-[#F1F5F2] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#52C7D9] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Log</span>
          </button>

          <button
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F06464]/15 hover:bg-[#F06464]/25 border border-[#F06464]/40 text-xs font-semibold text-[#F06464] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Emergency System Reset</span>
          </button>
        </div>
      </div>

      {resetFeedback && (
        <div className="p-3.5 rounded-xl bg-[#71D49A]/10 border border-[#71D49A]/30 flex items-center gap-2.5 text-xs text-[#71D49A]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resetFeedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 flex items-center gap-2.5 text-xs text-[#F06464]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#151F24] border border-[#F06464]/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F06464]/15 text-[#F06464] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F2]">Confirm Network Baseline Reset</h3>
                <p className="text-xs text-[#91A19B]">Administrative Privilege Override</p>
              </div>
            </div>
            <p className="text-xs text-[#91A19B]">
              This operation triggers an authenticated server-side reset of all arterial timing controllers, clears
              emergency green waves, and flushes cache lines. An audit entry will be recorded under your badge ID.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-[#10171B] border border-[#29383A] text-xs text-[#91A19B] hover:text-[#F1F5F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSystemReset}
                className="px-4 py-1.5 rounded-xl bg-[#F06464] hover:bg-[#F06464]/90 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-[#151F24] border border-[#29383A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#64736D] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit records by actor, action, IP, or details..."
            className="w-full bg-[#10171B] border border-[#29383A] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A]"
          />
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-[#91A19B] mr-1 text-[11px]">Severity:</span>
          {(['ALL', 'CRITICAL', 'WARN', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                filterSeverity === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-[#F06464] text-white border-[#F06464]'
                    : sev === 'WARN'
                    ? 'bg-[#F2B84B] text-[#0B0F12] border-[#F2B84B]'
                    : 'bg-[#B7F34A] text-[#0B0F12] border-[#B7F34A]'
                  : 'bg-[#10171B] text-[#91A19B] border-[#29383A]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#151F24] border border-[#29383A] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#29383A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#B7F34A]" />
            <span className="text-xs font-bold text-[#F1F5F2]">Server Security Audit Trail</span>
            <span className="text-[11px] font-mono text-[#91A19B]">
              ({filteredLogs.length} of {logs.length} logged events)
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#70D6B4] bg-[#70D6B4]/10 px-2 py-0.5 rounded border border-[#70D6B4]/20">
            ENCRYPTION: SHA-256 HMAC
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#10171B] border-b border-[#29383A] text-[#91A19B] text-[11px]">
              <tr>
                <th className="py-3 px-4">Event ID / Time</th>
                <th className="py-3 px-4">Actor &amp; Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#29383A]/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#91A19B]">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCrit = log.severity === 'CRITICAL';
                  const isWarn = log.severity === 'WARN';
                  return (
                    <tr key={log.id} className="hover:bg-[#1B292E]/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#F1F5F2]">{log.id}</div>
                        <div className="text-[10px] text-[#64736D]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-[#F1F5F2]">{log.actor}</div>
                        <div className="text-[10px] text-[#91A19B]">{log.role}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-[#10171B] border border-[#29383A] text-[10px] font-bold text-[#52C7D9]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCrit
                              ? 'bg-[#F06464]/15 text-[#F06464] border border-[#F06464]/30'
                              : isWarn
                              ? 'bg-[#F2B84B]/15 text-[#F2B84B] border border-[#F2B84B]/30'
                              : 'bg-[#71D49A]/15 text-[#71D49A] border border-[#71D49A]/30'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[#91A19B]">{log.ip}</td>
                      <td className="py-3 px-4 text-[#F1F5F2] max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
