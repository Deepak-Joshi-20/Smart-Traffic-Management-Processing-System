/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Traffic Network Ambient Background Component
 *
 * Renders subtle, elegant line-art illustrations inspired by modern intelligent
 * transportation platforms and the Examos dark aesthetic:
 * - Geometric arterial road network lines with subtle lane dashes
 * - Abstract multi-way intersection diagrams & roundabout circles
 * - Minimal traffic signal head outlines with soft glowing lenses
 * - Glowing network connection nodes and micro-grid matrix
 * - Deep purple-black base (#100D18) with subtle teal (#35B99B) & blue (#4D91E8) ambient aura
 */
export const AcademicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Deep ambient dark purple/teal gradient lighting */}
      <div className="absolute inset-0 bg-[#100D18]" />
      <div className="absolute -top-40 left-1/4 w-[750px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(77,145,232,0.07),transparent_70%)]" />
      <div className="absolute top-1/3 -right-32 w-[650px] h-[650px] bg-[radial-gradient(ellipse_at_center,rgba(53,185,155,0.05),transparent_70%)]" />
      <div className="absolute -bottom-40 left-1/3 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(110,75,200,0.05),transparent_70%)]" />

      {/* 2. Seamless subtle micro-grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #4D91E8 1px, transparent 1px),
            linear-gradient(to bottom, #4D91E8 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 3. Vector Traffic Arterial & Intersection Line Art */}
      <svg
        className="absolute inset-0 w-full h-full text-[#35B99B]/15 stroke-current fill-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* --- ILLUSTRATION 1: Abstract Multi-Lane Intersection & Roundabout (Top Right) --- */}
        <g transform="translate(1080, 50)" opacity="0.8">
          {/* Outer roundabout ring */}
          <circle cx="150" cy="150" r="90" stroke="#4D91E8" strokeWidth="1.2" strokeDasharray="4 6" />
          <circle cx="150" cy="150" r="60" stroke="#35B99B" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="25" stroke="#4D91E8" strokeWidth="1" />
          <circle cx="150" cy="150" r="3" fill="#35B99B" />

          {/* 4 Arterial approach roads branching outward */}
          <line x1="150" y1="0" x2="150" y2="60" stroke="#35B99B" strokeWidth="1.2" />
          <line x1="145" y1="0" x2="145" y2="60" stroke="#4D91E8" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="155" y1="0" x2="155" y2="60" stroke="#4D91E8" strokeWidth="0.8" strokeDasharray="3 3" />

          <line x1="150" y1="240" x2="150" y2="300" stroke="#35B99B" strokeWidth="1.2" />
          <line x1="0" y1="150" x2="60" y2="150" stroke="#35B99B" strokeWidth="1.2" />
          <line x1="240" y1="150" x2="300" y2="150" stroke="#35B99B" strokeWidth="1.2" />

          {/* Signal Indicator Icon outlines */}
          <g transform="translate(70, 70)">
            <rect width="18" height="38" rx="4" stroke="#4D91E8" strokeWidth="1" fill="#191522" fillOpacity="0.4" />
            <circle cx="9" cy="9" r="3.5" stroke="#E55353" strokeWidth="0.8" />
            <circle cx="9" cy="19" r="3.5" stroke="#E5A84D" strokeWidth="0.8" />
            <circle cx="9" cy="29" r="3.5" stroke="#35B99B" strokeWidth="1" fill="#35B99B" fillOpacity="0.3" />
          </g>
        </g>

        {/* --- ILLUSTRATION 2: Arterial Road Vectors with Corridor Nodes (Bottom Left) --- */}
        <g transform="translate(60, 580)" opacity="0.75">
          {/* Diagonal expressway highway */}
          <path
            d="M 0 240 Q 120 180 240 160 T 480 80"
            stroke="#4D91E8"
            strokeWidth="1.5"
          />
          <path
            d="M 10 248 Q 125 190 245 170 T 485 90"
            stroke="#35B99B"
            strokeWidth="1"
            strokeDasharray="6 4"
          />
          <path
            d="M 20 256 Q 130 200 250 180 T 490 100"
            stroke="#4D91E8"
            strokeWidth="1.2"
          />

          {/* Junction Network Hub Nodes */}
          <circle cx="120" cy="180" r="14" stroke="#35B99B" strokeWidth="1" />
          <circle cx="120" cy="180" r="4" fill="#35B99B" />
          <circle cx="240" cy="160" r="16" stroke="#4D91E8" strokeWidth="1.2" />
          <circle cx="240" cy="160" r="5" fill="#4D91E8" />
          <circle cx="360" cy="120" r="12" stroke="#35B99B" strokeWidth="1" />
          <circle cx="360" cy="120" r="3" fill="#35B99B" />
        </g>

        {/* --- ILLUSTRATION 3: Traffic Signal Head Outline (Left Margin) --- */}
        <g transform="translate(80, 240)" opacity="0.65">
          <rect width="24" height="60" rx="6" stroke="#35B99B" strokeWidth="1.2" fill="#191522" fillOpacity="0.4" />
          {/* Signal visor hoods */}
          <path d="M 4 8 C 4 3 20 3 20 8" stroke="#35B99B" strokeWidth="0.8" />
          <circle cx="12" cy="14" r="4.5" stroke="#E55353" strokeWidth="1" />
          <path d="M 4 24 C 4 19 20 19 20 24" stroke="#35B99B" strokeWidth="0.8" />
          <circle cx="12" cy="30" r="4.5" stroke="#E5A84D" strokeWidth="1" />
          <path d="M 4 40 C 4 35 20 35 20 40" stroke="#35B99B" strokeWidth="0.8" />
          <circle cx="12" cy="46" r="4.5" stroke="#35B99B" strokeWidth="1.2" fill="#35B99B" fillOpacity="0.4" />
        </g>

        {/* --- ILLUSTRATION 4: Geometric Sensor Grid Rays (Center / Bottom Right) --- */}
        <g transform="translate(980, 520)" opacity="0.6">
          <polygon
            points="140,80 180,140 100,140"
            stroke="#4D91E8"
            strokeWidth="1.2"
            fill="#4D91E8"
            fillOpacity="0.05"
          />
          <circle cx="140" cy="80" r="6" stroke="#35B99B" strokeWidth="1" />
          <line x1="140" y1="80" x2="260" y2="180" stroke="#4D91E8" strokeWidth="0.8" strokeDasharray="3 4" />
          <line x1="140" y1="80" x2="60" y2="200" stroke="#35B99B" strokeWidth="0.8" strokeDasharray="3 4" />
          <line x1="140" y1="80" x2="180" y2="240" stroke="#4D91E8" strokeWidth="0.8" strokeDasharray="3 4" />
        </g>

        {/* --- SCATTERED NETWORK SENSOR NODES & GLOWING POINTS --- */}
        <circle cx="220" cy="120" r="2.5" fill="#4D91E8" opacity="0.7" />
        <circle cx="480" cy="180" r="2" fill="#35B99B" opacity="0.8" />
        <circle cx="760" cy="90" r="3" fill="#F5F3FA" opacity="0.5" />
        <circle cx="920" cy="210" r="2" fill="#4D91E8" opacity="0.75" />
        <circle cx="1320" cy="140" r="2.5" fill="#35B99B" opacity="0.8" />

        <circle cx="340" cy="420" r="2" fill="#35B99B" opacity="0.7" />
        <circle cx="680" cy="470" r="2.5" fill="#4D91E8" opacity="0.8" />
        <circle cx="840" cy="380" r="2" fill="#35B99B" opacity="0.7" />
        <circle cx="1200" cy="480" r="2" fill="#4D91E8" opacity="0.6" />

        <circle cx="280" cy="740" r="2.5" fill="#35B99B" opacity="0.8" />
        <circle cx="600" cy="780" r="2" fill="#F5F3FA" opacity="0.5" />
        <circle cx="890" cy="720" r="2.5" fill="#4D91E8" opacity="0.75" />
        <circle cx="1280" cy="760" r="2" fill="#35B99B" opacity="0.7" />

        {/* Micro coordinate crosshairs */}
        <g transform="translate(560, 140)" opacity="0.5">
          <path d="M 0 -7 L 0 7 M -7 0 L 7 0" stroke="#35B99B" strokeWidth="0.8" />
        </g>
        <g transform="translate(1020, 360)" opacity="0.5">
          <path d="M 0 -6 L 0 6 M -6 0 L 6 0" stroke="#4D91E8" strokeWidth="0.8" />
        </g>
        <g transform="translate(420, 680)" opacity="0.45">
          <path d="M 0 -6 L 0 6 M -6 0 L 6 0" stroke="#35B99B" strokeWidth="0.8" />
        </g>
      </svg>
    </div>
  );
};
