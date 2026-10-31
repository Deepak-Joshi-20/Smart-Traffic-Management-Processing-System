import React, { useState } from 'react';
import {
  Clock,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  ArrowUpDown,
} from 'lucide-react';
import { TrafficRecord, CongestionCategory } from '../../types';

interface HistoryViewProps {
  records: TrafficRecord[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ records }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [junctionFilter, setJunctionFilter] = useState('ALL');
  const [congestionFilter, setCongestionFilter] = useState<string>('ALL');

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.junctionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.laneId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJunction = junctionFilter === 'ALL' || r.junctionId === junctionFilter;
    const matchesCongestion = congestionFilter === 'ALL' || r.congestionLevel === congestionFilter;
    return matchesSearch && matchesJunction && matchesCongestion;
  });

  const handleExportCSV = () => {
    const headers = 'record_id,timestamp,junction_id,lane_id,vehicle_count,lane_capacity,density_index,speed_kmh,congestion_level,recommended_green_sec\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `${r.id},${r.timestamp},${r.junctionId},${r.laneId},${r.vehicleCount},${r.laneCapacity},${r.densityIndex},${r.averageSpeedKmH},${r.congestionLevel},${r.recommendedGreenSec}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urbanpulse_traffic_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F2] tracking-tight">
            Historical Traffic Telemetry
          </h1>
          <p className="text-xs text-[#91A19B] mt-0.5">
            Search, filter, and export historical approach readings and algorithm-generated signal splits.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="neon-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#B7F34A]" />
          <span>Export Filtered CSV ({filteredRecords.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#151F24] border border-[#29383A] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#64736D] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search record ID, approach lane, or intersection..."
            className="w-full bg-[#10171B] border border-[#29383A] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[#91A19B]">Junction:</span>
            <select
              value={junctionFilter}
              onChange={(e) => setJunctionFilter(e.target.value)}
              className="bg-[#10171B] border border-[#29383A] rounded-lg px-2.5 py-1 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
            >
              <option value="ALL">All Nodes</option>
              <option value="JUNCT_A">JUNCT_A</option>
              <option value="JUNCT_B">JUNCT_B</option>
              <option value="JUNCT_C">JUNCT_C</option>
              <option value="JUNCT_D">JUNCT_D</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#91A19B]">Congestion:</span>
            <select
              value={congestionFilter}
              onChange={(e) => setCongestionFilter(e.target.value)}
              className="bg-[#10171B] border border-[#29383A] rounded-lg px-2.5 py-1 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
            >
              <option value="ALL">All Levels</option>
              <option value="Low">Low Density</option>
              <option value="Moderate">Moderate Queue</option>
              <option value="High">High Congestion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="rounded-2xl bg-[#151F24] border border-[#29383A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#10171B] text-[#91A19B] border-b border-[#29383A]">
              <tr>
                <th className="py-3 px-4 font-medium">Record ID</th>
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Junction</th>
                <th className="py-3 px-4 font-medium">Lane Approach</th>
                <th className="py-3 px-4 font-medium text-right">Vehicles</th>
                <th className="py-3 px-4 font-medium text-right">Density Index</th>
                <th className="py-3 px-4 font-medium text-right">Avg Speed</th>
                <th className="py-3 px-4 font-medium text-center">Phase</th>
                <th className="py-3 px-4 font-medium text-right">Optimal Green</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#29383A]/60 text-[#F1F5F2]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#91A19B]">
                    No historical logs match your current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#1B292E]/50 transition-colors">
                    <td className="py-3 px-4 text-[#B7F34A] font-semibold">{r.id}</td>
                    <td className="py-3 px-4 text-[#91A19B]">{r.timestamp}</td>
                    <td className="py-3 px-4 font-sans font-medium">{r.junctionName}</td>
                    <td className="py-3 px-4 text-[#52C7D9]">{r.laneId}</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">{r.vehicleCount}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span
                        className={`font-bold ${
                          r.densityIndex > 75
                            ? 'text-[#F06464]'
                            : r.densityIndex >= 40
                            ? 'text-[#F2B84B]'
                            : 'text-[#71D49A]'
                        }`}
                      >
                        {r.densityIndex.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#91A19B]">
                      {r.averageSpeedKmH.toFixed(1)} km/h
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.signalPhase === 'GREEN'
                            ? 'text-[#71D49A] bg-[#71D49A]/10 border border-[#71D49A]/30'
                            : r.signalPhase === 'YELLOW'
                            ? 'text-[#F2B84B] bg-[#F2B84B]/10 border border-[#F2B84B]/30'
                            : 'text-[#F06464] bg-[#F06464]/10 border border-[#F06464]/30'
                        }`}
                      >
                        {r.signalPhase}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#B7F34A] tabular-nums">
                      {r.recommendedGreenSec}s
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.congestionLevel === 'High'
                            ? 'bg-[#F06464]/10 text-[#F06464] border border-[#F06464]/20'
                            : r.congestionLevel === 'Moderate'
                            ? 'bg-[#F2B84B]/10 text-[#F2B84B] border border-[#F2B84B]/20'
                            : 'bg-[#71D49A]/10 text-[#71D49A] border border-[#71D49A]/20'
                        }`}
                      >
                        {r.congestionLevel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
