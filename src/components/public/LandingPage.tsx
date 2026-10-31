import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Shield,
  Radio,
  Sliders,
  Cpu,
  Layers,
  MapPin,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Flame,
  Zap,
  Globe2,
  Database,
  Lock,
} from 'lucide-react';
import { PublicRoute, JunctionData } from '../../types';

interface LandingPageProps {
  currentPublicRoute: PublicRoute;
  onNavigatePublic: (route: PublicRoute) => void;
  onLaunchDashboard: () => void;
  junctions: JunctionData[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentPublicRoute,
  onNavigatePublic,
  onLaunchDashboard,
  junctions,
}) => {
  const [activePreviewJunction, setActivePreviewJunction] = useState<string>('JUNCT_B');

  const selectedJunction = junctions.find((j) => j.id === activePreviewJunction) || junctions[0];

  return (
    <div className="min-h-screen bg-[#0B0F12] text-[#F1F5F2] flex flex-col font-sans selection:bg-[#B7F34A]/30 selection:text-[#F1F5F2] relative">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0B0F12]/90 backdrop-blur-md border-b border-[#29383A] px-4 lg:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Product Name */}
          <div 
            onClick={() => onNavigatePublic('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#151F24] border border-[#29383A] flex items-center justify-center text-[#B7F34A] group-hover:border-[#B7F34A]/40 transition-colors shadow-xs">
              <Radio className="w-4 h-4 text-[#B7F34A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-[#F1F5F2]">URBAN PULSE</span>
                <span className="text-[10px] font-mono font-medium text-[#B7F34A] uppercase tracking-wider bg-[#B7F34A]/10 px-1.5 py-0.5 rounded border border-[#B7F34A]/20">
                  NEON GRID
                </span>
              </div>
              <p className="text-[11px] text-[#91A19B]">Smart Traffic Intelligence</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#91A19B]">
            <button
              onClick={() => onNavigatePublic('home')}
              className={`hover:text-[#F1F5F2] transition-colors cursor-pointer ${
                currentPublicRoute === 'home' ? 'text-[#B7F34A] font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigatePublic('features')}
              className={`hover:text-[#F1F5F2] transition-colors cursor-pointer ${
                currentPublicRoute === 'features' ? 'text-[#B7F34A] font-semibold' : ''
              }`}
            >
              Features
            </button>
            <button
              onClick={() => onNavigatePublic('how-it-works')}
              className={`hover:text-[#F1F5F2] transition-colors cursor-pointer ${
                currentPublicRoute === 'how-it-works' ? 'text-[#B7F34A] font-semibold' : ''
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigatePublic('about')}
              className={`hover:text-[#F1F5F2] transition-colors cursor-pointer ${
                currentPublicRoute === 'about' ? 'text-[#B7F34A] font-semibold' : ''
              }`}
            >
              About
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigatePublic('login')}
              className="px-3.5 py-1.5 text-xs font-medium text-[#91A19B] hover:text-[#F1F5F2] hover:bg-[#151F24] rounded-lg transition-colors cursor-pointer"
            >
              Operator Login
            </button>
            <button
              onClick={onLaunchDashboard}
              className="neon-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Public Content */}
      <main className="flex-1">
        {currentPublicRoute === 'home' && (
          <div>
            {/* HERO SECTION */}
            <section className="relative px-4 lg:px-12 pt-16 pb-20 max-w-7xl mx-auto">
              <div className="text-center max-w-3xl mx-auto space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151F24] border border-[#29383A] text-[11px] text-[#B7F34A] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B7F34A] animate-pulse" />
                  MUNICIPAL TRAFFIC INTELLIGENCE PLATFORM
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#F1F5F2] tracking-tight leading-[1.12]">
                  Make Every Intersection <span className="text-[#B7F34A]">Smarter.</span>
                </h1>

                <p className="text-base md:text-lg text-[#91A19B] max-w-2xl mx-auto leading-relaxed">
                  Understand traffic patterns, monitor congestion and make intelligent signal-timing decisions with a unified traffic intelligence platform.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
                  <button
                    onClick={onLaunchDashboard}
                    className="neon-btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Explore Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigatePublic('signup')}
                    className="neon-btn-secondary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <span>Get Started</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-6 pt-4 text-xs text-[#64736D] font-mono">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#B7F34A]" />
                    Real-Time Density Models
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#70D6B4]" />
                    Webster's Delay Solvers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#52C7D9]" />
                    Sub-second Incident Triaging
                  </span>
                </div>
              </div>

              {/* REALISTIC LIVE PRODUCT PREVIEW */}
              <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-[#151F24] border border-[#29383A] shadow-2xl overflow-hidden">
                {/* Preview Window Header */}
                <div className="bg-[#10171B] px-4 py-3 border-b border-[#29383A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F06464]/80" />
                    <span className="w-3 h-3 rounded-full bg-[#F2B84B]/80" />
                    <span className="w-3 h-3 rounded-full bg-[#71D49A]/80" />
                    <span className="ml-3 text-xs font-mono text-[#91A19B]">
                      urbanpulse.console/live-grid/metro-core
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#91A19B]">
                    <span className="flex items-center gap-1 font-mono text-[#B7F34A]">
                      <span className="w-2 h-2 rounded-full bg-[#B7F34A] animate-ping" />
                      LIVE TELEMETRY
                    </span>
                    <button
                      onClick={onLaunchDashboard}
                      className="text-xs text-[#B7F34A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Console</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Preview Dashboard Content */}
                <div className="p-6 bg-[#0B0F12]/60 space-y-6">
                  {/* Top Metric Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A]">
                      <div className="text-[11px] text-[#91A19B] uppercase font-mono">Total Vehicles</div>
                      <div className="text-xl font-bold text-[#F1F5F2] mt-0.5 tabular-nums">
                        {junctions.reduce((a, b) => a + b.n1 + b.n2, 0)} units
                      </div>
                      <div className="text-[10px] text-[#70D6B4] mt-1">Across 4 Sectors</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A]">
                      <div className="text-[11px] text-[#91A19B] uppercase font-mono">Active Nodes</div>
                      <div className="text-xl font-bold text-[#F1F5F2] mt-0.5 tabular-nums">
                        {junctions.length} Junctions
                      </div>
                      <div className="text-[10px] text-[#B7F34A] mt-1">100% Operational</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A]">
                      <div className="text-[11px] text-[#91A19B] uppercase font-mono">Congestion Points</div>
                      <div className="text-xl font-bold text-[#F2B84B] mt-0.5 tabular-nums">
                        {junctions.filter((j) => j.status === 'Congested').length} Critical
                      </div>
                      <div className="text-[10px] text-[#F2B84B] mt-1">Dynamic Timing Active</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#151F24] border border-[#29383A]">
                      <div className="text-[11px] text-[#91A19B] uppercase font-mono">Clearance Index</div>
                      <div className="text-xl font-bold text-[#B7F34A] mt-0.5 tabular-nums">
                        94.2%
                      </div>
                      <div className="text-[10px] text-[#70D6B4] mt-1">+6.4% Efficiency</div>
                    </div>
                  </div>

                  {/* Split Panel: Interactive Junction Picker + Approach Telemetry */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left: Junction list */}
                    <div className="md:col-span-5 space-y-2">
                      <div className="text-xs font-mono text-[#91A19B] uppercase tracking-wider mb-2">
                        Monitored Intersections
                      </div>
                      {junctions.map((j) => {
                        const isSelected = j.id === activePreviewJunction;
                        return (
                          <div
                            key={j.id}
                            onClick={() => setActivePreviewJunction(j.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1B292E] border-[#B7F34A]/50 text-[#F1F5F2]'
                                : 'bg-[#151F24] border-[#29383A] text-[#91A19B] hover:border-[#3D535A]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#F1F5F2]">{j.name}</span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                  j.status === 'Congested'
                                    ? 'bg-[#F06464]/10 text-[#F06464] border border-[#F06464]/20'
                                    : j.status === 'Moderate'
                                    ? 'bg-[#F2B84B]/10 text-[#F2B84B] border border-[#F2B84B]/20'
                                    : 'bg-[#71D49A]/10 text-[#71D49A] border border-[#71D49A]/20'
                                }`}
                              >
                                {j.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] mt-2 font-mono text-[#64736D]">
                              <span>Approaches: {j.n1 + j.n2} vehicles</span>
                              <span>Load L: {j.load.toFixed(1)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right: Selected Node Telemetry & Webster Split Preview */}
                    <div className="md:col-span-7 p-4 rounded-xl bg-[#151F24] border border-[#29383A] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-[#29383A] pb-3 mb-3">
                          <div>
                            <span className="text-xs font-mono text-[#B7F34A]">{selectedJunction.id}</span>
                            <h4 className="text-sm font-bold text-[#F1F5F2]">{selectedJunction.name}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-[#91A19B]">Signal State:</span>
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                selectedJunction.signalState === 'GREEN'
                                  ? 'text-[#71D49A] bg-[#71D49A]/10 border border-[#71D49A]/30'
                                  : selectedJunction.signalState === 'YELLOW'
                                  ? 'text-[#F2B84B] bg-[#F2B84B]/10 border border-[#F2B84B]/30'
                                  : 'text-[#F06464] bg-[#F06464]/10 border border-[#F06464]/30'
                              }`}
                            >
                              {selectedJunction.signalState}
                            </span>
                          </div>
                        </div>

                        {/* Approach Queue Progress Bars */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs font-mono mb-1">
                              <span className="text-[#91A19B]">Approach 1 (Primary Arterial)</span>
                              <span className="text-[#F1F5F2] font-bold">{selectedJunction.n1} vehicles</span>
                            </div>
                            <div className="h-2 w-full bg-[#10171B] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#B7F34A] transition-all duration-300"
                                style={{ width: `${Math.min(100, (selectedJunction.n1 / 50) * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-mono mb-1">
                              <span className="text-[#91A19B]">Approach 2 (Secondary Crossway)</span>
                              <span className="text-[#F1F5F2] font-bold">{selectedJunction.n2} vehicles</span>
                            </div>
                            <div className="h-2 w-full bg-[#10171B] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#52C7D9] transition-all duration-300"
                                style={{ width: `${Math.min(100, (selectedJunction.n2 / 50) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Webster's Calculation Split */}
                        <div className="mt-4 p-3 rounded-lg bg-[#10171B] border border-[#29383A] text-xs font-mono">
                          <div className="text-[11px] text-[#B7F34A] mb-1">Webster's Delay Optimization Model</div>
                          <div className="text-[#91A19B]">
                            Calculated Cycle Time: <span className="text-[#F1F5F2] font-bold">{selectedJunction.greenDurationSec + 30}s</span> | Optimal Green Split: <span className="text-[#B7F34A] font-bold">{selectedJunction.greenDurationSec}s</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#29383A] flex items-center justify-between">
                        <span className="text-[11px] text-[#64736D] font-mono">
                          Weight Coeff: {selectedJunction.w.toFixed(1)}x
                        </span>
                        <button
                          onClick={onLaunchDashboard}
                          className="text-xs font-semibold text-[#B7F34A] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Full Junction Monitor</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PRODUCT CAPABILITIES GRID */}
            <section className="px-4 lg:px-12 py-16 max-w-7xl mx-auto border-t border-[#29383A]/60">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
                  Core Architecture
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-[#F1F5F2] mt-1">
                  Engineered for Municipal Operations
                </h2>
                <p className="text-sm text-[#91A19B] mt-2">
                  High-throughput traffic intelligence without opaque black boxes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] hover:border-[#B7F34A]/30 transition-all space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B292E] border border-[#29383A] flex items-center justify-center text-[#B7F34A]">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F1F5F2]">Adaptive Signal Timing</h3>
                  <p className="text-xs text-[#91A19B] leading-relaxed">
                    Dynamically recalculate green splits using proven traffic flow equations. Eliminate unnecessary idle waiting at empty approaches.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] hover:border-[#70D6B4]/30 transition-all space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B292E] border border-[#29383A] flex items-center justify-center text-[#70D6B4]">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F1F5F2]">Emergency Priority Green Wave</h3>
                  <p className="text-xs text-[#91A19B] leading-relaxed">
                    Instantly clear critical transit and emergency response corridors through automated signal overrides with cache line invalidation.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] hover:border-[#52C7D9]/30 transition-all space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B292E] border border-[#29383A] flex items-center justify-center text-[#52C7D9]">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#F1F5F2]">Longitudinal Analytics</h3>
                  <p className="text-xs text-[#91A19B] leading-relaxed">
                    Inspect congestion frequency, capacity utilization, speed degradation, and historical bottlenecks to plan infrastructure investments.
                  </p>
                </div>
              </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="px-4 lg:px-12 py-16 max-w-5xl mx-auto text-center space-y-5">
              <h2 className="text-3xl font-extrabold text-[#F1F5F2]">
                Ready to Upgrade Municipal Traffic Operations?
              </h2>
              <p className="text-sm text-[#91A19B] max-w-xl mx-auto">
                Launch the interactive Urban Pulse control dashboard to monitor junctions, evaluate signal splits, and inspect congestion patterns.
              </p>
              <div className="pt-2">
                <button
                  onClick={onLaunchDashboard}
                  className="neon-btn-primary px-7 py-3.5 rounded-xl text-sm font-semibold shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Launch Operations Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* FEATURES VIEW */}
        {currentPublicRoute === 'features' && (
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-16 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">Features</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#F1F5F2]">
                Unified Traffic Intelligence Engine
              </h1>
              <p className="text-sm text-[#91A19B] max-w-xl mx-auto">
                Explore the modular subsystems that empower traffic engineers and control operators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B292E] flex items-center justify-center text-[#B7F34A]">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#F1F5F2]">Sub-Second Junction Telemetry</h3>
                <p className="text-xs text-[#91A19B] leading-relaxed">
                  Continuously monitors queue depths across primary and secondary approaches. Automatically calculates approach load using weighted vehicle factor equations.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B292E] flex items-center justify-center text-[#70D6B4]">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#F1F5F2]">Adaptive Signal Reallocation</h3>
                <p className="text-xs text-[#91A19B] leading-relaxed">
                  Generates mathematically verified green duration recommendations to minimize vehicle delay. Compares fixed cycle times with load-proportional splits.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B292E] flex items-center justify-center text-[#52C7D9]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#F1F5F2]">Incident & Hazard Triage</h3>
                <p className="text-xs text-[#91A19B] leading-relaxed">
                  Automated alert propagation when approach densities exceed 80% or vehicle speeds degrade below threshold limits. Supports manual acknowledgement and resolution.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B292E] flex items-center justify-center text-[#F2B84B]">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#F1F5F2]">Dataset Ingestion & Validation</h3>
                <p className="text-xs text-[#91A19B] leading-relaxed">
                  Import municipal traffic CSV datasets, test peak rush versus free-flow conditions, and validate schema integrity before applying signal modifications.
                </p>
              </div>
            </div>

            <div className="text-center pt-6">
              <button
                onClick={onLaunchDashboard}
                className="neon-btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Interactive Platform</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* HOW IT WORKS VIEW */}
        {currentPublicRoute === 'how-it-works' && (
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-16 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">Operational Pipeline</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#F1F5F2]">
                How Urban Pulse Works
              </h1>
              <p className="text-sm text-[#91A19B] max-w-xl mx-auto">
                From dataset input to adaptive signal recommendations, every step is mathematically rigorous.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#10171B] border border-[#29383A] flex items-center justify-center font-mono text-base font-bold text-[#B7F34A] shrink-0">
                  01
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F1F5F2]">Vector Ingestion & Approach Preprocessing</h3>
                  <p className="text-xs text-[#91A19B] mt-1 leading-relaxed">
                    Traffic sensor readings or dataset records provide vehicle counts ($N_1, N_2$), lane capacities ($C_L$), and average speeds across each intersection approach.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#10171B] border border-[#29383A] flex items-center justify-center font-mono text-base font-bold text-[#70D6B4] shrink-0">
                  02
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F1F5F2]">Load Evaluation &amp; Congestion Classification</h3>
                  <p className="text-xs text-[#91A19B] mt-1 leading-relaxed">
                    Total load L = (N1 + N2) × W is calculated with vehicle weight coefficients. Nodes with L &gt; 80 are flagged as Congested, triggering priority recalculations.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#10171B] border border-[#29383A] flex items-center justify-center font-mono text-base font-bold text-[#52C7D9] shrink-0">
                  03
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F1F5F2]">Webster Delay Minimization Optimization</h3>
                  <p className="text-xs text-[#91A19B] mt-1 leading-relaxed">
                    Optimal cycle length C0 = (1.5L + 5) / (1 - Y) allocates green splits proportionally to critical approach flow ratios, reducing overall queue delays.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#10171B] border border-[#29383A] flex items-center justify-center font-mono text-base font-bold text-[#F2B84B] shrink-0">
                  04
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F1F5F2]">Coordinated Corridor Synchronization</h3>
                  <p className="text-xs text-[#91A19B] mt-1 leading-relaxed">
                    Signal timings across consecutive intersections are synchronized to establish green waves along major arterial avenues, reducing stop-and-go emissions.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={onLaunchDashboard}
                className="neon-btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Try It Live In The Operations Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ABOUT VIEW */}
        {currentPublicRoute === 'about' && (
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16 space-y-10">
            <div className="text-center space-y-3">
              <span className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">Mission</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#F1F5F2]">
                About Urban Pulse
              </h1>
              <p className="text-sm text-[#91A19B] max-w-xl mx-auto">
                Modernizing municipal mobility with responsive intelligence and transparent operations.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4 text-xs md:text-sm text-[#91A19B] leading-relaxed">
              <p>
                Urban Pulse is an intelligent traffic processing and decision support platform engineered for municipal transit departments, traffic control centers, and urban planners.
              </p>
              <p>
                Traditional municipal signal systems rely on rigid, time-of-day clock tables that fail when unexpected congestion surges or emergency vehicles approach. Urban Pulse evaluates real-time queue densities and dynamically solves for optimal green splits.
              </p>
              <div className="p-4 rounded-xl bg-[#10171B] border border-[#29383A] text-xs font-mono text-[#70D6B4] space-y-1">
                <div>DATA INTEGRITY &amp; OPERATIONAL TRANSPARENCY:</div>
                <div className="text-[#91A19B]">
                  Urban Pulse operates on dataset inputs and simulation models for training, evaluation, and operations prototyping. It does not fabricate live physical sensor feeds.
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={onLaunchDashboard}
                className="neon-btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Access Operations Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modern Professional Footer */}
      <footer className="border-t border-[#29383A] bg-[#0B0F12] px-4 lg:px-12 py-8 mt-12 text-xs text-[#64736D]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#B7F34A]" />
            <span className="font-bold text-[#F1F5F2]">URBAN PULSE</span>
            <span>·</span>
            <span className="font-mono text-[#91A19B]">NEON GRID v2.5</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <button onClick={() => onNavigatePublic('features')} className="hover:text-[#F1F5F2] cursor-pointer">
              Features
            </button>
            <button onClick={() => onNavigatePublic('how-it-works')} className="hover:text-[#F1F5F2] cursor-pointer">
              How It Works
            </button>
            <button onClick={() => onNavigatePublic('about')} className="hover:text-[#F1F5F2] cursor-pointer">
              About
            </button>
            <button onClick={() => onNavigatePublic('login')} className="hover:text-[#F1F5F2] cursor-pointer">
              Login
            </button>
          </div>

          <div className="font-mono text-[11px] text-[#64736D]">
            Smart City Traffic Intelligence Platform
          </div>
        </div>
      </footer>
    </div>
  );
};
