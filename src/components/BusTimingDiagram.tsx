/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Database,
  Radio,
  Zap,
} from 'lucide-react';

export type BusOperationType = 'READ' | 'WRITE' | 'MESI_BROADCAST';

interface BusTimingDiagramProps {
  currentCycle?: number;
}

export const BusTimingDiagram: React.FC<BusTimingDiagramProps> = ({ currentCycle = 42 }) => {
  // Bus Transaction Configuration
  const [opType, setOpType] = useState<BusOperationType>('READ');
  const [selectedAddr, setSelectedAddr] = useState<string>('0x0100');
  const [insertWaitState, setInsertWaitState] = useState<boolean>(false);
  const [showTimingSpecs, setShowTimingSpecs] = useState<boolean>(true);

  // Playback & Scrubber State (time t from 0 to totalCycles)
  // 4 standard cycles: T1, T2, T3, T4. If wait state enabled: T1, T2, Tw, T3, T4 (5 cycles)
  const totalCycles = insertWaitState ? 5 : 4;
  const [currentT, setCurrentT] = useState<number>(1.5); // current time cursor
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5x, 1x, 2x
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Addresses and corresponding data in traffic junction context
  const memoryAddresses: Record<
    string,
    { label: string; name: string; readVal: string; writeVal: string; meaning: string }
  > = {
    '0x0100': {
      label: 'N1_VEHICLES',
      name: 'North Queue Sensor (Connaught Plz)',
      readVal: '0x0000002A (42 veh)',
      writeVal: '0x00000030 (48 veh)',
      meaning: 'Sensor register holding incoming queue count on Phase 1',
    },
    '0x0101': {
      label: 'N2_VEHICLES',
      name: 'South Queue Sensor (Hauz Khas)',
      readVal: '0x00000018 (24 veh)',
      writeVal: '0x0000001F (31 veh)',
      meaning: 'Secondary approach queue accumulator',
    },
    '0x0102': {
      label: 'GREEN_TIME_W',
      name: 'Traffic Signal Green Duration',
      readVal: '0x00000037 (55 sec)',
      writeVal: '0x00000041 (65 sec)',
      meaning: 'Computed adaptive green signal allocation',
    },
    '0x0103': {
      label: 'LOAD_CALC_L',
      name: 'ALU Traffic Density Matrix',
      readVal: '0x0000004B (75 %)',
      writeVal: '0x00000055 (85 %)',
      meaning: 'ALU multiplication output: L = (N1 + N2) * W',
    },
    '0x0A40': {
      label: 'MESI_SYNC_TAG',
      name: 'Shared Inter-Core Snooping Line',
      readVal: '0x00000001 (SHARED)',
      writeVal: '0x00000003 (MODIFIED)',
      meaning: 'Cache line coherency tag broadcasted via Snooping Bus',
    },
  };

  const activeData = memoryAddresses[selectedAddr] || memoryAddresses['0x0100'];

  // Animation Loop for live scrubbing
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimestampRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const elapsedSec = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      setCurrentT((prev) => {
        // Advance cycle: 1 cycle per 1.8 seconds at 1x speed
        const delta = (elapsedSec * playbackSpeed) / 1.8;
        let next = prev + delta;
        if (next >= totalCycles) {
          next = 0; // loop
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, totalCycles]);

  // Adjust cursor if wait state is toggled
  useEffect(() => {
    if (currentT >= totalCycles) {
      setCurrentT(totalCycles - 0.05);
    }
  }, [totalCycles, currentT]);

  // Helper cycle names
  const cycleNames = insertWaitState
    ? ['T1 (Addr Setup)', 'T2 (Bus Strobe)', 'Tw (Wait State)', 'T3 (Data Ready)', 'T4 (Latch/Release)']
    : ['T1 (Addr Setup)', 'T2 (Bus Strobe)', 'T3 (Data Ready)', 'T4 (Latch/Release)'];

  // Current phase index (0 to totalCycles - 1)
  const currentPhaseIndex = Math.min(totalCycles - 1, Math.floor(currentT));
  const currentCycleName = cycleNames[currentPhaseIndex] || 'T1';

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 360;
  const leftMargin = 150;
  const rightMargin = 40;
  const graphWidth = svgWidth - leftMargin - rightMargin;
  const cycleWidth = graphWidth / totalCycles;

  // Signal vertical row layout
  const signals = [
    { id: 'CLK', name: 'CLK (400MHz)', y: 45, color: '#38bdf8', desc: 'Master System Synchronous Clock' },
    { id: 'ADDR', name: 'ADDR [31:0]', y: 100, color: '#fbbf24', desc: 'Address Bus (Multiplexed/Dedicated)' },
    {
      id: 'RD',
      name: opType === 'MESI_BROADCAST' ? 'SNOOP_REQ#' : 'MEM_RD#',
      y: 155,
      color: '#34d399',
      desc: opType === 'MESI_BROADCAST' ? 'Snoop Invalidate Request' : 'Memory Read Control Strobe (Active-Low)',
    },
    {
      id: 'WR',
      name: opType === 'MESI_BROADCAST' ? 'SNOOP_HIT#' : 'MEM_WR#',
      y: 210,
      color: '#f87171',
      desc: opType === 'MESI_BROADCAST' ? 'Shared Cache Hit Strobe' : 'Memory Write Control Strobe (Active-Low)',
    },
    { id: 'DATA', name: 'DATA [127:0]', y: 265, color: '#c084fc', desc: '128-bit Cache Line Data Bus' },
    {
      id: 'READY',
      name: 'READY# / ACK',
      y: 320,
      color: '#a3e635',
      desc: 'Slave / Memory Device Ready Handshake',
    },
  ];

  // Calculate current signal levels based on currentT
  const getSignalState = (signalId: string, t: number) => {
    const cycleFraction = t % 1;
    const cycleIdx = Math.floor(t);

    switch (signalId) {
      case 'CLK':
        return cycleFraction < 0.5 ? 'HIGH (1)' : 'LOW (0)';

      case 'ADDR':
        if (t < 0.15) return 'TRANSITION';
        if (t < totalCycles - 0.2) return selectedAddr;
        return 'FLOAT';

      case 'RD':
        if (opType === 'WRITE') return 'HIGH (Inactive)';
        if (opType === 'READ') {
          // Drops LOW at falling edge of T1 (t=0.5), rises at T4 rising edge (t=totalCycles-1)
          if (t >= 0.5 && t < totalCycles - 1) return 'ACTIVE LOW (0)';
          return 'HIGH (Inactive 1)';
        }
        // MESI broadcast
        if (t >= 0.5 && t < totalCycles - 1.2) return 'ACTIVE LOW (BusRdX)';
        return 'HIGH (Inactive 1)';

      case 'WR':
        if (opType === 'READ') return 'HIGH (Inactive)';
        if (opType === 'WRITE') {
          // Drops LOW at falling edge of T1 (t=0.5), rises at t=totalCycles-1
          if (t >= 0.5 && t < totalCycles - 1) return 'ACTIVE LOW (0)';
          return 'HIGH (Inactive 1)';
        }
        // MESI Broadcast: Hit response
        if (t >= 1.5 && t < totalCycles - 0.5) return 'ACTIVE LOW (HIT#)';
        return 'HIGH (Inactive 1)';

      case 'DATA':
        if (opType === 'READ') {
          const dataValidStart = insertWaitState ? 2.2 : 1.8;
          if (t < dataValidStart) return 'Hi-Z (Floating)';
          if (t <= totalCycles - 0.1) return activeData.readVal;
          return 'Hi-Z (Floating)';
        } else if (opType === 'WRITE') {
          if (t < 0.5) return 'Hi-Z (Floating)';
          if (t <= totalCycles - 0.2) return activeData.writeVal;
          return 'Hi-Z (Floating)';
        } else {
          // MESI
          if (t < 1.8) return 'Hi-Z (Floating)';
          return 'TAG: 0x0A40 (MODIFIED)';
        }

      case 'READY':
        const readyAssertT = insertWaitState ? 2.5 : 1.5;
        if (t >= readyAssertT && t <= totalCycles - 0.8) {
          return 'LOW (0 - Memory Ready)';
        }
        return insertWaitState && t < readyAssertT && t >= 1.0 ? 'HIGH (1 - Wait Requested)' : 'HIGH (1 - Idle)';

      default:
        return 'UNKNOWN';
    }
  };

  // Convert time t into X coordinate
  const timeToX = (t: number) => leftMargin + t * cycleWidth;

  // Build Clock waveform path
  const buildClockPath = (rowY: number) => {
    const highY = rowY - 14;
    const lowY = rowY + 14;
    let d = `M ${leftMargin} ${lowY}`;
    for (let c = 0; c < totalCycles; c++) {
      const xStart = leftMargin + c * cycleWidth;
      const xMid = xStart + cycleWidth / 2;
      const xEnd = xStart + cycleWidth;
      d += ` L ${xStart} ${highY} L ${xMid} ${highY} L ${xMid} ${lowY} L ${xEnd} ${lowY}`;
    }
    return d;
  };

  // Build Address Bus crossover polygon path
  const buildAddressBusPaths = (rowY: number) => {
    const topY = rowY - 12;
    const botY = rowY + 12;
    const midY = rowY;
    const x0 = leftMargin;
    const xCross = leftMargin + cycleWidth * 0.15;
    const xEnd = leftMargin + (totalCycles - 0.2) * cycleWidth;
    const xFloat = leftMargin + totalCycles * cycleWidth;

    // Top rail
    const pathTop = `M ${x0} ${midY} L ${xCross} ${topY} L ${xEnd} ${topY} L ${xFloat} ${midY}`;
    // Bottom rail
    const pathBottom = `M ${x0} ${midY} L ${xCross} ${botY} L ${xEnd} ${botY} L ${xFloat} ${midY}`;
    // Polygon for fill
    const polygonPoints = `${x0},${midY} ${xCross},${topY} ${xEnd},${topY} ${xFloat},${midY} ${xEnd},${botY} ${xCross},${botY}`;

    return { pathTop, pathBottom, polygonPoints };
  };

  // Build Strobe Signal Path (Active-Low)
  const buildStrobePath = (rowY: number, isActive: boolean, startCycleT: number, endCycleT: number) => {
    const highY = rowY - 12;
    const lowY = rowY + 12;

    if (!isActive) {
      // Inactive: remains continuously HIGH
      return `M ${leftMargin} ${highY} L ${leftMargin + graphWidth} ${highY}`;
    }

    const xStart = leftMargin + startCycleT * cycleWidth;
    const xEnd = leftMargin + endCycleT * cycleWidth;

    return `M ${leftMargin} ${highY} L ${xStart} ${highY} L ${xStart} ${lowY} L ${xEnd} ${lowY} L ${xEnd} ${highY} L ${leftMargin + graphWidth} ${highY}`;
  };

  // Build Data Bus Waveform
  const buildDataBusWaveform = (rowY: number) => {
    const topY = rowY - 12;
    const botY = rowY + 12;
    const midY = rowY;

    if (opType === 'READ') {
      const validStartT = insertWaitState ? 2.2 : 1.8;
      const validEndT = totalCycles - 0.2;
      const xValidStart = leftMargin + validStartT * cycleWidth;
      const xValidEnd = leftMargin + validEndT * cycleWidth;
      const xCrossStart = xValidStart - cycleWidth * 0.12;
      const xCrossEnd = xValidEnd + cycleWidth * 0.12;

      // Floating lines before and after
      const hiz1 = `M ${leftMargin} ${midY} L ${xCrossStart} ${midY}`;
      const hiz2 = `M ${xCrossEnd} ${midY} L ${leftMargin + graphWidth} ${midY}`;

      // Valid bus packet
      const polygonPoints = `${xCrossStart},${midY} ${xValidStart},${topY} ${xValidEnd},${topY} ${xCrossEnd},${midY} ${xValidEnd},${botY} ${xValidStart},${botY}`;
      const pathTop = `M ${xCrossStart} ${midY} L ${xValidStart} ${topY} L ${xValidEnd} ${topY} L ${xCrossEnd} ${midY}`;
      const pathBottom = `M ${xCrossStart} ${midY} L ${xValidStart} ${botY} L ${xValidEnd} ${botY} L ${xCrossEnd} ${midY}`;

      return { hiz1, hiz2, polygonPoints, pathTop, pathBottom, validStartT, validEndT };
    } else {
      // WRITE
      const validStartT = 0.5;
      const validEndT = totalCycles - 0.2;
      const xValidStart = leftMargin + validStartT * cycleWidth;
      const xValidEnd = leftMargin + validEndT * cycleWidth;
      const xCrossStart = xValidStart - cycleWidth * 0.12;
      const xCrossEnd = xValidEnd + cycleWidth * 0.12;

      const hiz1 = `M ${leftMargin} ${midY} L ${xCrossStart} ${midY}`;
      const hiz2 = `M ${xCrossEnd} ${midY} L ${leftMargin + graphWidth} ${midY}`;

      const polygonPoints = `${xCrossStart},${midY} ${xValidStart},${topY} ${xValidEnd},${topY} ${xCrossEnd},${midY} ${xValidEnd},${botY} ${xValidStart},${botY}`;
      const pathTop = `M ${xCrossStart} ${midY} L ${xValidStart} ${topY} L ${xValidEnd} ${topY} L ${xCrossEnd} ${midY}`;
      const pathBottom = `M ${xCrossStart} ${midY} L ${xValidStart} ${botY} L ${xValidEnd} ${botY} L ${xCrossEnd} ${midY}`;

      return { hiz1, hiz2, polygonPoints, pathTop, pathBottom, validStartT, validEndT };
    }
  };

  // Build Ready line
  const buildReadyPath = (rowY: number) => {
    const highY = rowY - 12;
    const lowY = rowY + 12;
    const readyAssertT = insertWaitState ? 2.5 : 1.5;
    const readyEndT = totalCycles - 0.8;

    const xAssert = leftMargin + readyAssertT * cycleWidth;
    const xEnd = leftMargin + readyEndT * cycleWidth;

    return `M ${leftMargin} ${highY} L ${xAssert} ${highY} L ${xAssert} ${lowY} L ${xEnd} ${lowY} L ${xEnd} ${highY} L ${leftMargin + graphWidth} ${highY}`;
  };

  const addrBus = buildAddressBusPaths(signals[1].y);
  const dataBus = buildDataBusWaveform(signals[4].y);

  // Jump to specific cycle
  const jumpToCycle = (cycleIdx: number) => {
    setCurrentT(cycleIdx + 0.5);
    setIsPlaying(false);
  };

  return (
    <div className="rounded-2xl bg-[#201B29] border border-[#393044] shadow-xl overflow-hidden space-y-0 transition-all">
      {/* Top Banner Header */}
      <div className="p-5 border-b border-[#393044] bg-[#191522] text-[#F5F3FA]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#4D91E8]/20 text-[#4D91E8] border border-[#4D91E8]/30">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#F5F3FA] tracking-wide">
                    System Bus Timing &amp; Waveform Analyzer
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#191522] text-[#35B99B] border border-[#35B99B]/50 font-semibold uppercase">
                    Synchronous 400 MHz
                  </span>
                </div>
                <p className="text-xs text-[#A9A0BC] mt-0.5">
                  Synchronous multi-phase bus protocol showing Clock (CLK), Address Bus, Active-Low Strobe Signals, Hi-Z floating states, and Wait-State (<span className="text-[#E5A84D] font-mono">Tw</span>) insertion.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Operation Switcher */}
          <div className="flex items-center gap-2 shrink-0 bg-[#100D18] p-1.5 rounded-xl border border-[#393044]">
            <span className="text-[11px] font-mono text-[#A9A0BC] font-medium px-2">Operation:</span>
            <button
              onClick={() => {
                setOpType('READ');
                setCurrentT(1.5);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                opType === 'READ'
                  ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white shadow-sm'
                  : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]'
              }`}
            >
              MEM READ (LOAD)
            </button>
            <button
              onClick={() => {
                setOpType('WRITE');
                setCurrentT(1.5);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                opType === 'WRITE'
                  ? 'bg-[#E55353] text-white shadow-sm'
                  : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]'
              }`}
            >
              MEM WRITE (STORE)
            </button>
            <button
              onClick={() => {
                setOpType('MESI_BROADCAST');
                setCurrentT(1.5);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                opType === 'MESI_BROADCAST'
                  ? 'bg-[#4D91E8] text-white shadow-sm'
                  : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]'
              }`}
            >
              MESI SNOOP (BusRdX)
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Control Bar */}
      <div className="px-5 py-3.5 bg-[#191522] border-b border-[#393044] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Memory Address Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[#A9A0BC] font-semibold flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-[#4D91E8]" />
            Target Bus Line:
          </span>
          <div className="flex items-center gap-1 bg-[#100D18] p-1 rounded-lg border border-[#393044]">
            {Object.entries(memoryAddresses).map(([addrKey, val]) => (
              <button
                key={addrKey}
                onClick={() => setSelectedAddr(addrKey)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  selectedAddr === addrKey
                    ? 'bg-[#4D91E8] text-white shadow-sm'
                    : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]'
                }`}
                title={val.name}
              >
                {addrKey} <span className="font-normal opacity-85">({val.label})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Controls & Options */}
        <div className="flex items-center gap-3">
          {/* Wait State Toggle */}
          <button
            onClick={() => setInsertWaitState(!insertWaitState)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              insertWaitState
                ? 'bg-[#342818] text-[#E5A84D] border-[#574021]'
                : 'bg-[#100D18] text-[#A9A0BC] border-[#393044] hover:text-[#F5F3FA]'
            }`}
            title="Inject an asynchronous wait state (Tw) to simulate slow DRAM access time"
          >
            <span
              className={`w-2 h-2 rounded-full ${insertWaitState ? 'bg-[#E5A84D] animate-pulse' : 'bg-[#393044]'}`}
            />
            <span>{insertWaitState ? 'Wait State Tw (ACTIVE)' : '+ Insert Wait State (Tw)'}</span>
          </button>

          {/* Timing Specs Toggle */}
          <button
            onClick={() => setShowTimingSpecs(!showTimingSpecs)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              showTimingSpecs
                ? 'bg-[#201B29] text-[#F5F3FA] border-[#4D91E8]'
                : 'bg-[#100D18] text-[#A9A0BC] border-[#393044] hover:text-[#F5F3FA]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>AC Specs</span>
          </button>
        </div>
      </div>

      {/* Logic Analyzer Oscilloscope Viewport */}
      <div className="p-4 sm:p-6 bg-[#090d16] relative select-none">
        {/* Top Status Bar of Analyzer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              CHANNELS: 6 TRACES ACTIVE
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">
              TIMEBASE: <strong className="text-white">2.5 ns/div</strong> (400 MHz)
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400">
              CURSOR t = <strong className="text-white">{(currentT * 2.5).toFixed(2)} ns</strong> ({currentCycleName})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">Phase Jump:</span>
            {cycleNames.map((name, idx) => (
              <button
                key={name}
                onClick={() => jumpToCycle(idx)}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  currentPhaseIndex === idx
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* The SVG Oscilloscope Canvas */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[760px] h-[360px] font-mono select-none"
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            {/* Background grid dots and cycle division columns */}
            <defs>
              <pattern id="logicGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.75" fill="#1e293b" />
              </pattern>
              <linearGradient id="addrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="dataGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.18" />
              </linearGradient>
            </defs>

            {/* Background pattern */}
            <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#090d16" />
            <rect x={leftMargin} y="20" width={graphWidth} height={svgHeight - 40} fill="url(#logicGrid)" />

            {/* Vertical Cycle Boundary Guidelines & Headers */}
            {Array.from({ length: totalCycles + 1 }).map((_, c) => {
              const xPos = leftMargin + c * cycleWidth;
              const isWaitCycle = insertWaitState && c === 2;
              return (
                <g key={`col-${c}`}>
                  {/* Vertical division line */}
                  <line
                    x1={xPos}
                    y1={20}
                    x2={xPos}
                    y2={svgHeight - 15}
                    stroke={isWaitCycle ? '#f59e0b' : '#334155'}
                    strokeWidth={c === 0 || c === totalCycles ? 1.5 : 1}
                    strokeDasharray={c === 0 || c === totalCycles ? 'none' : '4 4'}
                    strokeOpacity={0.7}
                  />

                  {/* Cycle Header Box */}
                  {c < totalCycles && (
                    <g>
                      <rect
                        x={xPos + 4}
                        y={4}
                        width={cycleWidth - 8}
                        height={20}
                        rx="4"
                        fill={
                          currentPhaseIndex === c
                            ? insertWaitState && c === 2
                              ? '#78350f'
                              : '#0f766e'
                            : '#1e293b'
                        }
                        stroke={
                          currentPhaseIndex === c
                            ? insertWaitState && c === 2
                              ? '#f59e0b'
                              : '#14b8a6'
                            : '#334155'
                        }
                        strokeWidth="1"
                      />
                      <text
                        x={xPos + cycleWidth / 2}
                        y={17}
                        fill={currentPhaseIndex === c ? '#ffffff' : '#94a3b8'}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {cycleNames[c]}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Half-Cycle Clock Mid-Edge Guidelines */}
            {Array.from({ length: totalCycles }).map((_, c) => {
              const xMid = leftMargin + c * cycleWidth + cycleWidth / 2;
              return (
                <line
                  key={`mid-${c}`}
                  x1={xMid}
                  y1={24}
                  x2={xMid}
                  y2={svgHeight - 15}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="2 4"
                />
              );
            })}

            {/* Signal Row Backdrops & Labels */}
            {signals.map((sig) => (
              <g key={`row-${sig.id}`}>
                {/* Horizontal baseline guide */}
                <line
                  x1={leftMargin}
                  y1={sig.y}
                  x2={leftMargin + graphWidth}
                  y2={sig.y}
                  stroke="#1e293b"
                  strokeWidth="0.75"
                />

                {/* Left Header for Signal Trace */}
                <g>
                  <rect
                    x="10"
                    y={sig.y - 18}
                    width={leftMargin - 20}
                    height={36}
                    rx="6"
                    fill="#0f172a"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <circle cx="22" cy={sig.y} r="3.5" fill={sig.color} />
                  <text x="32" y={sig.y - 2} fill="#f8fafc" fontSize="10.5" fontWeight="bold">
                    {sig.name}
                  </text>
                  <text x="32" y={sig.y + 11} fill="#64748b" fontSize="8.5">
                    {getSignalState(sig.id, currentT)}
                  </text>
                </g>
              </g>
            ))}

            {/* ================= WAVEFORM TRACES ================= */}

            {/* 1. CLK Waveform */}
            <path
              d={buildClockPath(signals[0].y)}
              fill="none"
              stroke={signals[0].color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 2. ADDR [31:0] Bus Waveform */}
            <g>
              <polygon points={addrBus.polygonPoints} fill="url(#addrGrad)" stroke="none" />
              <path
                d={addrBus.pathTop}
                fill="none"
                stroke={signals[1].color}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d={addrBus.pathBottom}
                fill="none"
                stroke={signals[1].color}
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Bus label text inside packet */}
              <text
                x={leftMargin + (totalCycles / 2) * cycleWidth}
                y={signals[1].y + 4}
                fill="#fef08a"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {selectedAddr} · [{activeData.label}]
              </text>
            </g>

            {/* 3. MEM_RD# (or SNOOP_REQ#) Strobe */}
            <path
              d={buildStrobePath(
                signals[2].y,
                opType === 'READ' || opType === 'MESI_BROADCAST',
                0.5,
                insertWaitState ? 3.0 : 2.5
              )}
              fill="none"
              stroke={signals[2].color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {opType === 'READ' && (
              <text
                x={leftMargin + (insertWaitState ? 2.0 : 1.5) * cycleWidth}
                y={signals[2].y + 24}
                fill="#6ee7b7"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                Active-Low Assertion (Read DRAM/L3)
              </text>
            )}

            {/* 4. MEM_WR# (or SNOOP_HIT#) Strobe */}
            <path
              d={buildStrobePath(
                signals[3].y,
                opType === 'WRITE' || opType === 'MESI_BROADCAST',
                opType === 'MESI_BROADCAST' ? 1.5 : 0.5,
                insertWaitState ? 3.0 : 2.5
              )}
              fill="none"
              stroke={signals[3].color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {opType === 'WRITE' && (
              <text
                x={leftMargin + (insertWaitState ? 2.0 : 1.5) * cycleWidth}
                y={signals[3].y + 24}
                fill="#fca5a5"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                Active-Low Assertion (Write Strobe)
              </text>
            )}

            {/* 5. DATA [127:0] Bidirectional Bus */}
            <g>
              {/* Hi-Z dashed segments */}
              <path
                d={dataBus.hiz1}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.6"
                strokeDasharray="4 3"
              />
              <text
                x={leftMargin + (opType === 'READ' ? 0.7 : 0.25) * cycleWidth}
                y={signals[4].y - 4}
                fill="#94a3b8"
                fontSize="8.5"
                textAnchor="middle"
              >
                Hi-Z (Floating)
              </text>

              <path
                d={dataBus.hiz2}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.6"
                strokeDasharray="4 3"
              />

              {/* Active data packet */}
              <polygon points={dataBus.polygonPoints} fill="url(#dataGrad)" stroke="none" />
              <path
                d={dataBus.pathTop}
                fill="none"
                stroke={signals[4].color}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d={dataBus.pathBottom}
                fill="none"
                stroke={signals[4].color}
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Data payload string */}
              <text
                x={leftMargin + ((dataBus.validStartT + dataBus.validEndT) / 2) * cycleWidth}
                y={signals[4].y + 4}
                fill="#f3e8ff"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {opType === 'READ' ? activeData.readVal : activeData.writeVal}
              </text>
            </g>

            {/* 6. READY# Handshake Line */}
            <path
              d={buildReadyPath(signals[5].y)}
              fill="none"
              stroke={signals[5].color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {insertWaitState && (
              <text
                x={leftMargin + 1.8 * cycleWidth}
                y={signals[5].y - 15}
                fill="#f59e0b"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                READY# = 1 (Slave Inserts Tw)
              </text>
            )}

            {/* ================= LIVE TIMING CURSOR ================= */}
            <g>
              {/* Vertical Time Indicator Line */}
              <line
                x1={timeToX(currentT)}
                y1={20}
                x2={timeToX(currentT)}
                y2={svgHeight - 15}
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="none"
              />

              {/* Top Cursor Flag */}
              <polygon
                points={`${timeToX(currentT) - 6},18 ${timeToX(currentT) + 6},18 ${timeToX(currentT)},28`}
                fill="#f43f5e"
              />

              {/* Bottom Cursor Timestamp Badge */}
              <rect
                x={timeToX(currentT) - 34}
                y={svgHeight - 16}
                width="68"
                height="16"
                rx="3"
                fill="#f43f5e"
              />
              <text
                x={timeToX(currentT)}
                y={svgHeight - 4}
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                {(currentT * 2.5).toFixed(1)} ns
              </text>
            </g>
          </svg>
        </div>

        {/* Oscilloscope Scrubber Bar and Control Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          {/* Play / Step Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY CYCLE'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentT((prev) => Math.max(0, parseFloat((prev - 0.25).toFixed(2))));
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Step backward 0.25 cycle"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentT((prev) => (prev + 0.25 >= totalCycles ? 0 : parseFloat((prev + 0.25).toFixed(2))));
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Step forward 0.25 cycle"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentT(0);
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Reset to T1 start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Speed Multiplier */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-[10px]">
              {[0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    playbackSpeed === spd ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Scrubber Range Slider */}
          <div className="flex items-center gap-3 w-full sm:w-1/2">
            <span className="text-slate-400 text-[10px] shrink-0">Phase Scrub:</span>
            <input
              type="range"
              min="0"
              max={totalCycles}
              step="0.05"
              value={currentT}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentT(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-cyan-300 font-bold shrink-0 text-right w-14">
              T{Math.floor(currentT) + 1}.{(Math.floor((currentT % 1) * 10))}
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Breakdown Panel (Examos Theme) */}
      <div className="p-5 bg-[#191522] border-t border-[#393044] space-y-4">
        {/* Phase Breakdown Cards (Examos Theme) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* T1 Card */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              currentPhaseIndex === 0
                ? 'bg-[#191522] border-[#4D91E8] shadow-sm'
                : 'bg-[#191522]/60 border-[#393044]'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#393044] mb-2">
              <span className="font-bold text-[#F5F3FA] font-mono flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${currentPhaseIndex === 0 ? 'bg-[#4D91E8] animate-ping' : 'bg-[#393044]'}`}
                />
                Phase T1: Address Drive
              </span>
              <span className="text-[10px] font-mono font-bold text-[#4D91E8] bg-[#100D18] px-1.5 py-0.5 rounded border border-[#393044]">
                0.0 – 2.5 ns
              </span>
            </div>
            <p className="text-[11px] text-[#A9A0BC] leading-relaxed">
              CPU places 32-bit physical address onto <code className="text-[#F5F3FA] font-semibold">ADDR[31:0]</code>. Address latch enable (<span className="text-[#4D91E8] font-mono">ALE</span>) pulses high.
            </p>
          </div>

          {/* T2 Card */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              currentPhaseIndex === 1
                ? 'bg-[#191522] border-[#35B99B] shadow-sm'
                : 'bg-[#191522]/60 border-[#393044]'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#393044] mb-2">
              <span className="font-bold text-[#F5F3FA] font-mono flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${currentPhaseIndex === 1 ? 'bg-[#35B99B] animate-ping' : 'bg-[#393044]'}`}
                />
                Phase T2: Strobe Assertion
              </span>
              <span className="text-[10px] font-mono font-bold text-[#35B99B] bg-[#100D18] px-1.5 py-0.5 rounded border border-[#393044]">
                2.5 – 5.0 ns
              </span>
            </div>
            <p className="text-[11px] text-[#A9A0BC] leading-relaxed">
              Control strobe drops to Active-Low (<code className="text-[#35B99B] font-semibold">{opType === 'WRITE' ? 'MEM_WR# = 0' : 'MEM_RD# = 0'}</code>). DRAM address decoders activate word-line.
            </p>
          </div>

          {/* Tw or T3 Card */}
          {insertWaitState && (
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                currentPhaseIndex === 2
                  ? 'bg-[#342818] border-[#E5A84D]'
                  : 'bg-[#191522]/60 border-[#393044]'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#393044] mb-2">
                <span className="font-bold text-[#F5F3FA] font-mono flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${currentPhaseIndex === 2 ? 'bg-[#E5A84D] animate-ping' : 'bg-[#393044]'}`}
                  />
                  Tw: Memory Wait State
                </span>
                <span className="text-[10px] font-mono font-bold text-[#E5A84D] bg-[#100D18] px-1.5 py-0.5 rounded border border-[#393044]">
                  Tw +2.5 ns
                </span>
              </div>
              <p className="text-[11px] text-[#A9A0BC] leading-relaxed">
                Slow memory holds <code className="text-[#E5A84D] font-semibold">READY# = HIGH (1)</code>. The CPU extends bus cycles by inserting null clock period <span className="font-mono font-bold text-[#E5A84D]">Tw</span> without dropping strobes.
              </p>
            </div>
          )}

          {/* T3 Card */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              (insertWaitState && currentPhaseIndex === 3) || (!insertWaitState && currentPhaseIndex === 2)
                ? 'bg-[#191522] border-[#4D91E8] shadow-sm'
                : 'bg-[#191522]/60 border-[#393044]'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#393044] mb-2">
              <span className="font-bold text-[#F5F3FA] font-mono flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    (insertWaitState && currentPhaseIndex === 3) || (!insertWaitState && currentPhaseIndex === 2)
                      ? 'bg-[#4D91E8] animate-ping'
                      : 'bg-[#393044]'
                  }`}
                />
                Phase T3: Data Valid
              </span>
              <span className="text-[10px] font-mono font-bold text-[#4D91E8] bg-[#100D18] px-1.5 py-0.5 rounded border border-[#393044]">
                {insertWaitState ? '7.5 – 10.0 ns' : '5.0 – 7.5 ns'}
              </span>
            </div>
            <p className="text-[11px] text-[#A9A0BC] leading-relaxed">
              Memory asserts <code className="text-[#4D91E8] font-semibold">READY# = 0</code>. Valid data block (<code className="text-[#35B99B] font-semibold">{activeData.readVal}</code>) stabilizes on lines <strong>DATA[127:0]</strong> satisfying setup time.
            </p>
          </div>

          {/* T4 Card */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              (insertWaitState && currentPhaseIndex === 4) || (!insertWaitState && currentPhaseIndex === 3)
                ? 'bg-[#191522] border-[#393044]'
                : 'bg-[#191522]/60 border-[#393044]'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#393044] mb-2">
              <span className="font-bold text-[#F5F3FA] font-mono flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    (insertWaitState && currentPhaseIndex === 4) || (!insertWaitState && currentPhaseIndex === 3)
                      ? 'bg-[#F5F3FA] animate-ping'
                      : 'bg-[#393044]'
                  }`}
                />
                Phase T4: Latch &amp; Release
              </span>
              <span className="text-[10px] font-mono font-bold text-[#A9A0BC] bg-[#100D18] px-1.5 py-0.5 rounded border border-[#393044]">
                Bus Release
              </span>
            </div>
            <p className="text-[11px] text-[#A9A0BC] leading-relaxed">
              CPU latches data into destination register on rising clock edge of T4. Control strobes return HIGH. Data bus floats back to Hi-Z for arbitration handover.
            </p>
          </div>
        </div>

        {/* AC Timing Characteristics */}
        {showTimingSpecs && (
          <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#393044] pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4D91E8]" />
                <h4 className="font-bold text-[#F5F3FA]">
                  Synchronous Bus AC Timing Parameters
                </h4>
              </div>
              <span className="text-[11px] font-mono text-[#A9A0BC]">IEEE Std 1196 Compliant Interface</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-[#100D18] border border-[#393044]">
                <span className="text-[#A9A0BC] block text-[10px]">Bus Clock Period (tCLK):</span>
                <span className="text-[#F5F3FA] font-bold text-sm">2.50 ns</span>
                <span className="text-[#A9A0BC] text-[10px] block">f = 400 MHz system clock</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#100D18] border border-[#393044]">
                <span className="text-[#A9A0BC] block text-[10px]">Memory Access Time (tACC):</span>
                <span className="text-[#35B99B] font-bold text-sm">3.75 ns</span>
                <span className="text-[#A9A0BC] text-[10px] block">Address valid to Data stable</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#100D18] border border-[#393044]">
                <span className="text-[#A9A0BC] block text-[10px]">Data Setup Time (tSU):</span>
                <span className="text-[#4D91E8] font-bold text-sm">0.80 ns</span>
                <span className="text-[#A9A0BC] text-[10px] block">Min time before T4 edge</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#100D18] border border-[#393044]">
                <span className="text-[#A9A0BC] block text-[10px]">Data Hold Time (tH):</span>
                <span className="text-[#E5A84D] font-bold text-sm">0.45 ns</span>
                <span className="text-[#A9A0BC] text-[10px] block">Min hold time after strobe</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
