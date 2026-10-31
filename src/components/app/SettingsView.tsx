import React, { useState } from 'react';
import {
  User,
  Shield,
  Bell,
  Sliders,
  CheckCircle2,
  Lock,
  Layers,
  Save,
  Radio,
  Clock,
} from 'lucide-react';
import { AuthUser } from '../../types';

interface SettingsViewProps {
  currentUser: AuthUser;
  onUpdateUser: (updatedUser: AuthUser) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUpdateUser,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [agencySector, setAgencySector] = useState(currentUser.agencySector);
  const [badgeId, setBadgeId] = useState(currentUser.badgeId);
  const [congestionThreshold, setCongestionThreshold] = useState(80);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [autoWebsterOptimization, setAutoWebsterOptimization] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name,
      email,
      agencySector,
      badgeId,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#F1F5F2] tracking-tight">
          Operator Profile &amp; Console Configuration
        </h1>
        <p className="text-xs text-[#91A19B] mt-0.5">
          Manage municipal operator credentials, notification thresholds, and algorithm automation preferences.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-[#71D49A]/10 border border-[#71D49A]/30 flex items-center gap-2.5 text-xs text-[#71D49A]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Preferences updated and saved to local session.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#29383A]">
            <div className="w-10 h-10 rounded-xl bg-[#1B292E] border border-[#29383A] flex items-center justify-center text-[#B7F34A]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F1F5F2]">Operator Identity</h3>
              <p className="text-xs text-[#91A19B]">Authorized municipal console profile</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#91A19B] mb-1">Operator Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#10171B] border border-[#29383A] rounded-xl px-3.5 py-2 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#91A19B] mb-1">Agency Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#10171B] border border-[#29383A] rounded-xl px-3.5 py-2 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#91A19B] mb-1">Assigned Municipal Sector</label>
              <input
                type="text"
                value={agencySector}
                onChange={(e) => setAgencySector(e.target.value)}
                className="w-full bg-[#10171B] border border-[#29383A] rounded-xl px-3.5 py-2 text-xs text-[#F1F5F2] focus:outline-hidden focus:border-[#B7F34A]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#91A19B] mb-1">Badge Identifier</label>
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                className="w-full bg-[#10171B] border border-[#29383A] rounded-xl px-3.5 py-2 text-xs text-[#F1F5F2] font-mono focus:outline-hidden focus:border-[#B7F34A]"
              />
            </div>
          </div>
        </div>

        {/* Operational Thresholds Card */}
        <div className="p-6 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#29383A]">
            <div className="w-10 h-10 rounded-xl bg-[#1B292E] border border-[#29383A] flex items-center justify-center text-[#52C7D9]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F1F5F2]">Operational Thresholds</h3>
              <p className="text-xs text-[#91A19B]">Algorithm trigger limits and notifications</p>
            </div>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#91A19B]">Congestion Threshold Index (L):</span>
                <span className="text-[#B7F34A] font-bold">{congestionThreshold} Load Units</span>
              </div>
              <input
                type="range"
                min="50"
                max="120"
                value={congestionThreshold}
                onChange={(e) => setCongestionThreshold(Number(e.target.value))}
                className="w-full accent-[#B7F34A]"
              />
              <span className="text-[10px] text-[#64736D] block mt-1">
                When approach load exceeds {congestionThreshold}, critical congestion alerts are propagated.
              </span>
            </div>

            <div className="pt-2 border-t border-[#29383A] space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-sans font-medium text-[#F1F5F2]">Automated Webster Optimization</div>
                  <div className="text-[11px] text-[#64736D]">
                    Automatically compute delay-minimizing green splits upon queue surge detection.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoWebsterOptimization}
                  onChange={(e) => setAutoWebsterOptimization(e.target.checked)}
                  className="accent-[#B7F34A] w-4 h-4 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-sans font-medium text-[#F1F5F2]">Audio Alert Broadcasts</div>
                  <div className="text-[11px] text-[#64736D]">
                    Play audible chime on emergency priority vehicle dispatch.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={audioAlerts}
                  onChange={(e) => setAudioAlerts(e.target.checked)}
                  className="accent-[#B7F34A] w-4 h-4 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="neon-btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
