/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, ShieldCheck, Activity, Clock, Info, LogOut, Play } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  currentCycle: number;
  onLogout: () => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  onOpenOverview: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentCycle,
  onLogout,
  onRunSimulation,
  isSimulating,
  onOpenOverview,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-900/95 backdrop-blur-md px-4 lg:px-8 py-3 transition-all shadow-md text-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-900/40">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
                Smart Traffic Processing System
              </span>
              <span className="hidden sm:inline text-xs text-emerald-300 font-mono font-semibold bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800/80">
                Group 52 · MIMD 4-Core
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Intelligent Signal Processing &amp; Parallel Architecture Simulator
            </p>
          </div>
        </div>

        {/* Center Architectural Status Indicators */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Grid Nominal</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>MIMD Cores 0-3</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>MESI Snooping Bus</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Cycle #{currentCycle}</span>
          </div>
        </div>

        {/* Action & Profile Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Project Overview & Viva Guide Info Button */}
          <button
            onClick={onOpenOverview}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/90 transition-all shadow-xs cursor-pointer"
            title="Project Overview & 3-Member Viva Script (Group 52)"
          >
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-mono">Overview &amp; Script</span>
          </button>

          {/* Run Signal Simulation Cycle Button */}
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer ${
              isSimulating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
            }`}
            title="Execute parallel load calculation and MESI synchronization cycle"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span className="whitespace-nowrap">{isSimulating ? 'Processing...' : 'Run Signal Cycle'}</span>
          </button>

          {/* User Badge & Separate Sign Out / Portal Button */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left">
              <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 font-bold text-xs">
                DJ
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 leading-none">
                  Deepak Joshi
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5 font-medium truncate max-w-[120px]">
                  {currentRole}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-800/80 border border-slate-700/80 text-slate-300 text-xs font-medium transition-all cursor-pointer"
              title="Exit to Login Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Portal</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
