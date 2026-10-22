import React from 'react';
import {
  RotateCcw,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  Phone,
  Linkedin,
  Globe,
  Tag,
} from 'lucide-react';
import Modal from '../common/Modal';
import { compareProfiles } from '../../utils/duplicateDetector';
import { getCountryFlag, STAGES } from '../../utils/constants';

export default function DuplicateComparisonModal({
  isOpen,
  onClose,
  pendingMember,
  existingMember,
  matchReason,
  confidence,
  onApproveAndMerge,
  onApproveAsNew,
  onReject,
  isProcessing = false,
}) {
  if (!pendingMember || !existingMember) return null;

  const comparisonRows = compareProfiles(existingMember, pendingMember);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔍 Duplicate Profile Review & Resolution"
      size="xl"
    >
      <div className="space-y-5 text-xs text-stone-900 dark:text-stone-100">
        {/* Match Diagnosis Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white font-bold">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  Potential Duplicate Detected
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-mono font-black text-[10.5px]">
                  {confidence}% Confidence
                </span>
              </div>
              <p className="text-[11.5px] text-stone-600 dark:text-stone-300 mt-0.5">
                <strong>Reason:</strong> {matchReason}
              </p>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-x-auto shadow-xs">
          <div className="min-w-[540px]">
            <div className="grid grid-cols-12 bg-stone-100 dark:bg-stone-850 p-3 text-[11px] font-mono font-black uppercase tracking-wider text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <div className="col-span-3">Profile Field</div>
              <div className="col-span-4 text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                <span>🏛️ Existing Directory Profile</span>
              </div>
              <div className="col-span-1 text-center">⇄</div>
              <div className="col-span-4 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span>✨ New Form Submission</span>
              </div>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-[380px] overflow-y-auto">
              {comparisonRows.map((row) => (
                <div
                  key={row.field}
                  className={`grid grid-cols-12 p-3 items-center text-xs transition-colors ${
                    row.isChanged
                      ? 'bg-blue-50/70 dark:bg-blue-950/20'
                      : row.isNew
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'bg-white dark:bg-stone-900'
                  }`}
                >
                  {/* Field Label */}
                  <div className="col-span-3 font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <span>{row.label}</span>
                    {row.isChanged && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono font-black">
                        UPDATED
                      </span>
                    )}
                    {row.isNew && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-black">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Old Value */}
                  <div className="col-span-4 text-stone-600 dark:text-stone-300 font-medium break-words pr-2">
                    {row.oldVal}
                  </div>

                  {/* Arrow */}
                  <div className="col-span-1 text-center text-stone-400 font-bold">
                    {row.isChanged ? <ArrowRight size={13} className="mx-auto text-blue-500" /> : '—'}
                  </div>

                  {/* New Value */}
                  <div
                    className={`col-span-4 font-bold break-words pl-2 ${
                      row.isChanged
                        ? 'text-blue-900 dark:text-blue-300'
                        : row.isNew
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {row.newVal}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Decision Hub */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-stone-500">
            Select Resolution Action:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Merge & Update */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                navigator.vibrate?.([15]);
                onApproveAndMerge(pendingMember, existingMember);
              }}
              className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex flex-col items-center text-center gap-1 transition-all shadow-tactile-sm active:translate-x-[1px] active:translate-y-[1px] cursor-pointer min-h-[48px] justify-center"
            >
              <div className="flex items-center gap-1.5">
                <RotateCcw size={14} />
                <span>Merge & Update Old</span>
              </div>
              <span className="text-[10px] text-blue-100 font-normal">
                Replaces outdated details in directory
              </span>
            </button>

            {/* 2. False Alarm / Create New Entry */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                navigator.vibrate?.([15]);
                onApproveAsNew(pendingMember);
              }}
              className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-center text-center gap-1 transition-all shadow-tactile-sm active:translate-x-[1px] active:translate-y-[1px] cursor-pointer min-h-[48px] justify-center"
            >
              <div className="flex items-center gap-1.5">
                <UserCheck size={14} />
                <span>False Alarm: Add as New</span>
              </div>
              <span className="text-[10px] text-emerald-100 font-normal">
                Creates a separate distinct member
              </span>
            </button>

            {/* 3. Reject */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                navigator.vibrate?.([15]);
                onReject(pendingMember);
              }}
              className="p-3 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-rose-600 hover:text-white text-stone-700 dark:text-stone-300 font-bold text-xs flex flex-col items-center text-center gap-1 transition-all cursor-pointer min-h-[48px] justify-center"
            >
              <div className="flex items-center gap-1.5">
                <UserX size={14} />
                <span>Reject Submission</span>
              </div>
              <span className="text-[10px] opacity-80 font-normal">Discards pending form</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
