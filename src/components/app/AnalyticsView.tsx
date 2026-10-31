import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  Layers,
  ArrowRight,
  Database,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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

interface AnalyticsViewProps {
  junctions: JunctionData[];
  records: TrafficRecord[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  junctions,
  records,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | '7_DAYS' | '30_DAYS'>('TODAY');

  // Time-of-day traffic distribution
  const timeOfDayData = [
    { hour: '06:00', vehicles: 85, density: 24, speed: 48 },
    { hour: '08:00', vehicles: 310, density: 82, speed: 18 },
    { hour: '10:00', vehicles: 220, density: 58, speed: 32 },
    { hour: '12:00', vehicles: 195, density: 50, speed: 36 },
    { hour: '14:00', vehicles: 210, density: 55, speed: 34 },
    { hour: '17:00', vehicles: 340, density: 88, speed: 14 },
    { hour: '19:00', vehicles: 260, density: 68, speed: 28 },
    { hour: '21:00', vehicles: 140, density: 38, speed: 42 },
  ];

  // Junction performance matrix
  const performanceMatrix = junctions.map((j) => ({
    name: j.id,
    fullName: j.name,
    load: Math.round(j.load),
    greenSec: j.greenDurationSec,
    utilization: Math.round((j.load / j.queueThreshold) * 100),
    efficiencyRating: j.load > 80 ? 'Heavy Delay' : j.load > 40 ? 'Moderate Queue' : 'Optimal Flow',
  }));

  return (
    <div className="space-y-6">
      {/* Header and Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F2] tracking-tight">
            Traffic Intelligence Analytics
          </h1>
          <p className="text-xs text-[#91A19B] mt-0.5">
            Longitudinal capacity utilization, peak period patterns, and signal timing efficiency.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#151F24] p-1 rounded-xl border border-[#29383A] text-xs font-mono">
          {(['TODAY', '7_DAYS', '30_DAYS'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedPeriod === period
                  ? 'bg-[#1B292E] text-[#B7F34A] font-semibold'
                  : 'text-[#91A19B] hover:text-[#F1F5F2]'
              }`}
            >
              {period === 'TODAY' ? 'Current Shift' : period === '7_DAYS' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Multi-metric Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Peak Rush Influx</span>
          <div className="text-2xl font-bold text-[#F06464] tabular-nums">340 veh/hr</div>
          <span className="text-[10px] text-[#F06464] font-mono">Evening Commute (17:00-18:30)</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Avg Network Velocity</span>
          <div className="text-2xl font-bold text-[#52C7D9] tabular-nums">31.5 km/h</div>
          <span className="text-[10px] text-[#70D6B4] font-mono">+4.2 km/h with Webster Splits</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Signal Efficiency Index</span>
          <div className="text-2xl font-bold text-[#B7F34A] tabular-nums">92.4%</div>
          <span className="text-[10px] text-[#B7F34A] font-mono">Green Wave Coherence</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Incident Frequency</span>
          <div className="text-2xl font-bold text-[#F2B84B] tabular-nums">1.8 / day</div>
          <span className="text-[10px] text-[#64736D] font-mono">Spillback &gt; 80% density</span>
        </div>
      </div>

      {/* Main Charts: Diurnal Flow Cycle & Capacity Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Diurnal Traffic Pattern (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
                Diurnal Flow Profile
              </h3>
              <p className="text-sm font-bold text-[#F1F5F2] mt-0.5">
                Hourly Influx &amp; Approach Saturation Curve
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#64736D]">24-Hour Municipal Model</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeOfDayData}>
                <defs>
                  <linearGradient id="influxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B7F34A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#B7F34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64736D" fontSize={11} tickLine={false} />
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
                <Area
                  type="monotone"
                  dataKey="vehicles"
                  stroke="#B7F34A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#influxGrad)"
                  name="Hourly Influx (veh)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] font-mono text-[#91A19B] pt-2 border-t border-[#29383A]">
            Peak periods clearly emerge at morning ingress (08:00) and evening egress (17:00).
          </div>
        </div>

        {/* Junction Capacity Utilization Matrix (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
          <div>
            <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
              Intersection Capacity Load
            </h3>
            <p className="text-sm font-bold text-[#F1F5F2] mt-0.5">
              Saturation Relative to Queue Threshold
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceMatrix} layout="vertical">
                <XAxis type="number" domain={[0, 150]} stroke="#64736D" fontSize={10} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#64736D" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10171B',
                    borderColor: '#29383A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F1F5F2',
                  }}
                />
                <Bar dataKey="utilization" name="Capacity Load %" fill="#52C7D9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] font-mono text-[#64736D] pt-2 border-t border-[#29383A]">
            100% = Nominal capacity limit (Threshold: 80 load units).
          </div>
        </div>
      </div>

      {/* Junction Historical Performance Summary */}
      <div className="rounded-2xl bg-[#151F24] border border-[#29383A] p-5 space-y-3">
        <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
          Intersection Performance Matrix
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {performanceMatrix.map((item) => (
            <div key={item.name} className="p-3.5 rounded-xl bg-[#10171B] border border-[#29383A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F1F5F2]">{item.name}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    item.utilization > 100
                      ? 'text-[#F06464] bg-[#F06464]/10 border border-[#F06464]/20'
                      : item.utilization > 50
                      ? 'text-[#F2B84B] bg-[#F2B84B]/10 border border-[#F2B84B]/20'
                      : 'text-[#71D49A] bg-[#71D49A]/10 border border-[#71D49A]/20'
                  }`}
                >
                  {item.efficiencyRating}
                </span>
              </div>
              <div className="text-xs font-mono text-[#91A19B] space-y-1">
                <div className="flex justify-between">
                  <span>Load Index:</span>
                  <span className="text-[#F1F5F2] font-semibold">{item.load}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Green:</span>
                  <span className="text-[#B7F34A] font-semibold">{item.greenSec}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturation:</span>
                  <span className="text-[#52C7D9] font-semibold">{item.utilization}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
