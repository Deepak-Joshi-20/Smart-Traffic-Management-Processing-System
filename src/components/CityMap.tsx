/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import {
  Video,
  Siren,
  Layers,
  Activity,
  CheckCircle2,
  Car,
  Compass,
  ArrowUpRight,
  Maximize2,
  RefreshCw,
  Info,
  Radio,
  Gauge,
  Zap,
  TrendingDown,
  TrendingUp,
  Camera,
  Eye,
  Sliders,
  AlertTriangle,
  Monitor,
  Download,
  Map as MapIcon,
  Globe,
} from 'lucide-react';
import { JunctionData } from '../types';
import { CctvSurveillanceModal } from './CctvSurveillanceModal';

// Register GSAP MotionPathPlugin
gsap.registerPlugin(MotionPathPlugin);

interface CityMapProps {
  junctions: JunctionData[];
  onSelectJunction: (junctionId: string) => void;
  onDispatchEmergency: (junctionId: string) => void;
  onUpdateJunctionLoad: (junctionId: string, delta: number) => void;
  activeLayers?: {
    heatmap?: boolean;
    signalStatus?: boolean;
    emergencyCorridors?: boolean;
  };
}

type VehicleType = 'sedan' | 'bus' | 'van' | 'ev' | 'ambulance';

interface CorridorInfo {
  id: 'north' | 'south' | 'west' | 'east' | 'central';
  name: string;
  endpoints: string;
  density: number;
  speedKmH: number;
  durationSec: number;
  status: 'Free Flow' | 'Moderate' | 'Congested';
  vehicleCount: number;
}

interface VehicleDef {
  id: string;
  pathId: string;
  initialProgress: number;
  type: VehicleType;
  color: string;
  corridorId: 'north' | 'south' | 'west' | 'east' | 'central';
  label: string;
}

// Full roster of 22 vehicles across the arterial grid
const VEHICLE_ROSTER: VehicleDef[] = [
  // North Expressway (A <-> B)
  { id: 'north-e1', pathId: 'path-north-east', initialProgress: 0.05, type: 'sedan', color: '#4D91E8', corridorId: 'north', label: 'Car N-01' },
  { id: 'north-e2', pathId: 'path-north-east', initialProgress: 0.42, type: 'ev', color: '#35B99B', corridorId: 'north', label: 'EV N-02' },
  { id: 'north-e3', pathId: 'path-north-east', initialProgress: 0.78, type: 'bus', color: '#E5A84D', corridorId: 'north', label: 'Bus 104' },
  { id: 'north-w1', pathId: 'path-north-west', initialProgress: 0.12, type: 'sedan', color: '#A9A0BC', corridorId: 'north', label: 'Car N-03' },
  { id: 'north-w2', pathId: 'path-north-west', initialProgress: 0.52, type: 'van', color: '#7C6F99', corridorId: 'north', label: 'Van L-01' },
  { id: 'north-w3', pathId: 'path-north-west', initialProgress: 0.86, type: 'ev', color: '#35B99B', corridorId: 'north', label: 'EV N-04' },

  // South Arterial (C <-> D)
  { id: 'south-e1', pathId: 'path-south-east', initialProgress: 0.08, type: 'van', color: '#7C6F99', corridorId: 'south', label: 'Van L-02' },
  { id: 'south-e2', pathId: 'path-south-east', initialProgress: 0.48, type: 'sedan', color: '#4D91E8', corridorId: 'south', label: 'Car S-01' },
  { id: 'south-e3', pathId: 'path-south-east', initialProgress: 0.82, type: 'bus', color: '#E5A84D', corridorId: 'south', label: 'Bus 208' },
  { id: 'south-w1', pathId: 'path-south-west', initialProgress: 0.22, type: 'ev', color: '#35B99B', corridorId: 'south', label: 'EV S-02' },
  { id: 'south-w2', pathId: 'path-south-west', initialProgress: 0.62, type: 'sedan', color: '#A9A0BC', corridorId: 'south', label: 'Car S-03' },

  // West Expressway (A <-> C)
  { id: 'west-s1', pathId: 'path-west-south', initialProgress: 0.25, type: 'sedan', color: '#4D91E8', corridorId: 'west', label: 'Car W-01' },
  { id: 'west-s2', pathId: 'path-west-south', initialProgress: 0.72, type: 'van', color: '#7C6F99', corridorId: 'west', label: 'Van W-02' },
  { id: 'west-n1', pathId: 'path-west-north', initialProgress: 0.32, type: 'ev', color: '#35B99B', corridorId: 'west', label: 'EV W-03' },
  { id: 'west-n2', pathId: 'path-west-north', initialProgress: 0.82, type: 'bus', color: '#E5A84D', corridorId: 'west', label: 'Bus 312' },

  // East Expressway (B <-> D)
  { id: 'east-s1', pathId: 'path-east-south', initialProgress: 0.18, type: 'bus', color: '#E5A84D', corridorId: 'east', label: 'Bus 401' },
  { id: 'east-s2', pathId: 'path-east-south', initialProgress: 0.68, type: 'sedan', color: '#4D91E8', corridorId: 'east', label: 'Car E-01' },
  { id: 'east-n1', pathId: 'path-east-north', initialProgress: 0.35, type: 'van', color: '#7C6F99', corridorId: 'east', label: 'Van E-02' },
  { id: 'east-n2', pathId: 'path-east-north', initialProgress: 0.85, type: 'ev', color: '#35B99B', corridorId: 'east', label: 'EV E-03' },

  // Diagonal & Roundabout Hub Connectors
  { id: 'diag-ad', pathId: 'path-diag-ad', initialProgress: 0.15, type: 'ev', color: '#35B99B', corridorId: 'central', label: 'EV Cross-1' },
  { id: 'diag-cb', pathId: 'path-diag-cb', initialProgress: 0.65, type: 'bus', color: '#E5A84D', corridorId: 'central', label: 'Bus Cross-2' },
  { id: 'orbit-hub', pathId: 'path-roundabout-orbit', initialProgress: 0.40, type: 'sedan', color: '#4D91E8', corridorId: 'central', label: 'Hub Orbit' },
];

export const CityMap: React.FC<CityMapProps> = ({
  junctions,
  onSelectJunction,
  onDispatchEmergency,
  onUpdateJunctionLoad,
  activeLayers,
}) => {
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>('JUNCT_B');
  const [activeLayer, setActiveLayer] = useState<'traffic' | 'heatmap' | 'cameras' | 'greenwave'>('traffic');
  const [basemapMode, setBasemapMode] = useState<'carto' | 'satellite' | 'grid'>('carto');
  const [cameraModalJunction, setCameraModalJunction] = useState<JunctionData | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [showSpeedBadges, setShowSpeedBadges] = useState<boolean>(true);
  const [simulationMultiplier, setSimulationMultiplier] = useState<number>(1);
  const [inspectedVehicle, setInspectedVehicle] = useState<VehicleDef | null>(null);

  // Computed layer activation (respects parent activeLayers if provided, or internal controls)
  const isHeatmapActive = activeLayers?.heatmap !== undefined ? activeLayers.heatmap : (activeLayer === 'heatmap');
  const isSignalStatusActive = activeLayers?.signalStatus !== undefined ? activeLayers.signalStatus : false;
  const isEmergencyCorridorActive = activeLayers?.emergencyCorridors !== undefined
    ? activeLayers.emergencyCorridors
    : (activeLayer === 'greenwave' || isEmergencyActive);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const vehicleRefs = useRef<Record<string, SVGGElement | null>>({});
  const emergencyRef = useRef<SVGGElement | null>(null);
  const tweensRef = useRef<Record<string, { tween: gsap.core.Tween; baseDuration: number }>>({});
  const emergencyTweenRef = useRef<gsap.core.Tween | null>(null);

  // Layout coordinates for 4 junctions in an 800x480 SVG coordinate space
  const junctionNodes = useMemo(() => {
    const coords: Record<string, { x: number; y: number; label: string; subtitle: string }> = {
      JUNCT_A: { x: 230, y: 130, label: 'Junction A', subtitle: 'North Expressway Flyover' },
      JUNCT_B: { x: 570, y: 130, label: 'Junction B', subtitle: 'Downtown Financial Core' },
      JUNCT_C: { x: 230, y: 350, label: 'Junction C', subtitle: 'Tech & University Zone' },
      JUNCT_D: { x: 570, y: 350, label: 'Junction D', subtitle: 'Airport Logistics Ring' },
    };

    return junctions.map((j) => {
      const pos = coords[j.id] || { x: 400, y: 240, label: j.name, subtitle: '' };
      return {
        ...j,
        x: pos.x,
        y: pos.y,
        label: pos.label,
        subtitle: pos.subtitle,
      };
    });
  }, [junctions]);

  const selectedJunction = junctionNodes.find((j) => j.id === selectedJunctionId) || junctionNodes[0];

  // Helper map for fast lookup
  const jMap = useMemo(() => {
    const m = new Map<string, typeof junctionNodes[0]>();
    junctionNodes.forEach((j) => m.set(j.id, j));
    return m;
  }, [junctionNodes]);

  // Real-time corridor physics calculations based on junction load/density
  const corridors = useMemo<Record<'north' | 'south' | 'west' | 'east' | 'central', CorridorInfo>>(() => {
    const jA = jMap.get('JUNCT_A') || junctionNodes[0];
    const jB = jMap.get('JUNCT_B') || junctionNodes[1] || junctionNodes[0];
    const jC = jMap.get('JUNCT_C') || junctionNodes[2] || junctionNodes[0];
    const jD = jMap.get('JUNCT_D') || junctionNodes[3] || junctionNodes[0];

    const calcCorridor = (
      id: 'north' | 'south' | 'west' | 'east' | 'central',
      name: string,
      endpoints: string,
      load1: number,
      load2: number,
      baseDist: number
    ): CorridorInfo => {
      const avgLoad = (load1 + load2) / 2;
      const density = Math.min(98, Math.max(12, Math.round((avgLoad / 120) * 100)));
      const speedKmH = Math.max(12, Math.round(65 * (1 - density / 135)));
      const rawDuration = (baseDist / speedKmH) * 1.5;
      const durationSec = Number(Math.max(2.2, Math.min(18.0, rawDuration / simulationMultiplier)).toFixed(1));
      const vehicleCount = density > 75 ? 4 : density > 40 ? 3 : 2;
      const status: CorridorInfo['status'] =
        density > 75 ? 'Congested' : density >= 40 ? 'Moderate' : 'Free Flow';

      return {
        id,
        name,
        endpoints,
        density,
        speedKmH,
        durationSec,
        status,
        vehicleCount,
      };
    };

    return {
      north: calcCorridor('north', 'North Expressway', 'Junction A ↔ Junction B', jA.load, jB.load, 85),
      south: calcCorridor('south', 'South Arterial', 'Junction C ↔ Junction D', jC.load, jD.load, 85),
      west: calcCorridor('west', 'West Expressway', 'Junction A ↔ Junction C', jA.load, jC.load, 65),
      east: calcCorridor('east', 'East Expressway', 'Junction B ↔ Junction D', jB.load, jD.load, 65),
      central: calcCorridor(
        'central',
        'Central Hub Roundabout',
        'Orbital Grid Interconnect',
        (jA.load + jB.load + jC.load + jD.load) / 4,
        (jA.load + jB.load + jC.load + jD.load) / 4,
        50
      ),
    };
  }, [junctionNodes, jMap, simulationMultiplier]);

  // ==========================================
  // GSAP MOTION PATH SETUP & DYNAMIC SPEED CONTROL
  // ==========================================
  useEffect(() => {
    const ctx = gsap.context(() => {
      VEHICLE_ROSTER.forEach((v) => {
        const el = vehicleRefs.current[v.id];
        const pathEl = document.getElementById(v.pathId) as SVGPathElement | null;
        if (!el || !pathEl) return;

        const corridor = corridors[v.corridorId];
        const baseDuration = corridor ? corridor.durationSec : 6;
        const speedModifier = v.type === 'bus' ? 1.25 : v.type === 'ev' ? 0.9 : 1.0;
        const duration = Math.max(2.0, baseDuration * speedModifier);

        const tween = gsap.to(el, {
          motionPath: {
            path: pathEl,
            autoRotate: true,
            alignOrigin: [0.5, 0.5],
          },
          duration: duration,
          repeat: -1,
          ease: 'none',
        });

        tween.progress(v.initialProgress);
        tweensRef.current[v.id] = { tween, baseDuration: duration };
      });
    }, svgRef);

    return () => {
      ctx.revert();
      tweensRef.current = {};
    };
  }, []);

  // Smoothly adjust GSAP timeScale proportionally when load/density changes
  useEffect(() => {
    VEHICLE_ROSTER.forEach((v) => {
      const item = tweensRef.current[v.id];
      if (!item) return;

      const corridor = corridors[v.corridorId];
      if (!corridor) return;

      const speedModifier = v.type === 'bus' ? 1.25 : v.type === 'ev' ? 0.9 : 1.0;
      const targetDuration = corridor.durationSec * speedModifier;
      const targetTimeScale = item.baseDuration / targetDuration;

      gsap.to(item.tween, {
        timeScale: targetTimeScale,
        duration: 0.8,
        ease: 'power1.out',
      });
    });
  }, [corridors]);

  // Handle emergency vehicle animation via GSAP
  useEffect(() => {
    if (isEmergencyActive && emergencyRef.current) {
      const emergencyPath = document.getElementById('path-emergency') as SVGPathElement | null;
      if (emergencyPath) {
        emergencyTweenRef.current = gsap.to(emergencyRef.current, {
          motionPath: {
            path: emergencyPath,
            autoRotate: true,
            alignOrigin: [0.5, 0.5],
          },
          duration: 2.5 / simulationMultiplier,
          repeat: -1,
          ease: 'none',
        });
      }
    } else {
      if (emergencyTweenRef.current) {
        emergencyTweenRef.current.kill();
        emergencyTweenRef.current = null;
      }
    }
  }, [isEmergencyActive, simulationMultiplier]);

  // Load pulse attributes matching the Examos color palette
  const getPulseAttributes = (status: 'Free Flow' | 'Moderate' | 'Congested') => {
    switch (status) {
      case 'Congested':
        return {
          stroke: '#E55353',
          fill: '#3A1C24',
          speed: '1.2s',
          badgeBg: 'bg-[#3A1C24] text-[#E55353] border-[#5E2734]',
          label: 'Congested (L > 80)',
        };
      case 'Moderate':
        return {
          stroke: '#E5A84D',
          fill: '#342818',
          speed: '2.0s',
          badgeBg: 'bg-[#342818] text-[#E5A84D] border-[#574021]',
          label: 'Moderate (40 ≤ L ≤ 80)',
        };
      case 'Free Flow':
        return {
          stroke: '#35B99B',
          fill: '#17332B',
          speed: '3.0s',
          badgeBg: 'bg-[#17332B] text-[#35B99B] border-[#265245]',
          label: 'Free Flow (L < 40)',
        };
    }
  };

  const handleDispatchEmergencyClick = () => {
    setIsEmergencyActive(true);
    onDispatchEmergency('JUNCT_B');
    setTimeout(() => {
      setIsEmergencyActive(false);
    }, 8000);
  };

  // Render SVG Vehicle Geometry oriented along direction of travel
  const renderVehicleGraphic = (type: VehicleType, color: string) => {
    switch (type) {
      case 'bus':
        return (
          <g className="cursor-pointer transition-transform hover:scale-125">
            <rect x="-11" y="-5" width="22" height="10" rx="2.5" fill="#E5A84D" stroke="#100D18" strokeWidth="0.8" />
            <rect x="-8" y="-4" width="3" height="8" rx="0.5" fill="#100D18" opacity="0.85" />
            <rect x="-3.5" y="-4" width="3" height="8" rx="0.5" fill="#100D18" opacity="0.85" />
            <rect x="1" y="-4" width="3" height="8" rx="0.5" fill="#100D18" opacity="0.85" />
            <rect x="5.5" y="-4" width="4" height="8" rx="0.5" fill="#100D18" opacity="0.85" />
            <circle cx="10.5" cy="-3.2" r="1.1" fill="#FFFBEB" />
            <circle cx="10.5" cy="3.2" r="1.1" fill="#FFFBEB" />
            <circle cx="-11" cy="-3.2" r="0.9" fill="#E55353" />
            <circle cx="-11" cy="3.2" r="0.9" fill="#E55353" />
          </g>
        );

      case 'van':
        return (
          <g className="cursor-pointer transition-transform hover:scale-125">
            <rect x="-9" y="-4.5" width="18" height="9" rx="2" fill="#7C6F99" stroke="#100D18" strokeWidth="0.8" />
            <rect x="2" y="-3.5" width="4.5" height="7" rx="0.5" fill="#100D18" opacity="0.8" />
            <circle cx="8.5" cy="-2.8" r="1" fill="#FFFBEB" />
            <circle cx="8.5" cy="2.8" r="1" fill="#FFFBEB" />
            <circle cx="-9" cy="-2.8" r="0.9" fill="#E55353" />
            <circle cx="-9" cy="2.8" r="0.9" fill="#E55353" />
          </g>
        );

      case 'ev':
        return (
          <g className="cursor-pointer transition-transform hover:scale-125">
            <rect x="-7.5" y="-4" width="15" height="8" rx="2" fill="#35B99B" stroke="#100D18" strokeWidth="0.8" />
            <rect x="0" y="-3" width="3" height="6" rx="0.5" fill="#100D18" opacity="0.75" />
            <circle cx="-1" cy="0" r="1.3" fill="#4D91E8" />
            <circle cx="7.2" cy="-2.6" r="1" fill="#FFFBEB" />
            <circle cx="7.2" cy="2.6" r="1" fill="#FFFBEB" />
            <circle cx="-7.5" cy="-2.6" r="0.8" fill="#E55353" />
            <circle cx="-7.5" cy="2.6" r="0.8" fill="#E55353" />
          </g>
        );

      case 'sedan':
      default:
        return (
          <g className="cursor-pointer transition-transform hover:scale-125">
            <rect x="-7" y="-3.5" width="14" height="7" rx="1.8" fill={color} stroke="#100D18" strokeWidth="0.8" />
            <rect x="0.5" y="-2.6" width="2.5" height="5.2" rx="0.4" fill="#100D18" opacity="0.75" />
            <circle cx="6.8" cy="-2.2" r="0.9" fill="#FFFBEB" />
            <circle cx="6.8" cy="2.2" r="0.9" fill="#FFFBEB" />
            <circle cx="-7" cy="-2.2" r="0.8" fill="#E55353" />
            <circle cx="-7" cy="2.2" r="0.8" fill="#E55353" />
          </g>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Control & Density Physics Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#151F24] border border-[#29383A] text-xs shadow-md">
        {/* Basemap & Layer Switches */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Basemap Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#91A19B] font-medium mr-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
              <MapIcon className="w-3.5 h-3.5 text-[#B7F34A]" />
              <span>Map Style:</span>
            </span>
            <div className="flex items-center bg-[#10171B] border border-[#29383A] rounded-xl p-0.5">
              <button
                onClick={() => setBasemapMode('carto')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  basemapMode === 'carto'
                    ? 'bg-[#B7F34A] text-[#0B0F12] shadow-xs'
                    : 'text-[#91A19B] hover:text-[#F1F5F2]'
                }`}
                title="Real Municipal Cartography with named avenues, building footprints, and waterways"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Real Carto Map</span>
              </button>
              <button
                onClick={() => setBasemapMode('satellite')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  basemapMode === 'satellite'
                    ? 'bg-[#52C7D9] text-[#0B0F12] shadow-xs'
                    : 'text-[#91A19B] hover:text-[#F1F5F2]'
                }`}
                title="High-altitude dark satellite reconnaissance and runway telemetry"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Satellite Ortho</span>
              </button>
              <button
                onClick={() => setBasemapMode('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  basemapMode === 'grid'
                    ? 'bg-[#70D6B4] text-[#0B0F12] shadow-xs'
                    : 'text-[#91A19B] hover:text-[#F1F5F2]'
                }`}
                title="Tactical dark vector blueprint grid"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tactical Grid</span>
              </button>
            </div>
          </div>

          <div className="h-5 w-px bg-[#29383A] hidden sm:block" />

          {/* Layer Switches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#91A19B] font-medium mr-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-[#52C7D9]" />
              <span>Layers:</span>
            </span>
            <button
              onClick={() => setActiveLayer('traffic')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeLayer === 'traffic'
                  ? 'bg-[#1B292E] text-[#B7F34A] border border-[#B7F34A]/50 shadow-xs'
                  : 'bg-[#10171B] text-[#91A19B] hover:text-[#F1F5F2] border border-[#29383A]'
              }`}
            >
              Live Flow
            </button>
            <button
              onClick={() => setActiveLayer('heatmap')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeLayer === 'heatmap'
                  ? 'bg-[#F2B84B] text-[#0B0F12] font-semibold shadow-xs'
                  : 'bg-[#10171B] text-[#91A19B] hover:text-[#F1F5F2] border border-[#29383A]'
              }`}
            >
              Density Heatmap
            </button>
            <button
              onClick={() => setActiveLayer('cameras')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeLayer === 'cameras'
                  ? 'bg-[#52C7D9] text-[#0B0F12] font-semibold shadow-xs'
                  : 'bg-[#10171B] text-[#91A19B] hover:text-[#F1F5F2] border border-[#29383A]'
              }`}
            >
              CCTV Feeds
            </button>
            <button
              onClick={() => setActiveLayer('greenwave')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeLayer === 'greenwave'
                  ? 'bg-[#70D6B4] text-[#0B0F12] font-semibold shadow-xs'
                  : 'bg-[#10171B] text-[#91A19B] hover:text-[#F1F5F2] border border-[#29383A]'
              }`}
            >
              Green Wave
            </button>
          </div>
        </div>

        {/* Speed Badges Toggle & GSAP Simulation Speed Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSpeedBadges((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg border font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              showSpeedBadges
                ? 'bg-[#10171B] text-[#B7F34A] border-[#B7F34A]/40'
                : 'bg-[#10171B] text-[#91A19B] border-[#29383A]'
            }`}
            title="Toggle speed velocity indicators along arterial corridors"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Velocity: {showSpeedBadges ? 'ON' : 'OFF'}</span>
          </button>

          {/* Simulation multiplier toggle */}
          <div className="flex items-center bg-[#10171B] border border-[#29383A] rounded-xl p-0.5 font-mono">
            <button
              onClick={() => setSimulationMultiplier(1)}
              className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                simulationMultiplier === 1 ? 'bg-[#B7F34A] text-[#0B0F12] font-bold' : 'text-[#91A19B]'
              }`}
            >
              1× Real
            </button>
            <button
              onClick={() => setSimulationMultiplier(2)}
              className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                simulationMultiplier === 2 ? 'bg-[#52C7D9] text-[#0B0F12] font-bold' : 'text-[#91A19B]'
              }`}
            >
              2× Speed
            </button>
          </div>

          {/* Emergency Dispatch Button */}
          <button
            onClick={handleDispatchEmergencyClick}
            disabled={isEmergencyActive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              isEmergencyActive
                ? 'bg-[#3A1C24] text-[#F06464] border border-[#F06464]/40 cursor-not-allowed'
                : 'bg-[#F06464] hover:bg-[#F06464]/90 text-white shadow-rose-950/40'
            }`}
          >
            <Siren className={`w-3.5 h-3.5 ${isEmergencyActive ? 'animate-bounce' : ''}`} />
            <span>{isEmergencyActive ? 'Priority Active' : 'Dispatch Ambulance'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Corridor Telemetry Strip (Linking Density Values to GSAP Traversal Speed) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs font-mono">
        {Object.values(corridors).map((corr) => {
          const isCongested = corr.status === 'Congested';
          const isModerate = corr.status === 'Moderate';
          return (
            <motion.div
              key={corr.id}
              layout
              className={`p-2.5 rounded-xl border transition-all ${
                isCongested
                  ? 'bg-[#2A171D] border-[#5E2734] text-[#E55353]'
                  : isModerate
                  ? 'bg-[#281F1A] border-[#574021] text-[#E5A84D]'
                  : 'bg-[#191522] border-[#393044] text-[#35B99B]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-[#A9A0BC]">
                <span className="truncate">{corr.name}</span>
                <span className="font-semibold uppercase">{corr.status}</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-sm font-bold text-[#F5F3FA] tabular-nums">
                  {corr.density}% <span className="text-[10px] font-normal text-[#A9A0BC]">density</span>
                </div>
                <div className="text-xs font-bold tabular-nums">
                  {corr.speedKmH} <span className="text-[10px] font-normal opacity-80">km/h</span>
                </div>
              </div>
              <div className="text-[10px] text-[#A9A0BC] mt-1 flex items-center justify-between">
                <span>GSAP Duration: {corr.durationSec}s</span>
                <span className="flex items-center gap-0.5">
                  {isCongested ? <TrendingDown className="w-2.5 h-2.5 text-[#E55353]" /> : <TrendingUp className="w-2.5 h-2.5 text-[#35B99B]" />}
                  {isCongested ? 'Slowed' : 'Fluid'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main SVG Vector Map with GSAP MotionPath Vehicles & CCTV Overlays */}
      <div className="w-full rounded-2xl bg-[#201B29] border border-[#393044] overflow-hidden shadow-xl relative">
        {/* Top Floating Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#191522]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#393044] text-xs">
          <span className="w-2 h-2 rounded-full bg-[#35B99B] animate-pulse" />
          <span className="font-semibold text-[#F5F3FA]">GSAP MotionPath Simulation</span>
          <span className="text-[#393044]">·</span>
          <span className="text-[#A9A0BC] font-mono">
            {VEHICLE_ROSTER.length + (isEmergencyActive ? 1 : 0)} Active Markers
          </span>
        </div>

        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {inspectedVehicle && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-[#191522]/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#4D91E8]/50 text-[11px] text-[#F5F3FA] font-mono"
            >
              <Car className="w-3.5 h-3.5 text-[#4D91E8]" />
              <span>{inspectedVehicle.label}</span>
              <span className="text-[#35B99B]">{corridors[inspectedVehicle.corridorId].speedKmH} km/h</span>
              <button
                onClick={() => setInspectedVehicle(null)}
                className="text-[#A9A0BC] hover:text-[#F5F3FA] ml-1 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}

          <button
            onClick={() => setCameraModalJunction(selectedJunction)}
            className="flex items-center gap-1.5 bg-[#191522]/90 hover:bg-[#191522] backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#393044] text-xs font-medium text-[#F5F3FA] transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#4D91E8]" />
            <span>Inspect Selected CCTV</span>
          </button>
        </div>

        {/* SVG Map Container */}
        <svg
          ref={svgRef}
          viewBox="0 0 800 480"
          className="w-full h-auto block select-none bg-[#100D18]"
          style={{ maxHeight: '520px' }}
        >
          <defs>
            {/* Pattern for city street blocks */}
            <pattern id="city-blocks" width="36" height="36" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="#151120" stroke="#1F1A2A" strokeWidth="1" />
            </pattern>

            {/* Hidden Motion Paths utilized by GSAP MotionPathPlugin */}
            <path id="path-north-east" d="M 230 124 L 570 124" fill="none" opacity="0" />
            <path id="path-north-west" d="M 570 136 L 230 136" fill="none" opacity="0" />
            <path id="path-south-east" d="M 230 344 L 570 344" fill="none" opacity="0" />
            <path id="path-south-west" d="M 570 356 L 230 356" fill="none" opacity="0" />
            <path id="path-west-south" d="M 236 130 L 236 350" fill="none" opacity="0" />
            <path id="path-west-north" d="M 224 350 L 224 130" fill="none" opacity="0" />
            <path id="path-east-south" d="M 576 130 L 576 350" fill="none" opacity="0" />
            <path id="path-east-north" d="M 564 350 L 564 130" fill="none" opacity="0" />
            <path id="path-diag-ad" d="M 230 130 L 375 228 A 28 28 0 0 1 425 252 L 570 350" fill="none" opacity="0" />
            <path id="path-diag-cb" d="M 230 350 L 375 252 A 28 28 0 0 1 425 228 L 570 130" fill="none" opacity="0" />
            <path id="path-roundabout-orbit" d="M 400 214 A 26 26 0 1 1 399.9 214" fill="none" opacity="0" />
            <path id="path-emergency" d="M 230 124 L 570 124 L 576 350" fill="none" opacity="0" />

            {/* Heatmap Thermal Blur Filter */}
            <filter id="heat-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="7" />
            </filter>

            {/* Real Cartography Water Wave Pattern */}
            <pattern id="water-waves" width="28" height="14" patternUnits="userSpaceOnUse">
              <path d="M 0 7 Q 7 3 14 7 T 28 7" fill="none" stroke="#1C384C" strokeWidth="0.8" opacity="0.6" />
            </pattern>

            {/* Satellite Grid Quadrant Pattern */}
            <pattern id="satellite-mesh" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="none" stroke="#16252E" strokeWidth="0.5" strokeDasharray="3 3" />
            </pattern>
          </defs>

          {/* 0. BASEMAP LAYER: Real Carto Map vs Satellite Ortho vs Tactical Grid */}
          {basemapMode === 'carto' && (
            <g id="basemap-real-carto">
              {/* Municipal Base Canvas */}
              <rect width="800" height="480" fill="#0C141A" />

              {/* Urban Zoning Parcel Blocks (Building Footprints & Commercial Parcels) */}
              {/* Northwest Sector (Residential & Mixed Use) */}
              <rect x="40" y="30" width="70" height="55" rx="3" fill="#131E26" stroke="#1F323E" strokeWidth="0.8" />
              <rect x="120" y="30" width="75" height="55" rx="3" fill="#131E26" stroke="#1F323E" strokeWidth="0.8" />
              <rect x="40" y="170" width="60" height="45" rx="3" fill="#131E26" stroke="#1F323E" strokeWidth="0.8" />
              <rect x="110" y="170" width="75" height="45" rx="3" fill="#131E26" stroke="#1F323E" strokeWidth="0.8" />

              {/* Northeast Sector (Downtown Financial Core Towers) */}
              <rect x="615" y="30" width="65" height="55" rx="3" fill="#15242F" stroke="#233B4D" strokeWidth="0.8" />
              <rect x="690" y="30" width="70" height="55" rx="3" fill="#15242F" stroke="#233B4D" strokeWidth="0.8" />
              <rect x="615" y="170" width="70" height="45" rx="3" fill="#15242F" stroke="#233B4D" strokeWidth="0.8" />
              <rect x="695" y="170" width="65" height="45" rx="3" fill="#15242F" stroke="#233B4D" strokeWidth="0.8" />

              {/* Southwest Sector (Tech Innovation Campus & University) */}
              <rect x="40" y="270" width="75" height="50" rx="3" fill="#122026" stroke="#1F3540" strokeWidth="0.8" />
              <rect x="125" y="270" width="70" height="50" rx="3" fill="#122026" stroke="#1F3540" strokeWidth="0.8" />
              <rect x="40" y="380" width="65" height="60" rx="3" fill="#122026" stroke="#1F3540" strokeWidth="0.8" />
              <rect x="115" y="380" width="80" height="60" rx="3" fill="#122026" stroke="#1F3540" strokeWidth="0.8" />

              {/* Southeast Sector (Airport Freight & Industrial Logistics Terminals) */}
              <rect x="615" y="270" width="75" height="50" rx="3" fill="#141E24" stroke="#22333D" strokeWidth="0.8" />
              <rect x="700" y="270" width="65" height="50" rx="3" fill="#141E24" stroke="#22333D" strokeWidth="0.8" />
              <rect x="615" y="380" width="65" height="60" rx="3" fill="#141E24" stroke="#22333D" strokeWidth="0.8" />
              <rect x="690" y="380" width="75" height="60" rx="3" fill="#141E24" stroke="#22333D" strokeWidth="0.8" />

              {/* Urban Green Spaces & Parks */}
              {/* Riverside Botanical Arboretum */}
              <rect x="270" y="275" width="95" height="45" rx="6" fill="#0E231B" stroke="#1B4434" strokeWidth="1" />
              <text x="317" y="302" textAnchor="middle" fontSize="8" fill="#70D6B4" opacity="0.8" fontFamily="sans-serif">
                ARBORETUM PARK
              </text>

              {/* Waterfront Promenade Park */}
              <rect x="435" y="160" width="95" height="45" rx="6" fill="#0E231B" stroke="#1B4434" strokeWidth="1" />
              <text x="482" y="187" textAnchor="middle" fontSize="8" fill="#70D6B4" opacity="0.8" fontFamily="sans-serif">
                RIVERSIDE ESPLANADE
              </text>

              {/* Hudson / Metro Marina Waterway (Realistic Channel & Bay Shoreline) */}
              <path
                d="M 0 235 C 160 215, 270 260, 400 245 C 530 230, 640 270, 800 250 L 800 290 C 640 310, 530 270, 400 285 C 270 300, 160 255, 0 275 Z"
                fill="#091823"
                stroke="#163143"
                strokeWidth="1.5"
              />
              <path
                d="M 0 235 C 160 215, 270 260, 400 245 C 530 230, 640 270, 800 250 L 800 290 C 640 310, 530 270, 400 285 C 270 300, 160 255, 0 275 Z"
                fill="url(#water-waves)"
              />
              {/* Marina Docks at East Bay */}
              <line x1="720" y1="262" x2="775" y2="262" stroke="#25465C" strokeWidth="2.5" />
              <line x1="735" y1="256" x2="735" y2="268" stroke="#25465C" strokeWidth="1.5" />
              <line x1="755" y1="256" x2="755" y2="268" stroke="#25465C" strokeWidth="1.5" />
              <text x="745" y="250" textAnchor="middle" fontSize="7.5" fill="#52C7D9" opacity="0.75" fontFamily="monospace">
                MARINA SLIPS
              </text>
            </g>
          )}

          {basemapMode === 'satellite' && (
            <g id="basemap-satellite-ortho">
              {/* Satellite Dark Ground */}
              <rect width="800" height="480" fill="#080F13" />
              <rect width="800" height="480" fill="url(#satellite-mesh)" opacity="0.6" />

              {/* Waterway in Dark Satellite Infrared */}
              <path
                d="M 0 235 C 160 215, 270 260, 400 245 C 530 230, 640 270, 800 250 L 800 290 C 640 310, 530 270, 400 285 C 270 300, 160 255, 0 275 Z"
                fill="#060C10"
                stroke="#1B323D"
                strokeWidth="2"
              />

              {/* Airport Runway Complex near Junction D */}
              <g transform="translate(620, 390)">
                <rect x="0" y="0" width="150" height="26" fill="#141E24" stroke="#2A404E" strokeWidth="1" />
                <line x1="10" y1="13" x2="140" y2="13" stroke="#F1F5F2" strokeWidth="1.5" strokeDasharray="12 8" opacity="0.7" />
                <text x="18" y="17" fontSize="8.5" fontWeight="bold" fill="#F1F5F2" opacity="0.8" fontFamily="monospace">
                  09L
                </text>
                <text x="125" y="17" fontSize="8.5" fontWeight="bold" fill="#F1F5F2" opacity="0.8" fontFamily="monospace">
                  27R
                </text>
              </g>

              {/* Central Hub Satellite Radar Rings */}
              <circle cx="400" cy="240" r="85" fill="none" stroke="#52C7D9" strokeWidth="0.8" strokeDasharray="4 6" opacity="0.25" />
              <circle cx="400" cy="240" r="170" fill="none" stroke="#52C7D9" strokeWidth="0.6" strokeDasharray="4 6" opacity="0.15" />
              <circle cx="400" cy="240" r="260" fill="none" stroke="#52C7D9" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.1" />

              {/* GPS Coordinates HUD Overlay on Satellite */}
              <g transform="translate(25, 460)">
                <text fontSize="8.5" fill="#52C7D9" fontFamily="monospace" opacity="0.75">
                  LAT 37°46'31.2"N · LON 122°25'08.4"W · ALT 42m · ORBIT SAT-04
                </text>
              </g>
            </g>
          )}

          {basemapMode === 'grid' && (
            <g id="basemap-tactical-grid">
              <rect width="800" height="480" fill="url(#city-blocks)" />
              <path
                d="M 0 240 C 200 230, 300 260, 400 250 C 500 240, 600 270, 800 260"
                fill="none"
                stroke="#171A2E"
                strokeWidth="28"
                strokeLinecap="round"
              />
              <path
                d="M 0 240 C 200 230, 300 260, 400 250 C 500 240, 600 270, 800 260"
                fill="none"
                stroke="#212645"
                strokeWidth="4"
                strokeDasharray="12 12"
              />
            </g>
          )}

          {/* Road Highways Connecting the 4 Junctions */}
          {/* North Highway (I-94 Metropolitan Expressway) */}
          <line x1="230" y1="130" x2="570" y2="130" stroke="#18252E" strokeWidth="26" strokeLinecap="round" />
          <line x1="230" y1="130" x2="570" y2="130" stroke="#F5BE58" strokeWidth="1.4" opacity="0.9" />
          <line x1="230" y1="124" x2="570" y2="124" stroke="#F1F5F2" strokeWidth="1" strokeDasharray="6 6" opacity="0.35" />
          <line x1="230" y1="136" x2="570" y2="136" stroke="#F1F5F2" strokeWidth="1" strokeDasharray="6 6" opacity="0.35" />

          {/* South Highway (Route 101 Arterial Parkway) */}
          <line x1="230" y1="350" x2="570" y2="350" stroke="#18252E" strokeWidth="26" strokeLinecap="round" />
          <line x1="230" y1="350" x2="570" y2="350" stroke="#F5BE58" strokeWidth="1.4" opacity="0.9" />
          <line x1="230" y1="344" x2="570" y2="344" stroke="#F1F5F2" strokeWidth="1" strokeDasharray="6 6" opacity="0.35" />
          <line x1="230" y1="356" x2="570" y2="356" stroke="#F1F5F2" strokeWidth="1" strokeDasharray="6 6" opacity="0.35" />

          {/* West Highway (Grand Central Boulevard) */}
          <line x1="230" y1="130" x2="230" y2="350" stroke="#18252E" strokeWidth="26" strokeLinecap="round" />
          <line x1="230" y1="130" x2="230" y2="350" stroke="#F5BE58" strokeWidth="1.4" opacity="0.9" />
          <line x1="224" y1="130" x2="224" y2="350" stroke="#F1F5F2" strokeWidth="1" strokeDasharray="6 6" opacity="0.35" />
          <line x1="236" y1="130" x2="236" y2="350" stroke="#F1F5F2" strokeWidth="1" strokeDasharray="6 6" opacity="0.35" />

          {/* East Highway (Port Logistics Viaduct) */}
          <line x1="570" y1="130" x2="570" y2="350" stroke="#18252E" strokeWidth="26" strokeLinecap="round" />
          <line x1="570" y1="130" x2="570" y2="350" stroke="#F5BE58" strokeWidth="1.4" opacity="0.9" />
          <line x1="564" y1="130" x2="564" y2="350" stroke="#F1F5F2" strokeWidth="1" strokeDasharray="6 6" opacity="0.35" />
          <line x1="576" y1="130" x2="576" y2="350" stroke="#F1F5F2" strokeWidth="1" strokeDasharray="6 6" opacity="0.35" />

          {/* Diagonal Cross Connectors */}
          <line x1="230" y1="130" x2="570" y2="350" stroke="#141F26" strokeWidth="16" strokeLinecap="round" />
          <line x1="230" y1="130" x2="570" y2="350" stroke="#29383A" strokeWidth="1.2" strokeDasharray="8 8" />
          <line x1="570" y1="130" x2="230" y2="350" stroke="#141F26" strokeWidth="16" strokeLinecap="round" />
          <line x1="570" y1="130" x2="230" y2="350" stroke="#29383A" strokeWidth="1.2" strokeDasharray="8 8" />

          {/* Center Traffic Roundabout Circle */}
          <circle cx="400" cy="240" r="38" fill="none" stroke="#18252E" strokeWidth="18" />
          <circle cx="400" cy="240" r="38" fill="none" stroke="#F5BE58" strokeWidth="1.2" strokeDasharray="6 6" />
          <circle cx="400" cy="240" r="28" fill="#10171B" stroke="#29383A" strokeWidth="1.5" />
          <text
            x="400"
            y="244"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#B7F34A"
            fontFamily="JetBrains Mono, monospace"
          >
            Central Hub
          </text>

          {/* Geographic Real Street Name Labels (Only shown in Real Carto or Satellite mode) */}
          {(basemapMode === 'carto' || basemapMode === 'satellite') && (
            <g id="geographic-street-labels" className="pointer-events-none select-none">
              {/* North Expressway Label & Shield */}
              <g transform="translate(355, 108)">
                <rect x="-42" y="-11" width="84" height="15" rx="3" fill="#10171B" stroke="#52C7D9" strokeWidth="1" opacity="0.9" />
                <text x="0" y="0" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#52C7D9" fontFamily="monospace">
                  I-94 METRO EXPY
                </text>
              </g>

              {/* South Parkway Label & Shield */}
              <g transform="translate(355, 375)">
                <rect x="-40" y="-11" width="80" height="15" rx="3" fill="#10171B" stroke="#70D6B4" strokeWidth="1" opacity="0.9" />
                <text x="0" y="0" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#70D6B4" fontFamily="monospace">
                  RT-101 ARTERIAL
                </text>
              </g>

              {/* West Avenue Label */}
              <g transform="translate(195, 240) rotate(-90)">
                <text x="0" y="0" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#91A19B" opacity="0.85" fontFamily="monospace" letterSpacing="1">
                  GRAND CENTRAL BLVD
                </text>
              </g>

              {/* East Avenue Label */}
              <g transform="translate(605, 240) rotate(90)">
                <text x="0" y="0" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#91A19B" opacity="0.85" fontFamily="monospace" letterSpacing="1">
                  AIRPORT PORT VIADUCT
                </text>
              </g>
            </g>
          )}

          {/* 1. LAYER: Congestion Heatmap Layer (if active) */}
          {isHeatmapActive && (
            <g id="layer-congestion-heatmap" className="transition-opacity duration-300">
              {/* Thermal Corridor Bands with Glow */}
              <line
                x1="230"
                y1="130"
                x2="570"
                y2="130"
                stroke={corridors.north.status === 'Congested' ? '#F06464' : corridors.north.status === 'Moderate' ? '#F2B84B' : '#71D49A'}
                strokeWidth="18"
                strokeLinecap="round"
                filter="url(#heat-glow)"
                opacity="0.65"
              />
              <line
                x1="570"
                y1="130"
                x2="570"
                y2="350"
                stroke={corridors.east.status === 'Congested' ? '#F06464' : corridors.east.status === 'Moderate' ? '#F2B84B' : '#71D49A'}
                strokeWidth="18"
                strokeLinecap="round"
                filter="url(#heat-glow)"
                opacity="0.65"
              />
              <line
                x1="230"
                y1="350"
                x2="570"
                y2="350"
                stroke={corridors.south.status === 'Congested' ? '#F06464' : corridors.south.status === 'Moderate' ? '#F2B84B' : '#71D49A'}
                strokeWidth="18"
                strokeLinecap="round"
                filter="url(#heat-glow)"
                opacity="0.65"
              />
              <line
                x1="230"
                y1="130"
                x2="230"
                y2="350"
                stroke={corridors.west.status === 'Congested' ? '#F06464' : corridors.west.status === 'Moderate' ? '#F2B84B' : '#71D49A'}
                strokeWidth="18"
                strokeLinecap="round"
                filter="url(#heat-glow)"
                opacity="0.65"
              />

              {/* Radial Thermal Congestion Footprint Bubbles at each Node */}
              {junctionNodes.map((node) => {
                const heatColor =
                  node.status === 'Congested'
                    ? '#F06464'
                    : node.status === 'Moderate'
                    ? '#F2B84B'
                    : '#71D49A';
                const heatRadius = Math.min(52, Math.max(26, node.load * 0.42));
                return (
                  <g key={`heat-node-${node.id}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={heatRadius}
                      fill={heatColor}
                      filter="url(#heat-glow)"
                      opacity="0.45"
                    />
                    {/* Heatmap Queue Density Floating Badge */}
                    <g transform={`translate(${node.x - 36}, ${node.y - 48})`}>
                      <rect
                        width="72"
                        height="18"
                        rx="5"
                        fill="#0B0F12"
                        stroke={heatColor}
                        strokeWidth="1.2"
                      />
                      <text
                        x="36"
                        y="12"
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="700"
                        fill={heatColor}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        HEAT {Math.round((node.load / node.queueThreshold) * 100)}%
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}

          {/* 2. LAYER: Emergency Corridors Highlight Layer (if active) */}
          {isEmergencyCorridorActive && (
            <g id="layer-emergency-corridors" className="transition-opacity duration-300">
              {/* Wide Glowing Clearance Path along North Expressway (A <-> B) and East Corridor (B <-> D) */}
              <path
                d="M 230 124 L 570 124 L 576 350"
                fill="none"
                stroke="#52C7D9"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.35"
                filter="url(#heat-glow)"
              />
              <path
                d="M 230 124 L 570 124 L 576 350"
                fill="none"
                stroke="#F06464"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="10 8"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-36"
                  dur="1.1s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Emergency Corridor HUD Banner Pill */}
              <g transform="translate(400, 78)">
                <rect
                  x="-95"
                  y="-11"
                  width="190"
                  height="22"
                  rx="6"
                  fill="#0B0F12"
                  stroke="#F06464"
                  strokeWidth="1.5"
                />
                <circle cx="-80" cy="0" r="3.5" fill="#F06464">
                  <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" />
                </circle>
                <text
                  x="5"
                  y="4"
                  textAnchor="middle"
                  fill="#F06464"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ACTIVE EMERGENCY CORRIDOR
                </text>
              </g>

              {/* Siren Pulse Rings at Node A, B, and D */}
              {[
                { x: 230, y: 124 },
                { x: 570, y: 124 },
                { x: 576, y: 350 },
              ].map((pt, idx) => (
                <circle
                  key={`siren-ring-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="24"
                  fill="none"
                  stroke="#F06464"
                  strokeWidth="2"
                  opacity="0.8"
                >
                  <animate attributeName="r" values="12;32" dur="0.9s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0" dur="0.9s" repeatCount="indefinite" />
                </circle>
              ))}
            </g>
          )}

          {/* 3. LAYER: Signal Status & Live Light Phases (if active) */}
          {isSignalStatusActive && (
            <g id="layer-signal-status" className="transition-opacity duration-300">
              {junctionNodes.map((node) => {
                const isGreen = node.signalState === 'GREEN';
                const isYellow = node.signalState === 'YELLOW';
                const isRed = node.signalState === 'RED';

                return (
                  <g key={`signal-status-head-${node.id}`} transform={`translate(${node.x + 24}, ${node.y - 36})`}>
                    {/* Traffic Signal Head Box */}
                    <rect
                      x="0"
                      y="0"
                      width="18"
                      height="46"
                      rx="4"
                      fill="#0B0F12"
                      stroke="#29383A"
                      strokeWidth="1.5"
                      className="shadow-md"
                    />
                    {/* Red Lamp */}
                    <circle
                      cx="9"
                      cy="9"
                      r="4.5"
                      fill={isRed ? '#F06464' : '#2A171D'}
                      stroke={isRed ? '#F06464' : '#5E2734'}
                      strokeWidth="1"
                    />
                    {isRed && (
                      <circle cx="9" cy="9" r="7" fill="#F06464" opacity="0.3" filter="url(#heat-glow)" />
                    )}

                    {/* Amber/Yellow Lamp */}
                    <circle
                      cx="9"
                      cy="23"
                      r="4.5"
                      fill={isYellow ? '#F2B84B' : '#281F1A'}
                      stroke={isYellow ? '#F2B84B' : '#574021'}
                      strokeWidth="1"
                    />
                    {isYellow && (
                      <circle cx="9" cy="23" r="7" fill="#F2B84B" opacity="0.3" filter="url(#heat-glow)" />
                    )}

                    {/* Green Lamp */}
                    <circle
                      cx="9"
                      cy="37"
                      r="4.5"
                      fill={isGreen ? '#71D49A' : '#132822'}
                      stroke={isGreen ? '#71D49A' : '#1D4539'}
                      strokeWidth="1"
                    />
                    {isGreen && (
                      <circle cx="9" cy="37" r="7" fill="#71D49A" opacity="0.4" filter="url(#heat-glow)" />
                    )}

                    {/* Live Phase Countdown & Directional Pill */}
                    <g transform="translate(24, 13)">
                      <rect
                        x="0"
                        y="-10"
                        width="76"
                        height="20"
                        rx="5"
                        fill="#151F24"
                        stroke={isGreen ? '#71D49A' : isYellow ? '#F2B84B' : '#F06464'}
                        strokeWidth="1.2"
                      />
                      <text
                        x="38"
                        y="4"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="700"
                        fill={isGreen ? '#71D49A' : isYellow ? '#F2B84B' : '#F06464'}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {node.signalState} {node.greenDurationSec}s
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}

          {/* Speed / Velocity Corridor Overlay Badges */}
          {showSpeedBadges && (
            <g fontFamily="JetBrains Mono, monospace" fontSize="9" fontWeight="600">
              <g transform="translate(400, 105)">
                <rect x="-42" y="-9" width="84" height="18" rx="5" fill="#191522" stroke="#393044" strokeWidth="1" />
                <text x="0" y="3.5" textAnchor="middle" fill="#F5F3FA">
                  {corridors.north.speedKmH} km/h · {corridors.north.density}%
                </text>
              </g>

              <g transform="translate(400, 375)">
                <rect x="-42" y="-9" width="84" height="18" rx="5" fill="#191522" stroke="#393044" strokeWidth="1" />
                <text x="0" y="3.5" textAnchor="middle" fill="#F5F3FA">
                  {corridors.south.speedKmH} km/h · {corridors.south.density}%
                </text>
              </g>

              <g transform="translate(195, 240)">
                <rect x="-38" y="-9" width="76" height="18" rx="5" fill="#191522" stroke="#393044" strokeWidth="1" />
                <text x="0" y="3.5" textAnchor="middle" fill="#F5F3FA">
                  {corridors.west.speedKmH} km/h
                </text>
              </g>

              <g transform="translate(605, 240)">
                <rect x="-38" y="-9" width="76" height="18" rx="5" fill="#191522" stroke="#393044" strokeWidth="1" />
                <text x="0" y="3.5" textAnchor="middle" fill="#F5F3FA">
                  {corridors.east.speedKmH} km/h
                </text>
              </g>
            </g>
          )}

          {/* DYNAMIC GSAP MOTIONPATH ANIMATED VEHICLES */}
          {VEHICLE_ROSTER.map((v) => (
            <g
              key={v.id}
              ref={(el) => {
                vehicleRefs.current[v.id] = el;
              }}
              onClick={() => setInspectedVehicle(v)}
            >
              {renderVehicleGraphic(v.type, v.color)}
            </g>
          ))}

          {/* Priority Emergency Vehicle Animation if active */}
          {isEmergencyActive && (
            <g
              ref={emergencyRef}
              key="emergency-active-car"
            >
              <rect x="-10" y="-5" width="20" height="10" rx="2.5" fill="#E55353" stroke="#F5F3FA" strokeWidth="1.2" />
              <rect x="2" y="-3.5" width="4" height="7" rx="0.5" fill="#100D18" opacity="0.85" />
              <circle cx="-1" cy="0" r="2.2" fill="#F5F3FA">
                <animate attributeName="fill" values="#F5F3FA;#E55353;#4D91E8;#F5F3FA" dur="0.25s" repeatCount="indefinite" />
              </circle>
              <circle cx="9.5" cy="-3.2" r="1.3" fill="#FFFBEB" />
              <circle cx="9.5" cy="3.2" r="1.3" fill="#FFFBEB" />
              <circle cx="0" cy="0" r="16" fill="none" stroke="#E55353" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="r" values="8;24;8" dur="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.1;0.8" dur="0.6s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* THE FOUR MAJOR JUNCTIONS WITH PULSING RIPPLES AND CCTV OVERLAY BUTTONS */}
          {junctionNodes.map((node) => {
            const pulse = getPulseAttributes(node.status);
            const isSelected = selectedJunctionId === node.id;

            return (
              <g
                key={node.id}
                onClick={() => {
                  setSelectedJunctionId(node.id);
                  onSelectJunction(node.id);
                }}
                className="cursor-pointer group"
              >
                {/* Outer Pulsing Concentric Ripple Rings */}
                <circle cx={node.x} cy={node.y} r="22" fill="none" stroke={pulse.stroke} strokeWidth="2.5">
                  <animate
                    attributeName="r"
                    values="20;50"
                    dur={pulse.speed}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.85;0"
                    dur={pulse.speed}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Secondary Expanding Pulse Ring */}
                <circle cx={node.x} cy={node.y} r="22" fill="none" stroke={pulse.stroke} strokeWidth="1.5">
                  <animate
                    attributeName="r"
                    values="20;75"
                    dur={pulse.speed}
                    begin="0.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0"
                    dur={pulse.speed}
                    begin="0.4s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* High Congestion Urgent Warning Aura */}
                {node.status === 'Congested' && (
                  <circle cx={node.x} cy={node.y} r="19" fill={pulse.fill} opacity="0.6">
                    <animate
                      attributeName="opacity"
                      values="0.4;0.8;0.4"
                      dur="0.9s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Selection Indicator Ring */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="26"
                    fill="none"
                    stroke="#4D91E8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}

                {/* Junction Base Node Body */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="18"
                  fill="#201B29"
                  stroke={isSelected ? '#4D91E8' : '#393044'}
                  strokeWidth="2"
                />

                {/* Traffic Signal Core Dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill={
                    node.signalState === 'GREEN'
                      ? '#35B99B'
                      : node.signalState === 'YELLOW'
                      ? '#E5A84D'
                      : '#E55353'
                  }
                />

                {/* CCTV Camera Icon Overlay on Node */}
                <g
                  transform={`translate(${node.x - 24}, ${node.y - 36})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCameraModalJunction(node);
                  }}
                  className="cursor-pointer group/cam"
                >
                  <rect
                    width="48"
                    height="18"
                    rx="9"
                    fill="#191522"
                    stroke="#4D91E8"
                    strokeWidth="1.2"
                    className="group-hover/cam:fill-[#201B29] group-hover/cam:stroke-[#35B99B] transition-colors shadow-sm"
                  />
                  <circle cx="10" cy="9" r="2.2" fill="#E55353" className="animate-pulse" />
                  <text
                    x="27"
                    y="12.5"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#F5F3FA"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    CCTV
                  </text>
                </g>

                {/* Junction Name Label */}
                <text
                  x={node.x}
                  y={node.y + 34}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#F5F3FA"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {node.label}
                </text>

                {/* Subtitle & Core Assignment */}
                <text
                  x={node.x}
                  y={node.y + 48}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="500"
                  fill="#A9A0BC"
                  fontFamily="JetBrains Mono, monospace"
                >
                  Load L={node.load.toFixed(1)} · C{node.assignedCore}
                </text>

                {/* Status Indicator Badge Pill below node */}
                <g transform={`translate(${node.x - 38}, ${node.y + 54})`}>
                  <rect
                    width="76"
                    height="16"
                    rx="8"
                    fill={pulse.fill}
                    stroke={pulse.stroke}
                    strokeWidth="1"
                  />
                  <text
                    x="38"
                    y="11.5"
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="600"
                    fill={pulse.stroke}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {node.status}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4 Major Junction Cards with Prominent CCTV Icon Overlays */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#F5F3FA] flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#4D91E8]" />
            <span>Municipal Junction Nodes &amp; Surveillance Feeds</span>
          </span>
          <span className="text-[11px] text-[#A9A0BC] font-mono">
            Click 'CCTV' on any junction to stream live scanline optical feed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {junctionNodes.map((node) => {
            const pulse = getPulseAttributes(node.status);
            const isSelected = selectedJunctionId === node.id;
            return (
              <motion.div
                key={node.id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setSelectedJunctionId(node.id);
                  onSelectJunction(node.id);
                }}
                className={`relative p-4 rounded-2xl bg-[#201B29] border transition-all cursor-pointer group shadow-sm ${
                  isSelected
                    ? 'border-[#4D91E8] shadow-md shadow-[#4D91E8]/10'
                    : 'border-[#393044] hover:border-[#4D91E8]/50'
                }`}
              >
                {/* CCTV Icon Overlay Button at Top-Right of each Junction Card */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCameraModalJunction(node);
                  }}
                  title={`Open ${node.label} CCTV Camera Feed`}
                  className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#191522] hover:bg-[#251E33] border border-[#393044] hover:border-[#4D91E8] text-[#A9A0BC] hover:text-[#F5F3FA] transition-all text-[11px] font-mono group/cctv cursor-pointer shadow-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E55353] animate-pulse" />
                  <Video className="w-3.5 h-3.5 text-[#4D91E8] group-hover/cctv:scale-110 transition-transform" />
                  <span className="font-bold text-[#F5F3FA]">CCTV</span>
                </button>

                {/* Card Title & Core */}
                <div className="pr-16">
                  <h4 className="font-bold text-sm text-[#F5F3FA] truncate flex items-center gap-1.5">
                    <span>{node.label}</span>
                  </h4>
                  <p className="text-[11px] text-[#A9A0BC] truncate mt-0.5">{node.subtitle}</p>
                </div>

                {/* Status & Signal Indicator */}
                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${pulse.badgeBg}`}>
                    {node.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      node.signalState === 'GREEN'
                        ? 'bg-[#17332B] text-[#35B99B] border border-[#265245]'
                        : node.signalState === 'YELLOW'
                        ? 'bg-[#342818] text-[#E5A84D] border border-[#574021]'
                        : 'bg-[#3A1C24] text-[#E55353] border border-[#5E2734]'
                    }`}
                  >
                    {node.signalState} ({node.greenDurationSec}s)
                  </span>
                </div>

                {/* Queued Vehicles & Load */}
                <div className="mt-3 pt-3 border-t border-[#393044]/60 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#A9A0BC] block">Queue Depth</span>
                    <span className="text-sm font-bold text-[#F5F3FA] tabular-nums">
                      {node.n1 + node.n2}{' '}
                      <span className="text-[10px] font-normal text-[#A9A0BC]">units</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A9A0BC] block">Approach Load (L)</span>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        node.load > 80 ? 'text-[#E55353]' : 'text-[#35B99B]'
                      }`}
                    >
                      {node.load.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Visual Queue Meter */}
                <div className="mt-2.5 h-1.5 w-full bg-[#191522] rounded-full overflow-hidden border border-[#393044]/60">
                  <div
                    className={`h-full transition-all duration-300 ${
                      node.load > 80 ? 'bg-[#E55353]' : node.load >= 40 ? 'bg-[#E5A84D]' : 'bg-[#35B99B]'
                    }`}
                    style={{ width: `${Math.min(100, (node.load / 140) * 100)}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Junction Telemetry Inspector */}
      <div className="w-full rounded-2xl bg-[#151F24] border border-[#29383A] p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#29383A] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10171B] border border-[#29383A] flex items-center justify-center text-[#B7F34A]">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F2] flex items-center gap-2">
                <span>{selectedJunction.name}</span>
                <span className="text-[11px] text-[#91A19B] font-mono font-normal">
                  (Core {selectedJunction.assignedCore} Controller)
                </span>
              </h3>
              <p className="text-xs text-[#91A19B]">
                Real-time queue metrics, phase timings, and density modifiers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                getPulseAttributes(selectedJunction.status).badgeBg
              }`}
            >
              {selectedJunction.status}
            </span>
            <button
              onClick={() => setCameraModalJunction(selectedJunction)}
              className="py-1.5 px-3.5 rounded-xl bg-[#B7F34A] hover:bg-[#B7F34A]/90 text-xs font-bold text-[#0B0F12] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Launch CCTV Stream</span>
            </button>
          </div>
        </div>

        {/* 4 Responsive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#10171B] border border-[#29383A]">
            <span className="text-[#91A19B] text-[10px] uppercase tracking-wider block">Signal State</span>
            <span
              className={`inline-block mt-1.5 px-2.5 py-0.5 rounded font-bold ${
                selectedJunction.signalState === 'GREEN'
                  ? 'bg-[#17332B] text-[#71D49A] border border-[#265245]'
                  : selectedJunction.signalState === 'YELLOW'
                  ? 'bg-[#342818] text-[#F2B84B] border border-[#574021]'
                  : 'bg-[#3A1C24] text-[#F06464] border border-[#5E2734]'
              }`}
            >
              {selectedJunction.signalState} ({selectedJunction.greenDurationSec}s)
            </span>
            <span className="text-[10px] text-[#91A19B] block mt-1 font-sans">Adaptive Green Wave Phase</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10171B] border border-[#29383A]">
            <span className="text-[#91A19B] text-[10px] uppercase tracking-wider block">Queued Vehicles</span>
            <div className="text-sm font-bold text-[#F1F5F2] mt-1">
              {selectedJunction.n1 + selectedJunction.n2}{' '}
              <span className="text-xs text-[#91A19B] font-normal">Vehicles</span>
            </div>
            <span className="text-[10px] text-[#91A19B] block mt-1">
              Lane 1: {selectedJunction.n1} | Lane 2: {selectedJunction.n2}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10171B] border border-[#29383A]">
            <span className="text-[#91A19B] text-[10px] uppercase tracking-wider block">Calculated Load (L)</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-lg font-bold ${
                  selectedJunction.load > 80 ? 'text-[#F06464]' : 'text-[#71D49A]'
                }`}
              >
                {selectedJunction.load.toFixed(1)}
              </span>
              <span className="text-[10px] text-[#91A19B]">W = {selectedJunction.w.toFixed(1)}x</span>
            </div>
            <span className="text-[10px] text-[#91A19B] block mt-1">Formula: L = (N1 + N2) × W</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#10171B] border border-[#29383A]">
            <span className="text-[#91A19B] text-[10px] uppercase tracking-wider block">Simulate Traffic Load</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                onClick={() => onUpdateJunctionLoad(selectedJunction.id, -10)}
                className="py-1 px-2 rounded-lg bg-[#151F24] hover:bg-[#1B292E] text-xs font-medium text-[#F1F5F2] border border-[#29383A] transition-colors cursor-pointer text-center"
              >
                -10 Units
              </button>
              <button
                onClick={() => onUpdateJunctionLoad(selectedJunction.id, 15)}
                className="py-1 px-2 rounded-lg bg-[#B7F34A]/15 hover:bg-[#B7F34A]/25 text-xs font-semibold text-[#B7F34A] border border-[#B7F34A]/40 transition-colors cursor-pointer text-center"
              >
                +15 Units
              </button>
            </div>
            <span className="text-[10px] text-[#91A19B] block mt-1">Directly speeds or slows GSAP vehicle physics</span>
          </div>
        </div>
      </div>

      {/* High-Fidelity Multi-Channel CCTV Surveillance Modal */}
      {cameraModalJunction && (
        <CctvSurveillanceModal
          junction={cameraModalJunction}
          onClose={() => setCameraModalJunction(null)}
          onTriggerEmergency={onDispatchEmergency}
        />
      )}
    </div>
  );
};
