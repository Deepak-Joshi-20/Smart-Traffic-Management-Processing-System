import React, { useState, useEffect } from 'react';
import {
  PublicRoute,
  AppRoute,
  AuthUser,
  JunctionData,
  TrafficRecord,
  TrafficAlertItem,
  SimulationLogEntry,
} from './types';
import {
  INITIAL_JUNCTIONS,
  INITIAL_TRAFFIC_RECORDS,
  INITIAL_TRAFFIC_ALERTS,
} from './data/mockData';
import { NeonGridBackground } from './components/NeonGridBackground';
import { LandingPage } from './components/public/LandingPage';
import { AuthViews } from './components/public/AuthViews';
import { AppShell } from './components/app/AppShell';
import { DashboardView } from './components/app/DashboardView';
import { JunctionsView } from './components/app/JunctionsView';
import { TrafficMonitorView } from './components/app/TrafficMonitorView';
import { SignalManagementView } from './components/app/SignalManagementView';
import { AlertsView } from './components/app/AlertsView';
import { AnalyticsView } from './components/app/AnalyticsView';
import { HistoryView } from './components/app/HistoryView';
import { DataManagementView } from './components/app/DataManagementView';
import { SettingsView } from './components/app/SettingsView';
import { SystemArchitectureDrawer } from './components/app/SystemArchitectureDrawer';

export default function App() {
  // Public Route State
  const [publicRoute, setPublicRoute] = useState<PublicRoute>('home');

  // Authenticated Route State
  const [appRoute, setAppRoute] = useState<AppRoute>('dashboard');

  // Authentication State with localStorage persistence
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('urbanpulse_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return null;
  });

  // System Architecture Internal Diagnostics Drawer State
  const [isSystemArchitectureOpen, setIsSystemArchitectureOpen] = useState(false);

  // Core Simulation State
  const [simulationClockCycle, setSimulationClockCycle] = useState<number>(48);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [junctions, setJunctions] = useState<JunctionData[]>(INITIAL_JUNCTIONS);
  const [records, setRecords] = useState<TrafficRecord[]>(INITIAL_TRAFFIC_RECORDS);
  const [alerts, setAlerts] = useState<TrafficAlertItem[]>(INITIAL_TRAFFIC_ALERTS);
  const [currentDatasetName, setCurrentDatasetName] = useState('Municipal Sector Baseline');

  // Simulation Logs
  const [logs, setLogs] = useState<SimulationLogEntry[]>([
    {
      id: 'log-1',
      timestamp: '10:30:15',
      cycle: 46,
      subsystem: 'CORE_MIMD',
      level: 'INFO',
      message: 'Urban Pulse Neon Grid initialized: 4 processing sectors online.',
    },
    {
      id: 'log-2',
      timestamp: '10:30:20',
      cycle: 47,
      subsystem: 'MESI_BUS',
      level: 'SUCCESS',
      message: 'MESI Snooping Bus verified: Cache coherency synchronized.',
    },
    {
      id: 'log-3',
      timestamp: '10:30:25',
      cycle: 48,
      subsystem: 'TRAFFIC_GRID',
      level: 'WARN',
      message: 'Junction D queue crossed threshold (L=118.4 > 80). Priority green wave ready.',
    },
  ]);

  // Persist user changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('urbanpulse_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('urbanpulse_user');
    }
  }, [currentUser]);

  const addLog = (
    message: string,
    subsystem: SimulationLogEntry['subsystem'] = 'CORE_MIMD',
    level: SimulationLogEntry['level'] = 'INFO'
  ) => {
    const newEntry: SimulationLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      cycle: simulationClockCycle + 1,
      subsystem,
      level,
      message,
    };
    setSimulationClockCycle((prev) => prev + 1);
    setLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
  };

  const handleUpdateJunction = (id: string, updates: Partial<JunctionData>) => {
    setJunctions((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
    );
    addLog(`Parameters adjusted for node ${id}: ${JSON.stringify(updates)}`, 'TRAFFIC_GRID', 'INFO');
  };

  const handleUpdateJunctionLoad = (id: string, delta: number) => {
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const newN1 = Math.max(2, j.n1 + Math.round(delta / 2));
          const newLoad = (newN1 + j.n2) * j.w;
          const newStatus = newLoad > 80 ? 'Congested' : newLoad >= 40 ? 'Moderate' : 'Free Flow';
          return {
            ...j,
            n1: newN1,
            load: newLoad,
            status: newStatus,
          };
        }
        return j;
      })
    );
    addLog(`Density updated at ${id} (delta: ${delta > 0 ? '+' : ''}${delta})`, 'TRAFFIC_GRID', 'INFO');
  };

  const handleTriggerEmergency = (id: string) => {
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const newState = !j.hasEmergencyVehicle;
          return {
            ...j,
            hasEmergencyVehicle: newState,
            signalState: newState ? 'GREEN' : j.signalState,
            greenDurationSec: newState ? 120 : j.greenDurationSec,
          };
        }
        return j;
      })
    );

    // Propagate corresponding incident alert
    const target = junctions.find((j) => j.id === id);
    const newAlert: TrafficAlertItem = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      junctionId: id,
      junctionName: target?.name || id,
      type: 'EMERGENCY_DISPATCH',
      severity: 'CRITICAL',
      message: `Priority Emergency Vehicle clearance corridor activated for ${id}. Signal forced GREEN for 120s.`,
      status: 'ACTIVE',
    };
    setAlerts((prev) => [newAlert, ...prev]);

    addLog(
      `Priority Emergency Clearance override at ${id}. Broadcasted cache line invalidation and forced green.`,
      'CONTROL_UNIT',
      'HAZARD'
    );
  };

  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    addLog('Executing dynamic signal recalculation cycle across parallel sectors...', 'CORE_MIMD', 'INFO');

    setTimeout(() => {
      // Step: dynamically optimize green duration for highest load junction
      setJunctions((prev) =>
        prev.map((j) => {
          if (j.load > 80) {
            return { ...j, greenDurationSec: Math.min(110, j.greenDurationSec + 15) };
          }
          return j;
        })
      );
      addLog('Step: Webster split solver calculated optimal delay minimization.', 'PIPELINE', 'SUCCESS');
    }, 600);

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationClockCycle((prev) => prev + 1);
      addLog('Cycle complete. Signals synchronized across arterial corridors.', 'CORE_MIMD', 'SUCCESS');
    }, 1200);
  };

  const handleUpdateAlertStatus = (
    alertId: string,
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
  ) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status } : a))
    );
    addLog(`Alert ${alertId} status marked as ${status}.`, 'TRAFFIC_GRID', 'INFO');
  };

  const handleAddAlert = (newAlert: Omit<TrafficAlertItem, 'id' | 'timestamp'>) => {
    const item: TrafficAlertItem = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      ...newAlert,
    };
    setAlerts((prev) => [item, ...prev]);
    addLog(`New incident reported: ${item.message}`, 'TRAFFIC_GRID', 'WARN');
  };

  const handleIngestDataset = (csvText: string, datasetName: string) => {
    try {
      const lines = csvText.trim().split('\n');
      const dataRows = lines.slice(1);
      const parsedRecords: TrafficRecord[] = [];

      dataRows.forEach((row, idx) => {
        const parts = row.split(',').map((p) => p.trim());
        if (parts.length >= 7) {
          const [time, jId, lane, vCount, cap, speed, phase] = parts;
          const vehicles = parseInt(vCount, 10) || 20;
          const capacity = parseInt(cap, 10) || 50;
          const density = (vehicles / capacity) * 100;
          parsedRecords.push({
            id: `REC-ING-${idx + 1}`,
            timestamp: time || '10:30:00',
            junctionId: jId || 'JUNCT_A',
            junctionName:
              junctions.find((j) => j.id === jId)?.name || `Junction ${jId}`,
            laneId: lane || 'Approach-L1',
            vehicleCount: vehicles,
            laneCapacity: capacity,
            averageSpeedKmH: parseFloat(speed) || 30.0,
            signalPhase: (phase as any) || 'GREEN',
            densityIndex: density,
            congestionLevel: density > 75 ? 'High' : density >= 40 ? 'Moderate' : 'Low',
            recommendedGreenSec: Math.round(30 + (density / 100) * 45),
            source: 'UPLOADED',
          });
        }
      });

      if (parsedRecords.length > 0) {
        setRecords(parsedRecords);
        setCurrentDatasetName(datasetName);

        // Update junction loads to reflect new records
        setJunctions((prev) =>
          prev.map((j) => {
            const jRecords = parsedRecords.filter((r) => r.junctionId === j.id);
            if (jRecords.length > 0) {
              const n1 = jRecords[0]?.vehicleCount || j.n1;
              const n2 = jRecords[1]?.vehicleCount || j.n2;
              const load = (n1 + n2) * j.w;
              return {
                ...j,
                n1,
                n2,
                load,
                status: load > 80 ? 'Congested' : load >= 40 ? 'Moderate' : 'Free Flow',
              };
            }
            return j;
          })
        );
        addLog(`Ingested dataset: ${datasetName} (${parsedRecords.length} records).`, 'TRAFFIC_GRID', 'SUCCESS');
      }
    } catch (err) {
      addLog(`Dataset ingestion error: ${(err as Error).message}`, 'TRAFFIC_GRID', 'HAZARD');
    }
  };

  const handleResetToBaseline = () => {
    setJunctions(INITIAL_JUNCTIONS);
    setRecords(INITIAL_TRAFFIC_RECORDS);
    setAlerts(INITIAL_TRAFFIC_ALERTS);
    setCurrentDatasetName('Municipal Sector Baseline');
    addLog('Restored all nodes and parameters to baseline configuration.', 'TRAFFIC_GRID', 'INFO');
  };

  // 1. PUBLIC EXPERIENCE (When user is not logged in)
  if (!currentUser) {
    if (
      publicRoute === 'login' ||
      publicRoute === 'signup' ||
      publicRoute === 'forgot-password'
    ) {
      return (
        <div className="relative min-h-screen bg-[#0B0F12]">
          <NeonGridBackground />
          <AuthViews
            currentPublicRoute={publicRoute}
            onNavigatePublic={(route) => setPublicRoute(route)}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setAppRoute('dashboard');
              addLog(`Authenticated operator session: ${user.name} (${user.badgeId})`, 'TRAFFIC_GRID', 'SUCCESS');
            }}
          />
        </div>
      );
    }

    // Default Public Landing Page
    return (
      <div className="relative min-h-screen bg-[#0B0F12]">
        <NeonGridBackground />
        <LandingPage
          currentPublicRoute={publicRoute}
          onNavigatePublic={(route) => setPublicRoute(route)}
          onLaunchDashboard={() => {
            // Quick-start authenticated session as Senior Traffic Controller
            const demoUser: AuthUser = {
              id: 'demo-operator',
              name: 'Senior Traffic Controller',
              email: 'operator@urbanpulse.gov',
              role: 'Traffic Control Operator',
              agencySector: 'Municipal Central Command Center',
              badgeId: 'TCO-42',
            };
            setCurrentUser(demoUser);
            setAppRoute('dashboard');
            addLog('Session initiated from public dashboard launch.', 'TRAFFIC_GRID', 'SUCCESS');
          }}
          junctions={junctions}
        />
      </div>
    );
  }

  // 2. AUTHENTICATED APPLICATION (The actual Urban Pulse Smart Traffic Intelligence Platform)
  return (
    <div className="relative min-h-screen bg-[#0B0F12]">
      <NeonGridBackground />

      <AppShell
        currentRoute={appRoute}
        onNavigate={(route) => setAppRoute(route)}
        currentUser={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          setPublicRoute('home');
          addLog('Operator locked and exited console session.', 'TRAFFIC_GRID', 'INFO');
        }}
        simulationCycle={simulationClockCycle}
        isSimulating={isSimulating}
        onRunSimulation={handleRunSimulation}
        onTriggerEmergency={handleTriggerEmergency}
        onOpenSystemArchitecture={() => setIsSystemArchitectureOpen(true)}
        activeAlertCount={alerts.filter((a) => a.status === 'ACTIVE').length}
      >
        {/* Route Renderers */}
        {appRoute === 'dashboard' && (
          <DashboardView
            junctions={junctions}
            records={records}
            alerts={alerts}
            simulationCycle={simulationClockCycle}
            isSimulating={isSimulating}
            onRunSimulation={handleRunSimulation}
            onNavigate={(route) => setAppRoute(route)}
            onTriggerEmergency={handleTriggerEmergency}
            onUpdateJunctionLoad={handleUpdateJunctionLoad}
          />
        )}

        {appRoute === 'junctions' && (
          <JunctionsView
            junctions={junctions}
            onUpdateJunctionLoad={handleUpdateJunctionLoad}
            onTriggerEmergency={handleTriggerEmergency}
            onUpdateJunction={handleUpdateJunction}
          />
        )}

        {appRoute === 'traffic-monitor' && (
          <TrafficMonitorView
            junctions={junctions}
            records={records}
          />
        )}

        {appRoute === 'signal-management' && (
          <SignalManagementView
            junctions={junctions}
            onUpdateJunction={handleUpdateJunction}
            onRunSimulation={handleRunSimulation}
            isSimulating={isSimulating}
          />
        )}

        {appRoute === 'alerts' || appRoute === 'incidents' ? (
          <AlertsView
            alerts={alerts}
            junctions={junctions}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onAddAlert={handleAddAlert}
          />
        ) : null}

        {appRoute === 'analytics' && (
          <AnalyticsView
            junctions={junctions}
            records={records}
          />
        )}

        {appRoute === 'history' && (
          <HistoryView
            records={records}
          />
        )}

        {appRoute === 'data-management' && (
          <DataManagementView
            onIngestDataset={handleIngestDataset}
            onResetToBaseline={handleResetToBaseline}
            currentDatasetName={currentDatasetName}
            recordCount={records.length}
          />
        )}

        {(appRoute === 'settings' || appRoute === 'profile') && (
          <SettingsView
            currentUser={currentUser}
            onUpdateUser={(updated) => setCurrentUser(updated)}
          />
        )}
      </AppShell>

      {/* Internal Hardware & OS Architecture Diagnostics Modal */}
      <SystemArchitectureDrawer
        isOpen={isSystemArchitectureOpen}
        onClose={() => setIsSystemArchitectureOpen(false)}
        junctions={junctions}
        onTriggerEmergency={handleTriggerEmergency}
        onUpdateJunctionLoad={handleUpdateJunctionLoad}
        logs={logs}
        simulationCycle={simulationClockCycle}
      />
    </div>
  );
}
