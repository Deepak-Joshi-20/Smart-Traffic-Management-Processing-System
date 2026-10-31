/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JunctionData, CoreMesiLine, Instruction16Bit } from '../types';

export const INITIAL_JUNCTIONS: JunctionData[] = [
  {
    id: 'JUNCT_A',
    name: 'Junction A: Expressway Flyover',
    assignedCore: 0,
    n1: 18,
    n2: 14,
    w: 1.2,
    load: 38.4,
    status: 'Free Flow',
    signalState: 'GREEN',
    greenDurationSec: 35,
    hasEmergencyVehicle: false,
    queueThreshold: 80,
  },
  {
    id: 'JUNCT_B',
    name: 'Junction B: Knowledge Park Hub',
    assignedCore: 1,
    n1: 34,
    n2: 28,
    w: 1.5,
    load: 93.0,
    status: 'Congested',
    signalState: 'RED',
    greenDurationSec: 75,
    hasEmergencyVehicle: false,
    queueThreshold: 80,
  },
  {
    id: 'JUNCT_C',
    name: 'Junction C: Alpha Commercial Zone',
    assignedCore: 2,
    n1: 22,
    n2: 19,
    w: 1.0,
    load: 41.0,
    status: 'Moderate',
    signalState: 'GREEN',
    greenDurationSec: 45,
    hasEmergencyVehicle: false,
    queueThreshold: 80,
  },
  {
    id: 'JUNCT_D',
    name: 'Junction D: Pari Chowk Roundabout',
    assignedCore: 3,
    n1: 36,
    n2: 38,
    w: 1.6,
    load: 118.4,
    status: 'Congested',
    signalState: 'YELLOW',
    greenDurationSec: 90,
    hasEmergencyVehicle: true,
    queueThreshold: 80,
  },
];

export const INITIAL_MESI_LINES: CoreMesiLine[] = [
  {
    coreId: 0,
    cacheLineAddress: '0x0A40',
    data: 'SIG_A_TIME=35s [GREEN]',
    state: 'S',
    lastAction: 'BusRd (Shared Signal Wave Sync)',
  },
  {
    coreId: 1,
    cacheLineAddress: '0x0A40',
    data: 'SIG_A_TIME=35s [GREEN]',
    state: 'S',
    lastAction: 'BusRd (Snooped & Shared)',
  },
  {
    coreId: 2,
    cacheLineAddress: '0x0B10',
    data: 'EMERGENCY_CORRIDOR=OFF',
    state: 'E',
    lastAction: 'Exclusive Read from L2 Memory',
  },
  {
    coreId: 3,
    cacheLineAddress: '0x0C80',
    data: 'PRIORITY_OVERRIDE=JUNCT_D',
    state: 'M',
    lastAction: 'BusRdX (Modified: Local Cache Dirty)',
  },
];

export const TRAFFIC_INSTRUCTION_PROGRAM: Instruction16Bit[] = [
  {
    id: 'INST_01',
    address: '0x010',
    iBit: 0,
    opcode: 'LOAD',
    opcodeBinary: '000',
    operand: '0x100 [N1_VEHICLES]',
    description: 'Load lane 1 vehicle count into Accumulator/Register R1',
    rawMachineCode: '0 000 000100000000 (0x0100)',
  },
  {
    id: 'INST_02',
    address: '0x011',
    iBit: 0,
    opcode: 'ADD',
    opcodeBinary: '001',
    operand: '0x101 [N2_VEHICLES]',
    description: 'Add lane 2 vehicle count: R1 <- R1 + N2 (RAW Data Hazard if pipelined without forwarding)',
    rawMachineCode: '0 001 000100000001 (0x1101)',
  },
  {
    id: 'INST_03',
    address: '0x012',
    iBit: 0,
    opcode: 'MUL',
    opcodeBinary: '010',
    operand: '0x102 [W_WEIGHT]',
    description: 'Multiply total count by vehicle weight W: R1 <- R1 * W (Computes Approach Load L)',
    rawMachineCode: '0 010 000100000010 (0x2102)',
  },
  {
    id: 'INST_04',
    address: '0x013',
    iBit: 0,
    opcode: 'STORE',
    opcodeBinary: '011',
    operand: '0x103 [LOAD_L]',
    description: 'Store calculated load L into memory address 0x103',
    rawMachineCode: '0 011 000100000011 (0x3103)',
  },
  {
    id: 'INST_05',
    address: '0x014',
    iBit: 1, // Indirect addressing demo
    opcode: 'BUN',
    opcodeBinary: '100',
    operand: '0x200 [@ISR_CONGESTION]',
    description: 'Branch Unconditionally if L > 80 (Control Hazard! Speculative pipeline flush)',
    rawMachineCode: '1 100 001000000000 (0xC200)',
  },
];

// Initial Traffic Sensor & Dataset Ingestion Records
export const INITIAL_TRAFFIC_RECORDS = [
  {
    id: 'REC-001',
    timestamp: '10:25:00',
    junctionId: 'JUNCT_A',
    junctionName: 'Junction A: North Expressway',
    laneId: 'North-Approach-L1',
    vehicleCount: 18,
    laneCapacity: 50,
    averageSpeedKmH: 48.5,
    signalPhase: 'GREEN' as const,
    densityIndex: 36.0,
    congestionLevel: 'Low' as const,
    recommendedGreenSec: 32,
    source: 'SIMULATED' as const,
  },
  {
    id: 'REC-002',
    timestamp: '10:25:00',
    junctionId: 'JUNCT_A',
    junctionName: 'Junction A: North Expressway',
    laneId: 'South-Approach-L2',
    vehicleCount: 14,
    laneCapacity: 50,
    averageSpeedKmH: 52.0,
    signalPhase: 'GREEN' as const,
    densityIndex: 28.0,
    congestionLevel: 'Low' as const,
    recommendedGreenSec: 26,
    source: 'SIMULATED' as const,
  },
  {
    id: 'REC-003',
    timestamp: '10:24:45',
    junctionId: 'JUNCT_B',
    junctionName: 'Junction B: Downtown Financial Core',
    laneId: 'East-Approach-L1',
    vehicleCount: 42,
    laneCapacity: 50,
    averageSpeedKmH: 14.2,
    signalPhase: 'RED' as const,
    densityIndex: 84.0,
    congestionLevel: 'High' as const,
    recommendedGreenSec: 46,
    source: 'SIMULATED' as const,
  },
  {
    id: 'REC-004',
    timestamp: '10:24:45',
    junctionId: 'JUNCT_B',
    junctionName: 'Junction B: Downtown Financial Core',
    laneId: 'West-Approach-L2',
    vehicleCount: 38,
    laneCapacity: 50,
    averageSpeedKmH: 18.0,
    signalPhase: 'RED' as const,
    densityIndex: 76.0,
    congestionLevel: 'High' as const,
    recommendedGreenSec: 42,
    source: 'SIMULATED' as const,
  },
  {
    id: 'REC-005',
    timestamp: '10:24:30',
    junctionId: 'JUNCT_C',
    junctionName: 'Junction C: Tech & University Zone',
    laneId: 'North-Approach-L1',
    vehicleCount: 26,
    laneCapacity: 50,
    averageSpeedKmH: 34.0,
    signalPhase: 'GREEN' as const,
    densityIndex: 52.0,
    congestionLevel: 'Moderate' as const,
    recommendedGreenSec: 35,
    source: 'SIMULATED' as const,
  },
  {
    id: 'REC-006',
    timestamp: '10:24:30',
    junctionId: 'JUNCT_C',
    junctionName: 'Junction C: Tech & University Zone',
    laneId: 'South-Approach-L2',
    vehicleCount: 24,
    laneCapacity: 50,
    averageSpeedKmH: 36.5,
    signalPhase: 'GREEN' as const,
    densityIndex: 48.0,
    congestionLevel: 'Moderate' as const,
    recommendedGreenSec: 33,
    source: 'SIMULATED' as const,
  },
  {
    id: 'REC-007',
    timestamp: '10:24:15',
    junctionId: 'JUNCT_D',
    junctionName: 'Junction D: Airport Logistics Ring',
    laneId: 'East-Approach-L1',
    vehicleCount: 46,
    laneCapacity: 50,
    averageSpeedKmH: 11.5,
    signalPhase: 'YELLOW' as const,
    densityIndex: 92.0,
    congestionLevel: 'High' as const,
    recommendedGreenSec: 50,
    source: 'SIMULATED' as const,
  },
  {
    id: 'REC-008',
    timestamp: '10:24:15',
    junctionId: 'JUNCT_D',
    junctionName: 'Junction D: Airport Logistics Ring',
    laneId: 'West-Approach-L2',
    vehicleCount: 44,
    laneCapacity: 50,
    averageSpeedKmH: 12.0,
    signalPhase: 'YELLOW' as const,
    densityIndex: 88.0,
    congestionLevel: 'High' as const,
    recommendedGreenSec: 48,
    source: 'SIMULATED' as const,
  },
];

// Initial Traffic Incident & Congestion Alerts
export const INITIAL_TRAFFIC_ALERTS = [
  {
    id: 'ALT-101',
    timestamp: '10:24:15',
    junctionId: 'JUNCT_D',
    junctionName: 'Junction D: Airport Logistics Ring',
    type: 'CONGESTION_EXCEEDED' as const,
    severity: 'CRITICAL' as const,
    message: 'Density Index reached 92.0% on East Approach. Proportional algorithm extended green phase to 50s.',
    status: 'ACTIVE' as const,
  },
  {
    id: 'ALT-102',
    timestamp: '10:23:40',
    junctionId: 'JUNCT_B',
    junctionName: 'Junction B: Downtown Financial Core',
    type: 'SPEED_DROP' as const,
    severity: 'HIGH' as const,
    message: 'Average traffic speed dropped to 14.2 km/h (below 20 km/h threshold). Queue spillback detected.',
    status: 'ACTIVE' as const,
  },
  {
    id: 'ALT-103',
    timestamp: '10:20:10',
    junctionId: 'JUNCT_B',
    junctionName: 'Junction B: Downtown Financial Core',
    type: 'EMERGENCY_DISPATCH' as const,
    severity: 'HIGH' as const,
    message: 'Priority Emergency Corridor clearance requested. Signal forced green for 120s.',
    status: 'ACKNOWLEDGED' as const,
  },
  {
    id: 'ALT-104',
    timestamp: '10:15:30',
    junctionId: 'JUNCT_C',
    junctionName: 'Junction C: Tech & University Zone',
    type: 'SIGNAL_OVERRIDE' as const,
    severity: 'INFO' as const,
    message: 'Signal plan shifted from Fixed 45s to Adaptive Proportional timing (35s North / 33s South).',
    status: 'RESOLVED' as const,
  },
];

// Preset CSV Datasets for Quick Upload & Ingestion
export const SAMPLE_CSV_DATASETS: Record<string, string> = {
  peak_rush: `timestamp,junction_id,lane_id,vehicle_count,lane_capacity,average_speed_kmh,signal_phase
10:30:00,JUNCT_A,North-L1,42,50,16.5,RED
10:30:00,JUNCT_A,South-L2,39,50,18.0,RED
10:30:00,JUNCT_B,East-L1,48,50,11.2,RED
10:30:00,JUNCT_B,West-L2,46,50,12.0,RED
10:30:00,JUNCT_C,North-L1,35,50,22.0,GREEN
10:30:00,JUNCT_C,South-L2,38,50,20.5,GREEN
10:30:00,JUNCT_D,East-L1,50,50,8.5,YELLOW
10:30:00,JUNCT_D,West-L2,47,50,9.0,YELLOW`,

  free_flow: `timestamp,junction_id,lane_id,vehicle_count,lane_capacity,average_speed_kmh,signal_phase
10:30:00,JUNCT_A,North-L1,12,50,54.0,GREEN
10:30:00,JUNCT_A,South-L2,10,50,56.5,GREEN
10:30:00,JUNCT_B,East-L1,14,50,49.0,GREEN
10:30:00,JUNCT_B,West-L2,11,50,52.0,GREEN
10:30:00,JUNCT_C,North-L1,15,50,48.0,GREEN
10:30:00,JUNCT_C,South-L2,12,50,50.0,GREEN
10:30:00,JUNCT_D,East-L1,16,50,47.0,GREEN
10:30:00,JUNCT_D,West-L2,14,50,46.5,GREEN`,

  evening_commute: `timestamp,junction_id,lane_id,vehicle_count,lane_capacity,average_speed_kmh,signal_phase
18:15:00,JUNCT_A,North-L1,28,50,32.0,GREEN
18:15:00,JUNCT_A,South-L2,34,50,26.5,GREEN
18:15:00,JUNCT_B,East-L1,45,50,14.0,RED
18:15:00,JUNCT_B,West-L2,44,50,15.5,RED
18:15:00,JUNCT_C,North-L1,30,50,29.0,YELLOW
18:15:00,JUNCT_C,South-L2,32,50,28.0,YELLOW
18:15:00,JUNCT_D,East-L1,49,50,10.0,RED
18:15:00,JUNCT_D,West-L2,48,50,10.5,RED`,
};

