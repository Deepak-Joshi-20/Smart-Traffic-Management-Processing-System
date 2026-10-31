/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Zap,
  TrendingUp,
  BarChart3,
  HelpCircle,
  Database,
  Share2,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Thermometer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { JunctionData } from '../types';
import { BusTimingDiagram } from './BusTimingDiagram';

interface CoreArchitectureProps {
  junctions: JunctionData[];
  currentCycle: number;
  onUpdateJunctionLoad?: (junctionId: string, delta: number) => void;
  onApplyScenario?: (scenario: 'rush' | 'flow' | 'emergency' | 'balanced') => void;
}

interface SpeedupPoint {
  cycle: string;
  cycleNum: number;
  measuredSpeedup: number;
  theoreticalLimit: number;
  efficiencyPct: number;
  idealLinear: number;
}

export const CoreArchitecture: React.FC<CoreArchitectureProps> = ({
  junctions,
  currentCycle,
  onUpdateJunctionLoad,
  onApplyScenario,
}) => {
  // Amdahl's Law State
  const [parallelFractionP, setParallelFractionP] = useState<number>(0.8);
  const [coreCountN, setCoreCountN] = useState<number>(4);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  // Amdahl's formula: S = 1 / ((1 - P) + (P / N))
  const serialFraction = 1 - parallelFractionP;
  const parallelOverN = parallelFractionP / coreCountN;
  const amdahlSpeedup = 1 / (serialFraction + parallelOverN);
  const parallelEfficiency = (amdahlSpeedup / coreCountN) * 100;

  // Pipeline Speedup from report: S = (n * k) / (k + n - 1)
  const [instructionCountN, setInstructionCountN] = useState<number>(100);
  const pipelineStagesK = 4;
  const pipelineSpeedup =
    (instructionCountN * pipelineStagesK) / (pipelineStagesK + instructionCountN - 1);

  // Sequential vs Parallel simulated time
  const baselineSequentialTimeMs = 120;
  const parallelTimeMs =
    baselineSequentialTimeMs * serialFraction +
    (baselineSequentialTimeMs * parallelFractionP) / coreCountN;

  // Real-time 20-Cycle Speedup Tracking State
  const [isAutoStreaming, setIsAutoStreaming] = useState<boolean>(true);
  const [activeChartMetric, setActiveChartMetric] = useState<'speedup' | 'efficiency'>('speedup');
  const [localCycle, setLocalCycle] = useState<number>(currentCycle || 42);

  // CPU Power & Frequency Governor State
  const [cpuGovernor, setCpuGovernor] = useState<'performance' | 'balanced' | 'powersave'>('performance');

  const governorSpecs = {
    performance: { label: 'Performance (3.5 GHz)', freq: 3.5, voltage: 1.25, tdpWatts: 95, color: '#35B99B' },
    balanced: { label: 'Balanced (2.5 GHz)', freq: 2.5, voltage: 1.10, tdpWatts: 58, color: '#4D91E8' },
    powersave: { label: 'Power-Saver (1.6 GHz)', freq: 1.6, voltage: 0.95, tdpWatts: 28, color: '#A9A0BC' },
  };

  const handleAutoBalance = () => {
    if (!onUpdateJunctionLoad) return;
    const avgLoad = junctions.reduce((a, b) => a + b.load, 0) / junctions.length;
    junctions.forEach((j) => {
      const diff = avgLoad - j.load;
      if (Math.abs(diff) > 2) {
        onUpdateJunctionLoad(j.id, Math.round(diff));
      }
    });
  };


  // Initialize and maintain 20 rolling cycles
  const [cycleHistory, setCycleHistory] = useState<SpeedupPoint[]>(() => {
    const start = Math.max(1, (currentCycle || 42) - 19);
    const arr: SpeedupPoint[] = [];
    const baseTheoretical = 1 / ((1 - 0.8) + 0.8 / 4);
    for (let c = start; c <= (currentCycle || 42); c++) {
      const noise = Math.sin(c * 1.3) * 0.08 + Math.cos(c * 0.7) * 0.04;
      const measured = Math.max(1.0, parseFloat((baseTheoretical + noise).toFixed(2)));
      arr.push({
        cycle: `CC ${c}`,
        cycleNum: c,
        measuredSpeedup: measured,
        theoreticalLimit: parseFloat(baseTheoretical.toFixed(2)),
        efficiencyPct: parseFloat(((measured / 4) * 100).toFixed(1)),
        idealLinear: 4,
      });
    }
    return arr;
  });

  // Re-calculate theoretical limit across history when P or N changes
  useEffect(() => {
    setCycleHistory((prev) =>
      prev.map((pt) => {
        const noise = Math.sin(pt.cycleNum * 1.3) * 0.08 + Math.cos(pt.cycleNum * 0.7) * 0.04;
        const measured = Math.max(1.0, parseFloat((amdahlSpeedup + noise).toFixed(2)));
        return {
          ...pt,
          measuredSpeedup: measured,
          theoreticalLimit: parseFloat(amdahlSpeedup.toFixed(2)),
          efficiencyPct: parseFloat(((measured / coreCountN) * 100).toFixed(1)),
          idealLinear: coreCountN,
        };
      })
    );
  }, [parallelFractionP, coreCountN, amdahlSpeedup]);

  // Real-time stream interval updating every 1.6s
  useEffect(() => {
    if (!isAutoStreaming) return;
    const interval = setInterval(() => {
      setLocalCycle((prevCycle) => {
        const nextCycle = prevCycle + 1;
        setCycleHistory((prev) => {
          const noise = Math.sin(nextCycle * 1.3) * 0.08 + Math.cos(nextCycle * 0.7) * 0.04;
          const measured = Math.max(1.0, parseFloat((amdahlSpeedup + noise).toFixed(2)));
          const newPoint: SpeedupPoint = {
            cycle: `CC ${nextCycle}`,
            cycleNum: nextCycle,
            measuredSpeedup: measured,
            theoreticalLimit: parseFloat(amdahlSpeedup.toFixed(2)),
            efficiencyPct: parseFloat(((measured / coreCountN) * 100).toFixed(1)),
            idealLinear: coreCountN,
          };
          return [...prev.slice(1), newPoint];
        });
        return nextCycle;
      });
    }, 1600);
    return () => clearInterval(interval);
  }, [isAutoStreaming, amdahlSpeedup, coreCountN]);

  const handleTickCycle = () => {
    setLocalCycle((prevCycle) => {
      const nextCycle = prevCycle + 1;
      setCycleHistory((prev) => {
        const noise = Math.sin(nextCycle * 1.3) * 0.08 + Math.cos(nextCycle * 0.7) * 0.04;
        const measured = Math.max(1.0, parseFloat((amdahlSpeedup + noise).toFixed(2)));
        const newPoint: SpeedupPoint = {
          cycle: `CC ${nextCycle}`,
          cycleNum: nextCycle,
          measuredSpeedup: measured,
          theoreticalLimit: parseFloat(amdahlSpeedup.toFixed(2)),
          efficiencyPct: parseFloat(((measured / coreCountN) * 100).toFixed(1)),
          idealLinear: coreCountN,
        };
        return [...prev.slice(1), newPoint];
      });
      return nextCycle;
    });
  };

  const handleResetHistory = () => {
    const start = Math.max(1, localCycle - 19);
    const arr: SpeedupPoint[] = [];
    for (let c = start; c <= localCycle; c++) {
      const noise = Math.sin(c * 1.3) * 0.08 + Math.cos(c * 0.7) * 0.04;
      const measured = Math.max(1.0, parseFloat((amdahlSpeedup + noise).toFixed(2)));
      arr.push({
        cycle: `CC ${c}`,
        cycleNum: c,
        measuredSpeedup: measured,
        theoreticalLimit: parseFloat(amdahlSpeedup.toFixed(2)),
        efficiencyPct: parseFloat(((measured / coreCountN) * 100).toFixed(1)),
        idealLinear: coreCountN,
      });
    }
    setCycleHistory(arr);
  };

  const latestPoint = cycleHistory[cycleHistory.length - 1] || {
    measuredSpeedup: amdahlSpeedup,
    efficiencyPct: parallelEfficiency,
  };

  // Custom Recharts Tooltip (Examos Theme)
  const CustomSpeedupTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SpeedupPoint;
      return (
        <div className="p-3 rounded-xl bg-[#201B29] border border-[#393044] shadow-2xl text-xs font-mono space-y-1.5 min-w-[200px] text-[#F5F3FA]">
          <div className="font-bold text-[#F5F3FA] border-b border-[#393044] pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-[#4D91E8] font-semibold">Cycle #{data.cycleNum}</span>
          </div>
          <div className="flex items-center justify-between text-[#4D91E8]">
            <span>Measured Speedup:</span>
            <span className="font-bold">{data.measuredSpeedup.toFixed(2)}×</span>
          </div>
          <div className="flex items-center justify-between text-[#E5A84D]">
            <span>Amdahl Limit:</span>
            <span className="font-semibold">{data.theoreticalLimit.toFixed(2)}×</span>
          </div>
          <div className="flex items-center justify-between text-[#35B99B]">
            <span>Parallel Efficiency:</span>
            <span className="font-semibold">{data.efficiencyPct.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-[#A9A0BC]">
            <span>Ideal Linear (N):</span>
            <span className="font-semibold">{data.idealLinear}×</span>
          </div>
          <div className="text-[10px] text-[#A9A0BC] pt-1 border-t border-[#393044]">
            Bus Variance: {(data.theoreticalLimit - data.measuredSpeedup).toFixed(3)}×
          </div>
        </div>
      );
    }
    return null;
  };

  // Continuous Blue -> Amber -> Intense Red Color Interpolation based on processing load
  const getCoreThermalMetrics = (load: number, hasEmergency: boolean, status: string) => {
    // Approach Load L = (N1 + N2) * W
    let rawUtil = (load / 130) * 100;
    if (hasEmergency) rawUtil += 25;
    if (status === 'Congested') rawUtil = Math.max(78, rawUtil);

    const util = Math.min(100, Math.max(16, Math.round(rawUtil)));
    const temp = Math.round(38 + (util / 100) * 52); // 38°C (Idle) to 90°C (Peak)
    const freq = parseFloat((2.2 + (util / 100) * 1.3).toFixed(2)); // 2.20 GHz to 3.50 GHz

    // Smooth Blue (low load) -> Cyan/Yellow (moderate) -> Intense Red (high load)
    let r: number, g: number, b: number;
    let thermalStatus: 'Cool' | 'Nominal' | 'Warm' | 'Intense Critical';
    let badgeClass: string;

    if (util <= 35) {
      // 0 to 35: Cool Sapphire Blue (#1d4ed8 / rgb(29, 78, 216)) to Sky Blue (#0284c7 / rgb(2, 132, 199))
      const t = util / 35;
      r = Math.round(29 + t * (2 - 29));
      g = Math.round(78 + t * (132 - 78));
      b = Math.round(216 + t * (199 - 216));
      thermalStatus = 'Cool';
      badgeClass = 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (util <= 65) {
      // 35 to 65: Sky Blue to Warm Amber (#d97706 / rgb(217, 119, 6))
      const t = (util - 35) / 30;
      r = Math.round(2 + t * (217 - 2));
      g = Math.round(132 + t * (119 - 132));
      b = Math.round(199 + t * (6 - 199));
      thermalStatus = util < 50 ? 'Nominal' : 'Warm';
      badgeClass = 'text-amber-800 bg-amber-50 border-amber-300 font-semibold';
    } else {
      // 65 to 100: Amber to Blazing Crimson Red (#dc2626 / rgb(220, 38, 38))
      const t = Math.min(1, (util - 65) / 35);
      r = Math.round(217 + t * (220 - 217));
      g = Math.round(119 - t * (119 - 38));
      b = Math.round(6 - t * (6 - 38));
      thermalStatus = 'Intense Critical';
      badgeClass = 'text-red-700 bg-red-100 border-red-300 font-bold animate-pulse';
    }

    const rgbStr = `rgb(${r}, ${g}, ${b})`;
    const hexStr = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    const tintStr = `rgba(${r}, ${g}, ${b}, 0.16)`;
    const glowStr = `0 4px 20px rgba(${r}, ${g}, ${b}, ${util >= 70 ? 0.35 : 0.15})`;

    return {
      utilizationPct: util,
      temperatureC: temp,
      freqGhz: freq,
      thermalStatus,
      rgbStr,
      hexStr,
      tintStr,
      glowStr,
      badgeClass,
      barGradient: `linear-gradient(90deg, #2563eb 0%, #f59e0b 55%, ${rgbStr} 100%)`,
    };
  };

  return (
    <div className="space-y-5">
      {/* Header Summary */}
      <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#F5F3FA] tracking-tight">
              MIMD Multi-Core Shared Memory Architecture
            </h2>
            <span className="text-xs font-mono font-semibold text-[#A9A0BC] bg-[#191522] px-2.5 py-0.5 rounded-md border border-[#393044]">
              4-Core Symmetric Multiprocessor (SMP)
            </span>
          </div>
          <p className="text-xs text-[#A9A0BC] mt-1">
            Multiple Instruction, Multiple Data (MIMD) structure where 4 independent processor cores
            concurrently calculate traffic loads for separate junctions while sharing physical memory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* DVFS Power Governor */}
          <div className="flex items-center gap-1 bg-[#191522] p-1 rounded-xl border border-[#393044] text-xs font-mono">
            <span className="text-[10px] text-[#A9A0BC] px-1 font-sans">Governor:</span>
            {(['performance', 'balanced', 'powersave'] as const).map((gov) => (
              <button
                key={gov}
                onClick={() => setCpuGovernor(gov)}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                  cpuGovernor === gov
                    ? 'bg-[#201B29] text-white border border-[#393044] shadow-xs'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
                }`}
              >
                {gov === 'performance' ? '3.5 GHz' : gov === 'balanced' ? '2.5 GHz' : '1.6 GHz'}
              </button>
            ))}
          </div>

          {/* Auto-Balance Button */}
          {onUpdateJunctionLoad && (
            <button
              onClick={handleAutoBalance}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#17332B] hover:bg-[#1f453a] text-[#35B99B] border border-[#265245] transition-all cursor-pointer shadow-xs"
              title="Automatically rebalance queue depths and CPU thermal load across all 4 cores"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Balance Cores</span>
            </button>
          )}

          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#191522] hover:bg-[#251E33] text-[#F5F3FA] border border-[#393044] transition-colors shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#4D91E8]" />
            <span>{showFormulaDetails ? 'Hide Formulas' : 'Explain Amdahl\'s Law'}</span>
          </button>
        </div>
      </div>

      {/* Formula Explanation Callout if toggled */}
      {showFormulaDetails && (
        <div className="p-4 rounded-2xl bg-[#191522] border border-[#393044] text-xs text-[#A9A0BC] space-y-2 animate-in fade-in duration-150">
          <div className="font-bold text-[#F5F3FA] flex items-center gap-1.5 text-sm">
            <TrendingUp className="w-4 h-4 text-[#35B99B]" />
            <span>Amdahl's Law &amp; Pipeline Theoretical Limits</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono">
            <div className="p-3 rounded-xl bg-[#201B29] border border-[#393044] space-y-1 shadow-sm">
              <span className="text-[#35B99B] font-bold block">1. Amdahl's Speedup Formula:</span>
              <p className="text-[#F5F3FA]">
                Speedup = 1 / ((1 - P) + (P / N))
              </p>
              <p className="text-[#A9A0BC] text-[11px]">
                Where <strong className="text-[#35B99B]">P = 0.8</strong> (80% parallel traffic load computation),
                and <strong className="text-[#35B99B]">N = 4</strong> cores.
                Yields theoretical speedup: <strong>1 / (0.2 + 0.2) = 2.5×</strong>.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#201B29] border border-[#393044] space-y-1 shadow-sm">
              <span className="text-[#4D91E8] font-bold block">2. 4-Stage Pipeline Speedup:</span>
              <p className="text-[#F5F3FA]">
                Speedup_pipe = (n × k) / (k + n - 1)
              </p>
              <p className="text-[#A9A0BC] text-[11px]">
                For <strong className="text-[#4D91E8]">k = 4</strong> stages and <strong className="text-[#4D91E8]">n = 100</strong> instructions:
                Speedup = 400 / (4 + 100 - 1) = <strong>400 / 103 ≈ 3.88×</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Block Diagram of 4-Core MIMD Architecture */}
      <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#393044] gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#4D91E8] shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-[#F5F3FA]">
                Multi-Core Shared Memory Hardware Layout (4 Cores)
              </h3>
              <span className="text-[11px] text-[#A9A0BC]">
                Dynamic Processing Load Heatmap Overlay
              </span>
            </div>
          </div>

          {/* Thermal Legend & 1-Click Heatmap Test Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            {onApplyScenario && (
              <div className="flex items-center gap-1 bg-[#191522] p-1 rounded-xl border border-[#393044] text-xs font-mono">
                <span className="text-[10px] text-[#A9A0BC] px-1 font-semibold uppercase">Heatmap:</span>
                <button
                  onClick={() => onApplyScenario('flow')}
                  className="px-2 py-1 rounded-lg bg-[#201B29] hover:bg-[#251E33] text-[#4D91E8] border border-[#393044] text-[10px] font-bold transition-colors cursor-pointer"
                  title="Set all junctions to low density (Cores turn Cool Blue)"
                >
                  Cool (Idle)
                </button>
                <button
                  onClick={() => onApplyScenario('balanced')}
                  className="px-2 py-1 rounded-lg bg-[#342818] hover:bg-[#45341E] text-[#E5A84D] border border-[#574021] text-[10px] font-bold transition-colors cursor-pointer"
                  title="Set balanced load (Cores turn Warm Amber)"
                >
                  Moderate
                </button>
                <button
                  onClick={() => onApplyScenario('rush')}
                  className="px-2 py-1 rounded-lg bg-[#3A1C24] hover:bg-[#4D2330] text-[#E55353] border border-[#5E2734] text-[10px] font-bold transition-colors cursor-pointer"
                  title="Set heavy traffic congestion (Cores turn Intense Glowing Red)"
                >
                  Peak Rush
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Cores Layer with Dynamic Heatmap Overlays */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {junctions.map((j) => {
            const thermal = getCoreThermalMetrics(j.load, j.hasEmergencyVehicle, j.status);
            const isCritical = thermal.thermalStatus === 'Intense Critical';

            return (
              <div
                key={j.assignedCore}
                className="relative p-4 rounded-xl border transition-all duration-300 overflow-hidden"
                style={{
                  borderColor: isCritical ? '#E55353' : thermal.rgbStr,
                  boxShadow: thermal.glowStr,
                  background: `radial-gradient(circle at top right, ${thermal.tintStr} 0%, rgba(25, 21, 34, 0.96) 80%)`,
                }}
              >
                {/* Full Card Heatmap Radial Aura */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${thermal.tintStr} 0%, rgba(25, 21, 34, 0.05) 100%)`,
                  }}
                />

                {/* Intense Thermal Glow Ring if Overloaded */}
                {isCritical && (
                  <div
                    className="absolute -inset-1 rounded-xl blur-xs -z-10 animate-pulse pointer-events-none"
                    style={{ backgroundColor: thermal.rgbStr, opacity: 0.25 }}
                  />
                )}

                {/* Core Header with Thermal & Freq Badges */}
                <div className="relative z-10 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-lg text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs transition-colors"
                      style={{ backgroundColor: thermal.rgbStr }}
                    >
                      C{j.assignedCore}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        Core {j.assignedCore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {thermal.freqGhz} GHz · Die #{j.assignedCore}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${thermal.badgeClass}`}
                    >
                      {isCritical ? (
                        <Flame className="w-3 h-3 text-red-600 animate-bounce" />
                      ) : (
                        <Thermometer className="w-3 h-3" style={{ color: thermal.rgbStr }} />
                      )}
                      <span>{thermal.temperatureC}°C</span>
                    </span>
                  </div>
                </div>

                {/* Silicon Die Micro-Architecture Representation (SVG Heatmap) */}
                <div className="relative z-10 my-2 p-2 rounded-xl bg-[#191522] border border-[#393044] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#A9A0BC] font-semibold uppercase">Silicon Die:</span>
                    <span
                      className="font-bold px-1.5 py-0.5 rounded border text-[9px]"
                      style={{ color: thermal.rgbStr, borderColor: thermal.rgbStr, backgroundColor: thermal.tintStr }}
                    >
                      {thermal.hexStr}
                    </span>
                  </div>

                  {/* SVG Silicon Die Blocks showing live thermal heatmap sectors */}
                  <svg viewBox="0 0 160 50" className="w-full h-12 rounded-lg border border-[#393044] bg-[#100D18]">
                    {/* ALU Core Block */}
                    <rect
                      x="4"
                      y="4"
                      width="72"
                      height="20"
                      rx="3"
                      fill={thermal.rgbStr}
                      fillOpacity={0.25 + (thermal.utilizationPct / 100) * 0.45}
                      stroke={thermal.rgbStr}
                      strokeWidth="1"
                    />
                    <text x="8" y="17" fontSize="7" fontFamily="monospace" fontWeight="bold" fill="#F5F3FA">
                      ALU / EX Core
                    </text>

                    {/* Register File Block */}
                    <rect
                      x="80"
                      y="4"
                      width="76"
                      height="20"
                      rx="3"
                      fill={thermal.rgbStr}
                      fillOpacity={0.20 + (thermal.utilizationPct / 100) * 0.35}
                      stroke={thermal.rgbStr}
                      strokeWidth="1"
                    />
                    <text x="84" y="17" fontSize="7" fontFamily="monospace" fontWeight="bold" fill="#F5F3FA">
                      Register File (RF)
                    </text>

                    {/* Private L1-I / L1-D Cache Matrix Block */}
                    <rect
                      x="4"
                      y="26"
                      width="72"
                      height="20"
                      rx="3"
                      fill={thermal.rgbStr}
                      fillOpacity={0.22 + (thermal.utilizationPct / 100) * 0.4}
                      stroke={thermal.rgbStr}
                      strokeWidth="1"
                    />
                    <text x="8" y="39" fontSize="7" fontFamily="monospace" fontWeight="bold" fill="#F5F3FA">
                      32KB L1-Cache
                    </text>

                    {/* Snooping Bus Interface Block */}
                    <rect
                      x="80"
                      y="26"
                      width="76"
                      height="20"
                      rx="3"
                      fill={thermal.rgbStr}
                      fillOpacity={0.30 + (thermal.utilizationPct / 100) * 0.45}
                      stroke={thermal.rgbStr}
                      strokeWidth="1"
                    />
                    <text x="84" y="39" fontSize="7" fontFamily="monospace" fontWeight="bold" fill="#F5F3FA">
                      MESI Bus Node
                    </text>

                    {/* Animated Heatwave Ripples when Critical */}
                    {isCritical && (
                      <g stroke="#E55353" strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
                        <line x1="20" y1="2" x2="35" y2="2" />
                        <line x1="60" y1="2" x2="75" y2="2" />
                        <line x1="100" y1="2" x2="115" y2="2" />
                        <line x1="135" y1="2" x2="150" y2="2" />
                      </g>
                    )}
                  </svg>
                </div>

                {/* Heatmap Processing Load Bar */}
                <div className="relative z-10 my-2 p-2 rounded-lg bg-[#191522] border border-[#393044] space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#A9A0BC] font-medium">Core Load:</span>
                    <span className="font-bold tabular-nums" style={{ color: thermal.rgbStr }}>
                      {thermal.utilizationPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#100D18] overflow-hidden border border-[#393044] p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${thermal.utilizationPct}%`,
                        backgroundColor: thermal.rgbStr,
                      }}
                    />
                  </div>
                </div>

                {/* Sub-components of the Core */}
                <div className="relative z-10 space-y-1.5 text-[11px] font-mono">
                  <div className="p-1.5 rounded-lg bg-[#191522] border border-[#393044] flex justify-between">
                    <span className="text-[#A9A0BC]">ALU Formula:</span>
                    <span className="font-semibold text-[#F5F3FA]">L = ({j.n1}+{j.n2})×{j.w}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#191522] border border-[#393044] flex justify-between">
                    <span className="text-[#A9A0BC]">Target Hub:</span>
                    <span className="text-[#F5F3FA] font-bold truncate max-w-[105px]" title={j.name}>
                      {j.name.split(':')[0]}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#191522] border border-[#393044] flex justify-between">
                    <span className="text-[#A9A0BC]">Approach Load:</span>
                    <span className="font-bold tabular-nums" style={{ color: thermal.rgbStr }}>
                      {j.load.toFixed(1)} {isCritical ? '(Alert)' : ''}
                    </span>
                  </div>
                </div>

                {/* Live Core Load Stepper Controls */}
                {onUpdateJunctionLoad && (
                  <div className="relative z-10 mt-2.5 pt-2 border-t border-[#393044] flex items-center justify-between gap-1.5">
                    <span className="text-[10px] text-[#A9A0BC] font-mono">Tune:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateJunctionLoad(j.id, -12)}
                        className="px-2 py-0.5 rounded bg-[#100D18] hover:bg-[#201B29] text-[#A9A0BC] hover:text-[#F5F3FA] text-[10px] font-mono border border-[#393044] transition-colors cursor-pointer"
                        title="Reduce queue (Cools core)"
                      >
                        -12 Units
                      </button>
                      <button
                        onClick={() => onUpdateJunctionLoad(j.id, 20)}
                        className="px-2 py-0.5 rounded bg-[#3A1C24] hover:bg-[#4D2330] text-[#E55353] text-[10px] font-mono font-bold border border-[#5E2734] transition-colors cursor-pointer"
                        title="Spike queue"
                      >
                        +20 Spike
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Central Snooping Interconnect Bus Backbone (Unit 1 & 4 Interconnect) */}
        <div className="relative p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-inner space-y-2 font-mono">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30">
                <Share2 className="w-4 h-4 text-cyan-400" />
              </span>
              <div>
                <span className="font-bold text-white text-xs block">
                  High-Speed System Snooping Bus &amp; Crossbar Interconnect
                </span>
                <span className="text-[10px] text-slate-400">
                  Unit 1 &amp; 4: Dedicated 32-bit Address, 128-bit Cache Line Data, &amp; MESI Invalidate Snooping Lines
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">ADDR[31:0]</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">DATA[127:0]</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">CTRL/SNOOP</span>
            </div>
          </div>

          {/* Graphical Bus Lines Track */}
          <div className="space-y-1 pt-1">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 opacity-90 shadow-2xs shadow-amber-500/30" />
            <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 opacity-90 shadow-2xs shadow-purple-500/30" />
            <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 opacity-90 shadow-2xs shadow-emerald-500/30" />
          </div>
        </div>

        {/* Shared L2/L3 & Global Main Memory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#4D91E8]" />
              <h4 className="font-bold text-xs text-[#F5F3FA]">Unified Shared L2/L3 Cache (8MB)</h4>
            </div>
            <p className="text-xs text-[#A9A0BC]">
              Shared between Core 0–3. Maintains unified tag directory and cache lines.
            </p>
            <div className="text-[11px] font-mono text-[#F5F3FA] bg-[#100D18] p-2 rounded-lg border border-[#393044]">
              Shared Lines: <span className="text-[#4D91E8] font-semibold">0x0A40</span> (Signal Wave Sync), <span className="text-[#35B99B] font-semibold">0x0B10</span> (Emergency Route)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#35B99B]" />
              <h4 className="font-bold text-xs text-[#F5F3FA]">Main Memory (DRAM Global Matrix)</h4>
            </div>
            <p className="text-xs text-[#A9A0BC]">
              Holds master traffic density matrix, junction history table, and hardwired routines.
            </p>
            <div className="text-[11px] font-mono text-[#35B99B] bg-[#17332B] p-2 rounded-lg border border-[#265245] font-semibold">
              Global Memory State: Consistent (MESI Protocol Synchronized)
            </div>
          </div>
        </div>
      </div>

      {/* Unit 1: Interactive System Bus Timing & Waveform Diagram */}
      <BusTimingDiagram currentCycle={localCycle} />

      {/* Amdahl's Law Interactive Calculator & Execution Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Interactive Controls Card */}
        <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#393044] pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#E5A84D]" />
              <h3 className="font-bold text-sm text-[#F5F3FA]">Amdahl's Law Performance Calculator</h3>
            </div>
            <span className="text-xs font-mono font-semibold text-[#4D91E8] bg-[#191522] px-2 py-0.5 rounded border border-[#393044]">
              Interactive Model
            </span>
          </div>

          {/* Slider 1: Parallel Fraction P */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#A9A0BC]">
              <span className="font-medium">Parallelizable Traffic Code (P):</span>
              <span className="font-mono font-bold text-[#4D91E8] tabular-nums">
                {(parallelFractionP * 100).toFixed(0)}% ({parallelFractionP.toFixed(2)})
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.98"
              step="0.02"
              value={parallelFractionP}
              onChange={(e) => setParallelFractionP(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#191522] rounded-lg appearance-none cursor-pointer accent-[#4D91E8]"
            />
            <div className="flex justify-between text-[10px] text-[#A9A0BC]">
              <span>50% (Sequential)</span>
              <span className="text-[#4D91E8] font-medium">Default: 80%</span>
              <span>98% (Max Parallel)</span>
            </div>
          </div>

          {/* Core Count Selector */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-[#A9A0BC]">
              <span className="font-medium">Number of Processor Cores (N):</span>
              <span className="font-mono font-bold text-[#F5F3FA]">{coreCountN} Cores</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 4, 8, 16].map((num) => (
                <button
                  key={num}
                  onClick={() => setCoreCountN(num)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    coreCountN === num
                      ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white shadow-sm'
                      : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
                  }`}
                >
                  N={num}
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline Instruction Slider */}
          <div className="space-y-1 pt-1 border-t border-[#393044]">
            <div className="flex justify-between text-xs text-[#A9A0BC]">
              <span className="font-medium">Pipeline Program Instructions (n):</span>
              <span className="font-mono font-bold text-[#35B99B] tabular-nums">
                {instructionCountN} Instructions (k=4)
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={instructionCountN}
              onChange={(e) => setInstructionCountN(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#191522] rounded-lg appearance-none cursor-pointer accent-[#35B99B]"
            />
          </div>

          {/* Metric Outputs Strip */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
              <span className="text-[11px] text-[#A9A0BC] block">MIMD Speedup:</span>
              <span className="text-xl font-bold font-mono text-[#4D91E8] tabular-nums">
                {amdahlSpeedup.toFixed(2)}×
              </span>
              <span className="text-[10px] text-[#A9A0BC] block mt-0.5">
                Baseline (P=0.8, N=4): 2.50×
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
              <span className="text-[11px] text-[#A9A0BC] block">Pipeline Speedup:</span>
              <span className="text-xl font-bold font-mono text-[#35B99B] tabular-nums">
                {pipelineSpeedup.toFixed(2)}×
              </span>
              <span className="text-[10px] text-[#A9A0BC] block mt-0.5">
                Formula: nk / (k + n - 1)
              </span>
            </div>
          </div>
        </div>

        {/* Visual Benchmark & Latency Bars */}
        <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#393044] pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#35B99B]" />
              <h3 className="font-bold text-sm text-[#F5F3FA]">Execution Time &amp; Parallel Efficiency</h3>
            </div>
            <span className="text-xs font-mono font-semibold text-[#35B99B] bg-[#17332B] px-2 py-0.5 rounded border border-[#265245]">
              Efficiency: {parallelEfficiency.toFixed(1)}%
            </span>
          </div>

          {/* Sequential vs Parallel Time Comparison */}
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between text-xs text-[#A9A0BC] mb-1">
                <span>Single-Core (Sequential 1-Core Execution):</span>
                <span className="font-mono font-semibold text-[#F5F3FA]">{baselineSequentialTimeMs} ms</span>
              </div>
              <div className="w-full h-3 bg-[#191522] rounded-full overflow-hidden border border-[#393044]">
                <div className="h-full bg-[#393044] rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A9A0BC] mb-1">
                <span className="text-[#4D91E8] font-medium">
                  {coreCountN}-Core MIMD Parallel Execution Time:
                </span>
                <span className="font-mono font-bold text-[#4D91E8]">
                  {parallelTimeMs.toFixed(1)} ms
                </span>
              </div>
              <div className="w-full h-3 bg-[#191522] rounded-full overflow-hidden border border-[#393044]">
                <div
                  className="h-full bg-gradient-to-r from-[#4D91E8] to-[#35B99B] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(5, (parallelTimeMs / baselineSequentialTimeMs) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Time breakdown visualizer */}
            <div className="p-3 rounded-xl bg-[#191522] border border-[#393044] text-xs font-mono space-y-1.5">
              <div className="text-[#A9A0BC] text-[11px] font-sans font-medium">Time Breakdown:</div>
              <div className="flex justify-between text-[#A9A0BC]">
                <span>Serial Section (1 - P):</span>
                <span>{(serialFraction * baselineSequentialTimeMs).toFixed(1)} ms (Fixed bottleneck)</span>
              </div>
              <div className="flex justify-between text-[#4D91E8]">
                <span>Parallel Section (P / N):</span>
                <span>{((parallelFractionP * baselineSequentialTimeMs) / coreCountN).toFixed(1)} ms</span>
              </div>
              <div className="pt-1 border-t border-[#393044] flex justify-between font-bold text-[#F5F3FA]">
                <span>Total Latency Reduction:</span>
                <span className="text-[#35B99B]">-{(baselineSequentialTimeMs - parallelTimeMs).toFixed(1)} ms ({((1 - parallelTimeMs/baselineSequentialTimeMs)*100).toFixed(0)}% faster)</span>
              </div>
            </div>

            <div className="text-[11px] text-[#A9A0BC] bg-[#191522] p-2.5 rounded-lg border border-[#393044] leading-relaxed">
              <strong className="text-[#F5F3FA]">Architectural Note:</strong> As predicted by Amdahl's Law, even with infinite cores, speedup cannot exceed <span className="text-[#4D91E8] font-mono font-semibold">1 / (1 - P) = {(1 / serialFraction).toFixed(2)}×</span> due to sequential synchronization and MESI cache snooping overhead.
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Recharts Speedup Factor Tracker (Last 20 Clock Cycles) */}
      <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-4">
        {/* Header of Chart Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#393044]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#4D91E8]" />
              <h3 className="font-bold text-sm text-[#F5F3FA]">
                Real-Time Amdahl Speedup Factor (Last 20 Clock Cycles)
              </h3>
            </div>
            <p className="text-xs text-[#A9A0BC] mt-0.5">
              Tracking cycle-by-cycle MIMD speedup against theoretical limit S = 1 / ((1 - P) + P/N) with snooping bus latency jitter.
            </p>
          </div>

          {/* Controls Strip */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Metric Mode Switch */}
            <div className="flex items-center p-1 bg-[#191522] rounded-lg border border-[#393044] text-xs font-mono">
              <button
                onClick={() => setActiveChartMetric('speedup')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeChartMetric === 'speedup'
                    ? 'bg-[#201B29] text-[#F5F3FA] font-bold shadow-xs border border-[#393044]'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
                }`}
              >
                Speedup (S)
              </button>
              <button
                onClick={() => setActiveChartMetric('efficiency')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeChartMetric === 'efficiency'
                    ? 'bg-[#201B29] text-[#35B99B] font-bold shadow-xs border border-[#393044]'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
                }`}
              >
                Efficiency (η%)
              </button>
            </div>

            {/* Play/Pause Streaming */}
            <button
              onClick={() => setIsAutoStreaming(!isAutoStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                isAutoStreaming
                  ? 'bg-[#191522] text-[#4D91E8] border border-[#4D91E8]/40'
                  : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
              }`}
              title={isAutoStreaming ? 'Pause live stream' : 'Resume live stream'}
            >
              {isAutoStreaming ? <Pause className="w-3.5 h-3.5 text-[#4D91E8]" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoStreaming ? 'Streaming' : 'Paused'}</span>
            </button>

            {/* Step Tick */}
            <button
              onClick={handleTickCycle}
              className="p-1.5 rounded-lg bg-[#191522] hover:bg-[#251E33] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044] transition-colors cursor-pointer"
              title="Advance one clock cycle"
            >
              <Activity className="w-3.5 h-3.5 text-[#4D91E8]" />
            </button>

            {/* Reset */}
            <button
              onClick={handleResetHistory}
              className="p-1.5 rounded-lg bg-[#191522] hover:bg-[#251E33] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044] transition-colors cursor-pointer"
              title="Reset 20-cycle window"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-time Metrics Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
            <span className="text-[10px] text-[#A9A0BC] uppercase block">Latest Cycle</span>
            <span className="text-[#F5F3FA] font-bold text-sm">CC #{localCycle}</span>
            <span className="text-[10px] text-[#4D91E8] block mt-0.5">{isAutoStreaming ? 'Live Bus Snooping' : 'Holding State'}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
            <span className="text-[10px] text-[#A9A0BC] uppercase block">Measured Speedup</span>
            <span className="text-[#4D91E8] font-bold text-sm tabular-nums">{latestPoint.measuredSpeedup.toFixed(2)}×</span>
            <span className="text-[10px] text-[#A9A0BC] block mt-0.5">Real-world bus jitter</span>
          </div>
          <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
            <span className="text-[10px] text-[#A9A0BC] uppercase block">Amdahl Theoretical</span>
            <span className="text-[#E5A84D] font-bold text-sm tabular-nums">{amdahlSpeedup.toFixed(2)}×</span>
            <span className="text-[10px] text-[#A9A0BC] block mt-0.5">P={parallelFractionP}, N={coreCountN}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#191522] border border-[#393044]">
            <span className="text-[10px] text-[#A9A0BC] uppercase block">Current Efficiency</span>
            <span className="text-[#35B99B] font-bold text-sm tabular-nums">{latestPoint.efficiencyPct.toFixed(1)}%</span>
            <span className="text-[10px] text-[#A9A0BC] block mt-0.5">Target: &gt;60% nominal</span>
          </div>
        </div>

        {/* Recharts Line Chart Viewport */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={cycleHistory}
              margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#393044" />
              <XAxis
                dataKey="cycle"
                stroke="#393044"
                tick={{ fontSize: 10, fill: '#A9A0BC' }}
                interval={1}
              />
              <YAxis
                stroke="#393044"
                tick={{ fontSize: 10, fill: '#A9A0BC' }}
                domain={activeChartMetric === 'speedup' ? [1.0, Math.max(coreCountN, Math.ceil(amdahlSpeedup) + 0.5)] : [30, 100]}
                unit={activeChartMetric === 'speedup' ? 'x' : '%'}
              />
              <Tooltip content={<CustomSpeedupTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#A9A0BC' }}
                iconType="circle"
              />
              {activeChartMetric === 'speedup' ? (
                <>
                  <ReferenceLine
                    y={amdahlSpeedup}
                    stroke="#E5A84D"
                    strokeDasharray="4 4"
                    label={{
                      value: `Amdahl Limit (${amdahlSpeedup.toFixed(2)}x)`,
                      fill: '#E5A84D',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="measuredSpeedup"
                    name="Measured Speedup"
                    stroke="#4D91E8"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#4D91E8' }}
                    activeDot={{ r: 6, fill: '#35B99B' }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="theoreticalLimit"
                    name="Theoretical Limit"
                    stroke="#E5A84D"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="idealLinear"
                    name={`Ideal Linear (${coreCountN}x)`}
                    stroke="#A9A0BC"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              ) : (
                <>
                  <ReferenceLine
                    y={parallelEfficiency}
                    stroke="#35B99B"
                    strokeDasharray="4 4"
                    label={{
                      value: `Target Efficiency (${parallelEfficiency.toFixed(1)}%)`,
                      fill: '#35B99B',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="efficiencyPct"
                    name="Parallel Efficiency (%)"
                    stroke="#35B99B"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#35B99B' }}
                    activeDot={{ r: 6, fill: '#4D91E8' }}
                    isAnimationActive={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Interpretation */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Blue curve tracks simulated cycle speedup with realistic bus snooping latency variations.</span>
          </div>
          <span className="font-mono text-blue-700 font-semibold">
            Window: 20 Clock Cycles (CC #{cycleHistory[0]?.cycleNum} → CC #{localCycle})
          </span>
        </div>
      </div>
    </div>
  );
};
