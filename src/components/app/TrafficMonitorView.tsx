import React, { useState } from 'react';
import {
  Activity,
  BarChart2,
  TrendingUp,
  Clock,
  Filter,
  Layers,
  ArrowRight,
  Database,
  Gauge,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { JunctionData, TrafficRecord } from '../../types';

interface TrafficMonitorViewProps {
  junctions: JunctionData[];
  records: TrafficRecord[];
}

export const TrafficMonitorView: React.FC<TrafficMonitorViewProps> = ({
  junctions,
  records,
}) => {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'ALL' | 'LAST_15M' | 'LAST_1H'>('ALL');
  const [selectedJunctionFilter, setSelectedJunctionFilter] = useState<string>('ALL');

  // Chart data comparing junction approach loads
  const junctionComparisonData = junctions.map((j) => ({
    name: j.id,
    fullName: j.name,
    ArterialN1: j.n1,
    CrosswayN2: j.n2,
    TotalVehicles: j.n1 + j.n2,
    LoadIndex: Math.round(j.load),
    CapacityLimit: j.queueThreshold,
  }));

  // Historical speed vs density trend from records
  const speedDensityTrend = records.map((r) => ({
    time: r.timestamp,
    density: r.densityIndex,
    speed: r.averageSpeedKmH,
    lane: r.laneId,
  }));

  return (
    <div className="space-y-6">
      {/* Header and Telemetry Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F2] tracking-tight">
            Traffic Density &amp; Flow Monitoring
          </h1>
          <p className="text-xs text-[#91A19B] mt-0.5">
            Evaluate vehicle density indices, velocity degradation, and approach capacity utilization across nodes.
          </p>
        </div>

        {/* Data Source Transparency Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151F24] border border-[#29383A] text-xs font-mono">
          <Database className="w-3.5 h-3.5 text-[#52C7D9]" />
          <span className="text-[#91A19B]">Source:</span>
          <span className="text-[#F1F5F2] font-semibold">Active Simulation Telemetry</span>
        </div>
      </div>

      {/* Top 3 Quick Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Average Approach Speed</span>
          <div className="text-2xl font-bold text-[#52C7D9] tabular-nums">
            {(records.reduce((a, b) => a + b.averageSpeedKmH, 0) / (records.length || 1)).toFixed(1)} km/h
          </div>
          <span className="text-[10px] text-[#64736D] font-mono">Benchmark: 45.0 km/h free flow</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Peak Density Approach</span>
          <div className="text-2xl font-bold text-[#F06464] tabular-nums">
            {Math.max(...records.map((r) => r.densityIndex)).toFixed(1)}%
          </div>
          <span className="text-[10px] text-[#F06464] font-mono">East Approach (JUNCT_D)</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Total Monitored Lanes</span>
          <div className="text-2xl font-bold text-[#B7F34A] tabular-nums">8 Arterial Lanes</div>
          <span className="text-[10px] text-[#70D6B4] font-mono">Capacity: 50 vehicles/approach</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Junction Queue Comparison Bar Chart (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
                Approach Vehicle Distribution
              </h3>
              <p className="text-sm font-bold text-[#F1F5F2] mt-0.5">
                Lane 1 vs Lane 2 Vehicle Influx by Junction
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={junctionComparisonData} barSize={16}>
                <XAxis dataKey="name" stroke="#64736D" fontSize={11} tickLine={false} />
                <YAxis stroke="#64736D" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10171B',
                    borderColor: '#29383A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F1F5F2',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#91A19B', paddingTop: '10px' }} />
                <Bar dataKey="ArterialN1" name="Lane 1 Vehicles (N1)" fill="#B7F34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="CrosswayN2" name="Lane 2 Vehicles (N2)" fill="#52C7D9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] font-mono text-[#64736D] pt-2 border-t border-[#29383A] flex justify-between">
            <span>Formula: Total Vehicles = N1 + N2</span>
            <span>Capacity Threshold: 50/approach</span>
          </div>
        </div>

        {/* Speed Degradation vs Density Index (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
          <div>
            <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
              Speed vs Density Correlation
            </h3>
            <p className="text-sm font-bold text-[#F1F5F2] mt-0.5">
              Flow Velocity Under High Densities
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedDensityTrend}>
                <XAxis dataKey="time" stroke="#64736D" fontSize={10} tickLine={false} />
                <YAxis stroke="#64736D" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10171B',
                    borderColor: '#29383A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F1F5F2',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#91A19B', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="density"
                  name="Density Index (%)"
                  stroke="#F2B84B"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  name="Avg Speed (km/h)"
                  stroke="#70D6B4"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] font-mono text-[#91A19B] pt-2 border-t border-[#29383A]">
            Observed: Higher density (&gt;75%) causes rapid drop in average velocity to &lt;15 km/h.
          </div>
        </div>
      </div>

      {/* Junction Detail Cards Table */}
      <div className="rounded-2xl bg-[#151F24] border border-[#29383A] overflow-hidden">
        <div className="p-4 border-b border-[#29383A] flex items-center justify-between">
          <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
            Detailed Approach Telemetry Matrix
          </h3>
          <span className="text-[11px] font-mono text-[#64736D]">
            Showing {records.length} recent readings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#10171B] text-[#91A19B] border-b border-[#29383A]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Record ID</th>
                <th className="py-2.5 px-4 font-medium">Timestamp</th>
                <th className="py-2.5 px-4 font-medium">Junction</th>
                <th className="py-2.5 px-4 font-medium">Approach Lane</th>
                <th className="py-2.5 px-4 font-medium text-right">Vehicles</th>
                <th className="py-2.5 px-4 font-medium text-right">Density Index</th>
                <th className="py-2.5 px-4 font-medium text-right">Avg Speed</th>
                <th className="py-2.5 px-4 font-medium">Congestion Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#29383A]/60 text-[#F1F5F2]">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-[#1B292E]/50 transition-colors">
                  <td className="py-3 px-4 text-[#B7F34A] font-semibold">{r.id}</td>
                  <td className="py-3 px-4 text-[#91A19B]">{r.timestamp}</td>
                  <td className="py-3 px-4 font-sans font-medium text-[#F1F5F2]">{r.junctionName}</td>
                  <td className="py-3 px-4 text-[#52C7D9]">{r.laneId}</td>
                  <td className="py-3 px-4 text-right font-bold">{r.vehicleCount}</td>
                  <td className="py-3 px-4 text-right">
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
                  <td className="py-3 px-4 text-right text-[#91A19B]">{r.averageSpeedKmH.toFixed(1)} km/h</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
