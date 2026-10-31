/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  AlertOctagon,
  ShieldAlert,
  Cpu,
  Binary,
  Plus,
  GitBranch,
  Gauge,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { TRAFFIC_INSTRUCTION_PROGRAM } from '../data/mockData';
import { Instruction16Bit } from '../types';

interface PipelineVisualizerProps {
  onLogEvent?: (message: string, level: 'INFO' | 'WARN' | 'HAZARD') => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ onLogEvent }) => {
  const [clockCycle, setClockCycle] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [addressingFormat, setAddressingFormat] = useState<'1-addr' | '2-addr' | '3-addr'>('1-addr');
  const [enableForwarding, setEnableForwarding] = useState<boolean>(true);
  const [controlUnitMode, setControlUnitMode] = useState<'hardwired' | 'microprogrammed'>('hardwired');
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction16Bit>(TRAFFIC_INSTRUCTION_PROGRAM[0]);

  const [hasDataHazard] = useState<boolean>(true);
  const [hasControlHazard, setHasControlHazard] = useState<boolean>(false);

  // 2-Bit Saturating Counter Branch Predictor State (00 = Strongly Not Taken, 01 = Weakly Not Taken, 10 = Weakly Taken, 11 = Strongly Taken)
  const [bpuState, setBpuState] = useState<number>(2); // Default 10: Weakly Taken
  const [branchFlushes, setBranchFlushes] = useState<number>(0);
  const [forwardingHits, setForwardingHits] = useState<number>(3);

  // Custom instruction injector
  const [program, setProgram] = useState<Instruction16Bit[]>(TRAFFIC_INSTRUCTION_PROGRAM);
  const [newOpcode, setNewOpcode] = useState<'LOAD' | 'ADD' | 'SUB' | 'MUL' | 'STORE' | 'BUN' | 'NOP'>('ADD');
  const [newOperand, setNewOperand] = useState<string>('0x104 [CONGESTION_PRIORITY]');

  const getStageContent = () => {
    const ifIndex = clockCycle - 1;
    const idIndex = clockCycle - 2;
    const exIndex = !enableForwarding && clockCycle === 3 ? -1 : clockCycle - 3;
    const wbIndex = !enableForwarding && clockCycle <= 4 ? clockCycle - 5 : clockCycle - 4;

    return {
      ifInst: ifIndex >= 0 && ifIndex < program.length ? program[ifIndex] : null,
      idInst: idIndex >= 0 && idIndex < program.length ? program[idIndex] : null,
      exInst: exIndex >= 0 && exIndex < program.length ? program[exIndex] : null,
      wbInst: wbIndex >= 0 && wbIndex < program.length ? program[wbIndex] : null,
      isStalled: !enableForwarding && clockCycle === 3,
    };
  };

  const stageData = getStageContent();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setClockCycle((c) => {
          if (c >= program.length + 3) {
            setIsPlaying(false);
            return program.length + 3;
          }
          return c + 1;
        });
      }, 1300);
    }
    return () => clearInterval(timer);
  }, [isPlaying, program.length]);

  const handleStep = () => {
    if (clockCycle < program.length + 3) {
      setClockCycle((c) => c + 1);
      if (clockCycle === 2 && !enableForwarding && onLogEvent) {
        onLogEvent('RAW Data Hazard detected: Load-to-Use stall cycle inserted in EX stage.', 'WARN');
      }
      if (clockCycle === 4 && hasControlHazard) {
        // Evaluate Branch Predictor
        if (bpuState < 2) {
          // Mispredicted: flush pipeline
          setBranchFlushes((f) => f + 1);
          setBpuState((s) => Math.min(3, s + 1));
          if (onLogEvent) onLogEvent('BPU Misprediction: Speculative pipeline stages flushed on BUN!', 'HAZARD');
        } else {
          // Correctly predicted taken
          setBpuState((s) => Math.min(3, s + 1));
          if (onLogEvent) onLogEvent('BPU Hit: Speculatively fetched target without bubbles.', 'INFO');
        }
      }
    } else {
      setClockCycle(1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setClockCycle(1);
  };

  const handleInjectInstruction = () => {
    const nextIdx = program.length + 1;
    const newInst: Instruction16Bit = {
      id: `INST_0${nextIdx}`,
      address: `0x0${(0x10 + nextIdx).toString(16).toUpperCase()}`,
      iBit: 0,
      opcode: newOpcode,
      opcodeBinary: newOpcode === 'LOAD' ? '000' : newOpcode === 'ADD' ? '001' : newOpcode === 'MUL' ? '010' : '011',
      operand: newOperand,
      description: `Injected custom ${newOpcode} instruction into pipeline stream`,
      rawMachineCode: `0 001 00010000${nextIdx} (0x110${nextIdx})`,
    };
    setProgram((prev) => [...prev, newInst]);
    if (onLogEvent) onLogEvent(`Injected custom ${newOpcode} instruction at ${newInst.address}`, 'INFO');
  };

  const cpi = (clockCycle / Math.max(1, Math.min(program.length, clockCycle - 3))).toFixed(2);
  const ipc = (1 / parseFloat(cpi)).toFixed(2);

  const bpuLabels = [
    '00: Strongly Not Taken',
    '01: Weakly Not Taken',
    '10: Weakly Taken',
    '11: Strongly Taken',
  ];

  return (
    <div className="space-y-5">
      {/* Visualizer Header */}
      <div className="p-4 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#F5F3FA] tracking-tight">
              Instruction Cycle &amp; 4-Stage Pipeline Visualizer
            </h2>
            <span className="text-xs font-mono font-semibold text-[#A9A0BC] bg-[#191522] px-2.5 py-0.5 rounded-md border border-[#393044]">
              Hardware Pipeline &amp; Hazard Resolution
            </span>
          </div>
          <p className="text-xs text-[#A9A0BC] mt-1">
            Simulates custom 16-bit instruction format execution across{' '}
            <strong className="text-[#F5F3FA]">Fetch (IF) → Decode (ID) → Execute (EX) → Write-back (WB)</strong>{' '}
            with RAW Data Hazards, Branch Control Hazards, and Forwarding Bypasses.
          </p>
        </div>

        {/* Control Unit Mode Toggle & Performance HUD */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-[#191522] px-3 py-1.5 rounded-xl border border-[#393044] text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#A9A0BC] block">Cycles / Inst (CPI)</span>
              <span className="font-bold text-[#35B99B] tabular-nums">{cpi}</span>
            </div>
            <div className="border-l border-[#393044] pl-3">
              <span className="text-[10px] text-[#A9A0BC] block">Throughput (IPC)</span>
              <span className="font-bold text-[#4D91E8] tabular-nums">{ipc}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#191522] p-1 rounded-xl border border-[#393044] text-xs">
            <button
              onClick={() => setControlUnitMode('hardwired')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                controlUnitMode === 'hardwired'
                  ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white font-bold shadow-xs'
                  : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
              }`}
            >
              Hardwired
            </button>
            <button
              onClick={() => setControlUnitMode('microprogrammed')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                controlUnitMode === 'microprogrammed'
                  ? 'bg-[#4D91E8] text-white font-bold shadow-xs'
                  : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
              }`}
            >
              Microcode
            </button>
          </div>
        </div>
      </div>

      {/* 16-bit Instruction Format Showcase & Address Format Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Custom 16-Bit Instruction Format */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#393044]">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-[#4D91E8]" />
              <h3 className="font-bold text-sm text-[#F5F3FA]">
                16-Bit Instruction Register (IR) Breakdown
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-[#35B99B] bg-[#17332B] px-2 py-0.5 rounded border border-[#265245]">
              Selected: {selectedInstruction.opcode} ({selectedInstruction.id})
            </span>
          </div>

          {/* 16-Bit Architecture Graphic */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-1.5 text-center font-mono text-xs">
              <div className="col-span-2 p-3 rounded-xl bg-[#191522] border border-[#393044] text-[#F5F3FA]">
                <span className="text-[10px] text-[#A9A0BC] block uppercase font-sans font-bold">Bit 15</span>
                <span className="text-base font-bold block text-[#4D91E8]">{selectedInstruction.iBit}</span>
                <span className="text-[10px] text-[#A9A0BC] block">I-Bit (Mode)</span>
              </div>

              <div className="col-span-3 p-3 rounded-xl bg-[#191522] border border-[#393044] text-[#F5F3FA]">
                <span className="text-[10px] text-[#A9A0BC] block uppercase font-sans font-bold">Bits 14–12</span>
                <span className="text-base font-bold block text-[#35B99B]">{selectedInstruction.opcodeBinary}</span>
                <span className="text-[10px] text-[#A9A0BC] block">Opcode ({selectedInstruction.opcode})</span>
              </div>

              <div className="col-span-7 p-3 rounded-xl bg-[#191522] border border-[#393044] text-[#F5F3FA]">
                <span className="text-[10px] text-[#A9A0BC] block uppercase font-sans font-bold">Bits 11–0 (12 Bits)</span>
                <span className="text-base font-bold block text-[#F5F3FA]">{selectedInstruction.address}</span>
                <span className="text-[10px] text-[#A9A0BC] block truncate font-sans">
                  Target: {selectedInstruction.operand}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#A9A0BC] px-1 pt-1">
              <span>
                Addressing Mode:{' '}
                <strong className="text-[#F5F3FA]">
                  {selectedInstruction.iBit === 0 ? 'Direct (Effective Addr = IR[11:0])' : 'Indirect (M[IR[11:0]])'}
                </strong>
              </span>
              <span>Machine Code: <strong className="text-[#4D91E8] font-mono font-bold">{selectedInstruction.rawMachineCode}</strong></span>
            </div>
          </div>

          {/* Program Table & Custom Instruction Assembler Injector */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#F5F3FA]">Active Instruction Sequence:</span>
              <div className="flex items-center gap-1.5">
                <select
                  value={newOpcode}
                  onChange={(e) => setNewOpcode(e.target.value as any)}
                  className="bg-[#191522] border border-[#393044] rounded px-2 py-0.5 text-xs text-[#F5F3FA] font-mono"
                >
                  <option value="LOAD">LOAD</option>
                  <option value="ADD">ADD</option>
                  <option value="SUB">SUB</option>
                  <option value="MUL">MUL</option>
                  <option value="STORE">STORE</option>
                  <option value="BUN">BUN</option>
                  <option value="NOP">NOP</option>
                </select>
                <button
                  onClick={handleInjectInstruction}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#191522] hover:bg-[#251E33] text-[#35B99B] border border-[#265245] text-xs font-mono font-bold cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Inject</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#393044] text-[#A9A0BC] text-[11px] bg-[#191522]">
                    <th className="py-2 px-2.5">Addr</th>
                    <th className="py-2 px-2.5">Opcode</th>
                    <th className="py-2 px-2.5">I</th>
                    <th className="py-2 px-2.5">Operand</th>
                    <th className="py-2 px-2.5 font-sans">Semantics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#393044]/60">
                  {program.map((inst) => {
                    const isSel = selectedInstruction.id === inst.id;
                    return (
                      <tr
                        key={inst.id}
                        onClick={() => setSelectedInstruction(inst)}
                        className={`cursor-pointer transition-colors ${
                          isSel
                            ? 'bg-[#191522] text-[#4D91E8] font-semibold'
                            : 'hover:bg-[#191522]/50 text-[#A9A0BC]'
                        }`}
                      >
                        <td className="py-1.5 px-2.5 text-[#4D91E8] font-bold">{inst.address}</td>
                        <td className="py-1.5 px-2.5 font-bold text-[#F5F3FA]">{inst.opcode}</td>
                        <td className="py-1.5 px-2.5">{inst.iBit}</td>
                        <td className="py-1.5 px-2.5 text-[#E5A84D] font-medium">{inst.operand}</td>
                        <td className="py-1.5 px-2.5 text-[#A9A0BC] font-sans text-[11px] truncate max-w-xs">
                          {inst.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2-Bit Saturating Counter Branch Predictor Unit (BPU) */}
        <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#393044]">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#35B99B]" />
              <h3 className="font-bold text-sm text-[#F5F3FA]">2-Bit Dynamic Branch Predictor</h3>
            </div>
            <span className="text-[10px] font-mono text-[#35B99B] bg-[#17332B] px-2 py-0.5 rounded border border-[#265245]">
              BPU Unit
            </span>
          </div>

          <p className="text-xs text-[#A9A0BC] leading-relaxed">
            Saturating counter tracks BUN branch history for peak congestion ISR jumps (L &gt; 80):
          </p>

          {/* 4 Counter States */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {bpuLabels.map((lbl, idx) => (
              <button
                key={lbl}
                onClick={() => setBpuState(idx)}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  bpuState === idx
                    ? 'bg-[#17332B] text-[#35B99B] border-[#265245] font-bold shadow-xs'
                    : 'bg-[#191522] text-[#A9A0BC] border-[#393044] hover:text-[#F5F3FA]'
                }`}
              >
                <div className="text-[10px] uppercase opacity-75">{lbl.split(': ')[0]}</div>
                <div className="text-[11px] font-bold mt-0.5">{lbl.split(': ')[1]}</div>
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#191522] border border-[#393044] space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-[#A9A0BC]">Current BPU Prediction:</span>
              <span className={`font-bold ${bpuState >= 2 ? 'text-[#35B99B]' : 'text-[#E55353]'}`}>
                {bpuState >= 2 ? 'TAKEN (Branch Anticipated)' : 'NOT TAKEN (Linear PC)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#A9A0BC]">Pipeline Flushes:</span>
              <span className="font-bold text-[#E55353]">{branchFlushes} Bubbles</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#A9A0BC]">Forwarding Bypasses:</span>
              <span className="font-bold text-[#35B99B]">{forwardingHits} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Stage Pipeline Execution Stage Monitor */}
      <div className="p-5 rounded-2xl bg-[#201B29] border border-[#393044] shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#393044]">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#4D91E8]" />
              <h3 className="font-bold text-base text-[#F5F3FA]">
                4-Stage Pipeline Execution Stage Monitor
              </h3>
            </div>
            <p className="text-xs text-[#A9A0BC] mt-0.5">
              Current Simulation Clock Cycle: <strong className="text-[#4D91E8] font-mono">CC {clockCycle}</strong> of {program.length + 3}
            </p>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white transition-opacity hover:opacity-95 shadow-sm shadow-[#4D91E8]/20 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Auto Step'}</span>
            </button>
            <button
              onClick={handleStep}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-[#191522] hover:bg-[#251E33] text-[#F5F3FA] border border-[#393044] transition-colors cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Next Clock (CC+1)</span>
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-[#191522] hover:bg-[#251E33] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044] transition-colors cursor-pointer"
              title="Reset cycle to CC 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Stages Visual Pipeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Stage 1: Fetch (IF) */}
          <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4D91E8] uppercase tracking-wider">
                1. Fetch (IF)
              </span>
              <span className="text-[10px] font-mono text-[#A9A0BC]">PC → IR</span>
            </div>
            <div className="p-3 rounded-lg bg-[#201B29] border border-[#393044] min-h-[75px] flex flex-col justify-center">
              {stageData.ifInst ? (
                <div>
                  <div className="font-mono text-xs font-bold text-[#F5F3FA] flex items-center justify-between">
                    <span>{stageData.ifInst.opcode}</span>
                    <span className="text-[#4D91E8] text-[11px]">{stageData.ifInst.address}</span>
                  </div>
                  <div className="text-[10px] text-[#A9A0BC] truncate mt-1">
                    {stageData.ifInst.operand}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#A9A0BC] font-mono text-center">Idle</span>
              )}
            </div>
            <div className="text-[10px] text-[#A9A0BC]">Fetches 16-bit instruction from memory cache</div>
          </div>

          {/* Stage 2: Decode (ID) */}
          <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#35B99B] uppercase tracking-wider">
                2. Decode (ID)
              </span>
              <span className="text-[10px] font-mono text-[#A9A0BC]">Opcode / Operands</span>
            </div>
            <div className="p-3 rounded-lg bg-[#201B29] border border-[#393044] min-h-[75px] flex flex-col justify-center">
              {stageData.idInst ? (
                <div>
                  <div className="font-mono text-xs font-bold text-[#F5F3FA] flex items-center justify-between">
                    <span>{stageData.idInst.opcode}</span>
                    <span className="text-[#35B99B] text-[11px]">{stageData.idInst.opcodeBinary}</span>
                  </div>
                  <div className="text-[10px] text-[#A9A0BC] truncate mt-1">
                    Target: {stageData.idInst.operand}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#A9A0BC] font-mono text-center">Idle</span>
              )}
            </div>
            <div className="text-[10px] text-[#A9A0BC]">Decodes opcode &amp; reads source registers</div>
          </div>

          {/* Stage 3: Execute (EX) */}
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              stageData.isStalled
                ? 'border-[#5E2734] bg-[#3A1C24]'
                : 'border-[#393044] bg-[#191522]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E5A84D] uppercase tracking-wider">
                3. Execute (EX)
              </span>
              <span className="text-[10px] font-mono text-[#A9A0BC]">ALU / Comp</span>
            </div>
            <div className="p-3 rounded-lg bg-[#201B29] border border-[#393044] min-h-[75px] flex flex-col justify-center">
              {stageData.isStalled ? (
                <div className="text-[#E55353] font-mono text-xs font-bold flex items-center gap-1.5 justify-center">
                  <AlertOctagon className="w-4 h-4 animate-spin" />
                  <span>PIPELINE STALL (BUBBLE)</span>
                </div>
              ) : stageData.exInst ? (
                <div>
                  <div className="font-mono text-xs font-bold text-[#F5F3FA] flex items-center justify-between">
                    <span>{stageData.exInst.opcode}</span>
                    <span className="text-[#35B99B] text-[11px] font-semibold">ALU Active</span>
                  </div>
                  <div className="text-[10px] text-[#A9A0BC] truncate mt-1">
                    Arithmetic computation of traffic load L
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#A9A0BC] font-mono text-center">Idle</span>
              )}
            </div>
            <div className="text-[10px] text-[#A9A0BC]">Executes ALU addition, multiplication or branch</div>
          </div>

          {/* Stage 4: Write-back (WB) */}
          <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A9A0BC] uppercase tracking-wider">
                4. Write-back (WB)
              </span>
              <span className="text-[10px] font-mono text-[#A9A0BC]">Reg / Cache</span>
            </div>
            <div className="p-3 rounded-lg bg-[#201B29] border border-[#393044] min-h-[75px] flex flex-col justify-center">
              {stageData.wbInst ? (
                <div>
                  <div className="font-mono text-xs font-bold text-[#F5F3FA] flex items-center justify-between">
                    <span>{stageData.wbInst.opcode}</span>
                    <span className="text-[#4D91E8] text-[11px] font-semibold">Complete</span>
                  </div>
                  <div className="text-[10px] text-[#A9A0BC] truncate mt-1">
                    Updates Register / Memory with result
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#A9A0BC] font-mono text-center">Idle</span>
              )}
            </div>
            <div className="text-[10px] text-[#A9A0BC]">Stores result to destination register or cache</div>
          </div>
        </div>

        {/* Hazard Mitigation Controls & Forwarding Bypass */}
        <div className="p-4 rounded-xl bg-[#191522] border border-[#393044] grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data Hazard Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5F3FA] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#4D91E8]" />
                <span>RAW Data Hazard (ADD waiting for LOAD)</span>
              </span>
              <button
                onClick={() => setEnableForwarding(!enableForwarding)}
                className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                  enableForwarding
                    ? 'bg-[#17332B] text-[#35B99B] border border-[#265245]'
                    : 'bg-[#3A1C24] text-[#E55353] border border-[#5E2734]'
                }`}
              >
                Forwarding: {enableForwarding ? 'ON (Zero Stall)' : 'OFF (1 Bubble Stall)'}
              </button>
            </div>
            <p className="text-[11px] text-[#A9A0BC] leading-relaxed">
              {enableForwarding
                ? 'Internal data bypass routes ALU result directly from EX/WB stage output into the EX stage input, avoiding pipeline stall bubbles completely.'
                : 'Without forwarding hardware, the pipeline must insert stall bubbles waiting for Write-Back to commit to the register file.'}
            </p>
          </div>

          {/* Control Hazard Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5F3FA] flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-[#E5A84D]" />
                <span>Control Hazard (BUN Branch on Congestion L &gt; 80)</span>
              </span>
              <button
                onClick={() => setHasControlHazard(!hasControlHazard)}
                className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                  hasControlHazard
                    ? 'bg-[#342818] text-[#E5A84D] border border-[#574021]'
                    : 'bg-[#100D18] text-[#A9A0BC] border border-[#393044]'
                }`}
              >
                Branch Hazard: {hasControlHazard ? 'Active' : 'Standby'}
              </button>
            </div>
            <p className="text-[11px] text-[#A9A0BC] leading-relaxed">
              When approach load crosses threshold (L &gt; 80), conditional branch BUN updates PC to
              emergency signal service routine, demonstrating branch prediction and speculative flushing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
