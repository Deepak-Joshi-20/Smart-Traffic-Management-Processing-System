import React from 'react';

export const NeonGridBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Deep graphite ambient backdrop */}
      <div className="absolute inset-0 bg-[#0B0F12]" />

      {/* Subtle geometric Neon Grid lines */}
      <div 
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(41, 56, 58, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(41, 56, 58, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Subtle Radial Ambient Glows - Electric Lime & Mint */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#B7F34A]/[0.025] rounded-full blur-[140px]" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-[#52C7D9]/[0.025] rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-[#70D6B4]/[0.02] rounded-full blur-[160px]" />

      {/* Abstract smart-city vector arterial grid overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="neonArtery" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B7F34A" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#52C7D9" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#70D6B4" stopOpacity="0.2" />
          </linearGradient>
          <pattern id="dotGrid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="1.2" fill="#29383A" />
            <circle cx="0" cy="0" r="1.2" fill="#29383A" />
            <circle cx="80" cy="0" r="1.2" fill="#29383A" />
            <circle cx="0" cy="80" r="1.2" fill="#29383A" />
            <circle cx="80" cy="80" r="1.2" fill="#29383A" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#dotGrid)" />

        {/* Diagonal high-speed arterial lines */}
        <line x1="-10%" y1="20%" x2="110%" y2="80%" stroke="url(#neonArtery)" strokeWidth="1.5" strokeDasharray="8 12" />
        <line x1="20%" y1="-10%" x2="90%" y2="110%" stroke="url(#neonArtery)" strokeWidth="1.5" strokeDasharray="12 16" />
        <line x1="-5%" y1="85%" x2="75%" y2="-10%" stroke="#29383A" strokeWidth="1" />

        {/* City ring road circular paths */}
        <circle cx="65%" cy="45%" r="280" fill="none" stroke="#29383A" strokeWidth="1" strokeDasharray="6 8" />
        <circle cx="65%" cy="45%" r="420" fill="none" stroke="#29383A" strokeWidth="1" strokeOpacity="0.5" />

        {/* Intersection hub markers */}
        <circle cx="65%" cy="45%" r="4" fill="#B7F34A" fillOpacity="0.6" />
        <circle cx="28%" cy="32%" r="3" fill="#52C7D9" fillOpacity="0.5" />
        <circle cx="48%" cy="72%" r="3.5" fill="#70D6B4" fillOpacity="0.5" />
      </svg>
    </div>
  );
};
