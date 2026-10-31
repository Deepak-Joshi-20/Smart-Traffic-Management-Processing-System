/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Activity,
  Database,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  TrendingDown,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { MesiState, CoreMesiLine } from '../types';
import { INITIAL_MESI_LINES } from '../data/mockData';

interface MesiMonitorProps {
  onLogEvent?: (message: string, level: 'INFO' | 'WARN' | 'HAZARD') => void;
}

interface CacheLineRecord {
  address: string;
  name: string;
  lines: CoreMesiLine[];
}

export const MesiMonitor: React.FC<MesiMonitorProps> = ({ onLogEvent }) => {
  // Multi-line address matrix
  const [selectedAddress, setSelectedAddress] = useState<string>('0x0A40');
  const [cacheDatabase, setCacheDatabase] = useState<Record<string, CoreMesiLine[]>>({
    '0x0A40': INITIAL_MESI_LINES,
    '0x0B10': [
      { coreId: 0, cacheLineAddress: '0x0B10', data: 'EMERGENCY_CORRIDOR=OFF', state: 'S', lastAction: 'Shared Read' },
      { coreId: 1, cacheLineAddress: '0x0B10', data: 'EMERGENCY_CORRIDOR=OFF', state: 'S', lastAction: 'Shared Read' },
      { coreId: 2, cacheLineAddress: '0x0B10', data: 'EMERGENCY_CORRIDOR=OFF', state: 'E', lastAction: 'Exclusive Read' },
      { coreId: 3, cacheLineAddress: '0x0B10', data: 'EMERGENCY_CORRIDOR=OFF', state: 'I', lastAction: 'Invalidated by Core 2' },
    ],
    '0x0C80': [
      { coreId: 0, cacheLineAddress: '0x0C80', data: 'PRIORITY_OVERRIDE=JUNCT_D', state: 'I', lastAction: 'Invalidated' },
      { coreId: 1, cacheLineAddress: '0x0C80', data: 'PRIORITY_OVERRIDE=JUNCT_D', state: 'I', lastAction: 'Invalidated' },
      { coreId: 2, cacheLineAddress: '0x0C80', data: 'PRIORITY_OVERRIDE=JUNCT_D', state: 'I', lastAction: 'Invalidated' },
      { coreId: 3, cacheLineAddress: '0x0C80', data: 'PRIORITY_OVERRIDE=JUNCT_D', state: 'M', lastAction: 'Modified Dirty Write' },
    ],
    '0x0DF0': [
      { coreId: 0, cacheLineAddress: '0x0DF0', data: 'DENSITY_INDEX_A=38.4%', state: 'E', lastAction: 'Exclusive Clean' },
      { coreId: 1, cacheLineAddress: '0x0DF0', data: 'DENSITY_INDEX_A=38.4%', state: 'I', lastAction: 'Cold Line' },
      { coreId: 2, cacheLineAddress: '0x0DF0', data: 'DENSITY_INDEX_A=38.4%', state: 'I', lastAction: 'Cold Line' },
      { coreId: 3, cacheLineAddress: '0x0DF0', data: 'DENSITY_INDEX_A=38.4%', state: 'I', lastAction: 'Cold Line' },
    ],
  });

  const [busActivity, setBusActivity] = useState<string | null>('Bus Synchronized · Snooping Active');
  const [invalidationCount, setInvalidationCount] = useState<number>(14);
  const [busTransactions, setBusTransactions] = useState<number>(38);
  const [isPingPongActive, setIsPingPongActive] = useState<boolean>(false);

  const [coherenceLogs, setCoherenceLogs] = useState<string[]>([
    'Core 0 issued BusRd for CacheLine 0x0A40 (Shared Signal Wave Sync) -> State: S',
    'Core 1 snooped BusRd on address 0x0A40 -> Shared line acknowledged -> State: S',
    'Core 3 executed write to Priority Override (0x0C80) -> Issued BusRdX -> State: M',
  ]);

  const activeLines = cacheDatabase[selectedAddress] || cacheDatabase['0x0A40'];

  const addressMetadata: Record<string, { label: string; desc: string }> = {
    '0x0A40': { label: 'Signal Green Wave Sync', desc: 'Synchronized cycle offsets between Junction A and Junction B' },
    '0x0B10': { label: 'Emergency Priority Override', desc: 'Municipal ambulance route clearance flag' },
    '0x0C80': { label: 'Downtown Core Queue Depth', desc: 'Real-time vehicle accumulation counter for Core 3' },
    '0x0DF0': { label: 'Airport Logistics Density Index', desc: 'Heavy vehicle freight weighting table' },
  };

  const stateDefinitions: Record<MesiState, { name: string; desc: string; color: string; badge: string }> = {
    M: {
      name: 'Modified (Dirty)',
      desc: 'Line is present only in this cache and dirty. Must write-back to memory on eviction.',
      color: 'border-[#5E2734] bg-[#3A1C24] text-[#E55353]',
      badge: 'bg-[#E55353] text-white font-bold',
    },
    E: {
      name: 'Exclusive (Clean)',
      desc: 'Line is present only in this cache and clean. Can upgrade to M without bus traffic.',
      color: 'border-[#265245] bg-[#17332B] text-[#35B99B]',
      badge: 'bg-[#35B99B] text-white font-bold',
    },
    S: {
      name: 'Shared (Clean)',
      desc: 'Line is present in multiple cores caches. Clean with memory. Read-only access allowed.',
      color: 'border-[#4D91E8]/40 bg-[#191522] text-[#4D91E8]',
      badge: 'bg-[#4D91E8] text-white font-bold',
    },
    I: {
      name: 'Invalid',
      desc: 'Line does not contain valid data. Core must issue BusRd to read or BusRdX to modify.',
      color: 'border-[#393044] bg-[#191522] text-[#A9A0BC]',
      badge: 'bg-[#393044] text-[#A9A0BC] font-bold',
    },
  };

  // Ping-Pong False Sharing Stress Test Simulation Loop
  useEffect(() => {
    if (!isPingPongActive) return;

    let step = 0;
    const interval = setInterval(() => {
      const activeCore = step % 2 === 0 ? 0 : 1;
      const otherCore = step % 2 === 0 ? 1 : 0;

      setCacheDatabase((prev) => {
        const lines = prev[selectedAddress] || [];
        const updated = lines.map((l) => {
          if (l.coreId === activeCore) {
            return { ...l, state: 'M' as MesiState, lastAction: `Ping-Pong write to byte ${step % 8} -> M` };
          }
          if (l.coreId === otherCore) {
            return { ...l, state: 'I' as MesiState, lastAction: `Invalidated by Core ${activeCore} write` };
          }
          return l;
        });
        return { ...prev, [selectedAddress]: updated };
      });

      setInvalidationCount((c) => c + 1);
      setBusTransactions((t) => t + 2);
      const logMsg = `[False Sharing Ping-Pong] Core ${activeCore} wrote adjacent word -> Core ${otherCore} invalidated! (Thrashing!)`;
      setBusActivity(`Bus Storm: Rapid BusRdX invalidations on ${selectedAddress}`);
      setCoherenceLogs((logs) => [logMsg, ...logs.slice(0, 9)]);

      step++;
      if (step >= 8) {
        setIsPingPongActive(false);
        setBusActivity('False Sharing test complete. Coherence re-stabilized.');
      }
    }, 900);

    return () => clearInterval(interval);
  }, [isPingPongActive, selectedAddress]);

  const handleBusRd = (coreId: number) => {
    setCacheDatabase((prev) => {
      const currentLines = prev[selectedAddress] || [];
      const otherHolders = currentLines.filter((l) => l.coreId !== coreId && l.state !== 'I');
      const otherModified = currentLines.find((l) => l.coreId !== coreId && l.state === 'M');
      const newState: MesiState = otherHolders.length > 0 ? 'S' : 'E';

      const updated = currentLines.map((l) => {
        if (l.coreId === coreId) {
          return {
            ...l,
            state: newState,
            lastAction: `Read ${selectedAddress} via BusRd -> State: ${newState}`,
          };
        }
        if (otherModified && l.coreId === otherModified.coreId) {
          return {
            ...l,
            state: 'S' as MesiState,
            lastAction: `Snooped BusRd: Flushed modified data to memory -> State: S`,
          };
        }
        return l;
      });

      setBusTransactions((t) => t + 1);
      const logMsg = `Core ${coreId} issued BusRd for ${selectedAddress} -> State: ${newState}`;
      setBusActivity(`Bus Activity: BusRd on ${selectedAddress} from Core ${coreId}`);
      setCoherenceLogs((logs) => [logMsg, ...logs.slice(0, 9)]);
      if (onLogEvent) onLogEvent(logMsg, 'INFO');
      return { ...prev, [selectedAddress]: updated };
    });
  };

  const handleBusRdX = (coreId: number) => {
    setCacheDatabase((prev) => {
      const currentLines = prev[selectedAddress] || [];
      const updated = currentLines.map((l) => {
        if (l.coreId === coreId) {
          return {
            ...l,
            state: 'M' as MesiState,
            lastAction: `Wrote to ${selectedAddress} via BusRdX -> State: M`,
          };
        }
        return {
          ...l,
          state: 'I' as MesiState,
          lastAction: `Snooped BusRdX from Core ${coreId}: Cache line invalidated -> State: I`,
        };
      });

      setInvalidationCount((c) => c + 1);
      setBusTransactions((t) => t + 2);
      const logMsg = `Core ${coreId} wrote to ${selectedAddress} [BusRdX Invalidation Broadcast] -> Core ${coreId} is now MODIFIED (M)`;
      setBusActivity(`Bus Activity: BusRdX Invalidation Broadcast from Core ${coreId}!`);
      setCoherenceLogs((logs) => [logMsg, ...logs.slice(0, 9)]);
      if (onLogEvent) onLogEvent(logMsg, 'WARN');
      return { ...prev, [selectedAddress]: updated };
    });
  };

  const handleFlush = (coreId: number) => {
    setCacheDatabase((prev) => {
      const currentLines = prev[selectedAddress] || [];
      const target = currentLines.find((l) => l.coreId === coreId);
      if (!target || target.state === 'I') return prev;

      const updated = currentLines.map((l) => {
        if (l.coreId === coreId) {
          return {
            ...l,
            state: 'E' as MesiState,
            lastAction: 'Flushed dirty line to DRAM -> Now Clean E',
          };
        }
        return l;
      });

      setBusTransactions((t) => t + 1);
      const logMsg = `Core ${coreId} flushed modified cache line ${selectedAddress} back to DRAM Main Memory -> State: E`;
      setBusActivity(`Bus Activity: Memory Write-Back from Core ${coreId}`);
      setCoherenceLogs((logs) => [logMsg, ...logs.slice(0, 9)]);
      if (onLogEvent) onLogEvent(logMsg, 'INFO');
      return { ...prev, [selectedAddress]: updated };
    });
  };

  return (
    <div className="space-y-5">
      {/* MESI Header & Bus Status */}
      <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#F5F3FA] tracking-tight">
              MESI Cache Coherence Protocol &amp; Snooping Bus Monitor
            </h2>
            <span className="text-xs font-mono font-semibold text-[#35B99B] bg-[#17332B] px-2.5 py-0.5 rounded-md border border-[#265245]">
              Snooping Matrix Active
            </span>
          </div>
          <p className="text-xs text-[#A9A0BC] mt-1">
            Maintains memory consistency across L1 Caches for the 4 parallel cores. Prevents stale signal parameters and priority collision hazards.
          </p>
        </div>

        {/* Coherence Metrics & Ping-Pong Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-[#191522] px-3 py-1.5 rounded-xl border border-[#393044] text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#A9A0BC] block">Bus Invalidations</span>
              <span className="font-bold text-[#E55353] tabular-nums">{invalidationCount}</span>
            </div>
            <div className="border-l border-[#393044] pl-3">
              <span className="text-[10px] text-[#A9A0BC] block">Bus Transactions</span>
              <span className="font-bold text-[#4D91E8] tabular-nums">{busTransactions}</span>
            </div>
          </div>

          <button
            onClick={() => setIsPingPongActive(true)}
            disabled={isPingPongActive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isPingPongActive
                ? 'bg-[#3A1C24] text-[#E55353] border border-[#5E2734] animate-pulse'
                : 'bg-[#191522] hover:bg-[#251E33] text-[#F5F3FA] border border-[#393044]'
            }`}
            title="Demonstrate false sharing: multiple cores repeatedly write to adjacent words in the same 64-byte line"
          >
            <Zap className="w-3.5 h-3.5 text-[#E5A84D]" />
            <span>{isPingPongActive ? 'Ping-Pong Storming...' : 'Test False Sharing'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Line Cache Selector Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(addressMetadata).map(([addr, meta]) => {
          const isSel = selectedAddress === addr;
          return (
            <button
              key={addr}
              onClick={() => setSelectedAddress(addr)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSel
                  ? 'bg-[#191522] border-[#4D91E8] shadow-sm shadow-[#4D91E8]/10'
                  : 'bg-[#201B29] border-[#393044] hover:border-[#4D91E8]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#4D91E8]">{addr}</span>
                {isSel && <span className="w-2 h-2 rounded-full bg-[#35B99B]" />}
              </div>
              <div className="text-xs font-bold text-[#F5F3FA] mt-1 truncate">{meta.label}</div>
              <div className="text-[10px] text-[#A9A0BC] truncate mt-0.5">{meta.desc}</div>
            </button>
          );
        })}
      </div>

      {/* 4 State Definitions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(['M', 'E', 'S', 'I'] as MesiState[]).map((stateKey) => {
          const st = stateDefinitions[stateKey];
          return (
            <div key={stateKey} className={`p-3.5 rounded-xl border ${st.color} shadow-xs space-y-1`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-tight">{st.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${st.badge}`}>
                  State [{stateKey}]
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Interactive 4-Core Snooping Bus Cache Matrix */}
      <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#393044]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#4D91E8]" />
            <h3 className="font-bold text-sm text-[#F5F3FA]">
              Active Snooping Bus: Address Line [{selectedAddress}]
            </h3>
          </div>
          <span className="text-xs font-mono text-[#35B99B] bg-[#17332B] px-2 py-0.5 rounded border border-[#265245]">
            {busActivity}
          </span>
        </div>

        {/* 4 Cores L1 Cache Lines */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {activeLines.map((line) => {
            const st = stateDefinitions[line.state];
            return (
              <div
                key={line.coreId}
                className={`p-4 rounded-xl border transition-all space-y-3 bg-[#191522] ${
                  line.state === 'M'
                    ? 'border-[#5E2734] ring-1 ring-[#5E2734]'
                    : line.state === 'E'
                    ? 'border-[#265245]'
                    : line.state === 'S'
                    ? 'border-[#4D91E8]/50'
                    : 'border-[#393044]'
                }`}
              >
                {/* Core Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#201B29] border border-[#393044] font-mono font-bold text-xs flex items-center justify-center text-[#4D91E8]">
                      C{line.coreId}
                    </span>
                    <span className="font-bold text-xs text-[#F5F3FA]">Core {line.coreId}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${st.badge}`}>
                    {line.state}
                  </span>
                </div>

                {/* Cache Line Data */}
                <div className="p-2.5 rounded-lg bg-[#100D18] border border-[#393044] font-mono text-xs space-y-1">
                  <div className="text-[10px] text-[#A9A0BC] flex justify-between">
                    <span>Tag Addr:</span>
                    <span className="text-[#4D91E8] font-bold">{selectedAddress}</span>
                  </div>
                  <div className="text-[11px] text-[#F5F3FA] truncate font-semibold" title={line.data}>
                    {line.data}
                  </div>
                  <div className="text-[9.5px] text-[#A9A0BC] pt-0.5 truncate">
                    {line.lastAction}
                  </div>
                </div>

                {/* Core Bus Actions */}
                <div className="space-y-1.5 pt-1">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleBusRd(line.coreId)}
                      className="px-2 py-1 text-[11px] font-mono rounded bg-[#201B29] hover:bg-[#251E33] text-[#35B99B] border border-[#265245] transition-colors cursor-pointer text-center"
                      title="Issue Bus Read (BusRd) - loads data into cache in S or E state"
                    >
                      BusRd
                    </button>
                    <button
                      onClick={() => handleBusRdX(line.coreId)}
                      className="px-2 py-1 text-[11px] font-mono rounded bg-[#201B29] hover:bg-[#251E33] text-[#E55353] border border-[#5E2734] transition-colors cursor-pointer text-center"
                      title="Issue Bus Read with Intent to Modify (BusRdX) - invalidates other cores"
                    >
                      BusRdX
                    </button>
                  </div>
                  {line.state === 'M' && (
                    <button
                      onClick={() => handleFlush(line.coreId)}
                      className="w-full py-1 text-[10px] font-mono rounded bg-[#3A1C24] hover:bg-[#4D2330] text-[#E55353] border border-[#5E2734] transition-colors cursor-pointer text-center font-bold"
                    >
                      Flush Dirty to Memory
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Coherence Snooping Transaction Log */}
        <div className="pt-2">
          <span className="text-xs font-bold text-[#A9A0BC] block mb-1.5">
            Real-Time Coherence Snooper Transactions:
          </span>
          <div className="p-3 rounded-xl bg-[#100D18] border border-[#393044] font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto">
            {coherenceLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-[#A9A0BC]">
                <ArrowRight className="w-3 h-3 text-[#4D91E8] shrink-0" />
                <span className={i === 0 ? 'text-[#F5F3FA] font-semibold' : ''}>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
