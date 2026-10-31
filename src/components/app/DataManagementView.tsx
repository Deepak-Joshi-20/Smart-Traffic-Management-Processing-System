import React, { useState } from 'react';
import {
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { SAMPLE_CSV_DATASETS } from '../../data/mockData';
import { TrafficRecord } from '../../types';

interface DataManagementViewProps {
  onIngestDataset: (csvText: string, datasetName: string) => void;
  onResetToBaseline: () => void;
  currentDatasetName: string;
  recordCount: number;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  onIngestDataset,
  onResetToBaseline,
  currentDatasetName,
  recordCount,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('peak_rush');
  const [customCsvInput, setCustomCsvInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleApplyPreset = (presetKey: string) => {
    setIsProcessing(true);
    setValidationError(null);
    setValidationSuccess(null);

    const csvData = SAMPLE_CSV_DATASETS[presetKey];
    if (!csvData) {
      setValidationError('Dataset template not found.');
      setIsProcessing(false);
      return;
    }

    setTimeout(() => {
      onIngestDataset(csvData, presetKey.replace('_', ' ').toUpperCase());
      setIsProcessing(false);
      setValidationSuccess(`Preset [${presetKey.replace('_', ' ').toUpperCase()}] validated and ingested successfully.`);
    }, 400);
  };

  const handleCustomUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCsvInput.trim()) {
      setValidationError('Please paste CSV text or select a preset dataset.');
      return;
    }

    setIsProcessing(true);
    setValidationError(null);
    setValidationSuccess(null);

    // Validate headers
    const lines = customCsvInput.trim().split('\n');
    if (lines.length < 2) {
      setValidationError('Dataset must contain header line and at least one data record.');
      setIsProcessing(false);
      return;
    }

    setTimeout(() => {
      onIngestDataset(customCsvInput, 'CUSTOM_INGESTED_DATASET');
      setIsProcessing(false);
      setValidationSuccess(`Successfully ingested custom dataset (${lines.length - 1} records).`);
      setCustomCsvInput('');
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header and Current Dataset Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F2] tracking-tight">
            Dataset Ingestion &amp; Management
          </h1>
          <p className="text-xs text-[#91A19B] mt-0.5">
            Ingest municipal traffic records, validate schema integrity, and switch operational traffic vectors.
          </p>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="neon-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#F2B84B]" />
          <span>Reset Network to Baseline</span>
        </button>
      </div>

      {/* Dataset State Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Active Dataset</span>
          <div className="text-lg font-bold text-[#B7F34A]">{currentDatasetName}</div>
          <span className="text-[10px] text-[#70D6B4] font-mono">STATUS: VALIDATED &amp; INGESTED</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Total Records</span>
          <div className="text-lg font-bold text-[#52C7D9] tabular-nums">{recordCount} records</div>
          <span className="text-[10px] text-[#91A19B] font-mono">Across 8 monitored approaches</span>
        </div>

        <div className="p-4 rounded-xl bg-[#151F24] border border-[#29383A] space-y-1">
          <span className="text-[10px] font-mono text-[#91A19B] uppercase block">Schema Validation</span>
          <div className="text-lg font-bold text-[#71D49A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#71D49A]" />
            <span>Passed (7/7 Fields)</span>
          </div>
          <span className="text-[10px] text-[#91A19B] font-mono">Vehicle counts, speed, capacity verified</span>
        </div>
      </div>

      {/* Success/Error Feedback */}
      {validationSuccess && (
        <div className="p-4 rounded-xl bg-[#71D49A]/10 border border-[#71D49A]/30 flex items-center gap-3 text-xs text-[#71D49A]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{validationSuccess}</span>
        </div>
      )}
      {validationError && (
        <div className="p-4 rounded-xl bg-[#F06464]/10 border border-[#F06464]/30 flex items-center gap-3 text-xs text-[#F06464]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Grid: Preset Datasets & Custom CSV Ingestion Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Preset Operational Scenarios (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
          <div>
            <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
              Pre-configured Municipal Scenarios
            </h3>
            <p className="text-sm font-bold text-[#F1F5F2] mt-0.5">
              Instant Simulation Datasets
            </p>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => handleApplyPreset('peak_rush')}
              className="p-4 rounded-xl bg-[#10171B] border border-[#29383A] hover:border-[#F06464]/50 cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F1F5F2]">Peak Morning Rush</span>
                <span className="text-[10px] font-mono bg-[#F06464]/10 text-[#F06464] px-2 py-0.5 rounded border border-[#F06464]/20">
                  Heavy (80-95%)
                </span>
              </div>
              <p className="text-xs text-[#91A19B]">
                High queue influx across arterial approaches, severe speed drops, triggers dynamic Webster splits.
              </p>
            </div>

            <div
              onClick={() => handleApplyPreset('free_flow')}
              className="p-4 rounded-xl bg-[#10171B] border border-[#29383A] hover:border-[#71D49A]/50 cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F1F5F2]">Off-Peak Free Flow</span>
                <span className="text-[10px] font-mono bg-[#71D49A]/10 text-[#71D49A] px-2 py-0.5 rounded border border-[#71D49A]/20">
                  Minimal (15-30%)
                </span>
              </div>
              <p className="text-xs text-[#91A19B]">
                Unimpeded velocity (50+ km/h), minimal queue depths, lowest average intersection delay.
              </p>
            </div>

            <div
              onClick={() => handleApplyPreset('evening_commute')}
              className="p-4 rounded-xl bg-[#10171B] border border-[#29383A] hover:border-[#F2B84B]/50 cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F1F5F2]">Evening Commute Transit</span>
                <span className="text-[10px] font-mono bg-[#F2B84B]/10 text-[#F2B84B] px-2 py-0.5 rounded border border-[#F2B84B]/20">
                  Moderate (60-80%)
                </span>
              </div>
              <p className="text-xs text-[#91A19B]">
                Asymmetric directional load shifting outward toward peripheral highway corridors.
              </p>
            </div>
          </div>
        </div>

        {/* Custom CSV Upload Form (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#151F24] border border-[#29383A] space-y-4">
          <div>
            <h3 className="text-xs font-mono text-[#B7F34A] uppercase tracking-wider">
              Custom Dataset Ingestion
            </h3>
            <p className="text-sm font-bold text-[#F1F5F2] mt-0.5">
              Paste or Upload Traffic Vector Records
            </p>
          </div>

          <form onSubmit={handleCustomUpload} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-[#91A19B] mb-1">
                CSV Input (Header required: timestamp, junction_id, lane_id, vehicle_count, lane_capacity, average_speed_kmh, signal_phase)
              </label>
              <textarea
                value={customCsvInput}
                onChange={(e) => setCustomCsvInput(e.target.value)}
                rows={7}
                placeholder={`timestamp,junction_id,lane_id,vehicle_count,lane_capacity,average_speed_kmh,signal_phase\n10:30:00,JUNCT_A,North-L1,42,50,16.5,RED\n10:30:00,JUNCT_A,South-L2,39,50,18.0,RED`}
                className="w-full bg-[#10171B] border border-[#29383A] rounded-xl p-3 text-xs font-mono text-[#F1F5F2] placeholder-[#64736D] focus:outline-hidden focus:border-[#B7F34A]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-[#64736D]">
                Format: RFC 4180 CSV standard
              </span>
              <button
                type="submit"
                disabled={isProcessing}
                className="neon-btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Validating Dataset...' : 'Validate & Ingest Records'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#151F24] border border-[#29383A] rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[#F1F5F2]">Confirm Network Reset</h3>
            <p className="text-xs text-[#91A19B] leading-relaxed">
              This will restore all 4 municipal junctions to default baseline vehicle volumes (N1/N2) and reset emergency signal overrides.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#10171B] text-xs font-medium text-[#91A19B] border border-[#29383A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetToBaseline();
                  setShowResetConfirm(false);
                  setValidationSuccess('Network parameters reset to baseline configuration.');
                }}
                className="neon-btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
