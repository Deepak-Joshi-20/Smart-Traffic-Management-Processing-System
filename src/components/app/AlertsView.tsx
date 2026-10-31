import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Siren,
  Shield,
  Layers,
  ArrowRight,
  Flame,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { TrafficAlertItem, JunctionData } from '../../types';

interface AlertsViewProps {
  alerts: TrafficAlertItem[];
  junctions: JunctionData[];
  onUpdateAlertStatus: (alertId: string, status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED') => void;
  onAddAlert: (newAlert: Omit<TrafficAlertItem, 'id' | 'timestamp'>) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  junctions,
  onUpdateAlertStatus,
  onAddAlert,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInjectModal, setShowInjectModal] = useState(false);

  // Manual incident simulation form
  const [injectJunction, setInjectJunction] = useState(junctions[0]?.id || 'JUNCT_A');
  const [injectSeverity, setInjectSeverity] = useState<TrafficAlertItem['severity']>('HIGH');
  const [injectType, setInjectType] = useState<TrafficAlertItem['type']>('CONGESTION_EXCEEDED');
  const [injectMessage, setInjectMessage] = useState('');

  const filteredAlerts = alerts.filter((a) => {
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesSearch =
      a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.junctionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.junctionName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  const handleInjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetJunction = junctions.find((j) => j.id === injectJunction);
    onAddAlert({
      junctionId: injectJunction,
      junctionName: targetJunction?.name || injectJunction,
      type: injectType,
      severity: injectSeverity,
      message:
        injectMessage.trim() ||
        `Simulated ${injectType.replace('_', ' ')} logged for intersection ${injectJunction}.`,
      status: 'ACTIVE',
    });
    setInjectMessage('');
    setShowInjectModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Incident Trigger CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F2] tracking-tight">
            Alerts &amp; Incident Operations Command
          </h1>
          <p className="text-xs text-[#91A19B] mt-0.5">
            Triage approach queue spillbacks, emergency priority overrides, and velocity drop anomalies.
          </p>
        </div>

        <button
          onClick={() => setShowInjectModal(true)}
          className="neon-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Simulate Incident Event</span>
        </button>
      </div>

      {/* 4 Overview Count Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Critical Alerts</span>
          <div className="text-2xl font-bold text-[#F06464] tabular-nums">{criticalCount}</div>
          <span className="text-[10px] text-[#F06464] block">Requires Immediate Action</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Active Incidents</span>
          <div className="text-2xl font-bold text-[#F2B84B] tabular-nums">{activeCount}</div>
          <span className="text-[10px] text-[#F2B84B] block">Unresolved in System</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Acknowledged</span>
          <div className="text-2xl font-bold text-[#52C7D9] tabular-nums">{acknowledgedCount}</div>
          <span className="text-[10px] text-[#52C7D9] block">Operator Assigned</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Resolved Events</span>
          <div className="text-2xl font-bold text-[#71D49A] tabular-nums">{resolvedCount}</div>
          <span className="text-[10px] text-[#71D49A] block">Archived to History</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#151F24] border border-[#29383A] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#64736D] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incident description or junction..."
            className="w-full bg-[#10171B] border border-[#29383A] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Severity filter */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#91A19B]">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#10171B] border border-[#29383A] rounded-lg px-2.5 py-1 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#91A19B]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#10171B] border border-[#29383A] rounded-lg px-2.5 py-1 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Cards Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#151F24] border border-[#29383A] text-xs text-[#91A19B] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#71D49A] mx-auto" />
            <div className="font-semibold text-[#F1F5F2]">No matching incidents found</div>
            <p>All monitored intersections are operating within configured nominal tolerance parameters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.status === 'ACTIVE'
                  ? 'bg-[#151F24] border-[#29383A]'
                  : 'bg-[#10171B]/60 border-[#29383A]/60 opacity-80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-[#F06464]/10 text-[#F06464] border border-[#F06464]/30'
                          : alert.severity === 'HIGH'
                          ? 'bg-[#F2B84B]/10 text-[#F2B84B] border border-[#F2B84B]/30'
                          : 'bg-[#70D6B4]/10 text-[#70D6B4] border border-[#70D6B4]/30'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#B7F34A]">
                      {alert.junctionId}
                    </span>
                    <span className="text-xs text-[#64736D]">·</span>
                    <span className="text-xs font-medium text-[#F1F5F2]">{alert.junctionName}</span>
                    <span className="text-xs text-[#64736D]">·</span>
                    <span className="text-[11px] font-mono text-[#64736D]">{alert.timestamp}</span>
                  </div>

                  <p className="text-xs text-[#F1F5F2] leading-relaxed">
                    {alert.message}
                  </p>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <span
                    className={`text-[10px] font-mono px-2 py-1 rounded font-semibold ${
                      alert.status === 'ACTIVE'
                        ? 'text-[#F2B84B] bg-[#F2B84B]/10 border border-[#F2B84B]/20'
                        : alert.status === 'ACKNOWLEDGED'
                        ? 'text-[#52C7D9] bg-[#52C7D9]/10 border border-[#52C7D9]/20'
                        : 'text-[#71D49A] bg-[#71D49A]/10 border border-[#71D49A]/20'
                    }`}
                  >
                    {alert.status}
                  </span>

                  {alert.status === 'ACTIVE' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'ACKNOWLEDGED')}
                      className="px-3 py-1 rounded-lg bg-[#1B292E] hover:bg-[#24353C] border border-[#29383A] text-xs font-mono text-[#F1F5F2] transition-colors cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'RESOLVED')}
                      className="px-3 py-1 rounded-lg bg-[#71D49A]/10 hover:bg-[#71D49A]/20 border border-[#71D49A]/30 text-xs font-mono text-[#71D49A] font-semibold transition-colors cursor-pointer"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Incident Injector Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#151F24] border border-[#29383A] rounded-2xl shadow-2xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#F1F5F2]">Simulate Traffic Incident</h3>
              <p className="text-xs text-[#91A19B] mt-0.5">
                Inject a synthetic incident to verify operator alert propagation and dispatch responsiveness.
              </p>
            </div>

            <form onSubmit={handleInjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#91A19B] mb-1">Target Intersection</label>
                <select
                  value={injectJunction}
                  onChange={(e) => setInjectJunction(e.target.value)}
                  className="w-full bg-[#10171B] border border-[#29383A] rounded-xl px-3 py-2 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
                >
                  {junctions.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.id} — {j.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#91A19B] mb-1">Severity</label>
                  <select
                    value={injectSeverity}
                    onChange={(e) => setInjectSeverity(e.target.value as any)}
                    className="w-full bg-[#10171B] border border-[#29383A] rounded-xl px-3 py-2 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="INFO">INFO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#91A19B] mb-1">Anomaly Type</label>
                  <select
                    value={injectType}
                    onChange={(e) => setInjectType(e.target.value as any)}
                    className="w-full bg-[#10171B] border border-[#29383A] rounded-xl px-3 py-2 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
                  >
                    <option value="CONGESTION_EXCEEDED">Congestion Exceeded</option>
                    <option value="SPEED_DROP">Speed Drop Below 15km/h</option>
                    <option value="EMERGENCY_DISPATCH">Emergency Transit</option>
                    <option value="SIGNAL_OVERRIDE">Manual Phase Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#91A19B] mb-1">Description / Log Details</label>
                <textarea
                  value={injectMessage}
                  onChange={(e) => setInjectMessage(e.target.value)}
                  placeholder="e.g. Multi-vehicle queue spillback on north approach blocking flyover feeder..."
                  rows={3}
                  className="w-full bg-[#10171B] border border-[#29383A] rounded-xl p-3 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInjectModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#10171B] hover:bg-[#1B292E] text-xs font-medium text-[#91A19B] border border-[#29383A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neon-btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Broadcast Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
