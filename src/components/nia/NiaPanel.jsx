import React, { useState, useEffect } from 'react';
import {
  Settings,
  Download,
  Upload,
  Shield,
  AlertTriangle,
  Key,
  Trash2,
  Check,
  Lock,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Database,
  Map,
  FileSpreadsheet,
  Copy,
  Code2,
  CheckCircle2,
  Loader2,
  ListFilter,
  RotateCcw,
  Bell,
  UserCheck,
  UserX,
  Clock,
  LayoutDashboard,
  Users,
  TrendingUp,
  Share2,
  Search,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  exportAllData,
  importAllData,
  clearAllData,
  getNiaPIN,
  saveNiaPIN,
  getSheetsConfig,
  saveSheetsConfig,
  getTombstones,
  removeTombstone,
  clearTombstones,
  getNiaEmail,
  saveNiaEmail,
  updateMember,
  deleteMember,
  getMembers,
  saveMembers,
} from '../../utils/storage';
import {
  syncFromGoogleSheets,
  testSheetsConnection,
  getGoogleAppsScriptCode,
  pushAdminConfigToSheets,
  approveMember,
  rejectMember,
} from '../../utils/sheetsSync';
import { MAP_TILE_PRESETS, getCountryFlag, STAGES } from '../../utils/constants';
import { downloadJSON, hashPIN, copyToClipboard, parseMemberName, getAvatarGradient, getInitials, timeAgo } from '../../utils/helpers';
import { revokeNiaSession } from '../../utils/session';
import { detectDuplicateMatch } from '../../utils/duplicateDetector';
import Modal from '../common/Modal';
import AIMatchmaker from '../matchmaker/AIMatchmaker';
import NiaAddMember from './NiaAddMember';
import DuplicateComparisonModal from './DuplicateComparisonModal';
import CommunityWelcomeDispatcherModal from '../admin/CommunityWelcomeDispatcherModal';
import ManagerDashboard from '../manager/ManagerDashboard';

export default function NiaPanel({ onLock, activeTab: externalTab, setActiveTab: setExternalTab }) {
  const { apiKey, updateApiKey, members, refreshMembers, notify, isSheetsSyncing } = useApp();
  const [internalTab, setInternalTab] = useState('overview'); // 'overview' | 'members' | 'ai' | 'system'
  const activeTab = externalTab !== undefined ? externalTab : internalTab;
  const setActiveTab = setExternalTab || setInternalTab;
  const [keyInput, setKeyInput] = useState(apiKey);
  const [importMode, setImportMode] = useState('merge');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [showChangePIN, setShowChangePIN] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // ── Google Sheets Sync States ──────────────────────────────────────────────
  const [sheetsConfig, setSheetsConfigState] = useState(getSheetsConfig());
  const [apiUrlInput, setApiUrlInput] = useState(sheetsConfig?.apiUrl || '');
  const [isTestingSheets, setIsTestingSheets] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsTestFeedback, setSheetsTestFeedback] = useState(null);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);
  const [showTombstonesModal, setShowTombstonesModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [tombstonesList, setTombstonesList] = useState(getTombstones());

  // ── NIA Email / Notification States ────────────────────────────────────────
  const [niaEmailInput, setNiaEmailInput] = useState(getNiaEmail());
  const [isPushingEmail, setIsPushingEmail] = useState(false);
  const [emailPushFeedback, setEmailPushFeedback] = useState(null);
  const [showAdminAIMatchmaker, setShowAdminAIMatchmaker] = useState(false);

  // ── Pending Approvals ────────────────────────────────────────────────────
  const pendingMembers = members.filter((m) => m.status === 'pending');
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [duplicateReview, setDuplicateReview] = useState(null); // { pendingMember, existingMember, matchReason, confidence }
  const [dispatchModalMember, setDispatchModalMember] = useState(null);
  const [rosterSearch, setRosterSearch] = useState('');

  // Keep sheetsConfig in sync when background auto-sync completes or storage updates
  useEffect(() => {
    const handleSheetsConfigUpdated = (e) => {
      if (e.detail) {
        setSheetsConfigState(e.detail);
      } else {
        setSheetsConfigState(getSheetsConfig());
      }
    };
    window.addEventListener('sed_sheets_config_updated', handleSheetsConfigUpdated);
    window.addEventListener('sed_storage_updated', handleSheetsConfigUpdated);
    return () => {
      window.removeEventListener('sed_sheets_config_updated', handleSheetsConfigUpdated);
      window.removeEventListener('sed_storage_updated', handleSheetsConfigUpdated);
    };
  }, []);

  const handleLock = () => {
    revokeNiaSession();
    onLock?.();
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    updateApiKey(keyInput.trim());
    notify('Gemini API key saved to disk!');
  };

  const handleSaveSheetsConfig = (e) => {
    e?.preventDefault();
    const updated = saveSheetsConfig({
      ...sheetsConfig,
      apiUrl: apiUrlInput.trim(),
    });
    setSheetsConfigState(updated);
    notify('Google Sheets Webhook URL saved!');
  };

  const handleTestSheets = async () => {
    if (!apiUrlInput.trim()) {
      notify('Please enter a Google Apps Script Web App URL', 'warning');
      return;
    }
    setIsTestingSheets(true);
    setSheetsTestFeedback(null);
    try {
      const res = await testSheetsConnection(apiUrlInput.trim());
      setSheetsTestFeedback({
        success: true,
        message: `Connected! Found ${res.totalRows} submission row(s).`,
      });
      notify(`Connection successful! ${res.totalRows} row(s) detected.`);
      handleSaveSheetsConfig();
    } catch (err) {
      setSheetsTestFeedback({ success: false, message: err.message });
      notify('Connection failed — verify your Apps Script deployment', 'error');
    } finally {
      setIsTestingSheets(false);
    }
  };

  const handleSyncSheetsNow = async () => {
    if (!apiUrlInput.trim()) {
      notify('Configure Google Sheets Web App URL first', 'warning');
      return;
    }
    setIsSyncingSheets(true);
    try {
      handleSaveSheetsConfig();
      const result = await syncFromGoogleSheets();
      if (result.success) {
        refreshMembers();
        setSheetsConfigState(getSheetsConfig());
        notify(
          `Synced with Google Sheets: +${result.addedCount} new, ${result.updatedCount} updated, ${result.ignoredTombstoneCount} deleted ignored!`
        );
      } else {
        notify(`Sync failed: ${result.error}`, 'error');
      }
    } catch (err) {
      notify(`Sync error: ${err.message}`, 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleCopyAppsScript = () => {
    const code = getGoogleAppsScriptCode();
    copyToClipboard(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    notify('Google Apps Script code copied to clipboard!');
  };

  const handleRemoveTombstone = (key) => {
    removeTombstone(key);
    const clean = String(key).trim().toLowerCase();
    const currentMembers = getMembers().filter(
      (m) =>
        !(
          m.status === 'rejected' &&
          (m.name?.trim().toLowerCase() === clean ||
            m.id?.toLowerCase() === clean ||
            `sheet-row-${m.sheetRowIndex}` === clean)
        )
    );
    saveMembers(currentMembers);
    refreshMembers();
    const updated = getTombstones();
    setTombstonesList(updated);
    notify(`Restored "${key}" to allowed sync list`);
  };

  const handleClearAllTombstones = () => {
    clearTombstones();
    const currentMembers = getMembers().filter((m) => m.status !== 'rejected');
    saveMembers(currentMembers);
    refreshMembers();
    setTombstonesList([]);
    notify('All deletion tombstones cleared & rejected stubs reset');
  };

  const handleSaveNiaEmail = async (e) => {
    e?.preventDefault();
    if (!niaEmailInput.trim()) {
      notify('Please enter a valid email address', 'warning');
      return;
    }
    saveNiaEmail(niaEmailInput.trim());
    setIsPushingEmail(true);
    setEmailPushFeedback(null);
    try {
      const result = await pushAdminConfigToSheets({ adminEmail: niaEmailInput.trim() });
      if (result?.success) {
        setEmailPushFeedback({ success: true, message: 'Email saved & pushed to Apps Script ✓' });
        notify("NIA email saved! You'll receive notifications on new form submissions.");
      } else {
        setEmailPushFeedback({
          success: false,
          message: result?.error || 'Push failed — check your Apps Script URL',
        });
        notify('Email saved locally but failed to push to Apps Script', 'warning');
      }
    } catch {
      setEmailPushFeedback({ success: false, message: 'Network error — email saved locally only' });
    } finally {
      setIsPushingEmail(false);
    }
  };

  const handleApproveMember = async (member) => {
    setApprovingId(member.id);
    try {
      const approvedMember = { ...member, status: 'active', appStatus: 'APPROVED', isProfileUpdate: false };
      updateMember(member.id, { status: 'active', appStatus: 'APPROVED', isProfileUpdate: false });
      await approveMember(member);
      refreshMembers();
      setDispatchModalMember(approvedMember);
      notify(`✅ ${member.name} approved and is now visible in the public directory!`);
    } catch (err) {
      notify(`Failed to approve: ${err.message}`, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleApproveAndReplace = async (pendingMember, existingMember) => {
    setApprovingId(pendingMember.id);
    try {
      const updatedFields = {
        name: pendingMember.name || existingMember.name,
        role: pendingMember.role || existingMember.role,
        business: pendingMember.business || existingMember.business,
        stage: pendingMember.stage || existingMember.stage,
        lookingFor: pendingMember.lookingFor || existingMember.lookingFor,
        canHelp: pendingMember.canHelp || existingMember.canHelp,
        location: pendingMember.location || existingMember.location,
        phone: pendingMember.phone || existingMember.phone,
        email: pendingMember.email || existingMember.email,
        linkedin: pendingMember.linkedin || existingMember.linkedin,
        website: pendingMember.website || existingMember.website,
        instagram: pendingMember.instagram || existingMember.instagram,
        tags: pendingMember.tags?.length ? pendingMember.tags : existingMember.tags,
        status: 'active',
        appStatus: 'APPROVED_UPDATE',
        isProfileUpdate: true,
        formTimestamp: pendingMember.formTimestamp || pendingMember.createdAt,
        updatedAt: new Date().toISOString(),
      };

      updateMember(existingMember.id, updatedFields);
      deleteMember(pendingMember.id, { skipNameTombstone: true });

      const finalMember = { ...existingMember, ...updatedFields };
      await approveMember(finalMember);
      refreshMembers();
      setDispatchModalMember(finalMember);
      notify(`✅ Updated and replaced ${existingMember.name}'s profile in the directory!`);
    } catch (err) {
      notify(`Failed to update profile: ${err.message}`, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectMember = async (member) => {
    setRejectingId(member.id);
    try {
      updateMember(member.id, { status: 'rejected', appStatus: 'REJECTED' });
      await rejectMember(member, 'Rejected in NIA Portal');
      refreshMembers();
      notify(`❌ ${member.name} rejected and removed from directory.`, 'warning');
    } catch (err) {
      notify(`Failed to reject: ${err.message}`, 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const handleExport = () => setShowExportWarning(true);

  const doExport = () => {
    const data = exportAllData();
    downloadJSON(data, `smart_directory_backup_${new Date().toISOString().slice(0, 10)}.json`);
    localStorage.setItem('sed_last_export', new Date().toISOString());
    setShowExportWarning(false);
    notify('Exported JSON backup! Store it securely.');
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        if (!json.members && !Array.isArray(json)) throw new Error('Invalid JSON structure');
        importAllData(json, importMode);
        refreshMembers();
        notify(`Data imported successfully (${importMode} mode)! 🎉`);
      } catch (err) {
        console.error(err);
        notify('Failed to parse JSON file — check file format', 'error');
      }
    };
    reader.readAsText(file);
  };


  const handleClearAll = () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
    clearAllData();
    refreshMembers();
    notify('All directory data permanently erased from disk and browser', 'warning');
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const handleChangePIN = async (e) => {
    e.preventDefault();
    if (newPinInput.length < 4) {
      setPinError('Password must be at least 4 characters.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinError('Passwords do not match.');
      return;
    }
    try {
      const hash = await hashPIN(newPinInput);
      saveNiaPIN(hash);
      // Synchronize hash with Google Sheets cloud properties
      pushAdminConfigToSheets({ adminPinHash: hash });
      setShowChangePIN(false);
      setNewPinInput('');
      setConfirmPinInput('');
      setPinError('');
      notify('Security password permanently updated & synchronized!');
    } catch (err) {
      setPinError('Failed to change password: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* ── Top Header Banner (Widescreen Executive Console) ──────────────── */}
      <div className="card p-4 sm:p-6 bg-stone-950 text-white border-[1.5px] border-stone-800 shadow-tactile dark:shadow-tactile-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-600/20 via-emerald-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 sm:p-3 bg-emerald-600 rounded-2xl shrink-0 border-[1.5px] border-emerald-400 shadow-tactile-sm">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black tracking-tight font-display text-white">
                NIA & Data Governance
              </h2>
              <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Persistent Disk DB
              </span>
              {isSheetsSyncing || isSyncingSheets ? (
                <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse">
                  <RefreshCw size={10} className="animate-spin text-blue-400" />
                  <span>Syncing with Sheets...</span>
                </span>
              ) : sheetsConfig?.lastSyncAt ? (
                <span
                  className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  title={`Last synced: ${new Date(sheetsConfig.lastSyncAt).toLocaleString()}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Synced {timeAgo(sheetsConfig.lastSyncAt)}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 border border-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                  <span>Not synced yet</span>
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-stone-300 font-medium mt-0.5">
              Enterprise console: Google Sheets 2-way sync, member intake queue, AI matchmaking & system security.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto">
          <a
            href="/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-2 px-3 sm:px-3.5 font-bold shadow-tactile-sm flex-1 sm:flex-none justify-center"
          >
            <ExternalLink size={13} /> Public Directory
          </a>
          <button
            onClick={handleLock}
            className="btn-accent text-xs py-2 px-3 sm:px-3.5 font-bold shadow-tactile-sm cursor-pointer flex-1 sm:flex-none justify-center"
          >
            <Lock size={13} /> Lock Session
          </button>
        </div>
      </div>

      {/* ── Live Telemetry Metric Bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className="card p-4 text-left hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold tracking-wide uppercase">Network Total</span>
            <Users size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-display">
              {members.length}
            </div>
            {isSheetsSyncing || isSyncingSheets ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 animate-pulse">
                <RefreshCw size={10} className="animate-spin text-blue-600" />
                <span>Syncing live...</span>
              </span>
            ) : sheetsConfig?.lastSyncAt ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800"
                title={`Last synced: ${new Date(sheetsConfig.lastSyncAt).toLocaleString()}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synced {timeAgo(sheetsConfig.lastSyncAt)}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                <span>Not synced</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 truncate">
            {members.filter((m) => m.status === 'active' || !m.status).length} Active Directory
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="card p-4 text-left hover:border-blue-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold tracking-wide uppercase">Sheets 2-Way Sync</span>
            <FileSpreadsheet size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-display">
              {isSheetsSyncing || isSyncingSheets ? 'Syncing...' : sheetsConfig?.apiUrl ? 'Connected' : 'Offline'}
            </div>
            {(isSheetsSyncing || isSyncingSheets) && (
              <RefreshCw size={14} className="animate-spin text-blue-500" />
            )}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 truncate" title={sheetsConfig?.lastSyncAt ? `Last synced: ${new Date(sheetsConfig.lastSyncAt).toLocaleString()}` : ''}>
            {isSheetsSyncing || isSyncingSheets
              ? 'Fetching latest submissions...'
              : sheetsConfig?.lastSyncAt
                ? `Synced ${timeAgo(sheetsConfig.lastSyncAt)} (${new Date(sheetsConfig.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                : 'Web App URL Pending'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className="card p-4 text-left hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold tracking-wide uppercase">Intake Queue</span>
            <Clock
              size={16}
              className={pendingMembers.length > 0 ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-display">
              {pendingMembers.length}
            </div>
            {(isSheetsSyncing || isSyncingSheets) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900 animate-pulse">
                <RefreshCw size={10} className="animate-spin" />
              </span>
            )}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 truncate">
            {isSheetsSyncing || isSyncingSheets
              ? 'Checking for new requests...'
              : pendingMembers.length > 0
                ? 'Requires Moderation'
                : 'Queue Clear'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setTombstonesList(getTombstones());
            setShowTombstonesModal(true);
          }}
          className="card p-4 text-left hover:border-purple-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold tracking-wide uppercase">Tombstones</span>
            <ListFilter size={16} className="text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-display">
            {tombstonesList.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 truncate">
            Resurrection Guard
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className="card p-4 text-left hover:border-orange-500/50 transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold tracking-wide uppercase">AI Intelligence</span>
            <Sparkles size={16} className={apiKey ? 'text-orange-500 group-hover:scale-110 transition-transform' : 'text-stone-400'} />
          </div>
          <div className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-display">
            {apiKey ? 'Active' : 'Unset'}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 truncate">
            Gemini Matchmaker
          </div>
        </button>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 overflow-x-auto no-scrollbar scroll-smooth snap-x">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-tactile-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800'
          }`}
        >
          <FileSpreadsheet size={15} />
          <span>Overview & Sync</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'insights'
              ? 'bg-emerald-600 text-white shadow-tactile-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800'
          }`}
        >
          <TrendingUp size={15} />
          <span>Business Insights & Pulse</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-emerald-600 text-white shadow-tactile-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800'
          }`}
        >
          <Users size={15} />
          <span>Members & Intake</span>
          {pendingMembers.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'members'
                  ? 'bg-white text-emerald-700'
                  : 'bg-amber-500 text-white animate-pulse'
              }`}
            >
              {pendingMembers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ai'
              ? 'bg-emerald-600 text-white shadow-tactile-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800'
          }`}
        >
          <Sparkles size={15} />
          <span>AI Intelligence</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'system'
              ? 'bg-emerald-600 text-white shadow-tactile-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800'
          }`}
        >
          <Shield size={15} />
          <span>Security & System</span>
        </button>
      </div>

      {/* ── TAB: Business Insights & Community Pulse ──────────────────────── */}
      {activeTab === 'insights' && (
        <div className="animate-fade-in">
          <ManagerDashboard />
        </div>
      )}

      {/* ── TAB 1: Overview & 2-Way Sync ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Main Column: Google Sheets & Google Forms 2-Way Live Sync */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card p-5 sm:p-6 space-y-4 border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-b from-emerald-50/20 to-transparent dark:from-emerald-950/10">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="section-title text-base">
                    <FileSpreadsheet size={18} className="text-emerald-600 dark:text-emerald-400" />
                    Google Forms & Sheets 2-Way Live Sync
                  </h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Audit Trail Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAppsScriptModal(true)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 size={13} /> Get Apps Script Code
                  </button>
                  <span className="text-stone-300 dark:text-stone-700">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTombstonesList(getTombstones());
                      setShowTombstonesModal(true);
                    }}
                    className="text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ListFilter size={13} /> Deleted Records ({getTombstones().length})
                  </button>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                Live 2-way bridge between your Google Form submissions sheet and the directory. In-app
                edits and deletions automatically record status (<code>EDITED_IN_APP</code> /{' '}
                <code>DELETED</code>), timestamps, and audit notes in the Google Sheet, while deleted
                profiles are permanently prevented from resurrecting.
              </p>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="label text-[10px]">Google Apps Script Web App URL</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      inputMode="url"
                      value={apiUrlInput}
                      onChange={(e) => setApiUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="input font-mono text-xs py-2.5 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleTestSheets}
                      disabled={isTestingSheets || !apiUrlInput.trim()}
                      className="btn-secondary text-xs py-2.5 px-3.5 font-bold cursor-pointer justify-center"
                    >
                      {isTestingSheets ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                      {isTestingSheets ? 'Testing...' : 'Test URL'}
                    </button>
                  </div>
                </div>

                {sheetsTestFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      sheetsTestFeedback.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {sheetsTestFeedback.success ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <AlertCircle size={14} />
                    )}
                    <span>{sheetsTestFeedback.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                  <div className="text-[11px] text-stone-500">
                    {sheetsConfig?.lastSyncAt ? (
                      <span>
                        Last synced:{' '}
                        <strong>{new Date(sheetsConfig.lastSyncAt).toLocaleString()}</strong>
                      </span>
                    ) : (
                      <span>Never synced with Google Sheets</span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleSaveSheetsConfig}
                      className="btn-secondary text-xs py-2 px-3 font-bold cursor-pointer justify-center"
                    >
                      Save URL
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncSheetsNow}
                      disabled={isSyncingSheets || !apiUrlInput.trim()}
                      className="btn-primary text-xs py-2 px-4 font-bold cursor-pointer justify-center"
                    >
                      {isSyncingSheets ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      {isSyncingSheets ? 'Syncing Submissions...' : 'Sync Form Submissions Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Column: Backup & JSON Migration + Demo Data */}
          <div className="lg:col-span-5 space-y-6">
            {/* Backup & JSON Migration */}
            <div className="card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <h3 className="section-title text-base">
                  <Database size={16} className="text-orange-500" />
                  Backup & JSON Migration
                </h3>
                <span className="text-xs font-mono font-bold text-stone-500">
                  {members.length} records
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                Full snapshot export and import for disaster recovery or database synchronization.
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleExport}
                  className="btn-secondary text-xs py-2.5 flex-1 font-bold cursor-pointer"
                >
                  <Download size={14} /> Export Backup
                </button>
                <label className="btn-secondary text-xs py-2.5 flex-1 font-bold justify-center cursor-pointer">
                  <Upload size={14} /> Import Backup
                  <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                </label>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1">
                <span>Import Mode:</span>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                  />{' '}
                  Merge
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />{' '}
                  Replace All
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Members & Intake ──────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div className="space-y-6 animate-fade-in">
          {/* Pending Approvals Review Queue */}
          <div className="card p-5 sm:p-6 space-y-4 border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/20 to-transparent dark:from-amber-950/10">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="section-title text-base">
                  <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                  Pending Submissions & Approvals Queue
                </h3>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  pendingMembers.length > 0
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {pendingMembers.length > 0 ? `${pendingMembers.length} Pending Approval` : 'All Clear'}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              New form submissions wait here before appearing in the public directory. Review and
              approve or reject each one.
            </p>

            {pendingMembers.length === 0 ? (
              <div className="p-6 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-center text-stone-400 text-xs">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                No pending submissions — all submissions have been reviewed!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {pendingMembers.map((member) => {
                  const duplicateInfo = detectDuplicateMatch(
                    member,
                    members.filter(
                      (m) => m.id !== member.id && m.status !== 'pending' && m.status !== 'rejected'
                    )
                  );
                  const existingMatch = duplicateInfo.matchedMember;

                  return (
                    <div
                      key={member.id}
                      className={`p-4 bg-white dark:bg-stone-900 rounded-xl space-y-3 border flex flex-col justify-between ${
                        existingMatch
                          ? 'border-blue-300 dark:border-blue-800/80 ring-1 ring-blue-400/20'
                          : 'border-amber-200 dark:border-amber-900/60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-stone-500 truncate">
                              {member.role} {member.location?.city ? `· ${member.location.city}` : ''}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              existingMatch
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {existingMatch ? `MATCH: ${duplicateInfo.confidence}%` : 'NEW'}
                          </span>
                        </div>

                        {existingMatch && (
                          <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-lg text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300 text-[11px]">
                                <RotateCcw size={12} />
                                <span>Existing: {existingMatch.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setDuplicateReview({
                                    pendingMember: member,
                                    existingMember: existingMatch,
                                    matchReason: duplicateInfo.matchReason,
                                    confidence: duplicateInfo.confidence,
                                  })
                                }
                                className="text-[10.5px] font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <span>Side-by-Side</span> →
                              </button>
                            </div>
                            <p className="text-[10.5px] text-blue-700 dark:text-blue-300/80 leading-relaxed font-medium line-clamp-2">
                              {duplicateInfo.matchReason}
                            </p>
                          </div>
                        )}

                        {member.business && (
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2">
                            {member.business}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex-wrap">
                        {existingMatch ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setDuplicateReview({
                                  pendingMember: member,
                                  existingMember: existingMatch,
                                  matchReason: duplicateInfo.matchReason,
                                  confidence: duplicateInfo.confidence,
                                })
                              }
                              disabled={approvingId === member.id || rejectingId === member.id}
                              className="btn-primary text-[11px] py-1.5 px-3 flex-1 font-bold justify-center bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            >
                              <RotateCcw size={12} />
                              Resolve Diff
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveMember(member)}
                              disabled={approvingId === member.id || rejectingId === member.id}
                              className="btn-secondary text-[11px] py-1.5 px-2.5 font-bold justify-center cursor-pointer"
                              title="Approve as separate new entry"
                            >
                              New
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApproveMember(member)}
                            disabled={approvingId === member.id || rejectingId === member.id}
                            className="btn-primary text-[11px] py-1.5 px-3 flex-1 font-bold justify-center cursor-pointer"
                          >
                            {approvingId === member.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <UserCheck size={12} />
                            )}
                            Approve
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRejectMember(member)}
                          disabled={approvingId === member.id || rejectingId === member.id}
                          className="btn-danger text-[11px] py-1.5 px-3 font-bold justify-center cursor-pointer"
                        >
                          {rejectingId === member.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <UserX size={12} />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 0: Manual Member Intake & WhatsApp AI Parser */}
          <div className="w-full">
            <NiaAddMember />
          </div>

          {/* Section 1: Active Member Roster & Welcome Dispatcher */}
          <div className="card p-5 sm:p-6 space-y-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="section-title text-base">
                  Active Directory Roster & Announcement Dispatcher
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {members.filter((m) => m.status !== 'pending' && m.status !== 'rejected').length} Members
                </span>
              </div>

              {/* Quick Search Input */}
              <div className="relative w-full sm:w-auto sm:min-w-[260px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  inputMode="search"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Search founder or business..."
                  className="input text-xs pl-8 py-2 sm:py-1.5 w-full bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                />
              </div>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              Select any member from the directory to re-generate, polish, or dispatch their personalized
              WhatsApp welcome announcement to the community group.
            </p>

            <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-[420px] overflow-y-auto pr-1">
              {members
                .filter(
                  (m) =>
                    m.status !== 'pending' &&
                    m.status !== 'rejected' &&
                    (!rosterSearch.trim() ||
                      m.name?.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                      m.business?.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                      m.role?.toLowerCase().includes(rosterSearch.toLowerCase()))
                )
                .slice(0, 50)
                .map((m) => {
                  const { english, arabic, primary } = parseMemberName(m.name);
                  const stageObj = STAGES[m.stage] || STAGES.starting;
                  const flag = getCountryFlag(m.location?.country);
                  return (
                    <div
                      key={m.id}
                      className="py-3 px-2 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-stone-50/80 dark:hover:bg-stone-800/40"
                    >
                      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarGradient(
                            m.name
                          )} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {getInitials(m.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate">
                              {english || primary}
                            </span>
                            {arabic && (
                              <span className="text-[11px] text-stone-500 font-semibold" dir="rtl">
                                ({arabic})
                              </span>
                            )}
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${stageObj.bg} ${stageObj.text} ${stageObj.border}`}>
                              {stageObj.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            {m.role || 'Founder'} · <span className="font-medium text-stone-700 dark:text-stone-300">{m.business || 'Venture'}</span> · {flag} {m.location?.city || 'Egypt'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                        <button
                          type="button"
                          onClick={() => setDispatchModalMember(m)}
                          className="btn-primary text-[11px] py-2 sm:py-1.5 px-3 font-bold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs w-full sm:w-auto"
                          title="Generate WhatsApp Announcement"
                        >
                          <Share2 size={12} />
                          <span>📣 Dispatch Announcement</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: AI Intelligence ───────────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 4 Cols: Gemini AI API Key */}
            <div className="lg:col-span-4 space-y-6">
              <div className="card p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <h3 className="section-title text-base">
                    <Key size={16} className="text-orange-500" />
                    Gemini AI Integration
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      apiKey
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {apiKey ? 'Configured' : 'Missing'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                  Powers the semantic matchmaker and outreach icebreaker generator. Obtain free API keys from{' '}
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 font-bold underline"
                  >
                    Google AI Studio
                  </a>
                  .
                </p>
                <form onSubmit={handleSaveKey} className="space-y-3 pt-1">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Paste Gemini API Key (AIzaSy...)"
                    className="input font-mono text-xs py-2.5"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs flex-1 py-2 font-bold cursor-pointer">
                      <Check size={14} /> Save Gemini Key
                    </button>
                    {apiKey && (
                      <button
                        type="button"
                        onClick={() => {
                          updateApiKey('');
                          setKeyInput('');
                          notify('API key removed');
                        }}
                        className="btn-secondary text-xs py-2 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Right 8 Cols: AI Semantic Matchmaker & Contextual WhatsApp Outreach */}
            <div className="lg:col-span-8 space-y-6">
              <div className="card p-5 sm:p-6 space-y-4 border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-b from-emerald-50/20 to-transparent dark:from-emerald-950/10">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="section-title text-base">
                      <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
                      AI Semantic Matchmaker & WhatsApp Icebreaker Engine
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      NIA Exclusive
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                  Run deep semantic AI evaluations powered by Gemini LLM across all founder bios to
                  uncover subtle synergies, bilateral business opportunities, and automatically generate
                  tailored WhatsApp introductory icebreakers.
                </p>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                  <AIMatchmaker />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Security & System Settings ─────────────────────────────────── */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Column 1: Password & Map Configuration */}
          <div className="space-y-6">
            {/* Section 6: Security & NIA PIN */}
            <div className="card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <h3 className="section-title text-base">
                  <Shield size={16} className="text-orange-500" />
                  Admin Security Password
                </h3>
                <span className="text-[10px] font-black uppercase text-stone-400">Serverless & SHA-256</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                Your administrative password protects the portal across desktop and mobile devices. Verified
                server-side with constant-time cryptographic protection.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowChangePIN(true)}
                  className="btn-primary text-xs w-full py-2.5 font-bold cursor-pointer justify-center"
                >
                  <Shield size={14} /> Change Security Password
                </button>
              </div>
            </div>

            {/* Section 5: Map Provider & Tile API Configuration */}
            <div className="card p-5 sm:p-6 space-y-4 border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-b from-emerald-50/20 to-transparent dark:from-emerald-950/10">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <h3 className="section-title text-base">
                  <Map size={16} className="text-emerald-600 dark:text-emerald-400" />
                  Alliance Atlas Cartography
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Esri World Street Map Active
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                High-resolution global & Egyptian cartography powered by Esri World Street Map. 100%
                free, zero external API keys needed, and zero rate limits or watermarks.
              </p>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-semibold space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check size={14} className="text-emerald-600" /> Fully Optimized & Active
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Worldwide vector street layer calibrated for Egypt hubs and MENA ecosystem density.
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Email Alerts & Danger Zone */}
          <div className="space-y-6">
            {/* Section 2: Email Notifications & NIA Email */}
            <div className="card p-5 sm:p-6 space-y-4 border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-b from-blue-50/20 to-transparent dark:from-blue-950/10">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <h3 className="section-title text-base">
                  <Bell size={16} className="text-blue-600 dark:text-blue-400" />
                  Email Notifications
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    getNiaEmail() ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}
                >
                  {getNiaEmail() ? 'Active' : 'Not Set'}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                Receive an email alert whenever a new member submits the Google Form. Requires the{' '}
                <code>onFormSubmit</code> trigger to be set up in Apps Script.
              </p>
              <form onSubmit={handleSaveNiaEmail} className="space-y-3 pt-1">
                <div>
                  <label className="label text-[10px]">NIA Notification Email</label>
                  <input
                    type="email"
                    value={niaEmailInput}
                    onChange={(e) => setNiaEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="input text-xs py-2"
                  />
                </div>
                {emailPushFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      emailPushFeedback.success
                        ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                        : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {emailPushFeedback.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <span>{emailPushFeedback.message}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isPushingEmail || !niaEmailInput.trim()}
                  className="btn-primary text-xs w-full py-2.5 font-bold justify-center cursor-pointer"
                >
                  {isPushingEmail ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
                  {isPushingEmail ? 'Saving & Pushing...' : 'Save & Push to Apps Script'}
                </button>
              </form>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                <strong className="text-stone-700 dark:text-stone-300">
                  ⚡ One-time trigger setup:
                </strong>{' '}
                After saving your email, go to Apps Script → Triggers (clock icon) → + Add Trigger →{' '}
                <code>onFormSubmit</code> → On form submit → Save.
              </div>
            </div>

            {/* Section 10: Danger Zone (Erase All) */}
            <div className="card p-5 sm:p-6 border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={15} /> Danger Zone — Permanent Wipe
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                    Irrevocably erases all {members.length} founder profiles from persistent disk storage
                    and browser cache.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeleteConfirmText('');
                    setShowDeleteConfirm(true);
                  }}
                  className="btn-danger text-xs py-2 px-4 font-bold cursor-pointer"
                >
                  <Trash2 size={13} /> Clear All Directory Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {/* Google Apps Script Modal */}
      <Modal
        isOpen={showAppsScriptModal}
        onClose={() => setShowAppsScriptModal(false)}
        title="Google Apps Script 2-Way Sync Setup"
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl space-y-1.5 text-stone-700 dark:text-stone-300 font-medium">
            <p className="font-extrabold text-stone-900 dark:text-stone-100">
              Step-by-Step Deployment Guide:
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Open the <strong>Google Sheet</strong> connected to your Google Form.
              </li>
              <li>
                Click <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.
              </li>
              <li>
                Replace existing code in <code>Code.gs</code> with the snippet below.
              </li>
              <li>
                Click <strong>Deploy</strong> &gt; <strong>New deployment</strong>.
              </li>
              <li>
                Select type: <strong>Web app</strong>. Execute as: <strong>Me</strong>. Who has
                access: <strong>Anyone</strong>.
              </li>
              <li>
                Click <strong>Deploy</strong>, grant permission, and paste the generated{' '}
                <strong>Web App URL</strong> into the NIA Portal above.
              </li>
            </ol>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between bg-stone-900 text-stone-300 px-3 py-1.5 rounded-t-xl text-[11px] font-mono">
              <span>Code.gs</span>
              <button
                type="button"
                onClick={handleCopyAppsScript}
                className="btn-accent text-[10px] py-1 px-2.5 font-bold flex items-center gap-1"
              >
                {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                {copiedCode ? 'Copied Script!' : 'Copy Code.gs'}
              </button>
            </div>
            <textarea
              readOnly
              rows={12}
              value={getGoogleAppsScriptCode()}
              className="w-full bg-stone-950 text-emerald-400 font-mono text-[11px] p-3 rounded-b-xl border border-stone-800 focus:outline-none select-all"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setShowAppsScriptModal(false)}
              className="btn-secondary text-xs py-1.5 px-4"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Deleted Records / Tombstones Manager Modal */}
      <Modal
        isOpen={showTombstonesModal}
        onClose={() => setShowTombstonesModal(false)}
        title="Deleted Form Submissions (Tombstones)"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            These records were deleted in the web app and are permanently prevented from
            resurrecting when pulling from Google Sheets.
          </p>

          {tombstonesList.length === 0 ? (
            <div className="p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-center text-stone-400">
              No active tombstones. All Google Sheet rows will be imported.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {tombstonesList.map((key) => (
                <div
                  key={key}
                  className="p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl flex items-center justify-between gap-2"
                >
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200 truncate">
                    {key}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTombstone(key)}
                    className="btn-ghost text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] py-1 px-2 font-bold flex items-center gap-1"
                    title="Allow re-importing this record"
                  >
                    <RotateCcw size={12} /> Allow Re-import
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
            {tombstonesList.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllTombstones}
                className="btn-ghost text-rose-600 hover:bg-rose-50 text-xs font-bold"
              >
                Clear All Tombstones
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={() => setShowTombstonesModal(false)}
              className="btn-secondary text-xs py-1.5 px-4"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Export Confirmation */}
      <Modal
        isOpen={showExportWarning}
        onClose={() => setShowExportWarning(false)}
        title="Export Full Database"
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            This will download a full unencrypted JSON backup containing all member profiles.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowExportWarning(false)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Cancel
            </button>
            <button onClick={doExport} className="btn-primary text-xs py-1.5 px-3">
              Download JSON
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Permanent Database Wipe"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
            This action will permanently delete all {members.length} members from persistent disk
            storage.
          </p>
          <div>
            <label className="label text-[10px]">Type DELETE to confirm:</label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="input font-mono text-xs py-2"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText('');
              }}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
              className="btn-danger text-xs py-1.5 px-3 font-bold"
            >
              Yes, Erase Everything
            </button>
          </div>
        </div>
      </Modal>

      {/* Change PIN Modal */}
      <Modal
        isOpen={showChangePIN}
        onClose={() => {
          setShowChangePIN(false);
          setNewPinInput('');
          setConfirmPinInput('');
          setPinError('');
        }}
        title="Update Admin Security Password"
        size="sm"
      >
        <form onSubmit={handleChangePIN} className="space-y-3.5">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
            Changes your security credentials across devices. You can also configure the <code>ADMIN_PASSWORD</code> environment variable in your Vercel Dashboard for server-enforced authentication.
          </p>
          <div>
            <label className="label text-[10px]">New Password (min 4 characters)</label>
            <input
              type="password"
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              placeholder="Enter new password"
              className="input text-xs py-2"
              autoFocus
            />
          </div>
          <div>
            <label className="label text-[10px]">Confirm New Password</label>
            <input
              type="password"
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value)}
              placeholder="Confirm new password"
              className="input text-xs py-2"
            />
          </div>
          {pinError && <p className="text-xs text-rose-600 font-bold">{pinError}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowChangePIN(false)}
              className="btn-secondary text-xs py-1.5 px-3 cursor-pointer"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs py-1.5 px-3.5 cursor-pointer font-bold">
              Save Password
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Duplicate Profile Comparison & Resolution Modal ───────────────────── */}
      {duplicateReview && (
        <DuplicateComparisonModal
          isOpen={Boolean(duplicateReview)}
          onClose={() => setDuplicateReview(null)}
          pendingMember={duplicateReview.pendingMember}
          existingMember={duplicateReview.existingMember}
          matchReason={duplicateReview.matchReason}
          confidence={duplicateReview.confidence}
          isProcessing={
            approvingId === duplicateReview.pendingMember?.id ||
            rejectingId === duplicateReview.pendingMember?.id
          }
          onApproveAndMerge={async (pending, existing) => {
            await handleApproveAndReplace(pending, existing);
            setDuplicateReview(null);
          }}
          onApproveAsNew={async (pending) => {
            await handleApproveMember(pending);
            setDuplicateReview(null);
          }}
          onReject={async (pending) => {
            await handleRejectMember(pending);
            setDuplicateReview(null);
          }}
        />
      )}

      {/* ── Community Welcome Announcement Dispatcher Modal ────────────── */}
      {dispatchModalMember && (
        <CommunityWelcomeDispatcherModal
          isOpen={Boolean(dispatchModalMember)}
          onClose={() => setDispatchModalMember(null)}
          member={dispatchModalMember}
        />
      )}
    </div>
  );
}
