import React, { useState } from 'react';
import {
  X,
  Cpu,
  GitCommit,
  ShieldCheck,
  Calculator,
  Layers,
  Terminal,
  Activity,
  Zap,
} from 'lucide-react';
import { JunctionData, SimulationLogEntry } from '../../types';
import { CoreArchitecture } from '../CoreArchitecture';
import { PipelineVisualizer } from '../PipelineVisualizer';
import { MesiMonitor } from '../MesiMonitor';
import { AluBoothVisualizer } from '../AluBoothVisualizer';

interface SystemArchitectureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  junctions: JunctionData[];
  onTriggerEmergency: (id: string) => void;
  onUpdateJunctionLoad: (id: string, delta: number) => void;
  logs: SimulationLogEntry[];
  simulationCycle: number;
}

export const SystemArchitectureDrawer: React.FC<SystemArchitectureDrawerProps> = ({
  isOpen,
  onClose,
  junctions,
  onTriggerEmergency,
  onUpdateJunctionLoad,
  logs,
  simulationCycle,
}) => {
  const [internalTab, setInternalTab] = useState<'core' | 'pipeline' | 'mesi' | 'alu' | 'os_process'>('core');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 lg:p-6 overflow-y-auto">
      <div className="max-w-6xl w-full bg-[#151F24] border border-[#29383A] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 bg-[#10171B] border-b border-[#29383A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1B292E] border border-[#29383A] flex items-center justify-center text-[#B7F34A]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#F1F5F2]">
                  System Architecture &amp; Hardware Subsystems
                </h2>
                <span className="text-[10px] font-mono bg-[#B7F34A]/10 text-[#B7F34A] border border-[#B7F34A]/20 px-2 py-0.5 rounded">
                  INTERNAL DIAGNOSTICS
                </span>
              </div>
              <p className="text-[11px] text-[#91A19B]">
                Parallel multi-core processing, 4-stage pipeline, and MESI bus snooping models.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#64736D] hidden sm:inline">
              Clock Cycle #{simulationCycle}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#91A19B] hover:text-[#F1F5F2] hover:bg-[#1B292E] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subsystem Switcher Tabs */}
        <div className="px-4 py-2 bg-[#0B0F12] border-b border-[#29383A] flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setInternalTab('core')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              internalTab === 'core'
                ? 'bg-[#1B292E] text-[#B7F34A] border border-[#B7F34A]/40 font-semibold'
                : 'text-[#91A19B] hover:text-[#F1F5F2]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>MIMD Multi-Core Architecture</span>
          </button>

          <button
            onClick={() => setInternalTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              internalTab === 'pipeline'
                ? 'bg-[#1B292E] text-[#B7F34A] border border-[#B7F34A]/40 font-semibold'
                : 'text-[#91A19B] hover:text-[#F1F5F2]'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>4-Stage Instruction Pipeline</span>
          </button>

          <button
            onClick={() => setInternalTab('mesi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              internalTab === 'mesi'
                ? 'bg-[#1B292E] text-[#B7F34A] border border-[#B7F34A]/40 font-semibold'
                : 'text-[#91A19B] hover:text-[#F1F5F2]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MESI Cache Coherence</span>
          </button>

          <button
            onClick={() => setInternalTab('alu')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              internalTab === 'alu'
                ? 'bg-[#1B292E] text-[#B7F34A] border border-[#B7F34A]/40 font-semibold'
                : 'text-[#91A19B] hover:text-[#F1F5F2]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>ALU Booth Multiplier</span>
          </button>

          <button
            onClick={() => setInternalTab('os_process')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              internalTab === 'os_process'
                ? 'bg-[#1B292E] text-[#B7F34A] border border-[#B7F34A]/40 font-semibold'
                : 'text-[#91A19B] hover:text-[#F1F5F2]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>OS Scheduling &amp; Buffer IPC</span>
          </button>
        </div>

        {/* Content View Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#0B0F12]/90">
          {internalTab === 'core' && (
            <CoreArchitecture
              junctions={junctions}
              currentCycle={simulationCycle}
              onUpdateJunctionLoad={onUpdateJunctionLoad}
            />
          )}

          {internalTab === 'pipeline' && (
            <PipelineVisualizer />
          )}

          {internalTab === 'mesi' && (
            <MesiMonitor />
          )}

          {internalTab === 'alu' && (
            <AluBoothVisualizer
              junctions={junctions}
            />
          )}

          {internalTab === 'os_process' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F1F5F2]">
                    Process Management &amp; CPU Scheduling Models
                  </h3>
                  <span className="text-[10px] font-mono text-[#B7F34A]">ROUND ROBIN (QUANTUM = 20ms)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#10171B] border border-[#29383A]">
                    <div className="text-[#91A19B] text-[10px]">PROCESS 01 (PID 1024)</div>
                    <div className="text-[#F1F5F2] font-bold mt-1">SensorIngestThread</div>
                    <div className="text-[#71D49A] text-[11px] mt-2">State: RUNNING (Core 0)</div>
                    <div className="text-[#64736D] text-[10px] mt-1">Burst: 14ms | Priority: 1</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#10171B] border border-[#29383A]">
                    <div className="text-[#91A19B] text-[10px]">PROCESS 02 (PID 1025)</div>
                    <div className="text-[#F1F5F2] font-bold mt-1">WebsterSplitSolver</div>
                    <div className="text-[#71D49A] text-[11px] mt-2">State: RUNNING (Core 1)</div>
                    <div className="text-[#64736D] text-[10px] mt-1">Burst: 22ms | Priority: 2</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#10171B] border border-[#29383A]">
                    <div className="text-[#91A19B] text-[10px]">PROCESS 03 (PID 1026)</div>
                    <div className="text-[#F1F5F2] font-bold mt-1">EmergencyCorridorSvc</div>
                    <div className="text-[#52C7D9] text-[11px] mt-2">State: READY (Core 2)</div>
                    <div className="text-[#64736D] text-[10px] mt-1">Burst: 8ms | Priority: 0 (Critical)</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#10171B] border border-[#29383A]">
                    <div className="text-[#91A19B] text-[10px]">PROCESS 04 (PID 1027)</div>
                    <div className="text-[#F1F5F2] font-bold mt-1">TelemetryBroadcaster</div>
                    <div className="text-[#91A19B] text-[11px] mt-2">State: WAITING (Core 3)</div>
                    <div className="text-[#64736D] text-[10px] mt-1">Burst: 18ms | Priority: 3</div>
                  </div>
                </div>
              </div>

              {/* Producer-Consumer Bounded Buffer Simulation */}
              <div className="p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F1F5F2]">
                    Producer-Consumer Synchronisation &amp; Bounded Buffer
                  </h3>
                  <span className="text-[10px] font-mono text-[#52C7D9]">CAPACITY = 8 SLOTS (MUTEX LOCKS ACTIVE)</span>
                </div>

                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((slotIdx) => {
                    const isOccupied = slotIdx < 5;
                    return (
                      <div
                        key={slotIdx}
                        className={`p-3 rounded-xl border text-center font-mono text-xs ${
                          isOccupied
                            ? 'bg-[#1B292E] border-[#B7F34A]/50 text-[#F1F5F2]'
                            : 'bg-[#10171B] border-[#29383A] text-[#64736D]'
                        }`}
                      >
                        <div className="text-[10px] text-[#64736D]">Slot {slotIdx}</div>
                        <div className="font-bold mt-1 text-[11px]">
                          {isOccupied ? `PKT_${100 + slotIdx}` : 'EMPTY'}
                        </div>
                        <div className="text-[9px] mt-1 text-[#91A19B]">
                          {isOccupied ? 'Ready' : 'Free'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#91A19B] pt-2 border-t border-[#29383A]">
                  <span>Producer: Sensor Daemon (sem_wait(empty))</span>
                  <span className="text-[#71D49A]">Mutex: UNLOCKED</span>
                  <span>Consumer: Signal Engine (sem_post(full))</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
