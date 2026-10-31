/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Download,
  Filter,
  FileSpreadsheet,
  FileJson,
  Check,
} from 'lucide-react';
import { SimulationLogEntry } from '../types';

interface SystemLogDrawerProps {
  logs: SimulationLogEntry[];
  onClearLogs: () => void;
}

export const SystemLogDrawer: React.FC<SystemLogDrawerProps> = ({ logs, onClearLogs }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filterSubsystem, setFilterSubsystem] = useState<string>('ALL');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [downloadSuccessType, setDownloadSuccessType] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLogs = filterSubsystem === 'ALL'
    ? logs
    : logs.filter((l) => l.subsystem === filterSubsystem);

  const handleDownloadJson = () => {
    const telemetryExportPayload = {
      system: 'MetroPulse Traffic OS',
      module: 'Simulation Architecture Telemetry Console',
      exportedAt: new Date().toISOString(),
      activeFilter: filterSubsystem,
      totalRecordedEvents: filteredLogs.length,
      simulationMetrics: {
        totalCyclesAnalyzed: filteredLogs.length > 0 ? Math.max(...filteredLogs.map((l) => l.cycle)) : 0,
        subsystemsRecorded: Array.from(new Set(filteredLogs.map((l) => l.subsystem))),
        hazardEventsCount: filteredLogs.filter((l) => l.level === 'HAZARD').length,
        warningEventsCount: filteredLogs.filter((l) => l.level === 'WARN').length,
      },
      events: filteredLogs.map((l) => ({
        id: l.id,
        clockCycle: l.cycle,
        timestamp: l.timestamp,
        subsystem: l.subsystem,
        severity: l.level,
        message: l.message,
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(telemetryExportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MetroPulse_Telemetry_Logs_${filterSubsystem}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setIsExportMenuOpen(false);
    setDownloadSuccessType('JSON');
    setTimeout(() => setDownloadSuccessType(null), 2500);
  };

  const handleDownloadCsv = () => {
    const headers = ['Event ID', 'Clock Cycle', 'Timestamp', 'Subsystem', 'Severity Level', 'Telemetry Log Message'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      l.cycle,
      `"${l.timestamp}"`,
      `"${l.subsystem}"`,
      `"${l.level}"`,
      `"${l.message.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      `# =========================================================================`,
      `# PLATFORM: MetroPulse Traffic OS - Architecture Telemetry Event Log`,
      `# EXPORT TIMESTAMP: ${new Date().toLocaleString()}`,
      `# FILTER APPLIED: ${filterSubsystem} (${filteredLogs.length} Events)`,
      `# =========================================================================`,
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `MetroPulse_Telemetry_${filterSubsystem}_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    setIsExportMenuOpen(false);
    setDownloadSuccessType('CSV');
    setTimeout(() => setDownloadSuccessType(null), 2500);
  };

  const getLevelColor = (level: SimulationLogEntry['level']) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-[#35B99B] font-medium';
      case 'WARN':
        return 'text-[#E5A84D] font-medium';
      case 'HAZARD':
        return 'text-[#E55353] font-semibold';
      default:
        return 'text-[#F5F3FA]';
    }
  };

  return (
    <div className="border-t border-[#393044] bg-[#191522] backdrop-blur-md transition-all shadow-xl">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-mono font-bold text-[#F5F3FA] hover:text-[#4D91E8] transition-colors cursor-pointer"
        >
          <Terminal className="w-4 h-4 text-[#4D91E8]" />
          <span>Telemetry &amp; Hardware Event Console</span>
          <span className="px-1.5 py-0.5 rounded bg-[#100D18] border border-[#393044] text-[10px] text-[#A9A0BC] font-bold">
            {logs.length} Events
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#A9A0BC]" /> : <ChevronUp className="w-3.5 h-3.5 text-[#A9A0BC]" />}
        </button>

        {isOpen && (
          <div className="flex items-center gap-2 text-xs">
            {/* Filter buttons */}
            <div className="hidden sm:flex items-center gap-1 bg-[#100D18] px-2 py-1 rounded-lg border border-[#393044] font-mono text-[11px]">
              <Filter className="w-3 h-3 text-[#A9A0BC] mr-1" />
              {(['ALL', 'CORE_MIMD', 'PIPELINE', 'MESI_BUS', 'TRAFFIC_GRID'] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setFilterSubsystem(sub)}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    filterSubsystem === sub
                      ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white font-bold shadow-xs'
                      : 'text-[#A9A0BC] hover:text-[#F5F3FA]'
                  }`}
                >
                  {sub === 'ALL' ? 'All' : sub.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Telemetry Log Export Buttons */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center rounded-lg border border-[#393044] bg-[#100D18] p-0.5 shadow-xs">
                <button
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-medium text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#191522] transition-colors cursor-pointer"
                  title="Export Formatted JSON"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#4D91E8]" />
                  <span>JSON</span>
                </button>

                <div className="w-px h-3.5 bg-[#393044] mx-0.5" />

                <button
                  onClick={handleDownloadCsv}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-medium text-[#A9A0BC] hover:text-[#35B99B] hover:bg-[#191522] transition-colors cursor-pointer"
                  title="Export Spreadsheet CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#35B99B]" />
                  <span>CSV</span>
                </button>

                <div className="w-px h-3.5 bg-[#393044] mx-0.5" />

                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="p-1 rounded-md text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#191522] transition-colors cursor-pointer"
                  title="Export Options"
                >
                  <Download className="w-3.5 h-3.5 text-[#A9A0BC]" />
                </button>
              </div>

              {/* Success Notification Tooltip */}
              {downloadSuccessType && (
                <div className="absolute top-full mt-1.5 right-0 z-50 bg-[#17332B] border border-[#265245] text-[#35B99B] text-[10px] font-mono px-2 py-1 rounded shadow-lg flex items-center gap-1 whitespace-nowrap animate-in fade-in slide-in-from-top-1">
                  <Check className="w-3 h-3" />
                  <span>Exported as {downloadSuccessType}!</span>
                </div>
              )}

              {/* Detailed Export Dropdown Menu */}
              {isExportMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-[#201B29] border border-[#393044] shadow-2xl p-2.5 z-50 text-xs space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1 border-b border-[#393044]">
                    <span className="font-bold text-[#F5F3FA] block text-[11px]">Export Telemetry Logs</span>
                    <span className="text-[10px] text-[#A9A0BC] font-mono">MetroPulse Traffic OS</span>
                  </div>

                  <button
                    onClick={handleDownloadJson}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#191522] transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded bg-[#4D91E8]/10 text-[#4D91E8] group-hover:bg-[#4D91E8]/20 mt-0.5">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#F5F3FA] text-xs flex items-center gap-1">
                        Formatted JSON File
                        <span className="text-[9px] font-mono text-[#4D91E8] bg-[#191522] px-1 rounded border border-[#393044]">.json</span>
                      </div>
                      <div className="text-[10px] text-[#A9A0BC] leading-tight mt-0.5">
                        Structured machine-readable logs including cycles, hazards, and timestamps.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadCsv}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#191522] transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded bg-[#35B99B]/10 text-[#35B99B] group-hover:bg-[#35B99B]/20 mt-0.5">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#F5F3FA] text-xs flex items-center gap-1">
                        Tabular CSV Spreadsheet
                        <span className="text-[9px] font-mono text-[#35B99B] bg-[#191522] px-1 rounded border border-[#393044]">.csv</span>
                      </div>
                      <div className="text-[10px] text-[#A9A0BC] leading-tight mt-0.5">
                        Tabular dataset compatible with Excel, Google Sheets, or analytical software.
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClearLogs}
              className="p-1.5 rounded-lg bg-[#100D18] hover:bg-[#3A1C24] text-[#A9A0BC] hover:text-[#E55353] border border-[#393044] transition-colors cursor-pointer"
              title="Clear Event Log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Log Body */}
      {isOpen && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-3">
          <div className="h-36 overflow-y-auto rounded-xl bg-[#100D18] border border-[#393044] p-3 font-mono text-xs space-y-1.5">
            {filteredLogs.length === 0 ? (
              <div className="text-[#A9A0BC] text-center py-8">
                No events recorded for selected filter. Run signal cycles or tune lane controls above.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed text-[11px]">
                  <span className="text-[#A9A0BC] shrink-0">[{log.timestamp}]</span>
                  <span className="text-[#4D91E8] font-semibold shrink-0">CC#{log.cycle}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#191522] text-[10px] text-[#A9A0BC] border border-[#393044] shrink-0">
                    {log.subsystem}
                  </span>
                  <span className={`${getLevelColor(log.level)} break-words flex-1`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
