/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MapPin,
  Cpu,
  GitCommit,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Terminal,
  Sliders,
  CheckCircle2,
  Map as MapIcon,
  Navigation,
  Activity,
  AlertTriangle,
  Calculator,
  Radio,
  LogOut,
  User,
  Menu,
  X,
  Zap,
  Shield,
  Upload,
  BarChart2,
  Siren,
  Video,
} from 'lucide-react';
import { LoginPortal } from './components/LoginPortal';
import { AdminPortal } from './components/AdminPortal';
import { OperatorPortal } from './components/OperatorPortal';
import { AcademicBackground } from './components/AcademicBackground';
import { CityMap } from './components/CityMap';
import { JunctionGrid } from './components/JunctionGrid';
import { CoreArchitecture } from './components/CoreArchitecture';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { MesiMonitor } from './components/MesiMonitor';
import { AluBoothVisualizer } from './components/AluBoothVisualizer';
import { SystemLogDrawer } from './components/SystemLogDrawer';
import { UserRole, JunctionData, SimulationLogEntry } from './types';
import { INITIAL_JUNCTIONS } from './data/mockData';

export default function App() {
  // Navigation active tab - Defaults to the visual Interactive City Map
  const [activeTab, setActiveTab] = useState<
    'map' | 'junctions' | 'architecture' | 'pipeline' | 'mesi' | 'alu' | 'workbench' | 'admin'
  >('map');

  // Standalone Login Portal State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('Traffic Control Operator');

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // System Cycle Counter
  const [simulationClockCycle, setSimulationClockCycle] = useState<number>(42);

  // Junctions State (Shared single-source-of-truth across network)
  const [junctions, setJunctions] = useState<JunctionData[]>(INITIAL_JUNCTIONS);

  // Simulation Running State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Simulation Logs
  const [logs, setLogs] = useState<SimulationLogEntry[]>([
    {
      id: 'log-1',
      timestamp: '10:17:15',
      cycle: 39,
      subsystem: 'CORE_MIMD',
      level: 'INFO',
      message: 'MetroPulse Network initialized: 4 Processing Cores partitioned across municipal traffic sectors.',
    },
    {
      id: 'log-2',
      timestamp: '10:17:18',
      cycle: 40,
      subsystem: 'MESI_BUS',
      level: 'SUCCESS',
      message: 'MESI Snooping Bus operational. Shared line 0x0A40 synchronized across Core 0 and Core 1.',
    },
    {
      id: 'log-3',
      timestamp: '10:17:21',
      cycle: 41,
      subsystem: 'PIPELINE',
      level: 'INFO',
      message: '4-Stage Pipeline (IF -> ID -> EX -> WB) active. Data forwarding bypass circuits enabled.',
    },
    {
      id: 'log-4',
      timestamp: '10:17:23',
      cycle: 42,
      subsystem: 'TRAFFIC_GRID',
      level: 'WARN',
      message: 'Junction D queue crossed threshold (L=118.4 > 80). Priority green wave dispatched.',
    },
  ]);

  const addLog = (
    message: string,
    subsystem: SimulationLogEntry['subsystem'] = 'CORE_MIMD',
    level: SimulationLogEntry['level'] = 'INFO'
  ) => {
    const newEntry: SimulationLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      cycle: simulationClockCycle + 1,
      subsystem,
      level,
      message,
    };
    setSimulationClockCycle((prev) => prev + 1);
    setLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
  };

  const handleUpdateJunction = (id: string, updates: Partial<JunctionData>) => {
    setJunctions((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
    );
    addLog(`Parameters adjusted for node ${id}: ${JSON.stringify(updates)}`, 'TRAFFIC_GRID', 'INFO');
  };

  const handleUpdateJunctionLoad = (id: string, delta: number) => {
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const newN1 = Math.max(2, j.n1 + Math.round(delta / 2));
          const newLoad = (newN1 + j.n2) * j.w;
          const newStatus = newLoad > 80 ? 'Congested' : newLoad >= 40 ? 'Moderate' : 'Free Flow';
          return {
            ...j,
            n1: newN1,
            load: newLoad,
            status: newStatus,
          };
        }
        return j;
      })
    );
    addLog(`Density updated at ${id} (delta: ${delta > 0 ? '+' : ''}${delta})`, 'TRAFFIC_GRID', 'INFO');
  };

  const handleResetDefaults = () => {
    setJunctions(INITIAL_JUNCTIONS);
    addLog('Reset all traffic junctions to baseline configuration.', 'TRAFFIC_GRID', 'INFO');
  };

  const handleApplyScenario = (scenario: 'rush' | 'flow' | 'emergency' | 'balanced') => {
    if (scenario === 'rush') {
      setJunctions([
        { ...junctions[0], n1: 45, n2: 40, w: 1.5, load: 127.5, status: 'Congested', greenDurationSec: 85 },
        { ...junctions[1], n1: 50, n2: 48, w: 1.6, load: 156.8, status: 'Congested', greenDurationSec: 95 },
        { ...junctions[2], n1: 38, n2: 35, w: 1.2, load: 87.6, status: 'Congested', greenDurationSec: 70 },
        { ...junctions[3], n1: 52, n2: 55, w: 1.8, load: 192.6, status: 'Congested', greenDurationSec: 100 },
      ]);
      addLog('Applied Scenario: [Peak Rush] - Elevated densities, multi-core load balancing active.', 'TRAFFIC_GRID', 'HAZARD');
    } else if (scenario === 'flow') {
      setJunctions([
        { ...junctions[0], n1: 10, n2: 12, w: 1.0, load: 22.0, status: 'Free Flow', greenDurationSec: 30 },
        { ...junctions[1], n1: 14, n2: 11, w: 1.0, load: 25.0, status: 'Free Flow', greenDurationSec: 30 },
        { ...junctions[2], n1: 12, n2: 15, w: 1.0, load: 27.0, status: 'Free Flow', greenDurationSec: 30 },
        { ...junctions[3], n1: 15, n2: 14, w: 1.0, load: 29.0, status: 'Free Flow', greenDurationSec: 30 },
      ]);
      addLog('Applied Scenario: [Free Flow] - Minimal queue depths, zero pipeline stalls.', 'TRAFFIC_GRID', 'SUCCESS');
    } else if (scenario === 'emergency') {
      handleTriggerEmergency('JUNCT_B');
    } else if (scenario === 'balanced') {
      setJunctions([
        { ...junctions[0], n1: 25, n2: 25, w: 1.2, load: 60.0, status: 'Moderate', greenDurationSec: 55 },
        { ...junctions[1], n1: 25, n2: 25, w: 1.2, load: 60.0, status: 'Moderate', greenDurationSec: 55 },
        { ...junctions[2], n1: 25, n2: 25, w: 1.2, load: 60.0, status: 'Moderate', greenDurationSec: 55 },
        { ...junctions[3], n1: 25, n2: 25, w: 1.2, load: 60.0, status: 'Moderate', greenDurationSec: 55 },
      ]);
      addLog('Applied Scenario: [Balanced Load] - Symmetrical vehicle distribution.', 'TRAFFIC_GRID', 'INFO');
    }
  };

  const handleTriggerEmergency = (id: string) => {
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const newState = !j.hasEmergencyVehicle;
          return {
            ...j,
            hasEmergencyVehicle: newState,
            signalState: newState ? 'GREEN' : j.signalState,
            greenDurationSec: newState ? 120 : j.greenDurationSec,
          };
        }
        return j;
      })
    );
    addLog(
      `Priority Emergency Clearance override at ${id}. Broadcasted cache line invalidation and forced green.`,
      'CONTROL_UNIT',
      'HAZARD'
    );
  };

  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    addLog('Executing dynamic signal recalculation cycle across parallel cores...', 'CORE_MIMD', 'INFO');

    setTimeout(() => {
      addLog('Step 1: Ingesting sensor density vectors into L1 cache lines...', 'CORE_MIMD', 'INFO');
    }, 400);

    setTimeout(() => {
      addLog('Step 2: Pipelined arithmetic evaluation L = (N1 + N2) * W completed.', 'PIPELINE', 'SUCCESS');
    }, 900);

    setTimeout(() => {
      const congestedJunction = junctions.find((j) => j.load > 80);
      if (congestedJunction) {
        addLog(
          `Step 3: Hazard resolution: Peak load at ${congestedJunction.name}. Data forwarding applied.`,
          'PIPELINE',
          'WARN'
        );
      } else {
        addLog('Step 3: No hazards detected. Uniform throughput maintained.', 'PIPELINE', 'SUCCESS');
      }
    }, 1400);

    setTimeout(() => {
      addLog('Step 4: MESI Snooping Bus verified: Cache coherency synchronized across all cores.', 'MESI_BUS', 'SUCCESS');
      setIsSimulating(false);
      addLog('Cycle complete. Signals synchronized.', 'CORE_MIMD', 'SUCCESS');
    }, 1900);
  };

  const navItems = [
    {
      id: 'map' as const,
      label: 'Interactive City Map & CCTV',
      category: 'Visual Traffic Models',
      icon: <MapIcon className="w-4 h-4" />,
    },
    {
      id: 'junctions' as const,
      label: 'Signal Controllers & Grid',
      category: 'Visual Traffic Models',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: 'architecture' as const,
      label: 'Multi-Core MIMD Architecture',
      category: 'Hardware Models',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'pipeline' as const,
      label: '4-Stage Instruction Pipeline',
      category: 'Hardware Models',
      icon: <GitCommit className="w-4 h-4" />,
    },
    {
      id: 'mesi' as const,
      label: 'MESI Cache Coherence',
      category: 'Hardware Models',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'alu' as const,
      label: 'ALU Booth Multiplier',
      category: 'Hardware Models',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      id: 'workbench' as const,
      label: 'Dataset Ingestion & Proportional Timing',
      category: 'Smart Algorithms',
      icon: <Upload className="w-4 h-4" />,
    },
    {
      id: 'admin' as const,
      label: 'Command Admin & Analytics',
      category: 'Management',
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  // 1. Standalone External Login Portal Screen
  if (!isAuthenticated) {
    return (
      <LoginPortal
        initialRole={currentRole}
        onLogin={(role) => {
          setCurrentRole(role);
          setIsAuthenticated(true);
          if (role === 'System Administrator') {
            setActiveTab('admin');
          } else {
            setActiveTab('map');
          }
          addLog(`Session authenticated for role: ${role}.`, 'TRAFFIC_GRID', 'SUCCESS');
        }}
      />
    );
  }

  // 2. Full Admin Portal View if selected
  if (activeTab === 'admin') {
    return (
      <div className="relative min-h-screen bg-[#100D18]">
        <AcademicBackground />
        <AdminPortal
          currentRole={currentRole}
          junctions={junctions}
          onSwitchRole={(role) => {
            setCurrentRole(role);
            if (role === 'Traffic Control Operator') setActiveTab('map');
          }}
          onLogout={() => setIsAuthenticated(false)}
          onRunSimulation={handleRunSimulation}
          isSimulating={isSimulating}
          onTriggerEmergency={handleTriggerEmergency}
          onUpdateJunctionLoad={handleUpdateJunctionLoad}
        />
      </div>
    );
  }

  const totalVehicles = junctions.reduce((acc, j) => acc + j.n1 + j.n2, 0);
  const congestedCount = junctions.filter((j) => j.status === 'Congested').length;

  return (
    <div className="min-h-screen bg-[#100D18] text-[#F5F3FA] flex font-sans selection:bg-[#4D91E8]/30 selection:text-[#F5F3FA] relative overflow-hidden">
      {/* Decorative Traffic Vector Background */}
      <AcademicBackground />

      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Professional Examos Sidebar Navigation */}
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
                <Radio className="w-4 h-4 text-[#4D91E8]" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#F5F3FA] tracking-tight">MetroPulse</h1>
              <p className="text-[11px] text-[#A9A0BC]">Traffic OS</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1 rounded-lg text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29] lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Group 1: Visual Traffic Models */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Visual Traffic Models
            </div>
            <nav className="space-y-1">
              {navItems
                .filter((item) => item.category === 'Visual Traffic Models')
                .map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                          : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                      }`}
                    >
                      <span className={isActive ? 'text-[#35B99B]' : 'text-[#A9A0BC]'}>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#35B99B]" />}
                    </button>
                  );
                })}
            </nav>
          </div>

          {/* Group 2: Hardware Architecture */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Hardware Architecture
            </div>
            <nav className="space-y-1">
              {navItems
                .filter((item) => item.category === 'Hardware Models')
                .map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                          : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                      }`}
                    >
                      <span className={isActive ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#4D91E8]" />}
                    </button>
                  );
                })}
            </nav>
          </div>

          {/* Group 3: Smart Algorithms & Admin */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#A9A0BC] uppercase tracking-wider">
              Optimization &amp; Command
            </div>
            <nav className="space-y-1">
              {navItems
                .filter((item) => item.category === 'Smart Algorithms' || item.category === 'Management')
                .map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#201B29] text-[#F5F3FA] font-semibold border border-[#393044] shadow-xs'
                          : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/60'
                      }`}
                    >
                      <span className={isActive ? 'text-[#35B99B]' : 'text-[#A9A0BC]'}>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#35B99B]" />}
                    </button>
                  );
                })}
            </nav>
          </div>
        </div>

        {/* Profile / Logout Widget */}
        <div className="p-3 border-t border-[#393044]">
          <div className="p-2.5 rounded-xl bg-[#201B29] border border-[#393044] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#191522] border border-[#393044] flex items-center justify-center text-[#4D91E8] shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#F5F3FA] truncate">{currentRole}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#35B99B]" />
                  <span className="text-[10px] text-[#A9A0BC] truncate">Active Session</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                addLog('Session locked. Returned to Login Portal.', 'TRAFFIC_GRID', 'INFO');
              }}
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
                {navItems.find((n) => n.id === activeTab)?.label || 'Overview'}
              </h2>
              <p className="text-xs text-[#A9A0BC] hidden sm:block">
                Municipal traffic control &amp; parallel processing architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Priority Emergency Dispatch */}
            <button
              onClick={() => handleTriggerEmergency('JUNCT_B')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3A1C24] hover:bg-[#4E212B] text-xs font-semibold text-[#E55353] border border-[#5E2734] transition-colors cursor-pointer"
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Priority Override</span>
            </button>

            {/* Cycle Counter Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-[#201B29] border border-[#393044] text-xs font-mono text-[#A9A0BC] hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#35B99B] animate-pulse" />
              <span>Cycle #{simulationClockCycle}</span>
            </div>

            {/* Run Signal Cycle CTA */}
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#4D91E8] to-[#35B99B] hover:opacity-90 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Processing...' : 'Run Cycle'}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-4 lg:p-8 space-y-6">
          {/* Top 4 Overview Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-medium text-[#A9A0BC] block uppercase tracking-wider">
                  Active Traffic
                </span>
                <span className="text-xl font-bold text-[#F5F3FA] mt-0.5 block tabular-nums">
                  {totalVehicles} <span className="text-xs font-normal text-[#A9A0BC]">units</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#191522] border border-[#393044] flex items-center justify-center text-[#4D91E8]">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-medium text-[#A9A0BC] block uppercase tracking-wider">
                  Congestion Points
                </span>
                <span
                  className={`text-xl font-bold mt-0.5 block tabular-nums ${
                    congestedCount > 0 ? 'text-[#E5A84D]' : 'text-[#35B99B]'
                  }`}
                >
                  {congestedCount} <span className="text-xs font-normal text-[#A9A0BC]">junctions</span>
                </span>
              </div>
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  congestedCount > 0
                    ? 'bg-[#E5A84D]/10 text-[#E5A84D] border-[#E5A84D]/30'
                    : 'bg-[#191522] text-[#35B99B] border-[#393044]'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-medium text-[#A9A0BC] block uppercase tracking-wider">
                  MIMD Throughput
                </span>
                <span className="text-xl font-bold text-[#F5F3FA] mt-0.5 block tabular-nums">
                  2.50× <span className="text-xs font-normal text-[#A9A0BC]">Amdahl</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#191522] border border-[#393044] flex items-center justify-center text-[#4D91E8]">
                <Cpu className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-medium text-[#A9A0BC] block uppercase tracking-wider">
                  Signal Coordination
                </span>
                <span className="text-xl font-bold text-[#35B99B] mt-0.5 block">
                  Adaptive
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#35B99B]/10 border border-[#35B99B]/30 flex items-center justify-center text-[#35B99B]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Active View Module Rendering */}
          <section className="relative">
            {/* 1. Interactive SVG City Map with Moving Cars & CCTV Cameras */}
            {activeTab === 'map' && (
              <CityMap
                junctions={junctions}
                onSelectJunction={(id) => {
                  addLog(`Selected map junction: ${id}`, 'TRAFFIC_GRID', 'INFO');
                }}
                onDispatchEmergency={handleTriggerEmergency}
                onUpdateJunctionLoad={handleUpdateJunctionLoad}
              />
            )}

            {/* 2. Signal Controllers & Physical Grid */}
            {activeTab === 'junctions' && (
              <JunctionGrid
                junctions={junctions}
                onUpdateJunction={handleUpdateJunction}
                onResetDefaults={handleResetDefaults}
                onApplyScenario={handleApplyScenario}
                onTriggerEmergency={handleTriggerEmergency}
              />
            )}

            {/* 3. Multi-Core MIMD Architecture Die & Amdahl Heatmap */}
            {activeTab === 'architecture' && (
              <CoreArchitecture
                junctions={junctions}
                currentCycle={simulationClockCycle}
                onUpdateJunctionLoad={handleUpdateJunctionLoad}
                onApplyScenario={handleApplyScenario}
              />
            )}

            {/* 4. 4-Stage Instruction Pipeline & RAW Forwarding */}
            {activeTab === 'pipeline' && (
              <PipelineVisualizer
                onLogEvent={(msg, level) => addLog(msg, 'PIPELINE', level as any)}
              />
            )}

            {/* 5. MESI Cache Coherence Protocol Snooper */}
            {activeTab === 'mesi' && (
              <MesiMonitor
                onLogEvent={(msg, level) => addLog(msg, 'MESI_BUS', level as any)}
              />
            )}

            {/* 6. ALU Booth Multiplier Stepper & IEEE-754 Floats */}
            {activeTab === 'alu' && (
              <AluBoothVisualizer junctions={junctions} />
            )}

            {/* 7. Operator Workbench (CSV Datasets, Density Index & Proportional Allocation) */}
            {activeTab === 'workbench' && (
              <OperatorPortal
                currentRole={currentRole}
                junctions={junctions}
                onSwitchRole={(role) => setCurrentRole(role)}
                onLogout={() => setIsAuthenticated(false)}
                onRunSimulation={handleRunSimulation}
                isSimulating={isSimulating}
                onTriggerEmergency={handleTriggerEmergency}
                onUpdateJunctionLoad={handleUpdateJunctionLoad}
              />
            )}
          </section>
        </main>

        {/* Real-time Hardware Console Drawer (Positioned safely within main flow, default collapsed) */}
        <SystemLogDrawer
          logs={logs}
          onClearLogs={() => setLogs([])}
        />
      </div>
    </div>
  );
}
