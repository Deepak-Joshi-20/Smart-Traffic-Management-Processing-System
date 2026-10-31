/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  LogOut,
  Map as MapIcon,
  MapPin,
  Menu,
  Play,
  Radio,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Siren,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Video,
  X,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { UserRole, JunctionData, TrafficAlertItem, TrafficRecord } from '../types';
import { INITIAL_TRAFFIC_ALERTS, INITIAL_TRAFFIC_RECORDS } from '../data/mockData';

interface AdminPortalProps {
  currentRole: UserRole;
  junctions: JunctionData[];
  onSwitchRole: (newRole: UserRole) => void;
  onLogout: () => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  onTriggerEmergency: (id: string) => void;
  onUpdateJunctionLoad: (id: string, delta: number) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentRole,
  junctions,
  onSwitchRole,
  onLogout,
  onRunSimulation,
  isSimulating,
  onTriggerEmergency,
  onUpdateJunctionLoad,
}) => {
  const [activeNav, setActiveNav] = useState<
    'overview' | 'live_traffic' | 'analytics' | 'signals' | 'alerts' | 'reports' | 'settings'
  >('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('today');
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [alerts, setAlerts] = useState<TrafficAlertItem[]>(INITIAL_TRAFFIC_ALERTS);

  // Selected junction for deep signal inspection
  const [inspectedJunctionId, setInspectedJunctionId] = useState<string>('JUNCT_B');
  const inspectedJunction = junctions.find((j) => j.id === inspectedJunctionId) || junctions[0];

  // Configurable System Thresholds
  const [congestionThreshold, setCongestionThreshold] = useState<number>(70);
  const [minGreenTime, setMinGreenTime] = useState<number>(15);
  const [cycleDuration, setCycleDuration] = useState<number>(120);

  // Total vehicles computed from current junctions
  const totalVehicles = useMemo(
    () => junctions.reduce((acc, j) => acc + j.n1 + j.n2, 0),
    [junctions]
  );
  const congestedJunctions = useMemo(
    () => junctions.filter((j) => j.status === 'Congested'),
    [junctions]
  );

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // A. Vehicle Flow Hourly Trend Dataset (24 hours)
  const vehicleFlowData = [
    { time: '00:00', totalFlow: 420, avgSpeed: 58, peak: 'Off-Peak' },
    { time: '03:00', totalFlow: 210, avgSpeed: 64, peak: 'Off-Peak' },
    { time: '06:00', totalFlow: 890, avgSpeed: 46, peak: 'Morning Build' },
    { time: '08:00', totalFlow: 2680, avgSpeed: 21, peak: 'Morning Peak' },
    { time: '09:00', totalFlow: 2940, avgSpeed: 17, peak: 'Morning Peak' },
    { time: '11:00', totalFlow: 1820, avgSpeed: 38, peak: 'Midday' },
    { time: '13:00', totalFlow: 1950, avgSpeed: 36, peak: 'Midday' },
    { time: '15:00', totalFlow: 2150, avgSpeed: 31, peak: 'Afternoon Build' },
    { time: '17:00', totalFlow: 3200, avgSpeed: 14, peak: 'Evening Peak' },
    { time: '18:30', totalFlow: 3410, avgSpeed: 12, peak: 'Evening Peak' },
    { time: '20:00', totalFlow: 2100, avgSpeed: 32, peak: 'Evening Dissipation' },
    { time: '22:00', totalFlow: 980, avgSpeed: 51, peak: 'Off-Peak' },
  ];

  // B. Traffic Density Comparison by Junction
  const junctionDensityData = junctions.map((j) => {
    const totalQ = j.n1 + j.n2;
    const densityPct = Math.min(100, Math.round((totalQ / 100) * 100));
    return {
      name: j.name.split(':')[0],
      fullName: j.name,
      density: densityPct,
      queue: totalQ,
      load: j.load,
      status: j.status,
    };
  });

  // C. Vehicle Category Distribution (Donut Chart)
  const vehicleCategoryData = [
    { name: 'Sedans & SUVs', value: 58, color: '#4D91E8' },
    { name: 'Motorcycles & 2W', value: 18, color: '#35B99B' },
    { name: 'Public Buses', value: 14, color: '#E5A84D' },
    { name: 'Freight & Logistics', value: 10, color: '#E55353' },
  ];

  // D. Peak Hour Comparison Data (Morning vs Evening vs Midday)
  const peakComparisonData = [
    { metric: 'Avg Queue (Vehicles)', morning: 142, midday: 64, evening: 168 },
    { metric: 'Congestion Index (%)', morning: 74, midday: 38, evening: 86 },
    { metric: 'Mean Speed (km/h)', morning: 19, midday: 42, evening: 14 },
    { metric: 'Wait Delay (sec)', morning: 88, midday: 35, evening: 105 },
  ];

  // Dismiss / Resolve Alert Handler
  const handleResolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a))
    );
  };

  // Export Daily Audit in JSON/CSV
  const handleExportAudit = (format: 'json' | 'csv') => {
    const payload = {
      system: 'MetroPulse Traffic OS - Municipal Audit',
      exportedAt: new Date().toISOString(),
      activeIntersections: junctions.length,
      monitoredVehicleCount: totalVehicles,
      congestedPoints: congestedJunctions.length,
      junctions: junctions.map((j) => ({
        id: j.id,
        name: j.name,
        load: j.load,
        status: j.status,
        signalState: j.signalState,
        greenDurationSec: j.greenDurationSec,
        laneQueues: { n1: j.n1, n2: j.n2 },
      })),
      activeAlerts: alerts.filter((a) => a.status === 'ACTIVE'),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MetroPulse_Traffic_Audit_${Date.now()}.json`;
      a.click();
    } else {
      let csv = 'Junction_ID,Name,Status,Load,Signal_State,Green_Seconds,Lane1_Vehicles,Lane2_Vehicles\n';
      junctions.forEach((j) => {
        csv += `${j.id},"${j.name}",${j.status},${j.load.toFixed(1)},${j.signalState},${j.greenDurationSec},${j.n1},${j.n2}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MetroPulse_Traffic_Audit_${Date.now()}.csv`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#100D18] text-[#F5F3FA] flex font-sans selection:bg-[#4D91E8]/30 selection:text-[#F5F3FA] relative overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#191522] border-r border-[#393044] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#393044] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4D91E8] to-[#35B99B] p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-[#191522] rounded-[10px] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#4D91E8]" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#F5F3FA] tracking-tight">Admin Portal</h1>
              <p className="text-[11px] text-[#A9A0BC]">Smart Traffic Operations</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29] lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Group 1: MAIN */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Main Operations
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveNav('overview');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeNav === 'overview'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeNav === 'overview' ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Command Overview</span>
                {activeNav === 'overview' && <span className="w-1.5 h-1.5 rounded-full bg-[#35B99B]" />}
              </button>

              <button
                onClick={() => {
                  setActiveNav('live_traffic');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeNav === 'live_traffic'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <MapPin className={`w-4 h-4 ${activeNav === 'live_traffic' ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Intersections &amp; Nodes</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#100D18] text-[#35B99B] font-mono border border-[#393044]">
                  {junctions.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveNav('analytics');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeNav === 'analytics'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <BarChart2 className={`w-4 h-4 ${activeNav === 'analytics' ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Traffic Analytics</span>
              </button>
            </nav>
          </div>

          {/* Group 2: TRAFFIC MANAGEMENT */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Traffic Management
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveNav('signals');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeNav === 'signals'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <Sliders className={`w-4 h-4 ${activeNav === 'signals' ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Signal Controllers</span>
              </button>

              <button
                onClick={() => {
                  setActiveNav('alerts');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeNav === 'alerts'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 ${activeNav === 'alerts' ? 'text-[#E5A84D]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Alerts &amp; Incidents</span>
                {alerts.filter((a) => a.status === 'ACTIVE').length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#3A1C24] text-[#E55353] font-mono border border-[#5E2734]">
                    {alerts.filter((a) => a.status === 'ACTIVE').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveNav('reports');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeNav === 'reports'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <FileText className={`w-4 h-4 ${activeNav === 'reports' ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Traffic Reports</span>
              </button>
            </nav>
          </div>

          {/* Group 3: SYSTEM */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Control &amp; Roles
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => onSwitchRole('Traffic Control Operator')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#4D91E8] hover:bg-[#201B29] transition-all text-left cursor-pointer group"
              >
                <Radio className="w-4 h-4 text-[#35B99B] group-hover:scale-110 transition-transform" />
                <span className="flex-1 font-semibold">Operator Workbench</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#A9A0BC]" />
              </button>

              <button
                onClick={() => {
                  setActiveNav('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeNav === 'settings'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <Settings className={`w-4 h-4 ${activeNav === 'settings' ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Threshold Config</span>
              </button>
            </nav>
          </div>
        </div>

        {/* User Session Profile Widget */}
        <div className="p-3 border-t border-[#393044]">
          <div className="p-2.5 rounded-xl bg-[#201B29] border border-[#393044] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#191522] border border-[#393044] flex items-center justify-center text-[#4D91E8] shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#F5F3FA] truncate">Administrator</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#35B99B]" />
                  <span className="text-[10px] text-[#A9A0BC] truncate">Full Network Clearance</span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Lock Console"
              className="p-1.5 rounded-lg text-[#A9A0BC] hover:text-[#E55353] hover:bg-[#191522] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen relative z-10">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#100D18]/90 backdrop-blur-md border-b border-[#393044] px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29] lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-semibold text-[#F5F3FA] tracking-tight">
                {activeNav === 'overview' && 'City Traffic Command Centre'}
                {activeNav === 'live_traffic' && 'Intersections & Fleet Telemetry'}
                {activeNav === 'analytics' && 'Advanced Traffic Analytics'}
                {activeNav === 'signals' && 'Signal Policy & Coordination'}
                {activeNav === 'alerts' && 'Incident & Alert Log'}
                {activeNav === 'reports' && 'Traffic Reports & Audits'}
                {activeNav === 'settings' && 'System Thresholds & Policies'}
              </h2>
              <p className="text-xs text-[#A9A0BC] hidden sm:block">
                Autonomous municipal arterial network optimization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Run Signal Recalculation */}
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#4D91E8] to-[#35B99B] hover:opacity-90 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Recalculating...' : 'Run Signal Cycle'}</span>
            </button>

            {/* Quick Switch to Operator */}
            <button
              onClick={() => onSwitchRole('Traffic Control Operator')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#201B29] hover:bg-[#251E33] border border-[#393044] text-xs font-medium text-[#4D91E8] transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-[#35B99B]" />
              <span>Operator Portal</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-4 lg:p-8 space-y-6">
          {/* Welcome Header */}
          <div className="p-6 rounded-2xl bg-[#201B29] border border-[#393044] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#A9A0BC] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#4D91E8]" />
                <span>{currentDateFormatted} · Metropolitan Region 1</span>
              </div>
              <h1 className="text-xl font-bold text-[#F5F3FA] tracking-tight">
                Welcome back, Administrator
              </h1>
              <p className="text-xs text-[#A9A0BC] mt-1 max-w-xl leading-relaxed">
                Monitor traffic conditions, manage signal allocation algorithms, and mitigate peak congestion across the municipal corridor.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onTriggerEmergency('JUNCT_B')}
                className="px-3.5 py-2 rounded-xl bg-[#3A1C24] hover:bg-[#4E212B] text-xs font-semibold text-[#E55353] border border-[#5E2734] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Siren className="w-3.5 h-3.5" />
                <span>Priority Emergency Override</span>
              </button>
              <button
                onClick={() => handleExportAudit('csv')}
                className="px-3.5 py-2 rounded-xl bg-[#191522] hover:bg-[#251E33] border border-[#393044] text-xs font-medium text-[#F5F3FA] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#A9A0BC]" />
                <span>Export Audit</span>
              </button>
            </div>
          </div>

          {/* 4 Overview Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-medium text-[#A9A0BC] block uppercase tracking-wider">
                  Monitored Hubs
                </span>
                <span className="text-xl font-bold text-[#F5F3FA] mt-0.5 block tabular-nums">
                  {junctions.length} <span className="text-xs font-normal text-[#A9A0BC]">Intersections</span>
                </span>
                <span className="text-[10px] text-[#35B99B] font-mono mt-1 block">100% Online &amp; Synced</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#191522] border border-[#393044] flex items-center justify-center text-[#4D91E8]">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-medium text-[#A9A0BC] block uppercase tracking-wider">
                  Active Signals
                </span>
                <span className="text-xl font-bold text-[#35B99B] mt-0.5 block tabular-nums">
                  16 <span className="text-xs font-normal text-[#A9A0BC]">Phases</span>
                </span>
                <span className="text-[10px] text-[#A9A0BC] font-mono mt-1 block">Adaptive Green Waves</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#35B99B]/10 border border-[#35B99B]/30 flex items-center justify-center text-[#35B99B]">
                <Sliders className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-medium text-[#A9A0BC] block uppercase tracking-wider">
                  Vehicles Ingested
                </span>
                <span className="text-xl font-bold text-[#F5F3FA] mt-0.5 block tabular-nums">
                  {totalVehicles} <span className="text-xs font-normal text-[#A9A0BC]">Units Active</span>
                </span>
                <span className="text-[10px] text-[#4D91E8] font-mono mt-1 block">Live Flow Stream</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#191522] border border-[#393044] flex items-center justify-center text-[#4D91E8]">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-medium text-[#A9A0BC] block uppercase tracking-wider">
                  Congestion Alerts
                </span>
                <span
                  className={`text-xl font-bold mt-0.5 block tabular-nums ${
                    congestedJunctions.length > 0 ? 'text-[#E5A84D]' : 'text-[#35B99B]'
                  }`}
                >
                  {congestedJunctions.length} <span className="text-xs font-normal text-[#A9A0BC]">Bottlenecks</span>
                </span>
                <span className="text-[10px] text-[#E5A84D] font-mono mt-1 block">Threshold L &gt; 80</span>
              </div>
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  congestedJunctions.length > 0
                    ? 'bg-[#3A1C24] text-[#E55353] border-[#5E2734]'
                    : 'bg-[#191522] text-[#35B99B] border-[#393044]'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* SECTION: Overview or Specific Module View */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              {/* Main Vehicle Flow Analysis Chart */}
              <div className="rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#393044] gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA]">
                      Arterial Vehicle Flow Rate &amp; Velocity Curve
                    </h3>
                    <p className="text-xs text-[#A9A0BC]">
                      24-hour municipal traffic volume vs mean arterial speed (km/h)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#35B99B] bg-[#191522] px-2.5 py-1 rounded-lg border border-[#393044]">
                      Peak: 3,410 Veh/Hr (18:30)
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vehicleFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4D91E8" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#4D91E8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#393044" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#A9A0BC" tick={{ fill: '#A9A0BC', fontSize: 11 }} />
                      <YAxis stroke="#A9A0BC" tick={{ fill: '#A9A0BC', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#191522',
                          borderColor: '#393044',
                          borderRadius: '12px',
                          color: '#F5F3FA',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${val} Units`, 'Flow Rate']}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalFlow"
                        stroke="#4D91E8"
                        strokeWidth={2}
                        fill="url(#flowGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2-Column Split: Density By Junction & Vehicle Category Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Density Bar Comparison (2 Cols) */}
                <div className="lg:col-span-2 rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                    <div>
                      <h3 className="font-bold text-sm text-[#F5F3FA]">Intersection Queue Density Index</h3>
                      <p className="text-xs text-[#A9A0BC]">
                        Relative lane saturation (%) across monitored nodes
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#A9A0BC]">Threshold: 70%</span>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={junctionDensityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#393044" opacity={0.5} />
                        <XAxis dataKey="name" stroke="#A9A0BC" tick={{ fill: '#A9A0BC', fontSize: 11 }} />
                        <YAxis domain={[0, 100]} stroke="#A9A0BC" tick={{ fill: '#A9A0BC', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#191522',
                            borderColor: '#393044',
                            borderRadius: '12px',
                            color: '#F5F3FA',
                            fontSize: '12px',
                          }}
                          formatter={(val: any) => [`${val}%`, 'Saturation']}
                        />
                        <Bar dataKey="density" radius={[6, 6, 0, 0]}>
                          {junctionDensityData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.density > 70 ? '#E55353' : entry.density >= 40 ? '#E5A84D' : '#35B99B'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut Chart: Vehicle Category Breakdown (1 Col) */}
                <div className="rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                    <h3 className="font-bold text-sm text-[#F5F3FA]">Vehicle Classification</h3>
                    <Compass className="w-4 h-4 text-[#4D91E8]" />
                  </div>

                  <div className="h-44 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vehicleCategoryData}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {vehicleCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#191522',
                            borderColor: '#393044',
                            borderRadius: '12px',
                            color: '#F5F3FA',
                            fontSize: '12px',
                          }}
                          formatter={(val: any) => [`${val}%`, 'Share']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    {vehicleCategoryData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[#A9A0BC]">{item.name}</span>
                        </div>
                        <span className="text-[#F5F3FA] font-bold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Live Traffic Intersections */}
          {activeNav === 'live_traffic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {junctions.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => setInspectedJunctionId(j.id)}
                    className={`p-4 rounded-2xl bg-[#201B29] border transition-all cursor-pointer shadow-md ${
                      inspectedJunctionId === j.id
                        ? 'border-[#4D91E8] shadow-lg shadow-[#4D91E8]/10'
                        : 'border-[#393044] hover:border-[#4D91E8]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between pb-2 border-b border-[#393044]">
                      <div>
                        <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider font-mono">
                          {j.id}
                        </span>
                        <h4 className="font-bold text-sm text-[#F5F3FA] truncate">{j.name}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          j.status === 'Congested'
                            ? 'bg-[#3A1C24] text-[#E55353] border-[#5E2734]'
                            : j.status === 'Moderate'
                            ? 'bg-[#342818] text-[#E5A84D] border-[#574021]'
                            : 'bg-[#17332B] text-[#35B99B] border-[#265245]'
                        }`}
                      >
                        {j.status}
                      </span>
                    </div>

                    <div className="space-y-2 mt-3 text-xs font-mono">
                      <div className="flex justify-between text-[#A9A0BC]">
                        <span>Queued Vehicles:</span>
                        <span className="text-[#F5F3FA] font-bold">{j.n1 + j.n2} Units</span>
                      </div>
                      <div className="flex justify-between text-[#A9A0BC]">
                        <span>Signal Phase:</span>
                        <span
                          className={`font-bold ${
                            j.signalState === 'GREEN'
                              ? 'text-[#35B99B]'
                              : j.signalState === 'YELLOW'
                              ? 'text-[#E5A84D]'
                              : 'text-[#E55353]'
                          }`}
                        >
                          {j.signalState} ({j.greenDurationSec}s)
                        </span>
                      </div>
                      <div className="flex justify-between text-[#A9A0BC]">
                        <span>Approach Load (L):</span>
                        <span className="text-[#F5F3FA] font-bold">{j.load.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#393044] flex items-center justify-between text-[11px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerEmergency(j.id);
                        }}
                        className="text-[#E55353] hover:underline flex items-center gap-1 font-medium"
                      >
                        <Siren className="w-3 h-3" />
                        <span>Force Green</span>
                      </button>
                      <span className="text-[#A9A0BC]">Core {j.assignedCore}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Deep Inspection Panel for Selected Junction */}
              <div className="rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA]">
                      Node Inspection: {inspectedJunction.name}
                    </h3>
                    <p className="text-xs text-[#A9A0BC]">
                      Signal state management and simulated approach queues
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateJunctionLoad(inspectedJunction.id, -10)}
                      className="px-3 py-1.5 rounded-lg bg-[#191522] hover:bg-[#251E33] border border-[#393044] text-xs text-[#F5F3FA] cursor-pointer"
                    >
                      -10 Density
                    </button>
                    <button
                      onClick={() => onUpdateJunctionLoad(inspectedJunction.id, 15)}
                      className="px-3 py-1.5 rounded-lg bg-[#4D91E8]/15 hover:bg-[#4D91E8]/25 text-xs font-semibold text-[#4D91E8] border border-[#4D91E8]/40 cursor-pointer"
                    >
                      +15 Density
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
                    <span className="text-[#A9A0BC] text-[10px] uppercase">Lane 1 Queue</span>
                    <span className="text-base font-bold text-[#F5F3FA] block mt-1">{inspectedJunction.n1} Veh</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
                    <span className="text-[#A9A0BC] text-[10px] uppercase">Lane 2 Queue</span>
                    <span className="text-base font-bold text-[#F5F3FA] block mt-1">{inspectedJunction.n2} Veh</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
                    <span className="text-[#A9A0BC] text-[10px] uppercase">Weight Multiplier (W)</span>
                    <span className="text-base font-bold text-[#4D91E8] block mt-1">{inspectedJunction.w.toFixed(1)}x</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
                    <span className="text-[#A9A0BC] text-[10px] uppercase">Calculated Load (L)</span>
                    <span className="text-base font-bold text-[#35B99B] block mt-1">{inspectedJunction.load.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Traffic Analytics (High Priority User Request) */}
          {activeNav === 'analytics' && (
            <div className="space-y-6">
              {/* Date Filters Header */}
              <div className="flex items-center justify-between bg-[#201B29] p-3 rounded-xl border border-[#393044]">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#4D91E8]" />
                  <span className="text-xs font-medium text-[#F5F3FA]">Temporal Filter:</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    onClick={() => setTimeRange('today')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      timeRange === 'today'
                        ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white font-bold'
                        : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTimeRange('7days')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      timeRange === '7days'
                        ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white font-bold'
                        : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setTimeRange('30days')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      timeRange === '30days'
                        ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white font-bold'
                        : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
                    }`}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              {/* Peak Hour Comparison Bar Chart */}
              <div className="rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA]">
                      Peak Hour Operational Comparison
                    </h3>
                    <p className="text-xs text-[#A9A0BC]">
                      Morning (08:00–10:00) vs Midday (12:00–14:00) vs Evening (17:00–19:00)
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#35B99B]">Evening Commute = Peak Demand</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#393044" opacity={0.5} />
                      <XAxis dataKey="metric" stroke="#A9A0BC" tick={{ fill: '#A9A0BC', fontSize: 11 }} />
                      <YAxis stroke="#A9A0BC" tick={{ fill: '#A9A0BC', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#191522',
                          borderColor: '#393044',
                          borderRadius: '12px',
                          color: '#F5F3FA',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="morning" name="Morning Peak (08:00)" fill="#4D91E8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="midday" name="Midday Off-Peak" fill="#35B99B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="evening" name="Evening Peak (18:00)" fill="#E55353" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Signal Management */}
          {activeNav === 'signals' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA]">
                      Adaptive Proportional Signal Timing Configuration
                    </h3>
                    <p className="text-xs text-[#A9A0BC]">
                      Algorithm: g = g_min + (D / ΣD) × (C − n × g_min)
                    </p>
                  </div>
                  <button
                    onClick={onRunSimulation}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-xs font-semibold text-white shadow-xs cursor-pointer"
                  >
                    Sync All Controllers
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
                    <span className="text-[#A9A0BC] uppercase tracking-wider text-[10px] block">
                      Total Cycle Duration (C)
                    </span>
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={cycleDuration}
                      onChange={(e) => setCycleDuration(parseInt(e.target.value))}
                      className="w-full accent-[#4D91E8] cursor-pointer"
                    />
                    <div className="flex justify-between font-bold text-[#F5F3FA]">
                      <span>60s</span>
                      <span className="text-[#4D91E8] text-sm">{cycleDuration}s</span>
                      <span>180s</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
                    <span className="text-[#A9A0BC] uppercase tracking-wider text-[10px] block">
                      Minimum Green Window (g_min)
                    </span>
                    <input
                      type="range"
                      min="10"
                      max="30"
                      value={minGreenTime}
                      onChange={(e) => setMinGreenTime(parseInt(e.target.value))}
                      className="w-full accent-[#35B99B] cursor-pointer"
                    />
                    <div className="flex justify-between font-bold text-[#F5F3FA]">
                      <span>10s</span>
                      <span className="text-[#35B99B] text-sm">{minGreenTime}s</span>
                      <span>30s</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
                    <span className="text-[#A9A0BC] uppercase tracking-wider text-[10px] block">
                      Congestion Alert Threshold
                    </span>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      value={congestionThreshold}
                      onChange={(e) => setCongestionThreshold(parseInt(e.target.value))}
                      className="w-full accent-[#E5A84D] cursor-pointer"
                    />
                    <div className="flex justify-between font-bold text-[#F5F3FA]">
                      <span>50%</span>
                      <span className="text-[#E5A84D] text-sm">{congestionThreshold}%</span>
                      <span>90%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Alerts & Incidents */}
          {activeNav === 'alerts' && (
            <div className="rounded-2xl bg-[#201B29] border border-[#393044] overflow-hidden shadow-xl space-y-0">
              <div className="p-5 border-b border-[#393044] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#F5F3FA]">Incident &amp; Congestion Alerts</h3>
                  <p className="text-xs text-[#A9A0BC]">Real-time detection events and system responses</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setAlertFilter(lvl)}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                        alertFilter === lvl
                          ? 'bg-[#191522] text-[#F5F3FA] font-bold border border-[#4D91E8]'
                          : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-[#393044]/60">
                {alerts
                  .filter((a) => alertFilter === 'ALL' || a.severity === alertFilter)
                  .map((alert) => (
                    <div key={alert.id} className="p-4 hover:bg-[#191522]/40 transition-colors flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-[#E55353] animate-ping'
                              : alert.severity === 'HIGH'
                              ? 'bg-[#E5A84D]'
                              : 'bg-[#4D91E8]'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#F5F3FA]">{alert.junctionName}</span>
                            <span className="text-[10px] text-[#A9A0BC] font-mono">{alert.id} · {alert.timestamp}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono uppercase ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-[#3A1C24] text-[#E55353]'
                                  : alert.severity === 'HIGH'
                                  ? 'bg-[#342818] text-[#E5A84D]'
                                  : 'bg-[#191522] text-[#4D91E8]'
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-xs text-[#A9A0BC] mt-1 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {alert.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#191522] hover:bg-[#251E33] border border-[#393044] text-[11px] font-medium text-[#35B99B] cursor-pointer"
                          >
                            Resolve Alert
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-[#35B99B] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SECTION: Reports & Export */}
          {activeNav === 'reports' && (
            <div className="p-6 rounded-2xl bg-[#201B29] border border-[#393044] space-y-5">
              <div>
                <h3 className="font-bold text-base text-[#F5F3FA]">Municipal Traffic Reports &amp; Data Audits</h3>
                <p className="text-xs text-[#A9A0BC] mt-0.5">
                  Export verified sensor throughput, queue metrics, and signal timing logs for municipal planning.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-3">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-[#35B99B]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#F5F3FA]">CSV Format Telemetry Dataset</h4>
                      <p className="text-[11px] text-[#A9A0BC]">Standard tabular data with lane queue numbers &amp; load factors</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportAudit('csv')}
                    className="w-full py-2 rounded-xl bg-[#201B29] hover:bg-[#251E33] border border-[#393044] text-xs font-medium text-[#35B99B] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Dataset</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-[#4D91E8]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#F5F3FA]">Full System JSON Audit</h4>
                      <p className="text-[11px] text-[#A9A0BC]">Structured JSON payload with incidents, alerts, and node configurations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportAudit('json')}
                    className="w-full py-2 rounded-xl bg-[#201B29] hover:bg-[#251E33] border border-[#393044] text-xs font-medium text-[#4D91E8] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Package</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Settings */}
          {activeNav === 'settings' && (
            <div className="p-6 rounded-2xl bg-[#201B29] border border-[#393044] space-y-4">
              <h3 className="font-bold text-base text-[#F5F3FA]">System Policies &amp; Thresholds</h3>
              <p className="text-xs text-[#A9A0BC]">
                Configure autonomous response behaviors for the municipal signal network.
              </p>
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-[#191522] border border-[#393044] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#F5F3FA]">Autonomous Congestion Dispatch</div>
                    <div className="text-[#A9A0BC] text-[11px]">Automatically increase green window when Density Index &gt; 70%</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#17332B] text-[#35B99B] border border-[#265245] font-mono font-bold">
                    Enabled
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#191522] border border-[#393044] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#F5F3FA]">Emergency Corridor Invalidation</div>
                    <div className="text-[#A9A0BC] text-[11px]">Broadcast immediate signal hold on emergency vehicle detection</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#17332B] text-[#35B99B] border border-[#265245] font-mono font-bold">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
