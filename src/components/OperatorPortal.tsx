/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
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
  Plus,
  Radio,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  Video,
  X,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  UserRole,
  JunctionData,
  TrafficRecord,
  TrafficAlertItem,
  JunctionRecommendation,
  CongestionCategory,
} from '../types';
import {
  INITIAL_TRAFFIC_RECORDS,
  INITIAL_TRAFFIC_ALERTS,
  SAMPLE_CSV_DATASETS,
} from '../data/mockData';

interface OperatorPortalProps {
  currentRole: UserRole;
  junctions: JunctionData[];
  onSwitchRole: (newRole: UserRole) => void;
  onLogout: () => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  onTriggerEmergency: (junctionId: string) => void;
  onUpdateJunctionLoad: (junctionId: string, delta: number) => void;
}

export const OperatorPortal: React.FC<OperatorPortalProps> = ({
  currentRole,
  junctions,
  onSwitchRole,
  onLogout,
  onRunSimulation,
  isSimulating,
  onTriggerEmergency,
  onUpdateJunctionLoad,
}) => {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'monitoring' | 'data_input' | 'junction_analysis' | 'congestion' | 'signals' | 'analytics' | 'history' | 'alerts'
  >('overview');

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Ingestion & Processed Records State
  const [trafficRecords, setTrafficRecords] = useState<TrafficRecord[]>(INITIAL_TRAFFIC_RECORDS);
  const [alerts, setAlerts] = useState<TrafficAlertItem[]>(INITIAL_TRAFFIC_ALERTS);

  // Algorithmic Parameters for Proportional Green Allocation
  const [cycleDurationC, setCycleDurationC] = useState<number>(120); // C in seconds
  const [minGreenTimeGMin, setMinGreenTimeGMin] = useState<number>(15); // g_min in seconds
  const [laneCapacity, setLaneCapacity] = useState<number>(50); // Vehicles per lane max

  // Manual Record Entry Form
  const [manualJunction, setManualJunction] = useState<string>('JUNCT_A');
  const [manualLane, setManualLane] = useState<string>('North-Approach-L1');
  const [manualCount, setManualCount] = useState<number>(25);
  const [manualSpeed, setManualSpeed] = useState<number>(40);
  const [manualPhase, setManualPhase] = useState<'RED' | 'YELLOW' | 'GREEN'>('GREEN');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // History search and filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'Low' | 'Moderate' | 'High'>('ALL');

  // Selected junction for Approach Deep Dive
  const [selectedJunctId, setSelectedJunctId] = useState<string>('JUNCT_B');

  // Compute Density Index: (Vehicle Count / Lane Capacity) * 100
  const computeDensityIndex = (count: number, cap: number = laneCapacity): number => {
    return Math.min(100, Math.round((count / cap) * 100 * 10) / 10);
  };

  // Classify congestion: Low < 40%, Moderate 40-70%, High > 70%
  const classifyCongestion = (density: number): CongestionCategory => {
    if (density > 70) return 'High';
    if (density >= 40) return 'Moderate';
    return 'Low';
  };

  // Proportional Signal Timing Calculation:
  // g = g_min + (D / sum(D)) * (C - n * g_min)
  const calculateSignalRecommendations = (
    junction: JunctionData
  ): JunctionRecommendation => {
    const approaches: {
      approach: 'North' | 'South' | 'East' | 'West';
      vehicleCount: number;
      fixedGreenSec: number;
      speedKmH: number;
    }[] = [
      { approach: 'North', vehicleCount: junction.n1, fixedGreenSec: 30, speedKmH: 35 },
      { approach: 'South', vehicleCount: junction.n2, fixedGreenSec: 30, speedKmH: 38 },
      { approach: 'East', vehicleCount: Math.round(junction.n1 * 0.8), fixedGreenSec: 30, speedKmH: 28 },
      { approach: 'West', vehicleCount: Math.round(junction.n2 * 1.1), fixedGreenSec: 30, speedKmH: 22 },
    ];

    const approachesWithDensity = approaches.map((app) => ({
      ...app,
      laneCapacity,
      densityIndex: computeDensityIndex(app.vehicleCount, laneCapacity),
    }));

    const totalDensity = approachesWithDensity.reduce((acc, app) => acc + app.densityIndex, 0) || 1;
    const n = approaches.length; // 4 approaches
    const availableFlexibleTime = Math.max(0, cycleDurationC - n * minGreenTimeGMin);

    const calculatedApproaches = approachesWithDensity.map((app) => {
      const propShare = app.densityIndex / totalDensity;
      const recommended = Math.round(minGreenTimeGMin + propShare * availableFlexibleTime);
      return {
        ...app,
        recommendedGreenSec: recommended,
      };
    });

    return {
      junctionId: junction.id,
      junctionName: junction.name,
      cycleDurationSec: cycleDurationC,
      minGreenSec: minGreenTimeGMin,
      approaches: calculatedApproaches,
      totalDensity,
    };
  };

  // Active recommendations for the selected junction
  const activeRecommendation = useMemo(() => {
    const j = junctions.find((item) => item.id === selectedJunctId) || junctions[0];
    return calculateSignalRecommendations(j);
  }, [selectedJunctId, junctions, cycleDurationC, minGreenTimeGMin, laneCapacity]);

  // Overall statistics
  const totalMonitoredJunctions = junctions.length;
  const totalVehiclesDetected = junctions.reduce((acc, j) => acc + j.n1 + j.n2, 0);

  const lowCongestionCount = junctions.filter(
    (j) => classifyCongestion(computeDensityIndex(j.n1 + j.n2, laneCapacity * 2)) === 'Low'
  ).length;
  const modCongestionCount = junctions.filter(
    (j) => classifyCongestion(computeDensityIndex(j.n1 + j.n2, laneCapacity * 2)) === 'Moderate'
  ).length;
  const highCongestionCount = junctions.filter(
    (j) => classifyCongestion(computeDensityIndex(j.n1 + j.n2, laneCapacity * 2)) === 'High'
  ).length;
  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  // Manual Record Add Handler
  const handleAddManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const density = computeDensityIndex(manualCount, laneCapacity);
    const category = classifyCongestion(density);
    const jName = junctions.find((j) => j.id === manualJunction)?.name || manualJunction;

    const newRecord: TrafficRecord = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      junctionId: manualJunction,
      junctionName: jName,
      laneId: manualLane,
      vehicleCount: manualCount,
      laneCapacity,
      averageSpeedKmH: manualSpeed,
      signalPhase: manualPhase,
      densityIndex: density,
      congestionLevel: category,
      recommendedGreenSec: Math.round(minGreenTimeGMin + (density / 100) * 35),
      source: 'MANUAL',
    };

    setTrafficRecords([newRecord, ...trafficRecords]);

    // Check if high congestion alert needs to be triggered
    if (category === 'High') {
      const newAlert: TrafficAlertItem = {
        id: `ALT-${Date.now().toString().slice(-3)}`,
        timestamp: newRecord.timestamp,
        junctionId: manualJunction,
        junctionName: jName,
        type: 'CONGESTION_EXCEEDED',
        severity: 'HIGH',
        message: `High congestion (${density}% density) logged on ${manualLane}. Recommended green timing: ${newRecord.recommendedGreenSec}s.`,
        status: 'ACTIVE',
      };
      setAlerts([newAlert, ...alerts]);
    }

    setUploadSuccessMsg('Traffic record preprocessed, analyzed, and committed to history!');
    setTimeout(() => setUploadSuccessMsg(null), 3000);
  };

  // Ingest Preset CSV Dataset
  const handleIngestDataset = (key: 'peak_rush' | 'free_flow' | 'evening_commute') => {
    const csv = SAMPLE_CSV_DATASETS[key];
    const lines = csv.trim().split('\n').slice(1);
    const newRecords: TrafficRecord[] = lines.map((line, idx) => {
      const [ts, jId, lId, vCount, cap, speed, phase] = line.split(',');
      const count = parseInt(vCount) || 10;
      const c = parseInt(cap) || 50;
      const density = computeDensityIndex(count, c);
      const cat = classifyCongestion(density);
      const jName = junctions.find((j) => j.id === jId)?.name || jId;

      return {
        id: `CSV-${Date.now().toString().slice(-3)}-${idx}`,
        timestamp: ts,
        junctionId: jId,
        junctionName: jName,
        laneId: lId,
        vehicleCount: count,
        laneCapacity: c,
        averageSpeedKmH: parseFloat(speed) || 30,
        signalPhase: (phase?.trim() as any) || 'GREEN',
        densityIndex: density,
        congestionLevel: cat,
        recommendedGreenSec: Math.round(minGreenTimeGMin + (density / 100) * 40),
        source: 'UPLOADED',
      };
    });

    setTrafficRecords([...newRecords, ...trafficRecords]);
    setUploadSuccessMsg(`Successfully ingested and processed ${newRecords.length} records from dataset: [${key}]`);
    setTimeout(() => setUploadSuccessMsg(null), 3500);
  };

  // Download Traffic History CSV
  const handleExportHistoryCsv = () => {
    let csv = 'Timestamp,Junction_ID,Junction_Name,Lane_ID,Vehicle_Count,Capacity,Speed_kmh,Density_Index,Congestion_Level,Recommended_Green_Sec,Source\n';
    trafficRecords.forEach((r) => {
      csv += `"${r.timestamp}","${r.junctionId}","${r.junctionName}","${r.laneId}",${r.vehicleCount},${r.laneCapacity},${r.averageSpeedKmH},${r.densityIndex},"${r.congestionLevel}",${r.recommendedGreenSec},"${r.source}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Traffic_Operations_History_${Date.now()}.csv`;
    a.click();
  };

  // Comparative Signal Allocation Chart Data (Fixed 30s vs Proportional Recommendation)
  const signalComparisonChartData = activeRecommendation.approaches.map((app) => ({
    approach: `${app.approach} Approach`,
    FixedTiming: app.fixedGreenSec,
    RecommendedGreen: app.recommendedGreenSec,
    Density: app.densityIndex,
  }));

  // Hourly Flow Chart Data
  const hourlyTrends = [
    { hour: '07:00', vehicles: 450, density: 32 },
    { hour: '08:00', vehicles: 1240, density: 78 },
    { hour: '09:00', vehicles: 1420, density: 85 },
    { hour: '10:00', vehicles: 980, density: 54 },
    { hour: '11:00', vehicles: 720, density: 42 },
    { hour: '12:00', vehicles: 840, density: 48 },
    { hour: '13:00', vehicles: 790, density: 45 },
    { hour: '14:00', vehicles: 880, density: 50 },
    { hour: '15:00', vehicles: 1100, density: 64 },
    { hour: '16:00', vehicles: 1350, density: 75 },
    { hour: '17:00', vehicles: 1580, density: 92 },
    { hour: '18:00', vehicles: 1650, density: 94 },
    { hour: '19:00', vehicles: 1120, density: 68 },
    { hour: '20:00', vehicles: 780, density: 46 },
  ];

  return (
    <div className="min-h-screen bg-[#100D18] text-[#F5F3FA] flex font-sans selection:bg-[#4D91E8]/30 selection:text-[#F5F3FA] relative overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Operator Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#191522] border-r border-[#393044] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#393044] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4D91E8] to-[#35B99B] p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-[#191522] rounded-[10px] flex items-center justify-center">
                <Radio className="w-4 h-4 text-[#35B99B]" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#F5F3FA] tracking-tight">Operator Portal</h1>
              <p className="text-[11px] text-[#A9A0BC]">Traffic Workbench</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1 rounded-lg text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29] lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Group 1: OPERATIONS */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Operations
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#35B99B]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Operator Overview</span>
                {activeTab === 'overview' && <span className="w-1.5 h-1.5 rounded-full bg-[#35B99B]" />}
              </button>

              <button
                onClick={() => {
                  setActiveTab('data_input');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'data_input'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <Upload className={`w-4 h-4 ${activeTab === 'data_input' ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Data Input &amp; Datasets</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#100D18] text-[#4D91E8] font-mono border border-[#393044]">
                  CSV
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('monitoring');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'monitoring'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <MapPin className={`w-4 h-4 ${activeTab === 'monitoring' ? 'text-[#35B99B]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Junction Monitoring</span>
              </button>
            </nav>
          </div>

          {/* Group 2: ANALYSIS */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Analysis &amp; Timing
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('signals');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'signals'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <Sliders className={`w-4 h-4 ${activeTab === 'signals' ? 'text-[#35B99B]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Signal Recommendations</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#17332B] text-[#35B99B] font-mono border border-[#265245]">
                  Algorithmic
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('congestion');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'congestion'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <Activity className={`w-4 h-4 ${activeTab === 'congestion' ? 'text-[#E5A84D]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Density &amp; Bottlenecks</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <BarChart2 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Flow Analytics</span>
              </button>
            </nav>
          </div>

          {/* Group 3: RECORDS & ALERTS */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Logs &amp; History
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('history');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <FileText className={`w-4 h-4 ${activeTab === 'history' ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Traffic History</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#100D18] text-[#A9A0BC] font-mono border border-[#393044]">
                  {trafficRecords.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('alerts');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'alerts'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 ${activeTab === 'alerts' ? 'text-[#E5A84D]' : 'text-[#A9A0BC]'}`} />
                <span className="flex-1">Traffic Alerts</span>
                {activeAlertsCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#3A1C24] text-[#E55353] font-mono border border-[#5E2734]">
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Group 4: ACCOUNT / SWITCH TO ADMIN */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Administration
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => onSwitchRole('System Administrator')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#4D91E8] hover:bg-[#201B29] transition-all text-left cursor-pointer group"
              >
                <Shield className="w-4 h-4 text-[#4D91E8] group-hover:scale-110 transition-transform" />
                <span className="flex-1 font-semibold">Admin Command Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#A9A0BC]" />
              </button>
            </nav>
          </div>
        </div>

        {/* Session Profile Widget */}
        <div className="p-3 border-t border-[#393044]">
          <div className="p-2.5 rounded-xl bg-[#201B29] border border-[#393044] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#191522] border border-[#393044] flex items-center justify-center text-[#35B99B] shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#F5F3FA] truncate">Traffic Operator</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#35B99B]" />
                  <span className="text-[10px] text-[#A9A0BC] truncate">Active Workbench</span>
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
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29] lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-semibold text-[#F5F3FA] tracking-tight">
                {activeTab === 'overview' && 'Operator Traffic Dashboard'}
                {activeTab === 'data_input' && 'Traffic Data Ingestion & Preprocessing'}
                {activeTab === 'monitoring' && 'Junction Status & Approach Queues'}
                {activeTab === 'signals' && 'Proportional Signal Allocation Recommendations'}
                {activeTab === 'congestion' && 'Traffic Density Index & Congestion Classification'}
                {activeTab === 'analytics' && 'Traffic Flow & Peak Hour Analytics'}
                {activeTab === 'history' && 'Processed Traffic History Log'}
                {activeTab === 'alerts' && 'Congestion & Incident Alerts'}
              </h2>
              <p className="text-xs text-[#A9A0BC] hidden sm:block">
                Municipal traffic processing workflow: Ingestion → Density Calculation → Signal Optimization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#4D91E8] to-[#35B99B] hover:opacity-90 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Processing...' : 'Run Signal Cycle'}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-4 lg:p-8 space-y-6">
          {/* Notification feedback banner if triggered */}
          {uploadSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-[#17332B] border border-[#265245] text-xs text-[#35B99B] flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {/* Top 6 Operator Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-[#201B29] border border-[#393044] space-y-1">
              <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider block font-mono">Monitored Hubs</span>
              <span className="text-lg font-bold text-[#F5F3FA] block">{totalMonitoredJunctions} Junctions</span>
              <span className="text-[10px] text-[#35B99B]">Active Grid</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#201B29] border border-[#393044] space-y-1">
              <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider block font-mono">Vehicles Detected</span>
              <span className="text-lg font-bold text-[#4D91E8] block">{totalVehiclesDetected} Units</span>
              <span className="text-[10px] text-[#A9A0BC]">Real-time Ingest</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#201B29] border border-[#393044] space-y-1">
              <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider block font-mono">Low Congestion</span>
              <span className="text-lg font-bold text-[#35B99B] block">{lowCongestionCount} Junctions</span>
              <span className="text-[10px] text-[#35B99B]">Density &lt; 40%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#201B29] border border-[#393044] space-y-1">
              <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider block font-mono">Moderate Load</span>
              <span className="text-lg font-bold text-[#E5A84D] block">{modCongestionCount} Junctions</span>
              <span className="text-[10px] text-[#E5A84D]">40% – 70%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#201B29] border border-[#393044] space-y-1">
              <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider block font-mono">High Congestion</span>
              <span className="text-lg font-bold text-[#E55353] block">{highCongestionCount} Junctions</span>
              <span className="text-[10px] text-[#E55353]">Density &gt; 70%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#201B29] border border-[#393044] space-y-1">
              <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider block font-mono">Active Alerts</span>
              <span className="text-lg font-bold text-[#E5A84D] block">{activeAlertsCount} Alerts</span>
              <span className="text-[10px] text-[#A9A0BC]">Threshold Events</span>
            </div>
          </div>

          {/* VIEW: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Algorithm Quick Spotlight: Proportional Green Allocation */}
              <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#393044] gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#35B99B]" />
                      <span>Proportional Signal Timing Algorithm Spotlight</span>
                    </h3>
                    <p className="text-xs text-[#A9A0BC] mt-0.5">
                      Formula: <code className="text-[#35B99B] font-mono">g = g_min + (D / ΣD) × (C − n × g_min)</code>
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('signals')}
                    className="px-3 py-1.5 rounded-xl bg-[#191522] hover:bg-[#251E33] border border-[#393044] text-xs font-semibold text-[#4D91E8] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect All Approaches</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                  {activeRecommendation.approaches.map((app) => (
                    <div key={app.approach} className="p-3.5 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F5F3FA]">{app.approach} Approach</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            app.densityIndex > 70
                              ? 'bg-[#3A1C24] text-[#E55353]'
                              : app.densityIndex >= 40
                              ? 'bg-[#342818] text-[#E5A84D]'
                              : 'bg-[#17332B] text-[#35B99B]'
                          }`}
                        >
                          D = {app.densityIndex}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[#A9A0BC] text-[11px]">
                        <span>Fixed Timing:</span>
                        <span className="text-[#F5F3FA] font-bold">{app.fixedGreenSec}s</span>
                      </div>
                      <div className="flex justify-between text-[#35B99B] text-[11px] font-bold">
                        <span>Recommended:</span>
                        <span>{app.recommendedGreenSec}s ({app.recommendedGreenSec - app.fixedGreenSec > 0 ? `+${app.recommendedGreenSec - app.fixedGreenSec}s` : `${app.recommendedGreenSec - app.fixedGreenSec}s`})</span>
                      </div>
                      <div className="w-full bg-[#100D18] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#35B99B] h-full rounded-full"
                          style={{ width: `${Math.min(100, (app.recommendedGreenSec / 60) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hourly Traffic Flow & Ingestion Curve */}
              <div className="rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA]">Simulated Vehicle Flow &amp; Congestion Index</h3>
                    <p className="text-xs text-[#A9A0BC]">Vehicle count throughput and corresponding saturation percentage</p>
                  </div>
                  <span className="text-xs font-mono text-[#35B99B]">Sample / Processed Stream</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#35B99B" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#35B99B" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#393044" opacity={0.5} />
                      <XAxis dataKey="hour" stroke="#A9A0BC" tick={{ fill: '#A9A0BC', fontSize: 11 }} />
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
                      <Area type="monotone" dataKey="vehicles" stroke="#35B99B" strokeWidth={2} fill="url(#flowGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DATA INPUT */}
          {activeTab === 'data_input' && (
            <div className="space-y-6">
              {/* Preset Dataset Ingestion Cards */}
              <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-[#F5F3FA]">Batch Dataset Preprocessing</h3>
                  <p className="text-xs text-[#A9A0BC]">
                    Ingest benchmark traffic datasets to calculate real density indices and evaluate signal recommendations.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleIngestDataset('peak_rush')}
                    className="p-4 rounded-xl bg-[#191522] hover:bg-[#251E33] border border-[#393044] hover:border-[#E55353]/50 text-left transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#F5F3FA] group-hover:text-[#E55353] transition-colors">
                        Peak Morning Rush
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3A1C24] text-[#E55353] border border-[#5E2734]">
                        Heavy Load
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A9A0BC]">
                      Elevated approach queues (38-48 units) across all intersections with high congestion.
                    </p>
                    <span className="text-xs font-semibold text-[#4D91E8] block pt-1">Ingest Dataset →</span>
                  </button>

                  <button
                    onClick={() => handleIngestDataset('free_flow')}
                    className="p-4 rounded-xl bg-[#191522] hover:bg-[#251E33] border border-[#393044] hover:border-[#35B99B]/50 text-left transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#F5F3FA] group-hover:text-[#35B99B] transition-colors">
                        Midday Free Flow
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#17332B] text-[#35B99B] border border-[#265245]">
                        Low Load
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A9A0BC]">
                      Uncongested arterial network (10-16 units per lane) with steady 50+ km/h vehicle speeds.
                    </p>
                    <span className="text-xs font-semibold text-[#4D91E8] block pt-1">Ingest Dataset →</span>
                  </button>

                  <button
                    onClick={() => handleIngestDataset('evening_commute')}
                    className="p-4 rounded-xl bg-[#191522] hover:bg-[#251E33] border border-[#393044] hover:border-[#E5A84D]/50 text-left transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#F5F3FA] group-hover:text-[#E5A84D] transition-colors">
                        Evening Commute
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#342818] text-[#E5A84D] border border-[#574021]">
                        Asymmetric
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A9A0BC]">
                      Heavy East &amp; West outflow queues from commercial districts toward residential corridors.
                    </p>
                    <span className="text-xs font-semibold text-[#4D91E8] block pt-1">Ingest Dataset →</span>
                  </button>
                </div>
              </div>

              {/* Manual Record Entry Form */}
              <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] space-y-4">
                <div className="pb-3 border-b border-[#393044]">
                  <h3 className="font-bold text-sm text-[#F5F3FA]">Manual Traffic Record Entry</h3>
                  <p className="text-xs text-[#A9A0BC]">
                    Submit manual approach count and velocity readings to trigger real-time preprocessing
                  </p>
                </div>

                <form onSubmit={handleAddManualRecord} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-[#A9A0BC] uppercase text-[10px] font-semibold mb-1">
                      Intersection
                    </label>
                    <select
                      value={manualJunction}
                      onChange={(e) => setManualJunction(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#191522] border border-[#393044] text-[#F5F3FA] focus:outline-none focus:border-[#4D91E8] cursor-pointer"
                    >
                      {junctions.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name.split(':')[0]} ({j.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#A9A0BC] uppercase text-[10px] font-semibold mb-1">
                      Approach Lane
                    </label>
                    <select
                      value={manualLane}
                      onChange={(e) => setManualLane(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#191522] border border-[#393044] text-[#F5F3FA] focus:outline-none focus:border-[#4D91E8] cursor-pointer"
                    >
                      <option value="North-Approach-L1">North Approach (Lane 1)</option>
                      <option value="South-Approach-L2">South Approach (Lane 2)</option>
                      <option value="East-Approach-L1">East Approach (Lane 1)</option>
                      <option value="West-Approach-L2">West Approach (Lane 2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#A9A0BC] uppercase text-[10px] font-semibold mb-1">
                      Vehicle Count (Units)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={manualCount}
                      onChange={(e) => setManualCount(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#191522] border border-[#393044] text-[#F5F3FA] focus:outline-none focus:border-[#4D91E8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A9A0BC] uppercase text-[10px] font-semibold mb-1">
                      Mean Speed (km/h)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={manualSpeed}
                      onChange={(e) => setManualSpeed(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#191522] border border-[#393044] text-[#F5F3FA] focus:outline-none focus:border-[#4D91E8]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white font-semibold shadow-xs hover:opacity-95 cursor-pointer"
                    >
                      Process &amp; Ingest Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: SIGNAL RECOMMENDATIONS (PROPORTIONAL ALLOCATION ALGORITHM) */}
          {activeTab === 'signals' && (
            <div className="space-y-6">
              {/* Algorithm Parameter Sliders */}
              <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#393044] gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA]">
                      Proportional Signal Allocation Parameters
                    </h3>
                    <p className="text-xs text-[#A9A0BC]">
                      Equation: <span className="text-[#35B99B] font-mono">g = g_min + (D / ΣD) × (C − n × g_min)</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#A9A0BC]">Inspect Junction:</label>
                    <select
                      value={selectedJunctId}
                      onChange={(e) => setSelectedJunctId(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[#191522] border border-[#393044] text-xs font-bold text-[#F5F3FA] cursor-pointer"
                    >
                      {junctions.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
                    <span className="text-[#A9A0BC] text-[10px] uppercase block">
                      Cycle Duration (C): {cycleDurationC}s
                    </span>
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={cycleDurationC}
                      onChange={(e) => setCycleDurationC(parseInt(e.target.value))}
                      className="w-full accent-[#4D91E8] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#A9A0BC]">
                      <span>60s</span>
                      <span>180s</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
                    <span className="text-[#A9A0BC] text-[10px] uppercase block">
                      Minimum Green Window (g_min): {minGreenTimeGMin}s
                    </span>
                    <input
                      type="range"
                      min="10"
                      max="30"
                      value={minGreenTimeGMin}
                      onChange={(e) => setMinGreenTimeGMin(parseInt(e.target.value))}
                      className="w-full accent-[#35B99B] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#A9A0BC]">
                      <span>10s</span>
                      <span>30s</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
                    <span className="text-[#A9A0BC] text-[10px] uppercase block">
                      Lane Saturation Capacity: {laneCapacity} Veh
                    </span>
                    <input
                      type="range"
                      min="30"
                      max="80"
                      value={laneCapacity}
                      onChange={(e) => setLaneCapacity(parseInt(e.target.value))}
                      className="w-full accent-[#E5A84D] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#A9A0BC]">
                      <span>30</span>
                      <span>80</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Comparison: Fixed-Time vs Proportional Green Time */}
              <div className="rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA]">
                      Fixed-Time (30s) vs Recommended Adaptive Green Time
                    </h3>
                    <p className="text-xs text-[#A9A0BC]">
                      Signal allocation dynamically adjusted to approach density (D)
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#35B99B] bg-[#191522] px-2.5 py-1 rounded-lg border border-[#393044]">
                    Total Allocated: {activeRecommendation.approaches.reduce((acc, a) => acc + a.recommendedGreenSec, 0)}s
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signalComparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#393044" opacity={0.5} />
                      <XAxis dataKey="approach" stroke="#A9A0BC" tick={{ fill: '#A9A0BC', fontSize: 11 }} />
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
                      <Bar dataKey="FixedTiming" name="Fixed Default (30s)" fill="#393044" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="RecommendedGreen" name="Recommended Adaptive Green (s)" fill="#35B99B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: JUNCTION MONITORING & SCHEMATIC INTERSECTION */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              {/* Junction Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {junctions.map((j) => {
                  const rec = calculateSignalRecommendations(j);
                  const isSelected = selectedJunctId === j.id;
                  const totalQ = j.n1 + j.n2;
                  const density = computeDensityIndex(totalQ, laneCapacity * 2);
                  const cat = classifyCongestion(density);

                  return (
                    <div
                      key={j.id}
                      onClick={() => setSelectedJunctId(j.id)}
                      className={`p-4 rounded-2xl bg-[#201B29] border transition-all cursor-pointer shadow-md ${
                        isSelected
                          ? 'border-[#35B99B] shadow-lg shadow-[#35B99B]/10'
                          : 'border-[#393044] hover:border-[#35B99B]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between pb-2 border-b border-[#393044]">
                        <div>
                          <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider font-mono">{j.id}</span>
                          <h4 className="font-bold text-sm text-[#F5F3FA] truncate">{j.name.split(':')[0]}</h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            cat === 'High'
                              ? 'bg-[#3A1C24] text-[#E55353] border-[#5E2734]'
                              : cat === 'Moderate'
                              ? 'bg-[#342818] text-[#E5A84D] border-[#574021]'
                              : 'bg-[#17332B] text-[#35B99B] border-[#265245]'
                          }`}
                        >
                          {cat} Congestion
                        </span>
                      </div>

                      <div className="space-y-2 mt-3 text-xs font-mono">
                        <div className="flex justify-between text-[#A9A0BC]">
                          <span>Vehicle Queue:</span>
                          <span className="text-[#F5F3FA] font-bold">{totalQ} Units</span>
                        </div>
                        <div className="flex justify-between text-[#A9A0BC]">
                          <span>Density Index:</span>
                          <span className="text-[#4D91E8] font-bold">{density}%</span>
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
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#393044] flex items-center justify-between text-[11px]">
                        <span className="text-[#35B99B] font-semibold">Inspect Approaches →</span>
                        <span className="text-[#A9A0BC]">Core {j.assignedCore}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Schematic Multi-Way Intersection Visualizer */}
              <div className="rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA]">
                      Schematic 4-Way Intersection Geometry: {activeRecommendation.junctionName}
                    </h3>
                    <p className="text-xs text-[#A9A0BC]">
                      North, South, East, West approach queue flows and active signal status
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#35B99B] bg-[#191522] px-2.5 py-1 rounded-lg border border-[#393044]">
                    Total Cycle: {activeRecommendation.cycleDurationSec}s
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                  {activeRecommendation.approaches.map((app) => (
                    <div key={app.approach} className="p-3.5 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
                      <div className="flex items-center justify-between border-b border-[#393044] pb-1.5">
                        <span className="font-bold text-[#F5F3FA]">{app.approach} Approach</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#35B99B] animate-pulse" />
                      </div>
                      <div className="flex justify-between text-[#A9A0BC]">
                        <span>Queued Vehicles:</span>
                        <span className="text-[#F5F3FA] font-bold">{app.vehicleCount} Units</span>
                      </div>
                      <div className="flex justify-between text-[#A9A0BC]">
                        <span>Density Index (D):</span>
                        <span className="text-[#4D91E8] font-bold">{app.densityIndex}%</span>
                      </div>
                      <div className="flex justify-between text-[#A9A0BC]">
                        <span>Mean Speed:</span>
                        <span className="text-[#F5F3FA]">{app.speedKmH} km/h</span>
                      </div>
                      <div className="flex justify-between text-[#35B99B] font-bold pt-1 border-t border-[#393044]/60">
                        <span>Rec. Green (g):</span>
                        <span>{app.recommendedGreenSec} seconds</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: CONGESTION ANALYSIS */}
          {activeTab === 'congestion' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] space-y-4">
                <div className="pb-3 border-b border-[#393044]">
                  <h3 className="font-bold text-sm text-[#F5F3FA]">
                    Traffic Density Index &amp; Congestion Classification Model
                  </h3>
                  <p className="text-xs text-[#A9A0BC]">
                    Index Formula: <code className="text-[#35B99B] font-mono">Density Index = (Vehicle Count / Lane Capacity) × 100</code>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-[#17332B] border border-[#265245] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#35B99B] text-sm">Low Congestion</span>
                      <span className="px-2 py-0.5 rounded bg-[#100D18] text-[#35B99B] text-[10px]">D &lt; 40%</span>
                    </div>
                    <p className="text-[11px] text-[#A9A0BC]">
                      Unrestricted free flow; queues clear within baseline minimum green interval (g_min = {minGreenTimeGMin}s).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#342818] border border-[#574021] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#E5A84D] text-sm">Moderate Congestion</span>
                      <span className="px-2 py-0.5 rounded bg-[#100D18] text-[#E5A84D] text-[10px]">40% ≤ D ≤ 70%</span>
                    </div>
                    <p className="text-[11px] text-[#A9A0BC]">
                      Active platoon build; proportional algorithm extends green allocation proportionally to prevent spillback.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#3A1C24] border border-[#5E2734] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#E55353] text-sm">High Congestion</span>
                      <span className="px-2 py-0.5 rounded bg-[#100D18] text-[#E55353] text-[10px]">D &gt; 70%</span>
                    </div>
                    <p className="text-[11px] text-[#A9A0BC]">
                      Bottleneck condition; maximum flexible cycle duration allocated to clear approach; alert triggered.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: FLOW ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA]">24-Hour Municipal Vehicle Volume &amp; Mean Speed</h3>
                    <p className="text-xs text-[#A9A0BC]">Comparison between hourly vehicle intake and arterial flow speed</p>
                  </div>
                  <span className="text-xs font-mono text-[#4D91E8]">Processed Time Series</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#393044" opacity={0.5} />
                      <XAxis dataKey="hour" stroke="#A9A0BC" tick={{ fill: '#A9A0BC', fontSize: 11 }} />
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
                      <Line type="monotone" dataKey="vehicles" name="Vehicles (Units)" stroke="#4D91E8" strokeWidth={2} />
                      <Line type="monotone" dataKey="density" name="Density Index (%)" stroke="#E5A84D" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: TRAFFIC HISTORY */}
          {activeTab === 'history' && (
            <div className="rounded-2xl bg-[#201B29] border border-[#393044] overflow-hidden shadow-xl space-y-0">
              <div className="p-5 border-b border-[#393044] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#F5F3FA]">Processed Traffic Records History</h3>
                  <p className="text-xs text-[#A9A0BC]">
                    Audit trail of preprocessed vehicle counts, density calculations, and signal recommendations
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A9A0BC]" />
                    <input
                      type="text"
                      placeholder="Search history..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#191522] border border-[#393044] text-xs text-[#F5F3FA] placeholder-[#A9A0BC] focus:outline-none focus:border-[#4D91E8] w-40"
                    />
                  </div>

                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                    className="py-1.5 px-2.5 rounded-xl bg-[#191522] border border-[#393044] text-xs text-[#F5F3FA] focus:outline-none focus:border-[#4D91E8] cursor-pointer"
                  >
                    <option value="ALL">All Densities</option>
                    <option value="Low">Low (&lt;40%)</option>
                    <option value="Moderate">Moderate (40-70%)</option>
                    <option value="High">High (&gt;70%)</option>
                  </select>

                  <button
                    onClick={handleExportHistoryCsv}
                    className="p-2 rounded-xl bg-[#191522] hover:bg-[#251E33] border border-[#393044] text-[#35B99B] cursor-pointer"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#191522] text-[#A9A0BC] uppercase tracking-wider text-[10px] border-b border-[#393044]">
                    <tr>
                      <th className="py-3 px-4">Timestamp &amp; ID</th>
                      <th className="py-3 px-4">Junction &amp; Lane</th>
                      <th className="py-3 px-4">Count / Cap</th>
                      <th className="py-3 px-4">Speed</th>
                      <th className="py-3 px-4">Density Index</th>
                      <th className="py-3 px-4">Congestion</th>
                      <th className="py-3 px-4">Rec. Green</th>
                      <th className="py-3 px-4 text-right">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#393044]/60 text-[#F5F3FA]">
                    {trafficRecords
                      .filter((r) => historyFilter === 'ALL' || r.congestionLevel === historyFilter)
                      .filter((r) => r.junctionName.toLowerCase().includes(historySearch.toLowerCase()) || r.laneId.toLowerCase().includes(historySearch.toLowerCase()))
                      .map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#191522]/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#F5F3FA] block">{rec.timestamp}</span>
                            <span className="text-[10px] text-[#A9A0BC]">{rec.id}</span>
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <span className="font-bold text-[#F5F3FA] block">{rec.junctionName.split(':')[0]}</span>
                            <span className="text-[10px] text-[#A9A0BC] font-mono">{rec.laneId}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold">{rec.vehicleCount}</span> / {rec.laneCapacity}
                          </td>
                          <td className="py-3.5 px-4 text-[#A9A0BC]">{rec.averageSpeedKmH} km/h</td>
                          <td className="py-3.5 px-4 font-bold text-[#4D91E8]">{rec.densityIndex}%</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                rec.congestionLevel === 'High'
                                  ? 'bg-[#3A1C24] text-[#E55353] border-[#5E2734]'
                                  : rec.congestionLevel === 'Moderate'
                                  ? 'bg-[#342818] text-[#E5A84D] border-[#574021]'
                                  : 'bg-[#17332B] text-[#35B99B] border-[#265245]'
                              }`}
                            >
                              {rec.congestionLevel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#35B99B]">{rec.recommendedGreenSec}s</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-[10px] text-[#A9A0BC] bg-[#191522] px-2 py-0.5 rounded border border-[#393044]">
                              {rec.source}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: ALERTS */}
          {activeTab === 'alerts' && (
            <div className="rounded-2xl bg-[#201B29] border border-[#393044] overflow-hidden shadow-xl space-y-0">
              <div className="p-5 border-b border-[#393044] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#F5F3FA]">Traffic Operations Alerts</h3>
                  <p className="text-xs text-[#A9A0BC]">Autonomous congestion triggers and threshold alerts</p>
                </div>
                <span className="text-xs font-mono text-[#35B99B]">Live Monitoring</span>
              </div>

              <div className="divide-y divide-[#393044]/60">
                {alerts.map((alt) => (
                  <div key={alt.id} className="p-4 hover:bg-[#191522]/40 transition-colors flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          alt.severity === 'CRITICAL' ? 'bg-[#E55353] animate-ping' : alt.severity === 'HIGH' ? 'bg-[#E5A84D]' : 'bg-[#4D91E8]'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#F5F3FA]">{alt.junctionName}</span>
                          <span className="text-[10px] text-[#A9A0BC] font-mono">{alt.id} · {alt.timestamp}</span>
                        </div>
                        <p className="text-xs text-[#A9A0BC] mt-1 leading-relaxed">{alt.message}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="text-[11px] font-mono text-[#35B99B] bg-[#191522] px-2.5 py-1 rounded-lg border border-[#393044]">
                        {alt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
