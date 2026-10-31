import React, { useState } from 'react';
import {
  MapPin,
  Sliders,
  Siren,
  Video,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Volume2,
  UserCheck,
  Eye,
} from 'lucide-react';
import { JunctionData, TrafficStatus } from '../../types';
import { CctvSurveillanceModal } from '../CctvSurveillanceModal';

interface JunctionsViewProps {
  junctions: JunctionData[];
  onUpdateJunctionLoad: (id: string, delta: number) => void;
  onTriggerEmergency: (id: string) => void;
  onUpdateJunction: (id: string, updates: Partial<JunctionData>) => void;
}

export const JunctionsView: React.FC<JunctionsViewProps> = ({
  junctions,
  onUpdateJunctionLoad,
  onTriggerEmergency,
  onUpdateJunction,
}) => {
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>(junctions[0]?.id || 'JUNCT_A');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TrafficStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCctvJunction, setActiveCctvJunction] = useState<JunctionData | null>(null);

  // Pedestrian walk call state
  const [pedestrianWalkActive, setPedestrianWalkActive] = useState<Record<string, boolean>>({});
  const [pedestrianTimer, setPedestrianTimer] = useState<Record<string, number>>({});

  const filteredJunctions = junctions.filter((j) => {
    const matchesFilter = statusFilter === 'ALL' || j.status === statusFilter;
    const matchesSearch =
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedJunction = junctions.find((j) => j.id === selectedJunctionId) || junctions[0];

  const handleTriggerPedestrianWalk = (id: string) => {
    if (pedestrianWalkActive[id]) return;
    setPedestrianWalkActive((prev) => ({ ...prev, [id]: true }));
    setPedestrianTimer((prev) => ({ ...prev, [id]: 15 }));

    const interval = setInterval(() => {
      setPedestrianTimer((prev) => {
        const current = prev[id] || 0;
        if (current <= 1) {
          clearInterval(interval);
          setPedestrianWalkActive((p) => ({ ...p, [id]: false }));
          return { ...prev, [id]: 0 };
        }
        return { ...prev, [id]: current - 1 };
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F2] tracking-tight">
            Junction Monitoring &amp; Telemetry
          </h1>
          <p className="text-xs text-[#91A19B] mt-0.5">
            Inspect approach queues, signal cycle allocation, and directional traffic flow schematics.
          </p>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search junction ID or name..."
            className="bg-[#151F24] border border-[#29383A] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A] w-52"
          />

          <div className="flex items-center gap-1 bg-[#151F24] p-1 rounded-xl border border-[#29383A] text-xs">
            {(['ALL', 'Free Flow', 'Moderate', 'Congested'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-[#1B292E] text-[#B7F34A] font-semibold'
                    : 'text-[#91A19B] hover:text-[#F1F5F2]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Selector List & Right Comprehensive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Junction List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-mono text-[#91A19B] uppercase tracking-wider">
            Monitored Intersections ({filteredJunctions.length})
          </div>

          <div className="space-y-2.5">
            {filteredJunctions.map((j) => {
              const isSelected = j.id === selectedJunctionId;
              return (
                <div
                  key={j.id}
                  onClick={() => setSelectedJunctionId(j.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B292E] border-[#B7F34A] shadow-md'
                      : 'bg-[#151F24] border-[#29383A] hover:border-[#3D535A]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#B7F34A]">{j.id}</span>
                      <h3 className="text-xs font-bold text-[#F1F5F2]">{j.name}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        j.status === 'Congested'
                          ? 'bg-[#F06464]/10 text-[#F06464] border border-[#F06464]/20'
                          : j.status === 'Moderate'
                          ? 'bg-[#F2B84B]/10 text-[#F2B84B] border border-[#F2B84B]/20'
                          : 'bg-[#71D49A]/10 text-[#71D49A] border border-[#71D49A]/20'
                      }`}
                    >
                      {j.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mt-3 pt-2.5 border-t border-[#29383A] text-[#91A19B]">
                    <div>
                      <span>Vehicles:</span>
                      <span className="text-[#F1F5F2] font-semibold block">{j.n1 + j.n2}</span>
                    </div>
                    <div>
                      <span>Load L:</span>
                      <span className="text-[#F1F5F2] font-semibold block">{j.load.toFixed(1)}</span>
                    </div>
                    <div>
                      <span>Signal:</span>
                      <span
                        className={`font-semibold block ${
                          j.signalState === 'GREEN'
                            ? 'text-[#71D49A]'
                            : j.signalState === 'YELLOW'
                            ? 'text-[#F2B84B]'
                            : 'text-[#F06464]'
                        }`}
                      >
                        {j.signalState} ({j.greenDurationSec}s)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Junction Schematics & Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedJunction && (
            <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#29383A] gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#B7F34A]">{selectedJunction.id}</span>
                    <span className="text-xs font-mono text-[#64736D]">·</span>
                    <span className="text-xs font-mono text-[#91A19B]">Sector 0{selectedJunction.assignedCore + 1}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#F1F5F2] mt-0.5">{selectedJunction.name}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCctvJunction(selectedJunction)}
                    className="px-3 py-1.5 rounded-xl bg-[#1B292E] hover:bg-[#24353C] border border-[#29383A] text-xs font-medium text-[#F1F5F2] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-[#52C7D9]" />
                    <span>Live CCTV Feed</span>
                  </button>

                  <button
                    onClick={() => onTriggerEmergency(selectedJunction.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedJunction.hasEmergencyVehicle
                        ? 'bg-[#F06464] text-white'
                        : 'bg-[#F06464]/10 hover:bg-[#F06464]/20 border border-[#F06464]/30 text-[#F06464]'
                    }`}
                  >
                    <Siren className="w-3.5 h-3.5" />
                    <span>{selectedJunction.hasEmergencyVehicle ? 'Clear Override' : 'Ambulance Wave'}</span>
                  </button>
                </div>
              </div>

              {/* INTERACTIVE SCHEMATIC ROAD-JUNCTION VISUALIZATION */}
              <div className="p-6 rounded-xl bg-[#0B0F12] border border-[#29383A] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="text-xs font-mono text-[#91A19B] mb-4 self-start">
                  Directional Approach Intersection Schematic
                </div>

                <div className="relative w-72 h-72 flex items-center justify-center">
                  {/* Road Asphalt Cross */}
                  <div className="absolute w-24 h-full bg-[#151F24] border-x border-[#29383A]" />
                  <div className="absolute h-24 w-full bg-[#151F24] border-y border-[#29383A]" />

                  {/* Road Center Lane Markings */}
                  <div className="absolute w-0.5 h-full border-l border-dashed border-[#64736D]" />
                  <div className="absolute h-0.5 w-full border-t border-dashed border-[#64736D]" />

                  {/* Center Intersection Box */}
                  <div className="absolute w-24 h-24 bg-[#1B292E]/90 border border-[#B7F34A]/40 flex items-center justify-center z-10 rounded-sm">
                    <div className="text-center font-mono">
                      <div className="text-[10px] text-[#64736D]">Active Phase</div>
                      <div
                        className={`text-xs font-bold ${
                          selectedJunction.signalState === 'GREEN'
                            ? 'text-[#71D49A]'
                            : selectedJunction.signalState === 'YELLOW'
                            ? 'text-[#F2B84B]'
                            : 'text-[#F06464]'
                        }`}
                      >
                        {selectedJunction.signalState}
                      </div>
                      <div className="text-[11px] font-bold text-[#F1F5F2] mt-0.5">
                        {selectedJunction.greenDurationSec}s
                      </div>
                    </div>
                  </div>

                  {/* NORTH APPROACH */}
                  <div className="absolute top-2 flex flex-col items-center text-center z-20">
                    <span className="text-[10px] font-mono text-[#91A19B]">NORTH (Lane 1)</span>
                    <span className="text-xs font-mono font-bold text-[#B7F34A]">{selectedJunction.n1} veh</span>
                    <div
                      className={`w-3 h-3 rounded-full mt-1 border ${
                        selectedJunction.signalState === 'GREEN'
                          ? 'bg-[#71D49A] border-[#71D49A] shadow-[0_0_8px_#71D49A]'
                          : 'bg-[#10171B] border-[#29383A]'
                      }`}
                    />
                  </div>

                  {/* SOUTH APPROACH */}
                  <div className="absolute bottom-2 flex flex-col items-center text-center z-20">
                    <div
                      className={`w-3 h-3 rounded-full mb-1 border ${
                        selectedJunction.signalState === 'GREEN'
                          ? 'bg-[#71D49A] border-[#71D49A] shadow-[0_0_8px_#71D49A]'
                          : 'bg-[#10171B] border-[#29383A]'
                      }`}
                    />
                    <span className="text-xs font-mono font-bold text-[#B7F34A]">{selectedJunction.n1} veh</span>
                    <span className="text-[10px] font-mono text-[#91A19B]">SOUTH (Lane 1)</span>
                  </div>

                  {/* EAST APPROACH */}
                  <div className="absolute right-2 flex items-center gap-1.5 z-20">
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        selectedJunction.signalState === 'RED'
                          ? 'bg-[#F06464] border-[#F06464] shadow-[0_0_8px_#F06464]'
                          : 'bg-[#10171B] border-[#29383A]'
                      }`}
                    />
                    <div className="text-left font-mono">
                      <div className="text-xs font-bold text-[#52C7D9]">{selectedJunction.n2} veh</div>
                      <div className="text-[10px] text-[#91A19B]">EAST (L2)</div>
                    </div>
                  </div>

                  {/* WEST APPROACH */}
                  <div className="absolute left-2 flex items-center gap-1.5 z-20">
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-[#52C7D9]">{selectedJunction.n2} veh</div>
                      <div className="text-[10px] text-[#91A19B]">WEST (L2)</div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        selectedJunction.signalState === 'RED'
                          ? 'bg-[#F06464] border-[#F06464] shadow-[0_0_8px_#F06464]'
                          : 'bg-[#10171B] border-[#29383A]'
                      }`}
                    />
                  </div>
                </div>

                {/* Pedestrian Call Button & Crosswalk State */}
                <div className="mt-5 flex items-center gap-4 text-xs font-mono">
                  <button
                    onClick={() => handleTriggerPedestrianWalk(selectedJunction.id)}
                    disabled={pedestrianWalkActive[selectedJunction.id]}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      pedestrianWalkActive[selectedJunction.id]
                        ? 'bg-[#71D49A]/20 border-[#71D49A] text-[#71D49A]'
                        : 'bg-[#151F24] border-[#29383A] text-[#91A19B] hover:text-[#F1F5F2]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#B7F34A]" />
                    <span>
                      {pedestrianWalkActive[selectedJunction.id]
                        ? `Walk Active (${pedestrianTimer[selectedJunction.id]}s)`
                        : 'Call Pedestrian Crosswalk'}
                    </span>
                  </button>

                  <div className="text-[11px] text-[#64736D]">
                    Pedestrian phase overrides crossway green cycle safely
                  </div>
                </div>
              </div>

              {/* Approach Queue Adjusters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#10171B] border border-[#29383A] space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#91A19B]">Primary Arterial (N1):</span>
                    <span className="text-[#F1F5F2] font-bold">{selectedJunction.n1} vehicles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateJunctionLoad(selectedJunction.id, -10)}
                      className="flex-1 py-1.5 rounded-lg bg-[#151F24] hover:bg-[#1B292E] text-xs font-mono text-[#91A19B] border border-[#29383A] cursor-pointer"
                    >
                      -10 Veh
                    </button>
                    <button
                      onClick={() => onUpdateJunctionLoad(selectedJunction.id, -2)}
                      className="flex-1 py-1.5 rounded-lg bg-[#151F24] hover:bg-[#1B292E] text-xs font-mono text-[#91A19B] border border-[#29383A] cursor-pointer"
                    >
                      -2 Veh
                    </button>
                    <button
                      onClick={() => onUpdateJunctionLoad(selectedJunction.id, 2)}
                      className="flex-1 py-1.5 rounded-lg bg-[#151F24] hover:bg-[#1B292E] text-xs font-mono text-[#B7F34A] border border-[#29383A] cursor-pointer"
                    >
                      +2 Veh
                    </button>
                    <button
                      onClick={() => onUpdateJunctionLoad(selectedJunction.id, 10)}
                      className="flex-1 py-1.5 rounded-lg bg-[#151F24] hover:bg-[#1B292E] text-xs font-mono text-[#B7F34A] border border-[#29383A] cursor-pointer"
                    >
                      +10 Veh
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#10171B] border border-[#29383A] space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#91A19B]">Secondary Crossway (N2):</span>
                    <span className="text-[#F1F5F2] font-bold">{selectedJunction.n2} vehicles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newN2 = Math.max(2, selectedJunction.n2 - 5);
                        const newLoad = (selectedJunction.n1 + newN2) * selectedJunction.w;
                        onUpdateJunction(selectedJunction.id, {
                          n2: newN2,
                          load: newLoad,
                          status: newLoad > 80 ? 'Congested' : newLoad >= 40 ? 'Moderate' : 'Free Flow',
                        });
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[#151F24] hover:bg-[#1B292E] text-xs font-mono text-[#91A19B] border border-[#29383A] cursor-pointer"
                    >
                      -5 Veh
                    </button>
                    <button
                      onClick={() => {
                        const newN2 = selectedJunction.n2 + 5;
                        const newLoad = (selectedJunction.n1 + newN2) * selectedJunction.w;
                        onUpdateJunction(selectedJunction.id, {
                          n2: newN2,
                          load: newLoad,
                          status: newLoad > 80 ? 'Congested' : newLoad >= 40 ? 'Moderate' : 'Free Flow',
                        });
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[#151F24] hover:bg-[#1B292E] text-xs font-mono text-[#52C7D9] border border-[#29383A] cursor-pointer"
                    >
                      +5 Veh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CCTV LIVE MODAL */}
      {activeCctvJunction && (
        <CctvSurveillanceModal
          junction={activeCctvJunction}
          onClose={() => setActiveCctvJunction(null)}
          onTriggerEmergency={onTriggerEmergency}
        />
      )}
    </div>
  );
};
