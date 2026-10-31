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
} from 'lucide-react';
import { JunctionData } from '../types';

// Register GSAP MotionPathPlugin
gsap.registerPlugin(MotionPathPlugin);

interface CityMapProps {
  junctions: JunctionData[];
  onSelectJunction: (junctionId: string) => void;
  onDispatchEmergency: (junctionId: string) => void;
  onUpdateJunctionLoad: (junctionId: string, delta: number) => void;
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
}) => {
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>('JUNCT_B');
  const [activeLayer, setActiveLayer] = useState<'traffic' | 'heatmap' | 'cameras' | 'greenwave'>('traffic');
  const [cameraModalJunction, setCameraModalJunction] = useState<JunctionData | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [showSpeedBadges, setShowSpeedBadges] = useState<boolean>(true);
  const [simulationMultiplier, setSimulationMultiplier] = useState<number>(1);
  const [inspectedVehicle, setInspectedVehicle] = useState<VehicleDef | null>(null);

  // CCTV Modal Custom Controls
  const [cameraAngle, setCameraAngle] = useState<'overhead' | 'north' | 'crosswalk'>('overhead');
  const [lowResGrayscale, setLowResGrayscale] = useState<boolean>(true);
  const [scanlinesActive, setScanlinesActive] = useState<boolean>(true);
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);
  const [streamTimestamp, setStreamTimestamp] = useState<string>('');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const vehicleRefs = useRef<Record<string, SVGGElement | null>>({});
  const emergencyRef = useRef<SVGGElement | null>(null);
  const tweensRef = useRef<Record<string, { tween: gsap.core.Tween; baseDuration: number }>>({});
  const emergencyTweenRef = useRef<gsap.core.Tween | null>(null);

  // Live timer for authentic CCTV OSD timestamp
  useEffect(() => {
    if (!cameraModalJunction) return;
    const interval = setInterval(() => {
      const d = new Date();
      const pad = (n: number, w = 2) => String(n).padStart(w, '0');
      const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(Math.floor(d.getMilliseconds() / 10))}`;
      setStreamTimestamp(formatted);
    }, 80);
    return () => clearInterval(interval);
  }, [cameraModalJunction]);

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

  const handleCaptureSnapshot = () => {
    setSnapshotFlash(true);
    setTimeout(() => {
      setSnapshotFlash(false);
    }, 220);
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#201B29] border border-[#393044] text-xs shadow-md">
        {/* Layer Switches */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#A9A0BC] font-medium mr-1 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#4D91E8]" />
            <span>Map View:</span>
          </span>
          <button
            onClick={() => setActiveLayer('traffic')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeLayer === 'traffic'
                ? 'bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white shadow-sm'
                : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
            }`}
          >
            Live Flow &amp; Vehicles
          </button>
          <button
            onClick={() => setActiveLayer('heatmap')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeLayer === 'heatmap'
                ? 'bg-[#E5A84D] text-[#100D18] font-semibold shadow-sm'
                : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
            }`}
          >
            Density Heatmap
          </button>
          <button
            onClick={() => setActiveLayer('cameras')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeLayer === 'cameras'
                ? 'bg-[#4D91E8] text-white shadow-sm'
                : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
            }`}
          >
            CCTV Sensors
          </button>
          <button
            onClick={() => setActiveLayer('greenwave')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeLayer === 'greenwave'
                ? 'bg-[#35B99B] text-white shadow-sm'
                : 'bg-[#191522] text-[#A9A0BC] hover:text-[#F5F3FA] border border-[#393044]'
            }`}
          >
            Green Wave Corridor
          </button>
        </div>

        {/* Speed Badges Toggle & GSAP Simulation Speed Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSpeedBadges((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              showSpeedBadges
                ? 'bg-[#191522] text-[#35B99B] border-[#35B99B]/40'
                : 'bg-[#191522] text-[#A9A0BC] border-[#393044]'
            }`}
            title="Toggle speed velocity indicators along arterial corridors"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Velocity Badges: {showSpeedBadges ? 'ON' : 'OFF'}</span>
          </button>

          {/* Simulation multiplier toggle */}
          <div className="flex items-center bg-[#191522] border border-[#393044] rounded-lg p-0.5 font-mono">
            <button
              onClick={() => setSimulationMultiplier(1)}
              className={`px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                simulationMultiplier === 1 ? 'bg-[#4D91E8] text-white font-bold' : 'text-[#A9A0BC]'
              }`}
            >
              1× Real
            </button>
            <button
              onClick={() => setSimulationMultiplier(2)}
              className={`px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                simulationMultiplier === 2 ? 'bg-[#35B99B] text-white font-bold' : 'text-[#A9A0BC]'
              }`}
            >
              2× Speed
            </button>
          </div>

          {/* Emergency Dispatch Button */}
          <button
            onClick={handleDispatchEmergencyClick}
            disabled={isEmergencyActive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all shadow-sm cursor-pointer ${
              isEmergencyActive
                ? 'bg-[#3A1C24] text-[#E55353] border border-[#5E2734] cursor-not-allowed'
                : 'bg-[#E55353] hover:bg-[#E55353]/90 text-white shadow-rose-950/40'
            }`}
          >
            <Siren className={`w-3.5 h-3.5 ${isEmergencyActive ? 'animate-bounce' : ''}`} />
            <span>{isEmergencyActive ? 'Ambulance Priority Active' : 'Dispatch Emergency Vehicle'}</span>
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
          </defs>

          {/* City Blocks Background Grid */}
          <rect width="800" height="480" fill="url(#city-blocks)" />

          {/* Subtle River / Canal Accent passing through center */}
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

          {/* Road Highways Connecting the 4 Junctions */}
          <line x1="230" y1="130" x2="570" y2="130" stroke="#251E33" strokeWidth="24" strokeLinecap="round" />
          <line x1="230" y1="130" x2="570" y2="130" stroke="#393044" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="230" y1="350" x2="570" y2="350" stroke="#251E33" strokeWidth="24" strokeLinecap="round" />
          <line x1="230" y1="350" x2="570" y2="350" stroke="#393044" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="230" y1="130" x2="230" y2="350" stroke="#251E33" strokeWidth="24" strokeLinecap="round" />
          <line x1="230" y1="130" x2="230" y2="350" stroke="#393044" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="570" y1="130" x2="570" y2="350" stroke="#251E33" strokeWidth="24" strokeLinecap="round" />
          <line x1="570" y1="130" x2="570" y2="350" stroke="#393044" strokeWidth="2" strokeDasharray="8 8" />

          {/* Diagonal Cross Connectors */}
          <line x1="230" y1="130" x2="570" y2="350" stroke="#1D1728" strokeWidth="14" strokeLinecap="round" />
          <line x1="570" y1="130" x2="230" y2="350" stroke="#1D1728" strokeWidth="14" strokeLinecap="round" />

          {/* Center Traffic Roundabout Circle */}
          <circle cx="400" cy="240" r="38" fill="none" stroke="#251E33" strokeWidth="16" />
          <circle cx="400" cy="240" r="38" fill="none" stroke="#393044" strokeWidth="1.5" strokeDasharray="5 5" />
          <circle cx="400" cy="240" r="28" fill="#191522" stroke="#393044" strokeWidth="1.5" />
          <text
            x="400"
            y="244"
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#A9A0BC"
            fontFamily="sans-serif"
          >
            Central Hub
          </text>

          {/* Heatmap Overlay Layer (if active) */}
          {activeLayer === 'heatmap' && (
            <g opacity="0.8">
              <line
                x1="230"
                y1="130"
                x2="570"
                y2="130"
                stroke={corridors.north.status === 'Congested' ? '#E55353' : corridors.north.status === 'Moderate' ? '#E5A84D' : '#35B99B'}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <line
                x1="570"
                y1="130"
                x2="570"
                y2="350"
                stroke={corridors.east.status === 'Congested' ? '#E55353' : corridors.east.status === 'Moderate' ? '#E5A84D' : '#35B99B'}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <line
                x1="230"
                y1="350"
                x2="570"
                y2="350"
                stroke={corridors.south.status === 'Congested' ? '#E55353' : corridors.south.status === 'Moderate' ? '#E5A84D' : '#35B99B'}
                strokeWidth="14"
                strokeLinecap="round"
              />
              <line
                x1="230"
                y1="130"
                x2="230"
                y2="350"
                stroke={corridors.west.status === 'Congested' ? '#E55353' : corridors.west.status === 'Moderate' ? '#E5A84D' : '#35B99B'}
                strokeWidth="12"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Green Wave Corridor Layer (if active) */}
          {activeLayer === 'greenwave' && (
            <g>
              <line
                x1="230"
                y1="130"
                x2="570"
                y2="130"
                stroke="#35B99B"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.85"
              />
              <line
                x1="570"
                y1="130"
                x2="570"
                y2="350"
                stroke="#35B99B"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.85"
              />
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
      <div className="w-full rounded-2xl bg-[#201B29] border border-[#393044] p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#393044] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#191522] border border-[#393044] flex items-center justify-center text-[#4D91E8]">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F5F3FA] flex items-center gap-2">
                <span>{selectedJunction.name}</span>
                <span className="text-[11px] text-[#A9A0BC] font-mono font-normal">
                  (Core {selectedJunction.assignedCore} Controller)
                </span>
              </h3>
              <p className="text-xs text-[#A9A0BC]">
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
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-xs font-semibold text-white transition-opacity hover:opacity-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Launch CCTV Stream</span>
            </button>
          </div>
        </div>

        {/* 4 Responsive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#191522] border border-[#393044]">
            <span className="text-[#A9A0BC] text-[10px] uppercase tracking-wider block">Signal State</span>
            <span
              className={`inline-block mt-1.5 px-2.5 py-0.5 rounded font-bold ${
                selectedJunction.signalState === 'GREEN'
                  ? 'bg-[#17332B] text-[#35B99B] border border-[#265245]'
                  : selectedJunction.signalState === 'YELLOW'
                  ? 'bg-[#342818] text-[#E5A84D] border border-[#574021]'
                  : 'bg-[#3A1C24] text-[#E55353] border border-[#5E2734]'
              }`}
            >
              {selectedJunction.signalState} ({selectedJunction.greenDurationSec}s)
            </span>
            <span className="text-[10px] text-[#A9A0BC] block mt-1 font-sans">Adaptive Green Wave Phase</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#191522] border border-[#393044]">
            <span className="text-[#A9A0BC] text-[10px] uppercase tracking-wider block">Queued Vehicles</span>
            <div className="text-sm font-bold text-[#F5F3FA] mt-1">
              {selectedJunction.n1 + selectedJunction.n2}{' '}
              <span className="text-xs text-[#A9A0BC] font-normal">Vehicles</span>
            </div>
            <span className="text-[10px] text-[#A9A0BC] block mt-1">
              Lane 1: {selectedJunction.n1} | Lane 2: {selectedJunction.n2}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#191522] border border-[#393044]">
            <span className="text-[#A9A0BC] text-[10px] uppercase tracking-wider block">Calculated Load (L)</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-lg font-bold ${
                  selectedJunction.load > 80 ? 'text-[#E55353]' : 'text-[#35B99B]'
                }`}
              >
                {selectedJunction.load.toFixed(1)}
              </span>
              <span className="text-[10px] text-[#A9A0BC]">W = {selectedJunction.w.toFixed(1)}x</span>
            </div>
            <span className="text-[10px] text-[#A9A0BC] block mt-1">Formula: L = (N1 + N2) × W</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#191522] border border-[#393044]">
            <span className="text-[#A9A0BC] text-[10px] uppercase tracking-wider block">Simulate Traffic Load</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                onClick={() => onUpdateJunctionLoad(selectedJunction.id, -10)}
                className="py-1 px-2 rounded-lg bg-[#201B29] hover:bg-[#251E33] text-xs font-medium text-[#F5F3FA] border border-[#393044] transition-colors cursor-pointer text-center"
              >
                -10 Units
              </button>
              <button
                onClick={() => onUpdateJunctionLoad(selectedJunction.id, 15)}
                className="py-1 px-2 rounded-lg bg-[#4D91E8]/15 hover:bg-[#4D91E8]/25 text-xs font-semibold text-[#4D91E8] border border-[#4D91E8]/40 transition-colors cursor-pointer text-center"
              >
                +15 Units
              </button>
            </div>
            <span className="text-[10px] text-[#A9A0BC] block mt-1">Directly speeds or slows GSAP vehicle physics</span>
          </div>
        </div>
      </div>

      {/* Simulated Live Low-Resolution Grayscale CCTV Video Modal with Scanline Animation */}
      <AnimatePresence>
        {cameraModalJunction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#100D18]/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-3xl rounded-2xl bg-[#191522] border border-[#393044] p-5 shadow-2xl space-y-4 overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#393044]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#E55353] animate-pulse flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F3FA] flex items-center gap-2">
                      <span>MUNICIPAL CCTV SURVEILLANCE</span>
                      <span className="text-xs font-mono font-normal text-[#35B99B] bg-[#17332B] px-2 py-0.5 rounded border border-[#265245]">
                        LIVE STREAM
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#A9A0BC] font-mono mt-0.5">
                      {cameraModalJunction.name} · Sensor Feed ID: SENSOR-{cameraModalJunction.id} (Core {cameraModalJunction.assignedCore})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCameraModalJunction(null)}
                  className="text-[#A9A0BC] hover:text-[#F5F3FA] p-1.5 rounded-lg hover:bg-[#201B29] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* The Low-Resolution Grayscale CCTV Video Viewport with CSS Scanlines */}
              <div
                className={`relative w-full h-80 bg-[#0B0912] rounded-xl overflow-hidden border-2 border-[#393044] select-none ${
                  lowResGrayscale ? 'filter grayscale contrast-125 brightness-90' : ''
                }`}
              >
                {/* 1. Moving CSS Scanline Beam sweeping vertically */}
                {scanlinesActive && (
                  <div
                    className="absolute inset-x-0 h-10 pointer-events-none z-30 animate-cctv-scanline opacity-70"
                    style={{
                      background:
                        'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.22), transparent)',
                    }}
                  />
                )}

                {/* 2. CRT Repeating Horizontal Scanlines */}
                {scanlinesActive && (
                  <div className="absolute inset-0 pointer-events-none z-20 cctv-crt-lines opacity-80" />
                )}

                {/* 3. Authentic CRT Vignette & Edge Glow */}
                <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]" />

                {/* 4. White Shutter Flash when Snapshot is captured */}
                {snapshotFlash && (
                  <div className="absolute inset-0 bg-white z-40 transition-opacity duration-200" />
                )}

                {/* 5. Authentic Surveillance OSD Headers */}
                {/* Top Left OSD */}
                <div className="absolute top-3 left-3 z-30 font-mono text-[10px] text-[#F5F3FA] bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded border border-white/20 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#35B99B] font-bold">CAM-0{cameraModalJunction.assignedCore + 1}</span>
                    <span>// {cameraModalJunction.id}</span>
                  </div>
                  <div className="text-[9px] text-[#A9A0BC]">
                    ANGLE: {cameraAngle.toUpperCase()} · 480p 15.0 FPS
                  </div>
                </div>

                {/* Top Right OSD: Live UTC Timestamp and Blinking Recording Dot */}
                <div className="absolute top-3 right-3 z-30 font-mono text-[10px] text-[#F5F3FA] bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded border border-white/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E55353] animate-ping" />
                  <span className="text-[#E55353] font-bold">REC [●]</span>
                  <span className="text-[#F5F3FA] tabular-nums">{streamTimestamp || '2026-10-30 18:24:00.00'}</span>
                </div>

                {/* Center Crosshair Reticle & Optical Detection Tags */}
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                  <div className="relative w-24 h-24 border border-white/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-white/40 absolute -left-1" />
                    <div className="w-2 h-0.5 bg-white/40 absolute -right-1" />
                    <div className="w-0.5 h-2 bg-white/40 absolute -top-1" />
                    <div className="w-0.5 h-2 bg-white/40 absolute -bottom-1" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  </div>
                </div>

                {/* Simulated Street Intersection Geometry and Animated Vehicles (Grayscale) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Road Grid Base */}
                  <div className="relative w-full h-full bg-[#181520] flex items-center justify-center">
                    {/* Horizontal Street */}
                    <div className="absolute inset-x-0 h-28 bg-[#24212D] border-y border-white/20 flex flex-col justify-around">
                      <div className="w-full border-b border-dashed border-white/30" />
                    </div>

                    {/* Vertical Street */}
                    <div className="absolute inset-y-0 w-28 bg-[#24212D] border-x border-white/20 flex justify-around">
                      <div className="h-full border-r border-dashed border-white/30" />
                    </div>

                    {/* Intersection Center Box */}
                    <div className="absolute w-28 h-28 bg-[#1F1C28] border border-white/30 flex items-center justify-center">
                      {/* Signal Core in Intersection */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full ${
                          cameraModalJunction.signalState === 'GREEN'
                            ? 'bg-white shadow-[0_0_12px_#fff]'
                            : cameraModalJunction.signalState === 'YELLOW'
                            ? 'bg-white/80 shadow-[0_0_8px_#fff]'
                            : 'bg-white/40'
                        }`}
                      />
                    </div>

                    {/* Crosswalk Zebra Strips */}
                    <div className="absolute top-18 w-28 h-3.5 flex justify-between px-1">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-2.5 h-full bg-white/30" />
                      ))}
                    </div>
                    <div className="absolute bottom-18 w-28 h-3.5 flex justify-between px-1">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-2.5 h-full bg-white/30" />
                      ))}
                    </div>

                    {/* Simulated Vehicles in Video Stream */}
                    {/* Vehicle 1 Eastbound */}
                    <motion.div
                      animate={{ x: [-200, 360] }}
                      transition={{ duration: 4.8, repeat: Infinity, ease: 'linear' }}
                      className="absolute top-[138px] z-10"
                    >
                      <div className="relative w-12 h-6 bg-white/90 rounded-sm border border-black flex items-center justify-center">
                        <div className="w-3 h-4 bg-black/60 rounded-xs" />
                        <span className="absolute -top-4 left-0 font-mono text-[7.5px] text-white bg-black/80 px-1 rounded whitespace-nowrap">
                          [CAR] 48 km/h
                        </span>
                      </div>
                    </motion.div>

                    {/* Vehicle 2 Westbound */}
                    <motion.div
                      animate={{ x: [360, -200] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: 'linear', delay: 1.2 }}
                      className="absolute top-[170px] z-10"
                    >
                      <div className="relative w-16 h-7 bg-white/75 rounded-sm border border-black flex items-center justify-around">
                        <div className="w-2.5 h-4 bg-black/60 rounded-xs" />
                        <div className="w-2.5 h-4 bg-black/60 rounded-xs" />
                        <span className="absolute -bottom-4 left-0 font-mono text-[7.5px] text-white bg-black/80 px-1 rounded whitespace-nowrap">
                          [BUS] 32 km/h
                        </span>
                      </div>
                    </motion.div>

                    {/* Vehicle 3 Southbound */}
                    <motion.div
                      animate={{ y: [-150, 200] }}
                      transition={{ duration: 6.0, repeat: Infinity, ease: 'linear', delay: 2.0 }}
                      className="absolute left-[388px] z-10"
                    >
                      <div className="relative w-6 h-11 bg-white/80 rounded-sm border border-black flex items-center justify-center">
                        <div className="w-4 h-2.5 bg-black/60 rounded-xs" />
                        <span className="absolute -right-16 top-0 font-mono text-[7.5px] text-white bg-black/80 px-1 rounded whitespace-nowrap">
                          [VAN] 41 km/h
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Bottom Left Telemetry HUD */}
                <div className="absolute bottom-3 left-3 z-30 font-mono text-[9.5px] text-[#F5F3FA] bg-black/75 backdrop-blur-xs px-2.5 py-1.5 rounded border border-white/20 space-y-0.5">
                  <div>
                    APPROACH LOAD L: <span className="font-bold">{cameraModalJunction.load.toFixed(1)}</span> (W = {cameraModalJunction.w.toFixed(1)}x)
                  </div>
                  <div>
                    QUEUED VEHICLES: <span className="font-bold">{cameraModalJunction.n1 + cameraModalJunction.n2}</span> (L1: {cameraModalJunction.n1} · L2: {cameraModalJunction.n2})
                  </div>
                  <div>
                    ACTIVE SIGNAL: <span className="font-bold">{cameraModalJunction.signalState}</span> ({cameraModalJunction.greenDurationSec}s Phase)
                  </div>
                </div>

                {/* Bottom Right Optical Flow & Bitrate HUD */}
                <div className="absolute bottom-3 right-3 z-30 font-mono text-[9.5px] text-[#F5F3FA] bg-black/75 backdrop-blur-xs px-2.5 py-1.5 rounded border border-white/20 space-y-0.5 text-right">
                  <div className="text-[#35B99B]">OPTICAL FLOW: LOCKED</div>
                  <div>BITRATE: 128 KBPS · MONO</div>
                  <div>STATUS: {cameraModalJunction.status.toUpperCase()}</div>
                </div>
              </div>

              {/* Bottom Interactive Surveillance Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                {/* Angle Presets */}
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-[#A9A0BC] text-[11px] mr-1">Angle:</span>
                  <button
                    onClick={() => setCameraAngle('overhead')}
                    className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                      cameraAngle === 'overhead'
                        ? 'bg-[#4D91E8] text-white border-[#4D91E8]'
                        : 'bg-[#201B29] text-[#A9A0BC] border-[#393044]'
                    }`}
                  >
                    Overhead
                  </button>
                  <button
                    onClick={() => setCameraAngle('north')}
                    className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                      cameraAngle === 'north'
                        ? 'bg-[#4D91E8] text-white border-[#4D91E8]'
                        : 'bg-[#201B29] text-[#A9A0BC] border-[#393044]'
                    }`}
                  >
                    North Approach
                  </button>
                  <button
                    onClick={() => setCameraAngle('crosswalk')}
                    className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                      cameraAngle === 'crosswalk'
                        ? 'bg-[#4D91E8] text-white border-[#4D91E8]'
                        : 'bg-[#201B29] text-[#A9A0BC] border-[#393044]'
                    }`}
                  >
                    Crosswalk
                  </button>
                </div>

                {/* Display Mode Toggles & Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLowResGrayscale((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] cursor-pointer transition-colors ${
                      lowResGrayscale
                        ? 'bg-[#191522] text-[#35B99B] border-[#35B99B]/40'
                        : 'bg-[#201B29] text-[#A9A0BC] border-[#393044]'
                    }`}
                  >
                    Low-Res Grayscale: {lowResGrayscale ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => setScanlinesActive((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] cursor-pointer transition-colors ${
                      scanlinesActive
                        ? 'bg-[#191522] text-[#4D91E8] border-[#4D91E8]/40'
                        : 'bg-[#201B29] text-[#A9A0BC] border-[#393044]'
                    }`}
                  >
                    Scanlines: {scanlinesActive ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={handleCaptureSnapshot}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#201B29] hover:bg-[#251E33] border border-[#393044] text-[#F5F3FA] transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#4D91E8]" />
                    <span>Snapshot</span>
                  </button>

                  <button
                    onClick={() => setCameraModalJunction(null)}
                    className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-[#4D91E8] to-[#35B99B] text-white font-semibold transition-opacity hover:opacity-95 cursor-pointer"
                  >
                    Close Feed
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
