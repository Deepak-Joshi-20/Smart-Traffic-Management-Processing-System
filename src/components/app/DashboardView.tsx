import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Flame,
  Layers,
  MapPin,
  Play,
  Radio,
  RotateCcw,
  Shield,
  Siren,
  Sliders,
  TrendingDown,
  TrendingUp,
  Video,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { JunctionData, TrafficRecord, TrafficAlertItem, AppRoute } from '../../types';
import { CityMap } from '../CityMap';

interface DashboardViewProps {
  junctions: JunctionData[];
  records: TrafficRecord[];
  alerts: TrafficAlertItem[];
  simulationCycle: number;
  isSimulating: boolean;
  onRunSimulation: () => void;
  onNavigate: (route: AppRoute) => void;
  onTriggerEmergency: (id: string) => void;
  onUpdateJunctionLoad: (id: string, delta: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  junctions,
  records,
  alerts,
  simulationCycle,
  isSimulating,
  onRunSimulation,
  onNavigate,
  onTriggerEmergency,
  onUpdateJunctionLoad,
}) => {
  // Multiple toggleable map layers with Local Storage Persistence
  const [mapLayers, setMapLayers] = useState<{
    heatmap: boolean;
    signalStatus: boolean;
    emergencyCorridors: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('urbanpulse_map_layers');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          heatmap: Boolean(parsed.heatmap),
          signalStatus: Boolean(parsed.signalStatus),
          emergencyCorridors: Boolean(parsed.emergencyCorridors),
        };
      }
    } catch {
      // Fallback to defaults
    }
    return {
      heatmap: false,
      signalStatus: true,
      emergencyCorridors: false,
    };
  });

  // Save layer preferences whenever mapLayers change
  useEffect(() => {
    try {
      localStorage.setItem('urbanpulse_map_layers', JSON.stringify(mapLayers));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, [mapLayers]);

  const toggleLayer = (layer: 'heatmap' | 'signalStatus' | 'emergencyCorridors') => {
    setMapLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const junctionNodes = useMemo(() => {
    return junctions.map((j) => ({
      ...j,
      label: j.name.split(':')[0] || j.id,
    }));
  }, [junctions]);

  // Calculated actual metrics from application state
  const totalVehicles = junctions.reduce((acc, j) => acc + j.n1 + j.n2, 0);
  const activeJunctionsCount = junctions.length;
  const congestedJunctionsCount = junctions.filter((j) => j.status === 'Congested').length;
  const avgDensity = Math.round(
    junctions.reduce((acc, j) => acc + (j.load / j.queueThreshold) * 100, 0) / junctions.length
  );
  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const recommendationsCount = junctions.filter((j) => j.load > 50).length;

  // Real-time density chart data derived from records
  const densityTrendData = records.slice(0, 8).reverse().map((r, i) => ({
    time: r.timestamp,
    density: r.densityIndex,
    speed: r.averageSpeedKmH,
    name: r.junctionName.split(':')[0],
  }));

  // Congestion Distribution breakdown
  const freeFlowCount = junctions.filter((j) => j.status === 'Free Flow').length;
  const moderateCount = junctions.filter((j) => j.status === 'Moderate').length;

  const pieData = [
    { name: 'Normal / Free Flow', value: freeFlowCount, color: '#71D49A' },
    { name: 'Moderate Queue', value: moderateCount, color: '#F2B84B' },
    { name: 'Critical Congested', value: congestedJunctionsCount, color: '#F06464' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* 1. WELCOME BANNER */}
      <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B7F34A] animate-pulse" />
            <span className="text-[11px] font-mono font-medium text-[#B7F34A] uppercase tracking-wider">
              Real-Time Traffic Operations Command
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#F1F5F2] tracking-tight">
            Traffic Intelligence Overview
          </h1>
          <p className="text-xs text-[#91A19B] leading-relaxed">
            Active municipal monitoring across 4 metropolitan arterial sectors. Signal optimization engine running on active simulation dataset.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-mono text-[#64736D] pt-1">
            <span>Cycle Clock: #{simulationCycle}</span>
            <span>·</span>
            <span>Dataset: Municipal Sector Baseline</span>
            <span>·</span>
            <span>Last Sync: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Operational CTA Controls */}
        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <button
            onClick={() => onTriggerEmergency('JUNCT_B')}
            className="px-3.5 py-2 rounded-xl bg-[#F06464]/10 hover:bg-[#F06464]/20 border border-[#F06464]/30 text-xs font-semibold text-[#F06464] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Siren className="w-4 h-4" />
            <span>Priority Green Wave</span>
          </button>
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="neon-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Optimizing Grid...' : 'Run Optimization'}</span>
          </button>
        </div>

        {/* Subtle decorative grid lines in background */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-15 pointer-events-none neon-grid-pattern" />
      </div>

      {/* 2. KEY METRICS STRIP (6 Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Total Vehicles</span>
          <div className="text-xl font-bold text-[#F1F5F2] tabular-nums">{totalVehicles}</div>
          <span className="text-[10px] text-[#70D6B4] block flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 4 Monitored Nodes
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Active Junctions</span>
          <div className="text-xl font-bold text-[#B7F34A] tabular-nums">{activeJunctionsCount} / 4</div>
          <span className="text-[10px] text-[#B7F34A] block">100% Operational</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Congested Points</span>
          <div className={`text-xl font-bold tabular-nums ${congestedJunctionsCount > 0 ? 'text-[#F06464]' : 'text-[#71D49A]'}`}>
            {congestedJunctionsCount}
          </div>
          <span className="text-[10px] text-[#91A19B] block">Queue &gt; 80 limit</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Avg Traffic Density</span>
          <div className="text-xl font-bold text-[#52C7D9] tabular-nums">{avgDensity}%</div>
          <span className="text-[10px] text-[#91A19B] block">Sector Capacity</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Active Alerts</span>
          <div className={`text-xl font-bold tabular-nums ${activeAlertsCount > 0 ? 'text-[#F2B84B]' : 'text-[#71D49A]'}`}>
            {activeAlertsCount}
          </div>
          <span className="text-[10px] text-[#F2B84B] block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Requires Action
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Signal Recs</span>
          <div className="text-xl font-bold text-[#B7F34A] tabular-nums">{recommendationsCount}</div>
          <span className="text-[10px] text-[#70D6B4] block">Webster Delay Solved</span>
        </div>
      </div>

      {/* 3. CITY TRAFFIC OVERVIEW (Interactive GSAP City Map with Multiple Toggleable Map Layers) */}
      <div className="rounded-2xl bg-[#151F24] border border-[#29383A] overflow-hidden space-y-0">
        {/* Top Header & Layer Toggles Bar */}
        <div className="px-5 py-4 border-b border-[#29383A] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B292E] border border-[#29383A] flex items-center justify-center text-[#B7F34A]">
              <Compass className="w-4 h-4 text-[#B7F34A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#F1F5F2]">
                  Metropolitan Arterial Grid &amp; CCTV Feeds
                </h2>
                <span className="text-[10px] font-mono text-[#B7F34A] bg-[#B7F34A]/10 border border-[#B7F34A]/20 px-2 py-0.5 rounded">
                  GSAP MOTIONPATH
                </span>
              </div>
              <p className="text-[11px] text-[#91A19B] mt-0.5">
                Toggleable visual layers for congestion thermals, live signal phases, and emergency corridors.
              </p>
            </div>
          </div>

          {/* Toggleable Layer Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-[#64736D] uppercase mr-1 hidden sm:inline">
              Map Layers:
            </span>

            {/* Layer 1: Heatmap for Congestion */}
            <button
              onClick={() => toggleLayer('heatmap')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all cursor-pointer ${
                mapLayers.heatmap
                  ? 'bg-[#F06464]/20 border-[#F06464] text-[#F06464] shadow-xs'
                  : 'bg-[#10171B] border-[#29383A] text-[#91A19B] hover:text-[#F1F5F2] hover:border-[#3D535A]'
              }`}
              title="Toggle thermal density heatmap overlay"
            >
              <Flame className={`w-3.5 h-3.5 ${mapLayers.heatmap ? 'text-[#F06464] animate-pulse' : 'text-[#64736D]'}`} />
              <span className="font-semibold">Heatmap</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  mapLayers.heatmap ? 'bg-[#F06464] text-white' : 'bg-[#1B292E] text-[#64736D]'
                }`}
              >
                {mapLayers.heatmap ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Layer 2: Signal Status for Live Light Phases */}
            <button
              onClick={() => toggleLayer('signalStatus')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all cursor-pointer ${
                mapLayers.signalStatus
                  ? 'bg-[#71D49A]/20 border-[#71D49A] text-[#71D49A] shadow-xs'
                  : 'bg-[#10171B] border-[#29383A] text-[#91A19B] hover:text-[#F1F5F2] hover:border-[#3D535A]'
              }`}
              title="Toggle live 3-aspect signal light heads and phase countdowns"
            >
              <Sliders className={`w-3.5 h-3.5 ${mapLayers.signalStatus ? 'text-[#71D49A]' : 'text-[#64736D]'}`} />
              <span className="font-semibold">Signal Status</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  mapLayers.signalStatus ? 'bg-[#71D49A] text-[#0B0F12]' : 'bg-[#1B292E] text-[#64736D]'
                }`}
              >
                {mapLayers.signalStatus ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Layer 3: Emergency Corridors for Priority Routes */}
            <button
              onClick={() => toggleLayer('emergencyCorridors')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all cursor-pointer ${
                mapLayers.emergencyCorridors
                  ? 'bg-[#52C7D9]/20 border-[#52C7D9] text-[#52C7D9] shadow-xs'
                  : 'bg-[#10171B] border-[#29383A] text-[#91A19B] hover:text-[#F1F5F2] hover:border-[#3D535A]'
              }`}
              title="Toggle priority emergency clearance routes and beacons"
            >
              <Siren className={`w-3.5 h-3.5 ${mapLayers.emergencyCorridors ? 'text-[#52C7D9] animate-bounce' : 'text-[#64736D]'}`} />
              <span className="font-semibold">Emergency Corridors</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  mapLayers.emergencyCorridors ? 'bg-[#52C7D9] text-[#0B0F12]' : 'bg-[#1B292E] text-[#64736D]'
                }`}
              >
                {mapLayers.emergencyCorridors ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Layer Telemetry Strip */}
        {(mapLayers.heatmap || mapLayers.signalStatus || mapLayers.emergencyCorridors) && (
          <div className="px-5 py-2.5 bg-[#10171B] border-b border-[#29383A] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Heatmap Legend */}
            {mapLayers.heatmap && (
              <div className="flex items-center gap-3">
                <span className="text-[#F06464] font-semibold flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Heatmap Legend:
                </span>
                <div className="flex items-center gap-2 text-[11px] text-[#91A19B]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#71D49A]" /> Free Flow (&lt;40%)
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#F2B84B]" /> Moderate (40-80%)
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#F06464]" /> Critical Saturation (&gt;80%)
                  </span>
                </div>
              </div>
            )}

            {/* Signal Status Live Countdown Preview */}
            {mapLayers.signalStatus && !mapLayers.heatmap && (
              <div className="flex items-center gap-3">
                <span className="text-[#71D49A] font-semibold flex items-center gap-1">
                  <Sliders className="w-3 h-3" />
                  Live Phase Timers:
                </span>
                <div className="flex items-center gap-2 text-[11px] text-[#91A19B]">
                  {junctionNodes.map((node) => (
                    <span key={node.id} className="flex items-center gap-1 font-mono">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          node.signalState === 'GREEN'
                            ? 'bg-[#71D49A]'
                            : node.signalState === 'YELLOW'
                            ? 'bg-[#F2B84B]'
                            : 'bg-[#F06464]'
                        }`}
                      />
                      <span className="text-[#F1F5F2] font-bold">{node.id.split('_')[1]}:</span>
                      <span>{node.greenDurationSec}s</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Corridor Active Status */}
            {mapLayers.emergencyCorridors && (
              <div className="flex items-center gap-3">
                <span className="text-[#52C7D9] font-semibold flex items-center gap-1">
                  <Siren className="w-3 h-3" />
                  Priority Route:
                </span>
                <span className="text-[#F1F5F2] text-[11px]">
                  North Expressway (A) → Downtown Hub (B) → Airport Ring (D)
                </span>
                <button
                  onClick={() => onTriggerEmergency('JUNCT_B')}
                  className="px-2 py-0.5 rounded bg-[#F06464]/20 hover:bg-[#F06464]/30 border border-[#F06464]/40 text-[#F06464] text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Clear Corridor Wave
                </button>
              </div>
            )}

            <button
              onClick={() => onNavigate('junctions')}
              className="text-xs text-[#B7F34A] hover:underline flex items-center gap-1 cursor-pointer ml-auto"
            >
              <span>Manage Junctions</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* CityMap Visualization Container */}
        <div className="p-4 bg-[#0B0F12]/80">
          <CityMap
            junctions={junctions}
            onSelectJunction={(id) => onNavigate('junctions')}
            onDispatchEmergency={onTriggerEmergency}
            onUpdateJunctionLoad={onUpdateJunctionLoad}
            activeLayers={mapLayers}
          />
        </div>
      </div>

      {/* 4. ANALYTICS & DISTRIBUTION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Real-time Density Trend Line Chart (7 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
                Density vs Speed Telemetry
              </h3>
              <p className="text-sm font-bold text-[#F1F5F2] mt-0.5">
                Approach Queue Saturation Trends
              </p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-[#91A19B] hover:text-[#F1F5F2] flex items-center gap-1 cursor-pointer"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={densityTrendData}>
                <defs>
                  <linearGradient id="densityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B7F34A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#B7F34A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52C7D9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#52C7D9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64736D" fontSize={10} tickLine={false} />
                <YAxis stroke="#64736D" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10171B',
                    borderColor: '#29383A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F1F5F2',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="density"
                  stroke="#B7F34A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#densityGrad)"
                  name="Density Index %"
                />
                <Area
                  type="monotone"
                  dataKey="speed"
                  stroke="#52C7D9"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#speedGrad)"
                  name="Avg Speed km/h"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#91A19B] pt-2 border-t border-[#29383A]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#B7F34A]" />
                Density Index (%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#52C7D9]" />
                Speed (km/h)
              </span>
            </div>
            <span>Derived from active traffic logs</span>
          </div>
        </div>

        {/* Congestion Distribution Donut (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#151F24] border border-[#29383A] flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
              Network Distribution
            </h3>
            <p className="text-sm font-bold text-[#F1F5F2] mt-0.5">
              Congestion Classification
            </p>
          </div>

          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10171B',
                    borderColor: '#29383A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F1F5F2',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[#91A19B] text-[11px]">{d.name}</span>
                </div>
                <span className="text-[#F1F5F2] font-bold">{d.value} node(s)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. JUNCTION STATUS CARDS + RECENT ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 4 Junction Status Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
              Junction Operating States
            </h3>
            <button
              onClick={() => onNavigate('signal-management')}
              className="text-xs text-[#91A19B] hover:text-[#F1F5F2] flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Signals</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {junctions.map((j) => (
              <div
                key={j.id}
                className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-3 hover:border-[#3D535A] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#B7F34A] block">{j.id}</span>
                    <h4 className="text-xs font-bold text-[#F1F5F2]">{j.name.split(':')[1] || j.name}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      j.signalState === 'GREEN'
                        ? 'text-[#71D49A] bg-[#71D49A]/10 border border-[#71D49A]/30'
                        : j.signalState === 'YELLOW'
                        ? 'text-[#F2B84B] bg-[#F2B84B]/10 border border-[#F2B84B]/30'
                        : 'text-[#F06464] bg-[#F06464]/10 border border-[#F06464]/30'
                    }`}
                  >
                    {j.signalState} ({j.greenDurationSec}s)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#10171B] p-2 rounded-lg border border-[#29383A]">
                  <div>
                    <span className="text-[#64736D] block">Queues N1/N2</span>
                    <span className="text-[#F1F5F2] font-semibold">{j.n1} + {j.n2} veh</span>
                  </div>
                  <div>
                    <span className="text-[#64736D] block">Load Index</span>
                    <span
                      className={`font-semibold ${
                        j.load > 80 ? 'text-[#F06464]' : j.load > 40 ? 'text-[#F2B84B]' : 'text-[#71D49A]'
                      }`}
                    >
                      {j.load.toFixed(1)} / {j.queueThreshold}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateJunctionLoad(j.id, -5)}
                      className="px-2 py-0.5 rounded bg-[#1B292E] hover:bg-[#24353C] text-[#91A19B] hover:text-[#F1F5F2] font-mono text-xs border border-[#29383A] cursor-pointer"
                      title="Reduce vehicles"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => onUpdateJunctionLoad(j.id, 5)}
                      className="px-2 py-0.5 rounded bg-[#1B292E] hover:bg-[#24353C] text-[#91A19B] hover:text-[#F1F5F2] font-mono text-xs border border-[#29383A] cursor-pointer"
                      title="Add vehicles"
                    >
                      +5
                    </button>
                  </div>

                  <button
                    onClick={() => onTriggerEmergency(j.id)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      j.hasEmergencyVehicle
                        ? 'bg-[#F06464] text-white shadow-xs'
                        : 'bg-[#1B292E] text-[#91A19B] hover:text-[#F06464] border border-[#29383A]'
                    }`}
                  >
                    {j.hasEmergencyVehicle ? 'Clear Emergency' : 'Ambulance'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Priority Alerts (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
                Priority Alerts &amp; Incidents
              </h3>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-[#91A19B] hover:text-[#F1F5F2] flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({alerts.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-[#10171B] border border-[#29383A] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-[#F06464]/10 text-[#F06464] border border-[#F06464]/30'
                          : alert.severity === 'HIGH'
                          ? 'bg-[#F2B84B]/10 text-[#F2B84B] border border-[#F2B84B]/30'
                          : 'bg-[#70D6B4]/10 text-[#70D6B4] border border-[#70D6B4]/30'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-mono text-[#64736D]">{alert.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#F1F5F2] font-medium leading-snug">
                    {alert.message}
                  </p>
                  <div className="text-[10px] font-mono text-[#91A19B] flex items-center justify-between pt-1">
                    <span>Target: {alert.junctionId}</span>
                    <span className="text-[#B7F34A]">{alert.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#29383A] flex items-center justify-between text-xs text-[#91A19B]">
            <span>Automated Alert Triage Engine</span>
            <button
              onClick={() => onNavigate('incidents')}
              className="text-[#B7F34A] hover:underline font-semibold cursor-pointer"
            >
              Incident Response Console →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
