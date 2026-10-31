/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calculator,
  Play,
  Pause,
  RotateCcw,
  Binary,
  Layers,
  HelpCircle,
  Cpu,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { JunctionData } from '../types';

interface AluBoothVisualizerProps {
  junctions: JunctionData[];
}

interface BoothStep {
  step: number;
  action: string;
  a: string;
  q: string;
  qMinus1: string;
  description: string;
}

export const AluBoothVisualizer: React.FC<AluBoothVisualizerProps> = ({ junctions }) => {
  // Select active junction to pull multiplicand from
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>('JUNCT_A');
  const activeJunction = junctions.find((j) => j.id === selectedJunctionId) || junctions[0];

  // Multiplicand M: total queue (N1 + N2), Multiplier Q: scaled integer weight
  const [multiplicandM, setMultiplicandM] = useState<number>(7);
  const [multiplierQ, setMultiplierQ] = useState<number>(3);
  const [bitWidth] = useState<number>(5);

  // Floating point weight demonstration
  const [floatWeight, setFloatWeight] = useState<number>(1.5);

  // Booth's Algorithm Step-by-Step State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showRadix4Comparison, setShowRadix4Comparison] = useState<boolean>(true);

  // Helper to convert signed integer to n-bit 2's complement binary string
  const toBinaryString = (val: number, bits: number): string => {
    let mask = (1 << bits) - 1;
    let n = val & mask;
    return (n >>> 0).toString(2).padStart(bits, '0');
  };

  // Pre-calculate all Booth's steps for given M and Q
  const boothTrace: BoothStep[] = React.useMemo(() => {
    const trace: BoothStep[] = [];
    const n = bitWidth;
    let A = 0;
    let Q = multiplierQ;
    let QMinus1 = 0;
    const M = multiplicandM;

    trace.push({
      step: 0,
      action: 'Initial State',
      a: toBinaryString(A, n),
      q: toBinaryString(Q, n),
      qMinus1: `${QMinus1}`,
      description: `Load A=0, Q=${multiplierQ} (${toBinaryString(Q, n)}), M=${multiplicandM} (${toBinaryString(M, n)}), Q-1=0`,
    });

    for (let i = 1; i <= n; i++) {
      const q0 = Q & 1;
      const pair = `${q0}${QMinus1}`;

      if (pair === '10') {
        A = A - M;
        trace.push({
          step: i,
          action: 'A <- A - M',
          a: toBinaryString(A, n),
          q: toBinaryString(Q, n),
          qMinus1: `${QMinus1}`,
          description: `Q0=1, Q-1=0: Subtract M from Accumulator (A = A - M)`,
        });
      } else if (pair === '01') {
        A = A + M;
        trace.push({
          step: i,
          action: 'A <- A + M',
          a: toBinaryString(A, n),
          q: toBinaryString(Q, n),
          qMinus1: `${QMinus1}`,
          description: `Q0=0, Q-1=1: Add M to Accumulator (A = A + M)`,
        });
      }

      // Arithmetic Right Shift (ARS) of {A, Q, Q-1}
      const combined = (A << (n + 1)) | ((Q & ((1 << n) - 1)) << 1) | QMinus1;
      const shifted = combined >> 1;

      QMinus1 = Q & 1;
      Q = (Q >> 1) | ((A & 1) << (n - 1));
      A = A >> 1;

      trace.push({
        step: i,
        action: 'ARS {A, Q, Q-1}',
        a: toBinaryString(A, n),
        q: toBinaryString(Q, n),
        qMinus1: `${QMinus1}`,
        description: `Cycle ${i}: Arithmetic Right Shift preserves sign bit`,
      });
    }

    return trace;
  }, [multiplicandM, multiplierQ, bitWidth]);

  // Auto-play timer for stepping through Booth's algorithm
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= boothTrace.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, boothTrace.length]);

  const currentStep = boothTrace[currentStepIndex] || boothTrace[0];
  const finalProduct = multiplicandM * multiplierQ;

  // Single Precision IEEE-754 calculation
  const getIeee754Representation = (val: number) => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, val);
    const intBits = view.getUint32(0);
    const binary = intBits.toString(2).padStart(32, '0');

    const signBit = binary[0];
    const exponentBits = binary.slice(1, 9);
    const mantissaBits = binary.slice(9);
    const exponentVal = parseInt(exponentBits, 2) - 127;
    const hex = '0x' + intBits.toString(16).toUpperCase().padStart(8, '0');

    return {
      signBit,
      exponentBits,
      mantissaBits,
      exponentVal,
      hex,
    };
  };

  const ieee754 = getIeee754Representation(floatWeight);

  const signedPresets = [
    { label: '7 × 3 = 21', m: 7, q: 3, desc: 'Positive × Positive' },
    { label: '-7 × 3 = -21', m: -7, q: 3, desc: 'Negative × Positive' },
    { label: '7 × -3 = -21', m: 7, q: -3, desc: 'Positive × Negative' },
    { label: '-5 × -4 = 20', m: -5, q: -4, desc: 'Negative × Negative' },
    { label: '11 × -2 = -22', m: 11, q: -2, desc: 'High Weight Scaling' },
  ];

  return (
    <div className="space-y-5">
      {/* Visualizer Header */}
      <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#F5F3FA] tracking-tight">
              ALU Hardware Booth Multiplier &amp; Numerical Computing
            </h2>
            <span className="text-xs font-mono font-semibold text-[#4D91E8] bg-[#191522] px-2.5 py-0.5 rounded-md border border-[#393044]">
              Hardware ALU Recoding
            </span>
          </div>
          <p className="text-xs text-[#A9A0BC] mt-1">
            Implements 2's complement hardware Booth Multiplier algorithm to compute Approach Load{' '}
            <code className="text-[#35B99B] font-mono font-semibold bg-[#191522] px-1.5 py-0.5 rounded border border-[#393044]">
              L = (N1 + N2) × W
            </code>{' '}
            without requiring sign-magnitude conversion, alongside IEEE-754 floating-point representations.
          </p>
        </div>

        {/* Quick Signed Presets */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-xs text-[#A9A0BC] font-medium mr-1">Signed Presets:</span>
          {signedPresets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setMultiplicandM(p.m);
                setMultiplierQ(p.q);
                setCurrentStepIndex(0);
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer border ${
                multiplicandM === p.m && multiplierQ === p.q
                  ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white font-bold border-transparent shadow-xs'
                  : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border-[#393044]'
              }`}
              title={p.desc}
            >
              {p.label.split(' = ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Booth's Algorithm Interactive Execution Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#393044] gap-2">
              <div>
                <h3 className="font-bold text-sm text-[#F5F3FA] flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#4D91E8]" />
                  <span>Booth's Multiplication Stepper (Radix-2)</span>
                </h3>
                <span className="text-[11px] text-[#A9A0BC]">
                  Hardware 5-Bit 2's Complement Shift &amp; Add/Sub Matrix
                </span>
              </div>

              {/* Stepper Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentStepIndex(0)}
                  className="p-1.5 rounded-lg bg-[#191522] hover:bg-[#251E33] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044] transition-colors cursor-pointer"
                  title="Reset to initial state"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white text-xs font-semibold shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Auto Step'}</span>
                </button>
                <button
                  disabled={currentStepIndex >= boothTrace.length - 1}
                  onClick={() => setCurrentStepIndex((p) => Math.min(boothTrace.length - 1, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-[#191522] hover:bg-[#251E33] text-[#F5F3FA] text-xs font-semibold border border-[#393044] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Next Step →
                </button>
              </div>
            </div>

            {/* Operand Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#191522] border border-[#393044]">
                <span className="text-[10px] text-[#A9A0BC] block uppercase">Multiplicand (M)</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min="-15"
                    max="15"
                    value={multiplicandM}
                    onChange={(e) => {
                      setMultiplicandM(parseInt(e.target.value) || 0);
                      setCurrentStepIndex(0);
                    }}
                    className="w-16 bg-[#100D18] border border-[#393044] rounded px-1.5 py-0.5 text-xs text-[#F5F3FA] font-bold focus:outline-none focus:border-[#4D91E8]"
                  />
                  <span className="text-[#A9A0BC] text-[10px]">Queue</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#191522] border border-[#393044]">
                <span className="text-[10px] text-[#A9A0BC] block uppercase">Multiplier (Q)</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min="-15"
                    max="15"
                    value={multiplierQ}
                    onChange={(e) => {
                      setMultiplierQ(parseInt(e.target.value) || 0);
                      setCurrentStepIndex(0);
                    }}
                    className="w-16 bg-[#100D18] border border-[#393044] rounded px-1.5 py-0.5 text-xs text-[#F5F3FA] font-bold focus:outline-none focus:border-[#4D91E8]"
                  />
                  <span className="text-[#A9A0BC] text-[10px]">Weight</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#191522] border border-[#393044]">
                <span className="text-[10px] text-[#A9A0BC] block uppercase">2's Complement (-M)</span>
                <span className="font-bold text-[#F5F3FA] mt-1 block">
                  {toBinaryString(-multiplicandM, bitWidth)} ({-multiplicandM})
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#191522] border border-[#393044]">
                <span className="text-[10px] text-[#4D91E8] block uppercase font-semibold">Expected Product</span>
                <span className="font-bold text-[#35B99B] text-sm mt-0.5 block">
                  {multiplicandM} × {multiplierQ} = {finalProduct}
                </span>
              </div>
            </div>

            {/* Active Hardware Register HUD (A, Q, Q-1) */}
            <div className="p-4 rounded-xl bg-[#100D18] text-[#F5F3FA] font-mono border border-[#393044] space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-[#393044] pb-2">
                <span className="text-[#A9A0BC] text-[11px]">Hardware Registers: Step {currentStepIndex} of {boothTrace.length - 1}</span>
                <span className="text-[#E5A84D] text-[11px] font-semibold bg-[#191522] px-2 py-0.5 rounded border border-[#393044]">
                  Action: {currentStep.action}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {/* Register A */}
                <div className="p-2.5 rounded-lg bg-[#191522] border border-[#393044]">
                  <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider block">Accumulator (A)</span>
                  <span className="text-lg font-bold text-[#4D91E8] tracking-widest">{currentStep.a}</span>
                  <span className="text-[10px] text-[#A9A0BC] block mt-0.5">5-bit signed</span>
                </div>

                {/* Register Q */}
                <div className="p-2.5 rounded-lg bg-[#191522] border border-[#393044]">
                  <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider block">Multiplier (Q)</span>
                  <span className="text-lg font-bold text-[#35B99B] tracking-widest">{currentStep.q}</span>
                  <span className="text-[10px] text-[#A9A0BC] block mt-0.5">Q₀ = {currentStep.q[currentStep.q.length - 1]}</span>
                </div>

                {/* Register Q-1 */}
                <div className="p-2.5 rounded-lg bg-[#191522] border border-[#393044]">
                  <span className="text-[10px] text-[#A9A0BC] uppercase tracking-wider block">Flip-Flop (Q₋₁)</span>
                  <span className="text-lg font-bold text-[#E5A84D] tracking-widest">{currentStep.qMinus1}</span>
                  <span className="text-[10px] text-[#A9A0BC] block mt-0.5">Bit pair: {currentStep.q[currentStep.q.length - 1]}{currentStep.qMinus1}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#191522] border border-[#393044] text-xs text-[#F5F3FA] flex items-center gap-2">
                <span className="text-[#35B99B] font-bold">Semantics:</span>
                <span className="text-[#A9A0BC]">{currentStep.description}</span>
              </div>
            </div>

            {/* Step Trace Log Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#393044] text-[#A9A0BC] text-[11px] bg-[#191522]">
                    <th className="py-2 px-3">Step</th>
                    <th className="py-2 px-3">Operation</th>
                    <th className="py-2 px-3 text-center text-[#4D91E8]">Accumulator (A)</th>
                    <th className="py-2 px-3 text-center text-[#35B99B]">Multiplier (Q)</th>
                    <th className="py-2 px-3 text-center text-[#E5A84D]">Q₋₁</th>
                    <th className="py-2 px-3">Action Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#393044]/60">
                  {boothTrace.map((st, i) => {
                    const isCurrent = currentStepIndex === i;
                    return (
                      <tr
                        key={i}
                        onClick={() => setCurrentStepIndex(i)}
                        className={`cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-[#191522] text-[#F5F3FA] font-bold'
                            : 'hover:bg-[#191522]/40 text-[#A9A0BC]'
                        }`}
                      >
                        <td className="py-1.5 px-3">{st.step}</td>
                        <td className="py-1.5 px-3 text-[#E5A84D]">{st.action}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-[#4D91E8]">{st.a}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-[#35B99B]">{st.q}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-[#E5A84D]">{st.qMinus1}</td>
                        <td className="py-1.5 px-3 text-[11px] text-[#A9A0BC] truncate max-w-xs">{st.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radix-2 vs Radix-4 Speedup Comparison */}
          {showRadix4Comparison && (
            <div className="p-4 rounded-2xl bg-[#191522] border border-[#393044] shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#393044]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#35B99B]" />
                  <h4 className="font-bold text-xs text-[#F5F3FA]">
                    Radix-2 vs Radix-4 High-Speed Multiplier Architecture
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-[#35B99B] bg-[#17332B] px-2 py-0.5 rounded border border-[#265245]">
                  50% Cycle Reduction
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#201B29] border border-[#393044] space-y-1">
                  <span className="text-[#4D91E8] font-bold block">Radix-2 Standard Booth (Active)</span>
                  <div className="text-[#A9A0BC] text-[11px] space-y-0.5">
                    <div>Bits inspected per step: <strong className="text-[#F5F3FA]">1 bit (Q₀, Q₋₁)</strong></div>
                    <div>Required hardware cycles: <strong className="text-[#F5F3FA]">n = 5 cycles</strong></div>
                    <div>Operations: +M, -M, 0</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#201B29] border border-[#393044] space-y-1">
                  <span className="text-[#35B99B] font-bold block">Radix-4 Modified Booth (Advanced)</span>
                  <div className="text-[#A9A0BC] text-[11px] space-y-0.5">
                    <div>Bits inspected per step: <strong className="text-[#F5F3FA]">2 bits (Qᵢ₊₁, Qᵢ, Qᵢ₋₁)</strong></div>
                    <div>Required hardware cycles: <strong className="text-[#35B99B]">n/2 = 3 cycles (40% faster)</strong></div>
                    <div>Operations: ±0, ±1M, ±2M (shifted M)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: IEEE-754 Floating Point Representation & Addressing Modes */}
        <div className="space-y-4">
          {/* Floating Point Representation */}
          <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#393044]">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-[#4D91E8]" />
                <h3 className="font-bold text-sm text-[#F5F3FA]">IEEE-754 Single Precision (32-Bit)</h3>
              </div>
              <span className="text-[10px] font-mono text-[#4D91E8] bg-[#191522] px-2 py-0.5 rounded border border-[#393044]">
                Vehicle Weights
              </span>
            </div>

            <p className="text-xs text-[#A9A0BC]">
              Vehicle weight factors (W = 1.0, 1.25, 1.5, 2.0) are encoded in standard 32-bit floating point:
            </p>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#A9A0BC] font-semibold">Test Weight (W):</span>
              {[1.0, 1.25, 1.5, 2.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setFloatWeight(val)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    floatWeight === val
                      ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white shadow-xs'
                      : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
                  }`}
                >
                  {val.toFixed(2)}x
                </button>
              ))}
            </div>

            {/* 32-Bit Bitfield Diagram */}
            <div className="p-3 rounded-xl bg-[#100D18] text-[#F5F3FA] font-mono text-xs space-y-2 border border-[#393044]">
              <div className="flex justify-between items-center text-[10px] text-[#A9A0BC]">
                <span>Weight Value: {floatWeight}</span>
                <span className="text-[#4D91E8] font-bold">{ieee754.hex}</span>
              </div>

              {/* Bit Breakdown */}
              <div className="grid grid-cols-12 gap-1 text-[10px] text-center">
                {/* Sign (1 bit) */}
                <div className="col-span-2 p-1.5 rounded bg-[#3A1C24] border border-[#5E2734] text-[#E55353]">
                  <span className="block text-[8px] text-[#A9A0BC]">Sign (1b)</span>
                  <span className="font-bold text-xs">{ieee754.signBit}</span>
                </div>
                {/* Exponent (8 bits) */}
                <div className="col-span-4 p-1.5 rounded bg-[#191522] border border-[#4D91E8]/40 text-[#4D91E8]">
                  <span className="block text-[8px] text-[#A9A0BC]">Exp (8b)</span>
                  <span className="font-bold text-[11px] truncate">{ieee754.exponentBits}</span>
                </div>
                {/* Mantissa (23 bits) */}
                <div className="col-span-6 p-1.5 rounded bg-[#17332B] border border-[#265245] text-[#35B99B]">
                  <span className="block text-[8px] text-[#A9A0BC]">Mantissa (23b)</span>
                  <span className="font-bold text-[10px] truncate">{ieee754.mantissaBits.slice(0, 8)}...</span>
                </div>
              </div>

              <div className="text-[10px] text-[#A9A0BC] pt-1 border-t border-[#393044] leading-relaxed font-sans">
                Formula: <strong className="text-[#F5F3FA] font-mono">(-1)^S × (1 + Mantissa) × 2^(Exp - 127)</strong>.
                Exp = {parseInt(ieee754.exponentBits, 2)} - 127 = <strong className="text-[#4D91E8] font-mono">{ieee754.exponentVal}</strong>.
              </div>
            </div>
          </div>

          {/* Bus Architecture & Addressing Modes Reference Card */}
          <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#393044]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#35B99B]" />
                <h3 className="font-bold text-sm text-[#F5F3FA]">Bus &amp; Addressing Modes</h3>
              </div>
              <span className="text-[10px] font-mono text-[#35B99B] bg-[#17332B] px-2 py-0.5 rounded border border-[#265245]">
                Architecture Specs
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[#191522] border border-[#393044] flex justify-between items-center">
                <span className="text-[#A9A0BC]">Bus Arbitration:</span>
                <span className="text-[#35B99B] font-bold">Centralized Round-Robin</span>
              </div>
              <div className="p-2 rounded-lg bg-[#191522] border border-[#393044] flex justify-between items-center">
                <span className="text-[#A9A0BC]">Data Bus Width:</span>
                <span className="text-[#F5F3FA] font-semibold">128-Bit High Throughput</span>
              </div>
              <div className="p-2 rounded-lg bg-[#191522] border border-[#393044] flex justify-between items-center">
                <span className="text-[#A9A0BC]">Address Bus:</span>
                <span className="text-[#F5F3FA] font-semibold">32-Bit Flat Address Space</span>
              </div>
            </div>

            {/* Addressing Modes Table */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#F5F3FA] block">Addressing Modes in System:</span>
              <div className="space-y-1 text-[10px] font-mono">
                <div className="p-1.5 rounded bg-[#191522] border border-[#393044] flex justify-between">
                  <span className="text-[#4D91E8] font-semibold">Direct Mode (I=0):</span>
                  <span className="text-[#A9A0BC]">LOAD R1, [0x100] (Lane 1 N1)</span>
                </div>
                <div className="p-1.5 rounded bg-[#191522] border border-[#393044] flex justify-between">
                  <span className="text-[#E5A84D] font-semibold">Indirect Mode (I=1):</span>
                  <span className="text-[#A9A0BC]">BUN [@0x200] (ISR Branch)</span>
                </div>
                <div className="p-1.5 rounded bg-[#191522] border border-[#393044] flex justify-between">
                  <span className="text-[#35B99B] font-semibold">Immediate Mode:</span>
                  <span className="text-[#A9A0BC]">MUL R1, #1.5 (Weight W)</span>
                </div>
                <div className="p-1.5 rounded bg-[#191522] border border-[#393044] flex justify-between">
                  <span className="text-[#A9A0BC] font-semibold">Register Mode:</span>
                  <span className="text-[#A9A0BC]">ADD R1, R2 (Accumulator)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
