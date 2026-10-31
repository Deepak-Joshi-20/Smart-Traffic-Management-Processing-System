/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'System Administrator' | 'Traffic Control Operator';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agencySector: string;
  badgeId: string;
}

export type AppRoute =
  | 'dashboard'
  | 'junctions'
  | 'traffic-monitor'
  | 'signal-management'
  | 'alerts'
  | 'incidents'
  | 'analytics'
  | 'history'
  | 'data-management'
  | 'settings'
  | 'profile';

export type PublicRoute =
  | 'home'
  | 'features'
  | 'how-it-works'
  | 'about'
  | 'login'
  | 'signup'
  | 'forgot-password';

export type TrafficStatus = 'Free Flow' | 'Moderate' | 'Congested';

export type CongestionCategory = 'Low' | 'Moderate' | 'High';

export interface JunctionData {
  id: string;
  name: string;
  assignedCore: number; // 0, 1, 2, 3
  n1: number; // Vehicles in Lane 1
  n2: number; // Vehicles in Lane 2
  w: number;  // Vehicle Weight factor (default: 1.0 - 2.5)
  load: number; // L = (n1 + n2) * w
  status: TrafficStatus;
  signalState: 'RED' | 'YELLOW' | 'GREEN';
  greenDurationSec: number; // Dynamically computed signal timing
  hasEmergencyVehicle: boolean;
  queueThreshold: number; // Congestion limit (e.g., 80)
}

export interface ApproachData {
  approach: 'North' | 'South' | 'East' | 'West';
  vehicleCount: number;
  laneCapacity: number;
  densityIndex: number; // (Vehicle Count / Lane Capacity) * 100
  fixedGreenSec: number;
  recommendedGreenSec: number; // g = g_min + (D / sumD) * (C - n * g_min)
  speedKmH: number;
}

export interface JunctionRecommendation {
  junctionId: string;
  junctionName: string;
  cycleDurationSec: number; // C
  minGreenSec: number; // g_min
  approaches: ApproachData[];
  totalDensity: number; // sum D
}

export interface TrafficRecord {
  id: string;
  timestamp: string;
  junctionId: string;
  junctionName: string;
  laneId: string;
  vehicleCount: number;
  laneCapacity: number;
  averageSpeedKmH: number;
  signalPhase: 'RED' | 'YELLOW' | 'GREEN';
  densityIndex: number; // (Vehicle Count / Lane Capacity) * 100
  congestionLevel: CongestionCategory;
  recommendedGreenSec: number;
  source: 'SIMULATED' | 'UPLOADED' | 'MANUAL';
}

export interface TrafficAlertItem {
  id: string;
  timestamp: string;
  junctionId: string;
  junctionName: string;
  type: 'CONGESTION_EXCEEDED' | 'SPEED_DROP' | 'EMERGENCY_DISPATCH' | 'SIGNAL_OVERRIDE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  message: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export type MesiState = 'M' | 'E' | 'S' | 'I';

export interface CoreMesiLine {
  coreId: number;
  cacheLineAddress: string;
  data: string;
  state: MesiState;
  lastAction: string;
}

export interface Instruction16Bit {
  id: string;
  address: string;
  iBit: 0 | 1;
  opcode: 'LOAD' | 'ADD' | 'SUB' | 'MUL' | 'STORE' | 'BUN' | 'NOP';
  opcodeBinary: string;
  operand: string;
  description: string;
  rawMachineCode: string;
}

export interface PipelineStageState {
  stage: 'IF' | 'ID' | 'EX' | 'WB';
  name: string;
  currentInstruction: Instruction16Bit | null;
  status: 'IDLE' | 'ACTIVE' | 'STALLED' | 'FORWARDED';
  cycleDetail: string;
}

export interface SimulationLogEntry {
  id: string;
  timestamp: string;
  cycle: number;
  subsystem: 'CORE_MIMD' | 'PIPELINE' | 'MESI_BUS' | 'TRAFFIC_GRID' | 'CONTROL_UNIT';
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'HAZARD';
  message: string;
}
