/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Cpu,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Sliders,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '../types';
import { AcademicBackground } from './AcademicBackground';

interface LoginPortalProps {
  onLogin: (role: UserRole) => void;
  initialRole?: UserRole;
  onOpenOverview?: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onLogin,
  initialRole = 'Traffic Control Operator',
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('operator@metropulse.traffic');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles: { id: UserRole; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      id: 'Traffic Control Operator',
      title: 'Traffic Operator',
      subtitle: 'Datasets, density & signal recommendations',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'System Administrator',
      title: 'Command Admin',
      subtitle: 'City-wide traffic analytics & policies',
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(selectedRole);
    }, 280);
  };

  return (
    <div className="min-h-screen bg-[#100D18] text-[#F5F3FA] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden select-none">
      {/* Custom Illustrated Academic Background */}
      <AcademicBackground />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4D91E8] to-[#35B99B] p-0.5 shadow-lg shadow-[#4D91E8]/20 mb-3.5">
            <div className="w-full h-full bg-[#191522] rounded-[14px] flex items-center justify-center">
              <Cpu className="w-6 h-6 text-[#4D91E8]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F3FA]">MetroPulse Traffic OS</h1>
          <p className="text-sm text-[#A9A0BC] mt-1">Autonomous Parallel Traffic Processing System</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#201B29] border border-[#393044] rounded-2xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-xl">
          {/* Role Selector Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-[#A9A0BC] mb-2 uppercase tracking-wider">
              Select Console Role
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#191522] rounded-xl border border-[#393044]">
              {roles.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.id);
                      if (r.id === 'Traffic Control Operator') {
                        setEmail('operator@metropulse.traffic');
                      } else if (r.id === 'System Administrator') {
                        setEmail('admin@metropulse.traffic');
                      } else {
                        setEmail('auditor@metropulse.traffic');
                      }
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#201B29] text-[#F5F3FA] border border-[#393044] shadow-sm'
                        : 'text-[#A9A0BC] hover:text-[#F5F3FA] hover:bg-[#201B29]/40'
                    }`}
                  >
                    <span className={isSelected ? 'text-[#4D91E8]' : 'text-[#A9A0BC]'}>{r.icon}</span>
                    <span className="mt-1 text-[11px] truncate w-full text-center">{r.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Work Email */}
            <div>
              <label className="block text-xs font-medium text-[#A9A0BC] mb-1.5" htmlFor="email">
                Operator Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#191522] border border-[#393044] text-[#F5F3FA] placeholder-[#A9A0BC]/40 text-sm focus:outline-none focus:border-[#4D91E8] focus:ring-1 focus:ring-[#4D91E8] transition-all"
                placeholder="name@metropulse.traffic"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#A9A0BC]" htmlFor="password">
                  Security Passkey
                </label>
                <a
                  href="#recover"
                  onClick={(e) => {
                    e.preventDefault();
                    setPassword('metropulse_prod_2026');
                  }}
                  className="text-xs text-[#4D91E8] hover:text-[#35B99B] transition-colors"
                >
                  Reset key
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#191522] border border-[#393044] text-[#F5F3FA] placeholder-[#A9A0BC]/40 text-sm focus:outline-none focus:border-[#4D91E8] focus:ring-1 focus:ring-[#4D91E8] transition-all"
                  placeholder="Enter security token"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9A0BC] hover:text-[#F5F3FA] transition-colors cursor-pointer"
                  title={showPassword ? 'Hide passkey' : 'Show passkey'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Session info */}
            <div className="flex items-center justify-between text-xs text-[#A9A0BC] pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#393044] bg-[#191522] text-[#4D91E8] focus:ring-0 cursor-pointer"
                />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] text-[#35B99B] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35B99B] animate-pulse" />
                Auth Nodes Ready
              </span>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#4D91E8] to-[#35B99B] hover:opacity-95 transition-all shadow-md shadow-[#4D91E8]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authorizing Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom subtle note */}
        <div className="text-center mt-6 text-xs text-[#A9A0BC] flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#35B99B]" />
          <span>Enterprise End-to-End TLS Telemetry Secured</span>
        </div>
      </div>
    </div>
  );
};
