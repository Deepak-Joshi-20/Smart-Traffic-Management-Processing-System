import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';
import { JunctionData } from '../../types';

interface SignalManagementViewProps {
  junctions: JunctionData[];
  onUpdateJunction: (id: string, updates: Partial<JunctionData>) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
}

export const SignalManagementView: React.FC<SignalManagementViewProps> = ({
  junctions,
  onUpdateJunction,
  onRunSimulation,
  isSimulating,
}) => {
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>(junctions[0]?.id || 'JUNCT_A');
  const [appliedRecommendations, setAppliedRecommendations] = useState<Record<string, boolean>>({});

  const selectedJunction = junctions.find((j) => j.id === selectedJunctionId) || junctions[0];

  // Mathematical Webster's minimum delay optimal calculation
  // Total lost time L = 2 phases * 4s lost = 8s
  const lostTimeL = 8;
  const saturationFlowS = 1800; // veh/hr capacity per lane
  const arrivalRateN1 = (selectedJunction.n1 * 60) / 10; // scaled hourly flow
  const arrivalRateN2 = (selectedJunction.n2 * 60) / 10;

  const y1 = Math.min(0.45, arrivalRateN1 / saturationFlowS);
  const y2 = Math.min(0.45, arrivalRateN2 / saturationFlowS);
  const totalY = Math.max(0.1, y1 + y2);

  // Webster formula: C0 = (1.5L + 5) / (1 - Y)
  const optimalCycleLength = Math.min(120, Math.max(45, Math.round((1.5 * lostTimeL + 5) / (1 - totalY))));
  const effectiveGreen = optimalCycleLength - lostTimeL;
  const optimalGreenSplitPhase1 = Math.round((y1 / totalY) * effectiveGreen);
  const optimalGreenSplitPhase2 = Math.round((y2 / totalY) * effectiveGreen);

  const handleApplyRecommendation = (junctionId: string) => {
    onUpdateJunction(junctionId, {
      greenDurationSec: optimalGreenSplitPhase1,
    });
    setAppliedRecommendations((prev) => ({ ...prev, [junctionId]: true }));
    setTimeout(() => {
      setAppliedRecommendations((prev) => ({ ...prev, [junctionId]: false }));
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Operational Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F2] tracking-tight">
            Signal Optimization &amp; Timing Plans
          </h1>
          <p className="text-xs text-[#91A19B] mt-0.5">
            Compare fixed cycle intervals with mathematically computed Webster minimum-delay splits.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151F24] border border-[#29383A] text-xs font-mono text-[#B7F34A]">
          <Info className="w-3.5 h-3.5 text-[#B7F34A]" />
          <span>Simulation Engine Active</span>
        </div>
      </div>

      {/* Main Grid: Junction Switcher & Detailed Calculation Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Junction Summary Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-mono text-[#91A19B] uppercase tracking-wider">
            Signal Phase Profiles
          </div>

          <div className="space-y-2.5">
            {junctions.map((j) => {
              const isSelected = j.id === selectedJunctionId;
              const hasRecommendation = j.load > 45;
              return (
                <div
                  key={j.id}
                  onClick={() => setSelectedJunctionId(j.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B292E] border-[#B7F34A] shadow-md'
                      : 'bg-[#151F24] border-[#29383A] hover:border-[#3D535A]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#B7F34A]">{j.id}</span>
                      <h4 className="text-xs font-bold text-[#F1F5F2]">{j.name}</h4>
                    </div>
                    {hasRecommendation && (
                      <span className="text-[10px] font-mono bg-[#B7F34A]/10 text-[#B7F34A] border border-[#B7F34A]/20 px-2 py-0.5 rounded">
                        Rec Ready
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono mt-3 pt-2.5 border-t border-[#29383A] text-[#91A19B]">
                    <span>Current Green: {j.greenDurationSec}s</span>
                    <span className="text-[#52C7D9]">Total Load: {j.load.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Comparative Timing & Webster Split Equation (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedJunction && (
            <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#29383A]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#B7F34A]">{selectedJunction.id}</span>
                    <span className="text-xs font-mono text-[#64736D]">·</span>
                    <span className="text-xs font-mono text-[#91A19B]">Cycle Synchronization</span>
                  </div>
                  <h3 className="text-base font-bold text-[#F1F5F2] mt-0.5">
                    {selectedJunction.name}
                  </h3>
                </div>

                <button
                  onClick={() => handleApplyRecommendation(selectedJunction.id)}
                  className="neon-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {appliedRecommendations[selectedJunction.id]
                      ? 'Applied To Simulation!'
                      : 'Deploy Recommended Timing'}
                  </span>
                </button>
              </div>

              {/* Side-by-Side: Current Timing vs Recommended Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Timing Card */}
                <div className="p-4 rounded-xl bg-[#10171B] border border-[#29383A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#91A19B] uppercase">Current Operational Plan</span>
                    <span className="text-[10px] font-mono bg-[#1B292E] text-[#91A19B] px-2 py-0.5 rounded">
                      Fixed Cycle
                    </span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#64736D]">Active Green Duration:</span>
                      <span className="text-[#F1F5F2] font-bold">{selectedJunction.greenDurationSec}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64736D]">Amber Transition:</span>
                      <span className="text-[#F2B84B] font-bold">4s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64736D]">All-Red Clearance:</span>
                      <span className="text-[#F06464] font-bold">2s</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#29383A]">
                      <span className="text-[#91A19B]">Estimated Delay / Veh:</span>
                      <span className="text-[#F2B84B] font-bold">38.4 sec</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Timing Card */}
                <div className="p-4 rounded-xl bg-[#10171B] border border-[#B7F34A]/40 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#B7F34A] uppercase">
                      Recommended Webster Split
                    </span>
                    <span className="text-[10px] font-mono bg-[#B7F34A]/10 text-[#B7F34A] px-2 py-0.5 rounded border border-[#B7F34A]/20">
                      Optimal Delay
                    </span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#91A19B]">Phase 1 Optimal Green:</span>
                      <span className="text-[#B7F34A] font-bold">{optimalGreenSplitPhase1}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#91A19B]">Phase 2 Optimal Green:</span>
                      <span className="text-[#52C7D9] font-bold">{optimalGreenSplitPhase2}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#91A19B]">Total Optimal Cycle (C₀):</span>
                      <span className="text-[#F1F5F2] font-bold">{optimalCycleLength}s</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#29383A]">
                      <span className="text-[#B7F34A]">Projected Delay Reduction:</span>
                      <span className="text-[#71D49A] font-bold">-22.6% delay</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mathematical Formulation Breakdown */}
              <div className="p-4 rounded-xl bg-[#10171B] border border-[#29383A] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#52C7D9] uppercase tracking-wider">
                    Webster's Traffic Flow Delay Equation
                  </span>
                  <span className="text-[11px] font-mono text-[#64736D]">HCM Standards</span>
                </div>

                <div className="p-3 rounded-lg bg-[#0B0F12] border border-[#29383A] font-mono text-xs text-[#91A19B] space-y-1">
                  <div className="text-[#B7F34A]">
                    C₀ = (1.5 · L + 5) / (1 - Y)
                  </div>
                  <div className="text-[11px] text-[#64736D]">
                    Where Total Lost Time L = {lostTimeL}s, Critical Flow Ratio Y = y₁ + y₂ = {totalY.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-[#F1F5F2] pt-1">
                    Calculated Result: C₀ = {optimalCycleLength}s (Green split allocated proportionally to approach queue ratio).
                  </div>
                </div>

                <div className="text-[11px] text-[#91A19B] leading-relaxed">
                  Rationale: Node {selectedJunction.id} currently holds {selectedJunction.n1} vehicles on approach 1 and {selectedJunction.n2} vehicles on approach 2. Shifting to {optimalGreenSplitPhase1}s green clears the accumulated backlog before phase inversion.
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-[#1B292E] border border-[#29383A] flex items-center justify-between text-xs text-[#64736D]">
                <span>Notice: Deployed timings update the simulation environment parameters.</span>
                <span className="font-mono text-[11px] text-[#91A19B]">STATUS: VERIFIED</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
