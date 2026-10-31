import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Clock,
  Compass,
  Cpu,
  Database,
  History,
  Layers,
  LogOut,
  MapPin,
  Menu,
  Play,
  Radio,
  Search,
  Settings,
  Shield,
  Siren,
  Sliders,
  User,
  X,
  Zap,
} from 'lucide-react';
import { AppRoute, AuthUser, TrafficAlertItem } from '../../types';

interface AppShellProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  currentUser: AuthUser;
  onLogout: () => void;
  simulationCycle: number;
  isSimulating: boolean;
  onRunSimulation: () => void;
  onTriggerEmergency: (id: string) => void;
  onOpenSystemArchitecture: () => void;
  activeAlertCount: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onNavigate,
  currentUser,
  onLogout,
  simulationCycle,
  isSimulating,
  onRunSimulation,
  onTriggerEmergency,
  onOpenSystemArchitecture,
  activeAlertCount,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Operations Command',
      category: 'MAIN',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'junctions' as const,
      label: 'Junction Monitoring',
      category: 'MAIN',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: 'traffic-monitor' as const,
      label: 'Traffic Density Flow',
      category: 'MAIN',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'signal-management' as const,
      label: 'Signal Optimization',
      category: 'CONTROL',
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      id: 'alerts' as const,
      label: 'Alerts & Incidents',
      category: 'CONTROL',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
    },
    {
      id: 'analytics' as const,
      label: 'Traffic Analytics',
      category: 'DATA & AUDIT',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'history' as const,
      label: 'Telemetry History',
      category: 'DATA & AUDIT',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'data-management' as const,
      label: 'Dataset Ingestion',
      category: 'DATA & AUDIT',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'settings' as const,
      label: 'Console Settings',
      category: 'SYSTEM',
      icon: <Settings className="w-4 h-4" />,
    },
    ...(currentUser.role === 'System Administrator'
      ? [
          {
            id: 'admin-audit' as const,
            label: 'Security Audit Vault',
            category: 'ADMIN & SECURITY',
            icon: <Shield className="w-4 h-4 text-[#F06464]" />,
            badge: 'RBAC',
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#0B0F12] text-[#F1F5F2] flex font-sans selection:bg-[#B7F34A]/30 selection:text-[#F1F5F2] relative">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#10171B] border-r border-[#29383A] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#29383A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#151F24] border border-[#29383A] flex items-center justify-center text-[#B7F34A] shadow-xs">
              <Radio className="w-4 h-4 text-[#B7F34A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-[#F1F5F2]">URBAN PULSE</span>
              </div>
              <p className="text-[10px] font-mono text-[#B7F34A]">NEON GRID // v2.5</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1 rounded-lg text-[#91A19B] hover:text-[#F1F5F2] hover:bg-[#151F24] lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {(['MAIN', 'CONTROL', 'DATA & AUDIT', 'SYSTEM'] as const).map((category) => {
            const items = navItems.filter((i) => i.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <div className="px-3 mb-1.5 text-[10px] font-mono font-semibold text-[#64736D] uppercase tracking-wider">
                  {category}
                </div>
                <nav className="space-y-1">
                  {items.map((item) => {
                    const isActive = currentRoute === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-[#151F24] text-[#F1F5F2] font-semibold border border-[#29383A] shadow-xs'
                            : 'text-[#91A19B] hover:text-[#F1F5F2] hover:bg-[#151F24]/60'
                        }`}
                      >
                        <span className={isActive ? 'text-[#B7F34A]' : 'text-[#64736D]'}>
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#F06464] text-white font-bold">
                            {item.badge}
                          </span>
                        )}
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B7F34A]" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}

          {/* Internal System Architecture Inspector Launcher */}
          <div className="pt-2 border-t border-[#29383A]">
            <div className="px-3 mb-1.5 text-[10px] font-mono font-semibold text-[#64736D] uppercase tracking-wider">
              Internal Engine
            </div>
            <button
              onClick={() => {
                onOpenSystemArchitecture();
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono text-[#91A19B] hover:text-[#B7F34A] hover:bg-[#151F24] transition-colors cursor-pointer border border-transparent hover:border-[#29383A]"
            >
              <Cpu className="w-4 h-4 text-[#B7F34A]" />
              <span className="flex-1 text-left">System Architecture</span>
              <span className="text-[10px] text-[#64736D]">MIMD/MESI</span>
            </button>
          </div>
        </div>

        {/* User Profile Card in Sidebar Footer */}
        <div className="p-3 border-t border-[#29383A] bg-[#10171B]">
          <div className="p-2.5 rounded-xl bg-[#151F24] border border-[#29383A] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#10171B] border border-[#29383A] flex items-center justify-center text-[#B7F34A] shrink-0 font-mono text-xs font-bold">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#F1F5F2] truncate">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#71D49A]" />
                  <span className="text-[10px] font-mono text-[#91A19B] truncate">
                    {currentUser.badgeId}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Lock / Logout"
              className="p-1.5 rounded-lg text-[#91A19B] hover:text-[#F06464] hover:bg-[#10171B] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen relative z-10">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#0B0F12]/90 backdrop-blur-md border-b border-[#29383A] px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-[#91A19B] hover:text-[#F1F5F2] hover:bg-[#151F24] lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#64736D]">
                <span>URBAN PULSE</span>
                <span>/</span>
                <span className="text-[#91A19B] capitalize">{currentRoute.replace('-', ' ')}</span>
              </div>
              <h2 className="text-sm font-bold text-[#F1F5F2] tracking-tight capitalize">
                {currentRoute.replace('-', ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Priority Emergency Clearance Override */}
            <button
              onClick={() => onTriggerEmergency('JUNCT_B')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F06464]/10 hover:bg-[#F06464]/20 border border-[#F06464]/30 text-xs font-semibold text-[#F06464] transition-colors cursor-pointer"
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Priority Wave</span>
            </button>

            {/* Cycle Counter */}
            <div className="px-3 py-1.5 rounded-xl bg-[#151F24] border border-[#29383A] text-xs font-mono text-[#91A19B] hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B7F34A] animate-pulse" />
              <span>Cycle #{simulationCycle}</span>
            </div>

            {/* Run Signal Optimization Cycle CTA */}
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              className="neon-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Optimizing...' : 'Run Cycle'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
