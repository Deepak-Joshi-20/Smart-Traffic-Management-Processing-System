import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Camera,
  Maximize2,
  Minimize2,
  Eye,
  Sliders,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Shield,
  Layers,
  MapPin,
  RefreshCw,
  Download,
  AlertTriangle,
  Flame,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';
import { JunctionData } from '../types';

interface CctvSurveillanceModalProps {
  junction: JunctionData;
  onClose: () => void;
  onTriggerEmergency?: (junctionId: string) => void;
}

export const CctvSurveillanceModal: React.FC<CctvSurveillanceModalProps> = ({
  junction,
  onClose,
  onTriggerEmergency,
}) => {
  const [activeChannel, setActiveChannel] = useState<'aerial' | 'approach' | 'crosswalk' | 'flir'>('aerial');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isAiDetectionOn, setIsAiDetectionOn] = useState<boolean>(true);
  const [isNightVision, setIsNightVision] = useState<boolean>(false);
  const [isScanlinesOn, setIsScanlinesOn] = useState<boolean>(true);
  const [snapshotTaken, setSnapshotTaken] = useState<boolean>(false);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');
  const [simulatedVehicleDetections, setSimulatedVehicleDetections] = useState([
    { id: 'DET-101', type: 'SEDAN', speed: 48.2, lane: 'Lane 1 (North)', conf: 96, x: 28, y: 35 },
    { id: 'DET-102', type: 'BUS', speed: 32.5, lane: 'Lane 2 (East)', conf: 94, x: 55, y: 52 },
    { id: 'DET-103', type: 'EV', speed: 44.0, lane: 'Lane 1 (South)', conf: 98, x: 42, y: 70 },
    { id: 'DET-104', type: 'VAN', speed: 38.6, lane: 'Lane 2 (West)', conf: 91, x: 68, y: 28 },
  ]);

  // Live timestamp timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      setLiveTimestamp(
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
          now.getHours()
        )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${ms}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 50);
    return () => clearInterval(interval);
  }, []);

  // Animate detected vehicles over time
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedVehicleDetections((prev) =>
        prev.map((det) => ({
          ...det,
          speed: Math.max(15, Math.min(65, det.speed + (Math.random() * 4 - 2))),
          x: (det.x + (Math.random() * 2 - 1) + 100) % 100,
        }))
      );
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const handleCaptureSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 250);
  };

  const coordinates: Record<string, { lat: string; lon: string; elevation: string }> = {
    JUNCT_A: { lat: '28°32\'08.4"N', lon: '77°23\'24.2"E', elevation: '208m MSL' },
    JUNCT_B: { lat: '28°32\'14.2"N', lon: '77°23\'58.8"E', elevation: '212m MSL' },
    JUNCT_C: { lat: '28°31\'42.6"N', lon: '77°23\'19.0"E', elevation: '206m MSL' },
    JUNCT_D: { lat: '28°31\'38.1"N', lon: '77°23\'54.5"E', elevation: '210m MSL' },
  };

  const geo = coordinates[junction.id] || { lat: '28°32\'00.0"N', lon: '77°23\'30.0"E', elevation: '210m MSL' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#151F24] border border-[#29383A] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-[#10171B] border-b border-[#29383A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1B292E] border border-[#29383A] flex items-center justify-center text-[#B7F34A]">
              <Video className="w-4 h-4 text-[#B7F34A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#F1F5F2]">
                  MUNICIPAL CCTV SURVEILLANCE FEED // {junction.id}
                </span>
                <span className="text-[10px] font-mono text-[#71D49A] bg-[#71D49A]/10 border border-[#71D49A]/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#71D49A] animate-pulse" />
                  ONLINE 1080p
                </span>
              </div>
              <p className="text-[11px] text-[#91A19B] font-mono mt-0.5">
                {junction.name} · {geo.lat} {geo.lon} · Elevation: {geo.elevation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCaptureSnapshot}
              className="px-3 py-1.5 rounded-lg bg-[#1B292E] hover:bg-[#24353C] border border-[#29383A] text-xs font-mono text-[#F1F5F2] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Capture surveillance snapshot"
            >
              <Camera className="w-3.5 h-3.5 text-[#52C7D9]" />
              <span className="hidden sm:inline">Snapshot</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#91A19B] hover:text-[#F1F5F2] hover:bg-[#1B292E] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel Selector Ribbon */}
        <div className="px-5 py-2.5 bg-[#0B0F12] border-b border-[#29383A] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[#64736D] mr-1">OPTICAL CHANNEL:</span>
            <button
              onClick={() => {
                setActiveChannel('aerial');
                setIsNightVision(false);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeChannel === 'aerial' && !isNightVision
                  ? 'bg-[#1B292E] text-[#B7F34A] border border-[#B7F34A]/40 font-bold'
                  : 'text-[#91A19B] hover:text-[#F1F5F2]'
              }`}
            >
              CAM-1: Overhead Orthophoto
            </button>
            <button
              onClick={() => {
                setActiveChannel('approach');
                setIsNightVision(false);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeChannel === 'approach' && !isNightVision
                  ? 'bg-[#1B292E] text-[#B7F34A] border border-[#B7F34A]/40 font-bold'
                  : 'text-[#91A19B] hover:text-[#F1F5F2]'
              }`}
            >
              CAM-2: North Approach Arterial
            </button>
            <button
              onClick={() => {
                setActiveChannel('crosswalk');
                setIsNightVision(false);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeChannel === 'crosswalk' && !isNightVision
                  ? 'bg-[#1B292E] text-[#B7F34A] border border-[#B7F34A]/40 font-bold'
                  : 'text-[#91A19B] hover:text-[#F1F5F2]'
              }`}
            >
              CAM-3: Pedestrian Crosswalk
            </button>
            <button
              onClick={() => {
                setActiveChannel('flir');
                setIsNightVision(true);
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeChannel === 'flir' || isNightVision
                  ? 'bg-[#F06464]/20 text-[#F06464] border border-[#F06464]/40 font-bold'
                  : 'text-[#91A19B] hover:text-[#F1F5F2]'
              }`}
            >
              FLIR: Thermal Infrared
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiDetectionOn(!isAiDetectionOn)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                isAiDetectionOn
                  ? 'bg-[#B7F34A]/10 text-[#B7F34A] border-[#B7F34A]/30'
                  : 'bg-[#10171B] text-[#64736D] border-[#29383A]'
              }`}
            >
              AI Bounding Boxes: {isAiDetectionOn ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setIsScanlinesOn(!isScanlinesOn)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                isScanlinesOn
                  ? 'bg-[#52C7D9]/10 text-[#52C7D9] border-[#52C7D9]/30'
                  : 'bg-[#10171B] text-[#64736D] border-[#29383A]'
              }`}
            >
              CRT Scanlines: {isScanlinesOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Video Viewport Stage */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[340px] select-none">
          {/* Shutter snapshot flash */}
          {snapshotTaken && <div className="absolute inset-0 bg-white z-50 transition-opacity duration-150" />}

          {/* CRT repeating horizontal scanlines */}
          {isScanlinesOn && (
            <div className="absolute inset-0 cctv-crt-lines pointer-events-none z-30 opacity-70" />
          )}

          {/* Vertical moving scanline beam */}
          {isScanlinesOn && (
            <div
              className="absolute inset-x-0 h-12 pointer-events-none z-40 animate-cctv-scanline opacity-75"
              style={{
                background:
                  'linear-gradient(to bottom, transparent, rgba(183, 243, 74, 0.08), rgba(183, 243, 74, 0.25), transparent)',
              }}
            />
          )}

          {/* CRT Vignette */}
          <div className="absolute inset-0 pointer-events-none z-30 shadow-[inset_0_0_100px_rgba(0,0,0,0.95)]" />

          {/* ON-SCREEN DISPLAY (OSD) HEADERS */}
          {/* Top Left OSD */}
          <div className="absolute top-4 left-4 z-40 font-mono text-[10px] text-[#F1F5F2] bg-black/75 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/20 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[#B7F34A] font-bold">
                {activeChannel === 'flir'
                  ? 'FLIR THERMAL IR (8-14µm)'
                  : `OPTICAL ${activeChannel.toUpperCase()}`}
              </span>
              <span className="text-white/40">|</span>
              <span>DEV #{junction.id}</span>
            </div>
            <div className="text-[9px] text-[#91A19B]">
              LENS: 24-70mm f/2.8 · ISO 800 · ZOOM {zoomLevel}x · FPS: 30.0
            </div>
          </div>

          {/* Top Right OSD: Recording Ticker & Timestamp */}
          <div className="absolute top-4 right-4 z-40 font-mono text-[10px] text-[#F1F5F2] bg-black/75 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F06464] animate-ping" />
            <span className="text-[#F06464] font-bold">REC [●]</span>
            <span className="text-white tabular-nums">{liveTimestamp}</span>
          </div>

          {/* Bottom Left OSD: Traffic Signal State & Queue Load */}
          <div className="absolute bottom-4 left-4 z-40 font-mono text-[10px] text-[#F1F5F2] bg-black/75 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/20 space-y-0.5">
            <div className="flex items-center gap-2">
              <span>SIGNAL PHASE:</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded ${
                  junction.signalState === 'GREEN'
                    ? 'text-[#71D49A] bg-[#71D49A]/20'
                    : junction.signalState === 'YELLOW'
                    ? 'text-[#F2B84B] bg-[#F2B84B]/20'
                    : 'text-[#F06464] bg-[#F06464]/20'
                }`}
              >
                {junction.signalState} ({junction.greenDurationSec}s)
              </span>
            </div>
            <div className="text-[9px] text-[#91A19B]">
              APPROACH LOAD: {junction.load.toFixed(1)} / {junction.queueThreshold} · VEHICLES: {junction.n1 + junction.n2}
            </div>
          </div>

          {/* Bottom Right OSD: Geo Radar Inset */}
          <div className="absolute bottom-4 right-4 z-40 font-mono text-[10px] text-[#F1F5F2] bg-black/85 backdrop-blur-xs p-2 rounded-lg border border-white/20 flex items-center gap-3">
            <div className="relative w-12 h-12 bg-[#10171B] rounded border border-[#29383A] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 border border-[#B7F34A]/30 rounded-full animate-ping opacity-30" />
              <div className="w-full h-0.5 bg-[#B7F34A]/40 absolute" />
              <div className="h-full w-0.5 bg-[#B7F34A]/40 absolute" />
              <div className="w-2 h-2 rounded-full bg-[#B7F34A] z-10" />
            </div>
            <div className="text-[9px] text-[#91A19B] space-y-0.5">
              <div className="text-[#B7F34A] font-bold">GEO RADAR LOCK</div>
              <div>{geo.lat}</div>
              <div>{geo.lon}</div>
            </div>
          </div>

          {/* Center Reticle Crosshairs */}
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center opacity-40">
            <div className="w-28 h-28 border border-white/30 rounded-full flex items-center justify-center">
              <div className="w-4 h-0.5 bg-white/60 absolute -left-2" />
              <div className="w-4 h-0.5 bg-white/60 absolute -right-2" />
              <div className="w-0.5 h-4 bg-white/60 absolute -top-2" />
              <div className="w-0.5 h-4 bg-white/60 absolute -bottom-2" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>

          {/* ACTUAL OPTICAL SURVEILLANCE STAGE CANVAS */}
          <div
            className={`w-full h-full relative transition-transform duration-300 ${
              isNightVision
                ? 'hue-rotate-180 invert brightness-125 contrast-150'
                : 'grayscale contrast-125 brightness-95'
            }`}
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Real Street Cartography & Intersection Background (Asphalt, Lanes, Markings) */}
            <svg viewBox="0 0 800 480" className="w-full h-full object-cover">
              {/* Surrounding Terrain & Buildings */}
              <rect width="800" height="480" fill="#13171B" />

              {/* Building Blocks */}
              <rect x="40" y="30" width="260" height="130" fill="#1C2329" stroke="#2B363D" strokeWidth="1.5" />
              <rect x="500" y="30" width="260" height="130" fill="#1C2329" stroke="#2B363D" strokeWidth="1.5" />
              <rect x="40" y="320" width="260" height="130" fill="#1C2329" stroke="#2B363D" strokeWidth="1.5" />
              <rect x="500" y="320" width="260" height="130" fill="#1C2329" stroke="#2B363D" strokeWidth="1.5" />

              {/* Asphalt Road Intersections */}
              {/* Horizontal Expressway */}
              <rect x="0" y="160" width="800" height="160" fill="#181E23" />
              {/* Vertical Avenue */}
              <rect x="300" y="0" width="200" height="480" fill="#181E23" />

              {/* Curbs & Sidewalks */}
              <line x1="0" y1="160" x2="300" y2="160" stroke="#3D4B53" strokeWidth="4" />
              <line x1="500" y1="160" x2="800" y2="160" stroke="#3D4B53" strokeWidth="4" />
              <line x1="0" y1="320" x2="300" y2="320" stroke="#3D4B53" strokeWidth="4" />
              <line x1="500" y1="320" x2="800" y2="320" stroke="#3D4B53" strokeWidth="4" />

              <line x1="300" y1="0" x2="300" y2="160" stroke="#3D4B53" strokeWidth="4" />
              <line x1="300" y1="320" x2="300" y2="480" stroke="#3D4B53" strokeWidth="4" />
              <line x1="500" y1="0" x2="500" y2="160" stroke="#3D4B53" strokeWidth="4" />
              <line x1="500" y1="320" x2="500" y2="480" stroke="#3D4B53" strokeWidth="4" />

              {/* Road Lane Dividers (Dashed White Lines) */}
              <line x1="0" y1="213" x2="280" y2="213" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.6" />
              <line x1="0" y1="266" x2="280" y2="266" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.6" />
              <line x1="520" y1="213" x2="800" y2="213" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.6" />
              <line x1="520" y1="266" x2="800" y2="266" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.6" />

              <line x1="366" y1="0" x2="366" y2="140" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.6" />
              <line x1="433" y1="0" x2="433" y2="140" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.6" />
              <line x1="366" y1="340" x2="366" y2="480" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.6" />
              <line x1="433" y1="340" x2="433" y2="480" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="14 14" opacity="0.6" />

              {/* Double Solid Yellow Centerlines */}
              <line x1="0" y1="239" x2="280" y2="239" stroke="#F5BE58" strokeWidth="1.5" opacity="0.75" />
              <line x1="0" y1="242" x2="280" y2="242" stroke="#F5BE58" strokeWidth="1.5" opacity="0.75" />
              <line x1="520" y1="239" x2="800" y2="239" stroke="#F5BE58" strokeWidth="1.5" opacity="0.75" />
              <line x1="520" y1="242" x2="800" y2="242" stroke="#F5BE58" strokeWidth="1.5" opacity="0.75" />

              {/* Crosswalk Zebra Strips */}
              <g fill="#FFFFFF" opacity="0.7">
                {/* West Crosswalk */}
                {[...Array(8)].map((_, i) => (
                  <rect key={`cw-w-${i}`} x="282" y={165 + i * 19} width="14" height="11" />
                ))}
                {/* East Crosswalk */}
                {[...Array(8)].map((_, i) => (
                  <rect key={`cw-e-${i}`} x="504" y={165 + i * 19} width="14" height="11" />
                ))}
                {/* North Crosswalk */}
                {[...Array(10)].map((_, i) => (
                  <rect key={`cw-n-${i}`} x={306 + i * 19} y="142" width="11" height="14" />
                ))}
                {/* South Crosswalk */}
                {[...Array(10)].map((_, i) => (
                  <rect key={`cw-s-${i}`} x={306 + i * 19} y="324" width="11" height="14" />
                ))}
              </g>

              {/* Traffic Signal Heads at Intersection Corners with Lit Lamps */}
              <g transform="translate(290, 130)">
                <rect x="0" y="0" width="12" height="26" rx="2" fill="#0A0C0E" stroke="#555" strokeWidth="1" />
                <circle
                  cx="6"
                  cy="6"
                  r="3"
                  fill={junction.signalState === 'RED' ? '#FF4D4D' : '#331111'}
                />
                <circle
                  cx="6"
                  cy="13"
                  r="3"
                  fill={junction.signalState === 'YELLOW' ? '#F5BE58' : '#332811'}
                />
                <circle
                  cx="6"
                  cy="20"
                  r="3"
                  fill={junction.signalState === 'GREEN' ? '#55FF99' : '#113322'}
                />
              </g>

              {/* Live Animated Moving Vehicles on Real Asphalt */}
              {/* Car 1: Heading East */}
              <g transform="translate(180, 185)">
                <rect x="-18" y="-9" width="36" height="18" rx="4" fill="#EAEAEA" stroke="#111" strokeWidth="1" />
                <rect x="2" y="-7" width="8" height="14" rx="2" fill="#222" opacity="0.8" />
                <circle cx="17" cy="-6" r="2" fill="#FFFFEE" />
                <circle cx="17" cy="6" r="2" fill="#FFFFEE" />
                <circle cx="-17" cy="-6" r="1.5" fill="#FF4444" />
                <circle cx="-17" cy="6" r="1.5" fill="#FF4444" />
              </g>

              {/* Car 2: Heading West */}
              <g transform="translate(620, 290)">
                <rect x="-18" y="-9" width="36" height="18" rx="4" fill="#BBBBBB" stroke="#111" strokeWidth="1" />
                <rect x="-10" y="-7" width="8" height="14" rx="2" fill="#222" opacity="0.8" />
                <circle cx="-17" cy="-6" r="2" fill="#FFFFEE" />
                <circle cx="-17" cy="6" r="2" fill="#FFFFEE" />
                <circle cx="17" cy="-6" r="1.5" fill="#FF4444" />
                <circle cx="17" cy="6" r="1.5" fill="#FF4444" />
              </g>

              {/* City Bus: Heading South */}
              <g transform="translate(390, 80)">
                <rect x="-11" y="-32" width="22" height="64" rx="4" fill="#D9D9D9" stroke="#111" strokeWidth="1" />
                <rect x="-9" y="16" width="18" height="10" rx="2" fill="#222" opacity="0.85" />
                <circle cx="-8" cy="31" r="2" fill="#FFFFEE" />
                <circle cx="8" cy="31" r="2" fill="#FFFFEE" />
              </g>

              {/* Delivery Van: Heading North */}
              <g transform="translate(460, 410)">
                <rect x="-12" y="-24" width="24" height="48" rx="4" fill="#F0F0F0" stroke="#111" strokeWidth="1" />
                <rect x="-10" y="-20" width="20" height="8" rx="2" fill="#222" opacity="0.85" />
                <circle cx="-8" cy="-23" r="2" fill="#FFFFEE" />
                <circle cx="8" cy="-23" r="2" fill="#FFFFEE" />
              </g>
            </svg>
          </div>

          {/* AI OPTICAL BOUNDING BOXES OVERLAY */}
          {isAiDetectionOn && (
            <div className="absolute inset-0 pointer-events-none z-30 font-mono">
              {/* Box 1 for Eastbound Car */}
              <div
                className="absolute border border-[#B7F34A] rounded-xs"
                style={{
                  top: '36%',
                  left: '21%',
                  width: '68px',
                  height: '42px',
                }}
              >
                <div className="absolute -top-4 left-0 bg-[#B7F34A] text-[#0B0F12] text-[8px] font-bold px-1 rounded-xs whitespace-nowrap shadow-xs">
                  [SEDAN #24] 48.2 km/h · 96%
                </div>
              </div>

              {/* Box 2 for Southbound Bus */}
              <div
                className="absolute border border-[#52C7D9] rounded-xs"
                style={{
                  top: '12%',
                  left: '46%',
                  width: '54px',
                  height: '92px',
                }}
              >
                <div className="absolute -top-4 left-0 bg-[#52C7D9] text-[#0B0F12] text-[8px] font-bold px-1 rounded-xs whitespace-nowrap shadow-xs">
                  [TRANSIT BUS #08] 32.5 km/h · 94%
                </div>
              </div>

              {/* Box 3 for Westbound Car */}
              <div
                className="absolute border border-[#B7F34A] rounded-xs"
                style={{
                  top: '58%',
                  left: '74%',
                  width: '68px',
                  height: '42px',
                }}
              >
                <div className="absolute -top-4 left-0 bg-[#B7F34A] text-[#0B0F12] text-[8px] font-bold px-1 rounded-xs whitespace-nowrap shadow-xs">
                  [EV SEDAN #18] 44.0 km/h · 98%
                </div>
              </div>

              {/* Box 4 for Delivery Van */}
              <div
                className="absolute border border-[#F5BE58] rounded-xs"
                style={{
                  top: '76%',
                  left: '54%',
                  width: '56px',
                  height: '76px',
                }}
              >
                <div className="absolute -top-4 left-0 bg-[#F5BE58] text-[#0B0F12] text-[8px] font-bold px-1 rounded-xs whitespace-nowrap shadow-xs">
                  [VAN #12] 38.6 km/h · 91%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Strip */}
        <div className="px-5 py-3.5 bg-[#10171B] border-t border-[#29383A] flex flex-wrap items-center justify-between gap-4 text-xs font-mono shrink-0">
          <div className="flex items-center gap-4 text-[#91A19B]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B7F34A]" />
              <strong className="text-[#F1F5F2]">4 Detections</strong> in View
            </span>
            <span>·</span>
            <span>Flow: <strong className="text-[#F1F5F2]">28.4 veh/min</strong></span>
            <span>·</span>
            <span>Optical Clarity: <strong className="text-[#71D49A]">99.4%</strong></span>
          </div>

          {/* PTZ Zoom Controls & Priority Override */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#151F24] border border-[#29383A] rounded-lg p-0.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                className="p-1.5 text-[#91A19B] hover:text-[#F1F5F2] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] text-[#F1F5F2] font-bold">{zoomLevel.toFixed(1)}x</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="p-1.5 text-[#91A19B] hover:text-[#F1F5F2] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {onTriggerEmergency && (
              <button
                onClick={() => onTriggerEmergency(junction.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  junction.hasEmergencyVehicle
                    ? 'bg-[#F06464] text-white shadow-xs'
                    : 'bg-[#F06464]/10 hover:bg-[#F06464]/20 border border-[#F06464]/30 text-[#F06464]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{junction.hasEmergencyVehicle ? 'Clear Emergency' : 'Ambulance Wave'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="neon-btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Close Surveillance Stream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
