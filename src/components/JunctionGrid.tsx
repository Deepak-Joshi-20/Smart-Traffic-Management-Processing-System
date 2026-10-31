/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Car,
  AlertTriangle,
  Siren,
  Sliders,
  RefreshCw,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  UserCheck,
  Calculator,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
} from 'lucide-react';
import { JunctionData, TrafficStatus } from '../types';

interface JunctionGridProps {
  junctions: JunctionData[];
  onUpdateJunction: (id: string, updates: Partial<JunctionData>) => void;
  onResetDefaults: () => void;
  onApplyScenario: (scenario: 'rush' | 'flow' | 'emergency' | 'balanced') => void;
  onTriggerEmergency: (id: string) => void;
}

export const JunctionGrid: React.FC<JunctionGridProps> = ({
  junctions,
  onUpdateJunction,
  onResetDefaults,
  onApplyScenario,
  onTriggerEmergency,
}) => {
  // Automated phase sequencing timer
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(false);
  const [cycleSpeed, setCycleSpeed] = useState<number>(1);
  const [phaseCountdowns, setPhaseCountdowns] = useState<Record<string, number>>({});
  const [pedestrianCalls, setPedestrianCalls] = useState<Record<string, number>>({});
  const [showWebsterPanel, setShowWebsterPanel] = useState<boolean>(false);

  // Initialize countdowns
  useEffect(() => {
    const initial: Record<string, number> = {};
    junctions.forEach((j) => {
      initial[j.id] = j.greenDurationSec;
    });
    setPhaseCountdowns(initial);
  }, []);

  // Automated Phase Sequencer Clock Loop
  useEffect(() => {
    if (!isAutoCycling) return;

    const interval = setInterval(() => {
      junctions.forEach((j) => {
        setPhaseCountdowns((prev) => {
          const currentLeft = prev[j.id] ?? j.greenDurationSec;
          if (currentLeft <= 1) {
            // Transition signal phase: GREEN -> YELLOW -> RED -> GREEN
            let nextState: 'GREEN' | 'YELLOW' | 'RED' = 'YELLOW';
            let nextDuration = 4; // yellow duration

            if (j.signalState === 'GREEN') {
              nextState = 'YELLOW';
              nextDuration = 4;
            } else if (j.signalState === 'YELLOW') {
              nextState = 'RED';
              nextDuration = Math.max(15, Math.round(j.greenDurationSec * 0.6));
            } else {
              nextState = 'GREEN';
              nextDuration = j.greenDurationSec;
            }

            onUpdateJunction(j.id, { signalState: nextState });
            return { ...prev, [j.id]: nextDuration };
          }
          return { ...prev, [j.id]: currentLeft - 1 };
        });
      });

      // Handle pedestrian calls countdown
      setPedestrianCalls((prev) => {
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([id, sec]) => {
          if (sec > 1) next[id] = sec - 1;
        });
        return next;
      });
    }, 1000 / cycleSpeed);

    return () => clearInterval(interval);
  }, [isAutoCycling, cycleSpeed, junctions, onUpdateJunction]);

  const handlePedestrianCall = (junctionId: string) => {
    setPedestrianCalls((prev) => ({ ...prev, [junctionId]: 18 }));
  };

  const getStatusBadge = (status: TrafficStatus) => {
    switch (status) {
      case 'Free Flow':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#17332B] text-[#35B99B] border border-[#265245]">
            <CheckCircle2 className="w-3 h-3" />
            Free Flow (L &lt; 40)
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#342818] text-[#E5A84D] border border-[#574021]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5A84D]" />
            Moderate (40 ≤ L ≤ 80)
          </span>
        );
      case 'Congested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3A1C24] text-[#E55353] border border-[#5E2734]">
            <AlertTriangle className="w-3 h-3 animate-pulse" />
            Congested (L &gt; 80)
          </span>
        );
    }
  };

  const getSignalBadge = (state: 'RED' | 'YELLOW' | 'GREEN', duration: number, junctionId: string) => {
    const liveSec = phaseCountdowns[junctionId] ?? duration;
    switch (state) {
      case 'RED':
        return (
          <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-[#3A1C24] text-[#E55353] border border-[#5E2734] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E55353]" />
            RED: {isAutoCycling ? `${liveSec}s` : `${duration}s`}
          </span>
        );
      case 'YELLOW':
        return (
          <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-[#342818] text-[#E5A84D] border border-[#574021] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5A84D] animate-ping" />
            YELLOW: {isAutoCycling ? `${liveSec}s` : `${duration}s`}
          </span>
        );
      case 'GREEN':
        return (
          <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-[#17332B] text-[#35B99B] border border-[#265245] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35B99B] animate-pulse" />
            GREEN: {isAutoCycling ? `${liveSec}s` : `${duration}s`}
          </span>
        );
    }
  };

  // Compute Webster's optimal splits for each junction
  const calculateWebsterSplit = (n1: number, n2: number) => {
    const y1 = n1 / 60;
    const y2 = n2 / 60;
    const Y = Math.min(0.85, Math.max(0.2, y1 + y2));
    const lostTimeL = 8; // seconds
    const C0 = Math.round((1.5 * lostTimeL + 5) / (1 - Y));
    const effectiveGreen = Math.max(20, C0 - lostTimeL);
    const g1 = Math.round((y1 / Y) * effectiveGreen);
    const g2 = effectiveGreen - g1;
    return { C0, g1, g2, Y: (Y * 100).toFixed(0) };
  };

  return (
    <div className="space-y-5">
      {/* Header & Scenario Presets Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#F5F3FA] tracking-tight">
              Signal Controllers &amp; Dynamic Grid Timing
            </h2>
            <span className="text-xs font-mono font-semibold text-[#A9A0BC] bg-[#191522] px-2.5 py-0.5 rounded-md border border-[#393044]">
              4 Physical Hubs
            </span>
          </div>
          <p className="text-xs text-[#A9A0BC] mt-1">
            Real-time lane vehicle detectors calculating Approach Load{' '}
            <code className="text-[#4D91E8] font-mono font-semibold bg-[#191522] px-1.5 py-0.5 rounded border border-[#393044]">
              L = (N1 + N2) × W
            </code>
            . Dynamic green wave extensions, automated phase sequencing, and Webster split optimization.
          </p>
        </div>

        {/* Phase Sequencer & Quick Scenarios */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Automated Phase Sequencer Button */}
          <button
            onClick={() => setIsAutoCycling((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isAutoCycling
                ? 'bg-[#17332B] text-[#35B99B] border-[#265245] shadow-xs'
                : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border-[#393044]'
            }`}
            title="Starts real-time automated countdown and signal transitions"
          >
            {isAutoCycling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#35B99B]" />}
            <span>Auto Sequencer: {isAutoCycling ? 'ACTIVE' : 'PAUSED'}</span>
          </button>

          {/* Speed Toggle */}
          {isAutoCycling && (
            <div className="flex items-center bg-[#191522] border border-[#393044] rounded-lg p-0.5 text-[11px] font-mono">
              <button
                onClick={() => setCycleSpeed(1)}
                className={`px-2 py-0.5 rounded cursor-pointer ${cycleSpeed === 1 ? 'bg-[#4D91E8] text-white font-bold' : 'text-[#A9A0BC]'}`}
              >
                1×
              </button>
              <button
                onClick={() => setCycleSpeed(2)}
                className={`px-2 py-0.5 rounded cursor-pointer ${cycleSpeed === 2 ? 'bg-[#35B99B] text-white font-bold' : 'text-[#A9A0BC]'}`}
              >
                2×
              </button>
            </div>
          )}

          {/* Webster Optimization Toggle */}
          <button
            onClick={() => setShowWebsterPanel((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              showWebsterPanel
                ? 'bg-[#4D91E8]/15 text-[#4D91E8] border-[#4D91E8]/40'
                : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border-[#393044]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Webster Splits</span>
            {showWebsterPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Presets */}
          <div className="flex items-center gap-1 pl-1 border-l border-[#393044]">
            <button
              onClick={() => onApplyScenario('rush')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#191522] hover:bg-[#251E33] text-[#F5F3FA] border border-[#393044] transition-colors cursor-pointer"
            >
              Peak Rush
            </button>
            <button
              onClick={() => onApplyScenario('flow')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#191522] hover:bg-[#251E33] text-[#F5F3FA] border border-[#393044] transition-colors cursor-pointer"
            >
              Free Flow
            </button>
            <button
              onClick={() => onApplyScenario('emergency')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#3A1C24] hover:bg-[#4D2330] text-[#E55353] border border-[#5E2734] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Siren className="w-3.5 h-3.5" />
              Priority
            </button>
            <button
              onClick={onResetDefaults}
              className="p-1.5 text-xs rounded-lg bg-[#191522] hover:bg-[#251E33] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044] transition-colors cursor-pointer"
              title="Reset to default initial values"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Webster's Minimum Delay Optimal Cycle Solver Drawer */}
      {showWebsterPanel && (
        <div className="p-4 rounded-2xl bg-[#191522] border border-[#4D91E8]/30 shadow-lg animate-in fade-in duration-150 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#393044] gap-2">
            <div>
              <h3 className="text-xs font-bold text-[#F5F3FA] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#4D91E8]" />
                <span>Webster Optimum Cycle Length Formula:</span>
                <code className="text-[#35B99B] font-mono font-semibold">C₀ = (1.5L + 5) / (1 - Y)</code>
              </h3>
              <p className="text-[11px] text-[#A9A0BC]">
                Minimizes average intersection vehicle delay across arterial approaches based on critical flow ratio Y.
              </p>
            </div>
            <button
              onClick={() => {
                junctions.forEach((j) => {
                  const webster = calculateWebsterSplit(j.n1, j.n2);
                  onUpdateJunction(j.id, { greenDurationSec: webster.g1 });
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-xs font-bold text-white transition-opacity hover:opacity-95 shadow-xs cursor-pointer shrink-0"
            >
              Apply All Optimal Green Splits
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            {junctions.map((j) => {
              const { C0, g1, g2, Y } = calculateWebsterSplit(j.n1, j.n2);
              return (
                <div key={j.id} className="p-3 rounded-xl bg-[#201B29] border border-[#393044] space-y-1">
                  <div className="flex items-center justify-between text-[#F5F3FA] font-bold">
                    <span>{j.name.split(':')[0]}</span>
                    <span className="text-[#4D91E8]">Flow Y: {Y}%</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-[#A9A0BC] pt-1">
                    <span>Optimal Cycle C₀:</span>
                    <span className="font-bold text-[#F5F3FA]">{C0}s</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-[#A9A0BC]">
                    <span>Lane 1 Green (g₁):</span>
                    <span className="font-bold text-[#35B99B]">{g1}s</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-[#A9A0BC]">
                    <span>Lane 2 Green (g₂):</span>
                    <span className="font-bold text-[#E5A84D]">{g2}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Junction Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {junctions.map((j) => {
          const pedSeconds = pedestrianCalls[j.id] || 0;
          const { C0, g1, g2 } = calculateWebsterSplit(j.n1, j.n2);

          // Level of service (LOS) based on volume/capacity
          const totalQueue = j.n1 + j.n2;
          const los =
            totalQueue > 80 ? 'F (Jam)' : totalQueue > 65 ? 'E (Severe)' : totalQueue > 45 ? 'C (Acceptable)' : 'A (Free)';

          return (
            <div
              key={j.id}
              className={`rounded-2xl bg-[#201B29] border p-5 transition-all shadow-md relative overflow-hidden ${
                j.status === 'Congested'
                  ? 'border-[#5E2734] ring-1 ring-[#5E2734]'
                  : 'border-[#393044] hover:border-[#4D91E8]/50'
              }`}
            >
              {/* Top Banner of Card */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#191522] border border-[#393044] text-[#4D91E8] font-bold font-mono text-xs flex items-center justify-center">
                      C{j.assignedCore}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-[#F5F3FA]">{j.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-[#A9A0BC] font-mono mt-0.5">
                        <span>Assigned: Core {j.assignedCore}</span>
                        <span>·</span>
                        <span>Addr: 0x0A{j.assignedCore * 20}</span>
                        <span>·</span>
                        <span className="text-[#35B99B]">LOS: {los}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {getStatusBadge(j.status)}
                  {getSignalBadge(j.signalState, j.greenDurationSec, j.id)}
                </div>
              </div>

              {/* Physical Intersection Mini Diagram */}
              <div className="my-3 p-3.5 rounded-xl bg-[#191522] border border-[#393044] flex items-center justify-between gap-4">
                <div className="relative w-32 h-26 bg-[#100D18] rounded-xl border border-[#393044] flex items-center justify-center overflow-hidden shrink-0">
                  {/* Road Grid Overlay */}
                  <div className="absolute inset-x-0 h-10 bg-[#1F1A2C] border-y border-dashed border-[#393044] flex items-center justify-around px-1">
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#F5F3FA]">
                      <Car className="w-3.5 h-3.5 text-[#4D91E8]" />
                      <span>{j.n1}</span>
                    </div>
                  </div>
                  <div className="absolute inset-y-0 w-10 bg-[#1F1A2C] border-x border-dashed border-[#393044] flex flex-col items-center justify-around py-1">
                    <div className="text-[10px] font-mono font-bold text-[#F5F3FA] flex flex-col items-center">
                      <span>{j.n2}</span>
                    </div>
                  </div>

                  {/* Center Signal Light */}
                  <div
                    className={`w-4 h-4 rounded-full border shadow-sm z-10 transition-colors ${
                      j.signalState === 'GREEN'
                        ? 'bg-[#35B99B] border-[#265245] shadow-[0_0_8px_#35B99B]'
                        : j.signalState === 'YELLOW'
                        ? 'bg-[#E5A84D] border-[#574021] shadow-[0_0_8px_#E5A84D]'
                        : 'bg-[#E55353] border-[#5E2734] shadow-[0_0_8px_#E55353]'
                    }`}
                  />

                  {/* Pedestrian Crosswalk Walking Indicator if active */}
                  {pedSeconds > 0 && (
                    <div className="absolute bottom-1 inset-x-1 py-0.5 rounded bg-[#35B99B] text-black font-bold font-mono text-[9px] flex items-center justify-center gap-1 shadow-sm z-20">
                      <span>WALK {pedSeconds}s</span>
                    </div>
                  )}

                  {j.hasEmergencyVehicle && (
                    <div className="absolute top-1 right-1 p-0.5 rounded bg-[#E55353] text-white animate-bounce shadow-xs z-20">
                      <Siren className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Mathematical Computation Box */}
                <div className="flex-1 font-mono text-xs space-y-1">
                  <div className="text-[#A9A0BC] text-[11px] font-sans">Queue &amp; Weight Evaluation:</div>
                  <div className="text-[#F5F3FA]">
                    <span className="text-[#A9A0BC]">L = </span>
                    <span className="text-[#35B99B] font-bold">({j.n1} + {j.n2})</span>
                    <span className="text-[#A9A0BC]"> × </span>
                    <span className="text-[#4D91E8] font-bold">{j.w.toFixed(1)}</span>
                  </div>
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-[#A9A0BC] font-sans">Calculated Load:</span>
                    <span className="text-base font-bold text-[#F5F3FA] tabular-nums">
                      {j.load.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-[#A9A0BC] font-sans">
                      (Threshold: {j.queueThreshold})
                    </span>
                  </div>

                  {/* Webster Recommendation */}
                  <div className="text-[10px] text-[#A9A0BC] font-sans pt-0.5">
                    Webster Optimal: Split L1={g1}s / L2={g2}s (Cycle: {C0}s)
                  </div>

                  {/* Hazard flag indicator */}
                  {j.load > j.queueThreshold && (
                    <div className="text-[10px] text-[#E55353] flex items-center gap-1 font-sans font-medium">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Exceeds limit → Triggers BUN Branch Routine</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Interactive Sliders */}
              <div className="space-y-3 pt-2">
                {/* Lane 1 slider */}
                <div>
                  <div className="flex justify-between text-xs text-[#A9A0BC] mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Car className="w-3.5 h-3.5 text-[#4D91E8]" /> Lane 1 Vehicles (N1):
                    </span>
                    <span className="font-mono font-bold text-[#4D91E8] tabular-nums">
                      {j.n1} units
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="60"
                    value={j.n1}
                    onChange={(e) => {
                      const newN1 = parseInt(e.target.value);
                      const newLoad = (newN1 + j.n2) * j.w;
                      const newStatus: TrafficStatus =
                        newLoad > 80 ? 'Congested' : newLoad >= 40 ? 'Moderate' : 'Free Flow';
                      const newGreen = Math.min(100, Math.max(25, Math.round(25 + newLoad * 0.5)));
                      onUpdateJunction(j.id, {
                        n1: newN1,
                        load: newLoad,
                        status: newStatus,
                        greenDurationSec: newGreen,
                      });
                    }}
                    className="w-full h-1.5 bg-[#191522] rounded-lg appearance-none cursor-pointer accent-[#4D91E8]"
                  />
                </div>

                {/* Lane 2 slider */}
                <div>
                  <div className="flex justify-between text-xs text-[#A9A0BC] mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Car className="w-3.5 h-3.5 text-[#35B99B]" /> Lane 2 Vehicles (N2):
                    </span>
                    <span className="font-mono font-bold text-[#35B99B] tabular-nums">
                      {j.n2} units
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="60"
                    value={j.n2}
                    onChange={(e) => {
                      const newN2 = parseInt(e.target.value);
                      const newLoad = (j.n1 + newN2) * j.w;
                      const newStatus: TrafficStatus =
                        newLoad > 80 ? 'Congested' : newLoad >= 40 ? 'Moderate' : 'Free Flow';
                      const newGreen = Math.min(100, Math.max(25, Math.round(25 + newLoad * 0.5)));
                      onUpdateJunction(j.id, {
                        n2: newN2,
                        load: newLoad,
                        status: newStatus,
                        greenDurationSec: newGreen,
                      });
                    }}
                    className="w-full h-1.5 bg-[#191522] rounded-lg appearance-none cursor-pointer accent-[#35B99B]"
                  />
                </div>

                {/* Vehicle Weight factor W */}
                <div>
                  <div className="flex justify-between text-xs text-[#A9A0BC] mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Sliders className="w-3.5 h-3.5 text-[#A9A0BC]" /> Vehicle Weight Factor (W):
                    </span>
                    <span className="font-mono font-bold text-[#F5F3FA] tabular-nums">
                      {j.w.toFixed(1)}x (Heavy / Transit mix)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="2.5"
                    step="0.1"
                    value={j.w}
                    onChange={(e) => {
                      const newW = parseFloat(e.target.value);
                      const newLoad = (j.n1 + j.n2) * newW;
                      const newStatus: TrafficStatus =
                        newLoad > 80 ? 'Congested' : newLoad >= 40 ? 'Moderate' : 'Free Flow';
                      const newGreen = Math.min(100, Math.max(25, Math.round(25 + newLoad * 0.5)));
                      onUpdateJunction(j.id, {
                        w: newW,
                        load: newLoad,
                        status: newStatus,
                        greenDurationSec: newGreen,
                      });
                    }}
                    className="w-full h-1.5 bg-[#191522] rounded-lg appearance-none cursor-pointer accent-[#A9A0BC]"
                  />
                </div>
              </div>

              {/* Bottom Actions: Pedestrian Walk Request & Signal Manual Overrides */}
              <div className="mt-4 pt-3 border-t border-[#393044] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Emergency Vehicle Dispatch */}
                  <button
                    onClick={() => onTriggerEmergency(j.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      j.hasEmergencyVehicle
                        ? 'bg-[#E55353] text-white shadow-xs'
                        : 'bg-[#191522] hover:bg-[#251E33] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
                    }`}
                    title="Simulates emergency vehicle detection, triggering priority override & MESI BusRdX invalidation"
                  >
                    <Siren className={`w-3.5 h-3.5 ${j.hasEmergencyVehicle ? 'animate-bounce' : ''}`} />
                    <span>
                      {j.hasEmergencyVehicle ? 'Emergency Active' : 'Dispatch Emergency'}
                    </span>
                  </button>

                  {/* Pedestrian Call Button */}
                  <button
                    onClick={() => handlePedestrianCall(j.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      pedSeconds > 0
                        ? 'bg-[#35B99B]/20 text-[#35B99B] border border-[#35B99B]/50'
                        : 'bg-[#191522] hover:bg-[#251E33] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
                    }`}
                    title="Request pedestrian crossing walk phase"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#35B99B]" />
                    <span>{pedSeconds > 0 ? `Walk ${pedSeconds}s` : 'Call Pedestrian'}</span>
                  </button>
                </div>

                {/* Direct Signal State Override */}
                <div className="flex items-center gap-1">
                  {(['GREEN', 'YELLOW', 'RED'] as const).map((sig) => (
                    <button
                      key={sig}
                      onClick={() => onUpdateJunction(j.id, { signalState: sig })}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        j.signalState === sig
                          ? sig === 'GREEN'
                            ? 'bg-[#35B99B] text-white shadow-xs'
                            : sig === 'YELLOW'
                            ? 'bg-[#E5A84D] text-[#100D18] shadow-xs'
                            : 'bg-[#E55353] text-white shadow-xs'
                          : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
                      }`}
                    >
                      {sig}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
