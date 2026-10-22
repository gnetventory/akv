import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Check,
  AlertCircle,
  UserPlus,
  Copy,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  Download,
  Filter,
  Users,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { parseIntro } from '../../utils/gemini';
import { addMembers } from '../../utils/storage';
import {
  parseRawFileToMessages,
  extractIntroCandidates,
  processIntroCandidatesBatch,
  analyzeDuplicates,
} from '../../utils/whatsappChatParser';
import ManualForm from './ManualForm';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const INTRO_TEMPLATE = `Name: Mohamed Ahmed
Role: Co-Founder & CTO
Business: BuildFlow — AI workflow automation for MENA contractors
Location: Cairo, Egypt
Stage: Running (Seed funded)
Seeking: Series A Investors, Senior Python Engineer
Offering: Tech architecture mentorship, Free API credits
Tags: SaaS, AI, ConstructionTech
LinkedIn: mohamed-ahmed-buildflow
WhatsApp: +201012345678`;

export default function AIParser() {
  const { apiKey, notify, refreshMembers, setActiveTab, activeMembers: existingMembers } = useApp();
  const [mode, setMode] = useState('files'); // 'files' | 'single' | 'manual'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [parsingProgress, setParsingProgress] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedProfiles, setStagedProfiles] = useState([]);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'new' | 'duplicates'
  const [editingProfile, setEditingProfile] = useState(null);

  // Single intro parser state
  const [rawText, setRawText] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleParsedResult, setSingleParsedResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // ── Multi-File Drag & Drop Handlers ─────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    addFilesToList(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    addFilesToList(files);
  };

  const addFilesToList = (files) => {
    const valid = files.filter((f) => f.name.endsWith('.txt') || f.name.endsWith('.md'));
    if (valid.length === 0) {
      notify('Please upload .txt (WhatsApp export) or .md (Markdown notes) files', 'warning');
      return;
    }
    setUploadedFiles((prev) => [...prev, ...valid]);
    notify(`Added ${valid.length} file(s) for extraction!`);
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ── Process Uploaded Files ──────────────────────────────────────────────────
  const handleProcessFiles = async () => {
    if (uploadedFiles.length === 0) return;
    setIsProcessing(true);
    setStagedProfiles([]);
    setError(null);

    try {
      let allCandidateMessages = [];

      // 1. Read and parse files into candidate messages
      for (const file of uploadedFiles) {
        const text = await file.text();
        const messages = parseRawFileToMessages(text, file.name);
        const candidates = extractIntroCandidates(messages);
        allCandidateMessages.push(...candidates);
      }

      if (allCandidateMessages.length === 0) {
        notify('No introduction messages detected in the uploaded files', 'warning');
        setIsProcessing(false);
        return;
      }

      notify(
        `Found ${allCandidateMessages.length} candidate introductions across files. Extracting profiles...`
      );

      // 2. Batch AI Extraction
      const extracted = await processIntroCandidatesBatch(allCandidateMessages, apiKey, (prog) =>
        setParsingProgress(prog)
      );

      // 3. Analyze duplicates against directory
      const staged = analyzeDuplicates(extracted, existingMembers);
      setStagedProfiles(staged);
      notify(`Successfully extracted ${staged.length} founder profiles! Ready for review.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'File extraction failed.');
      notify('Extraction failed: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
      setParsingProgress(null);
    }
  };

  // ── Staging Review Controls ─────────────────────────────────────────────────
  const handleToggleSelect = (profileId) => {
    setStagedProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, selectedForImport: !p.selectedForImport } : p))
    );
  };

  const handleSelectAll = () => {
    setStagedProfiles((prev) => prev.map((p) => ({ ...p, selectedForImport: true })));
  };

  const handleSelectNewOnly = () => {
    setStagedProfiles((prev) => prev.map((p) => ({ ...p, selectedForImport: !p.isDuplicate })));
  };

  const handleDeselectAll = () => {
    setStagedProfiles((prev) => prev.map((p) => ({ ...p, selectedForImport: false })));
  };

  const handleRemoveStaged = (profileId) => {
    setStagedProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  const handleSaveStagedToDirectory = () => {
    const selected = stagedProfiles.filter((p) => p.selectedForImport);
    if (selected.length === 0) {
      notify('No profiles selected for import', 'warning');
      return;
    }

    const added = addMembers(selected);
    refreshMembers();
    notify(`🎉 Imported ${added.length} new founder profiles into the Smart Directory!`);
    setStagedProfiles([]);
    setUploadedFiles([]);
    setActiveTab('directory');
  };

  const handleExportStagedJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(stagedProfiles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `extracted_profiles_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify('Downloaded extracted profiles JSON backup!');
  };

  // ── Single Intro Parser ─────────────────────────────────────────────────────
  const handleParseSingle = async () => {
    if (!rawText.trim()) return;
    setSingleLoading(true);
    setError(null);
    try {
      const data = await parseIntro(rawText);
      setSingleParsedResult({ ...data, originalText: rawText });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to parse text.');
    } finally {
      setSingleLoading(false);
    }
  };

  const filteredStaged = stagedProfiles.filter((p) => {
    if (filterMode === 'new') return !p.isDuplicate;
    if (filterMode === 'duplicates') return p.isDuplicate;
    return true;
  });

  const selectedCount = stagedProfiles.filter((p) => p.selectedForImport).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* ── Top Header Card ─────────────────────────────────────────────────── */}
      <div className="card p-6 sm:p-7 space-y-6 bg-white dark:bg-stone-900 border-[1.5px] border-stone-300 dark:border-stone-800 shadow-tactile-sm dark:shadow-none">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b-[1.5px] border-stone-200 dark:border-stone-800 pb-4 overflow-x-auto">
          <button
            onClick={() => {
              setMode('files');
              setError(null);
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13.5px] font-black transition-all whitespace-nowrap border-[1.5px] ${
              mode === 'files'
                ? 'bg-emerald-600 text-white border-emerald-800 dark:border-emerald-500 shadow-tactile-sm dark:shadow-none'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400 hover:text-stone-950'
            }`}
          >
            <Upload size={17} /> Bulk WhatsApp File Extractor (.txt / .md)
          </button>
          <button
            onClick={() => {
              setMode('single');
              setError(null);
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13.5px] font-black transition-all whitespace-nowrap border-[1.5px] ${
              mode === 'single'
                ? 'bg-emerald-600 text-white border-emerald-800 dark:border-emerald-500 shadow-tactile-sm dark:shadow-none'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400 hover:text-stone-950'
            }`}
          >
            <Sparkles size={17} /> Single Message AI Parser
          </button>
          <button
            onClick={() => {
              setMode('manual');
              setError(null);
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13.5px] font-black transition-all whitespace-nowrap border-[1.5px] ${
              mode === 'manual'
                ? 'bg-orange-600 text-white border-orange-800 dark:border-orange-500 shadow-tactile-sm dark:shadow-none'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400 hover:text-stone-950'
            }`}
          >
            <UserPlus size={17} /> Manual Profile Form
          </button>
        </div>

        {/* API Warning Notice if not set */}
        {!apiKey && mode !== 'manual' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border-[1.5px] border-amber-300 dark:border-amber-500/30 rounded-2xl flex items-start gap-3">
            <AlertCircle
              className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              size={19}
            />
            <div className="text-[13px] font-medium text-amber-900 dark:text-amber-300 leading-relaxed">
              <strong>Running in Offline NLP Mode:</strong> Add a Gemini API key in{' '}
              <strong>Admin Security Portal</strong> for multilingual neural parsing, or proceed
              with the high-accuracy built-in rule extractor.
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border-[1.5px] border-rose-300 dark:border-rose-500/30 rounded-2xl text-[13px] font-bold text-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* ── MODE 1: BULK WHATSAPP & MARKDOWN FILE DROPZONE ─────────────────── */}
        {mode === 'files' && (
          <div className="space-y-6">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-600 dark:hover:border-emerald-500 rounded-3xl p-8 text-center cursor-pointer bg-[#FAFAF7] dark:bg-stone-850 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-emerald-300 dark:border-emerald-800">
                <Upload size={26} />
              </div>
              <h3 className="text-base font-black text-stone-900 dark:text-stone-100 font-display">
                Drop your WhatsApp Chat Logs (.txt) or Markdown Notes (.md) here
              </h3>
              <p className="text-[12.5px] text-stone-500 dark:text-stone-400 mt-1 font-medium">
                Select one or multiple exported chat files to automatically scan and extract
                business profiles
              </p>
            </div>

            {/* Uploaded Files Queue */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-400">
                  <span>Queued Files ({uploadedFiles.length}):</span>
                  <button
                    onClick={() => setUploadedFiles([])}
                    className="text-rose-600 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText size={16} className="text-emerald-600 shrink-0" />
                        <span className="font-bold text-stone-800 dark:text-stone-200 truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Remove file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleProcessFiles}
                    disabled={isProcessing}
                    className="btn-primary w-full sm:w-auto text-[14px] font-black py-3 px-6 shadow-tactile-sm"
                  >
                    {isProcessing ? <LoadingSpinner size="sm" /> : <Sparkles size={17} />}
                    {isProcessing
                      ? `Extracting Intros (${parsingProgress?.current || 0}/${parsingProgress?.total || '...'})`
                      : `Extract Profiles from ${uploadedFiles.length} File(s)`}
                  </button>
                </div>
              </div>
            )}

            {/* Live Progress Bar */}
            {isProcessing && parsingProgress && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 animate-fade-in">
                <div className="flex justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <span>
                    Parsing founder intro from: <strong>{parsingProgress.currentSender}</strong>
                  </span>
                  <span>{parsingProgress.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-200 dark:bg-emerald-900 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-200"
                    style={{ width: `${parsingProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* ── STAGING REVIEW & IMPORT GRID ─────────────────────────────── */}
            {stagedProfiles.length > 0 && (
              <div className="mt-8 pt-8 border-t-[1.5px] border-stone-200 dark:border-stone-800 space-y-5 animate-slide-up">
                {/* Staging Control Ribbon */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAFAF7] dark:bg-stone-850 p-4 rounded-2xl border-[1.5px] border-stone-200 dark:border-stone-750">
                  <div>
                    <h3 className="text-base font-black text-stone-950 dark:text-white flex items-center gap-2 font-display">
                      <Users size={18} className="text-emerald-600" /> Staged Profiles for Review (
                      {stagedProfiles.length})
                    </h3>
                    <p className="text-[12px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {stagedProfiles.filter((p) => p.isDuplicate).length > 0 ? (
                        <span>
                          ⚠️ {stagedProfiles.filter((p) => p.isDuplicate).length} potential
                          duplicate(s) detected with existing directory.
                        </span>
                      ) : (
                        'All extracted profiles are unique and ready to import.'
                      )}
                    </p>
                  </div>

                  {/* Batch Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleSelectAll}
                      className="btn-secondary text-xs py-1.5 px-3 font-bold"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleSelectNewOnly}
                      className="btn-secondary text-xs py-1.5 px-3 font-bold text-emerald-700 dark:text-emerald-400"
                    >
                      Select New Only
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="btn-secondary text-xs py-1.5 px-3 font-bold"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={handleExportStagedJSON}
                      className="btn-secondary text-xs py-1.5 px-3 font-bold"
                      title="Download clean JSON snapshot"
                    >
                      <Download size={13} /> JSON
                    </button>
                    <button
                      onClick={handleSaveStagedToDirectory}
                      disabled={selectedCount === 0}
                      className="btn-primary text-xs py-2 px-4 font-black"
                    >
                      <Check size={14} /> Import ({selectedCount}) to Directory
                    </button>
                  </div>
                </div>

                {/* Filter Tabs (All / New / Duplicates) */}
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-stone-500 flex items-center gap-1">
                    <Filter size={12} /> Filter View:
                  </span>
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1 rounded-lg border ${
                      filterMode === 'all'
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200'
                    }`}
                  >
                    All ({stagedProfiles.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('new')}
                    className={`px-3 py-1 rounded-lg border ${
                      filterMode === 'new'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200'
                    }`}
                  >
                    New Only ({stagedProfiles.filter((p) => !p.isDuplicate).length})
                  </button>
                  <button
                    onClick={() => setFilterMode('duplicates')}
                    className={`px-3 py-1 rounded-lg border ${
                      filterMode === 'duplicates'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200'
                    }`}
                  >
                    Duplicates ({stagedProfiles.filter((p) => p.isDuplicate).length})
                  </button>
                </div>

                {/* Profile Staging Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStaged.map((profile) => (
                    <div
                      key={profile.id}
                      className={`p-4 rounded-2xl border-[1.5px] transition-all space-y-3 relative ${
                        profile.selectedForImport
                          ? 'bg-white dark:bg-stone-900 border-emerald-600 dark:border-emerald-500 shadow-tactile-sm dark:shadow-none'
                          : 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-70'
                      }`}
                    >
                      {/* Duplicate Warning Strip */}
                      {profile.isDuplicate && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                          <span>
                            ⚠️ {profile.duplicateReason || 'Matches existing member profile'}
                          </span>
                        </div>
                      )}

                      {/* Header Row: Checkbox + Name + Actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={profile.selectedForImport}
                            onChange={() => handleToggleSelect(profile.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <h4 className="font-black text-sm text-stone-950 dark:text-white font-display">
                              {profile.name}
                            </h4>
                            <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
                              {profile.role || 'Founder'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingProfile(profile)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800"
                            title="Edit profile before import"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleRemoveStaged(profile.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Discard from import"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Business Pitch */}
                      <div className="p-2.5 bg-[#FAFAF7] dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-750 text-[12.5px] italic text-stone-800 dark:text-stone-200">
                        "{profile.business}"
                      </div>

                      {/* Details & Badges */}
                      <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                        {profile.canHelp && (
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-900 dark:text-emerald-300 font-medium">
                            <strong>Offer:</strong> {profile.canHelp}
                          </div>
                        )}
                        {profile.lookingFor && (
                          <div className="p-2 bg-sky-50 dark:bg-sky-950/30 rounded-lg text-sky-900 dark:text-sky-300 font-medium">
                            <strong>Need:</strong> {profile.lookingFor}
                          </div>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold pt-1 border-t border-stone-100 dark:border-stone-800">
                        <span>
                          📍 {profile.location?.city || 'Egypt'},{' '}
                          {profile.location?.country || 'Global'}
                        </span>
                        <span className="capitalize font-bold text-stone-700 dark:text-stone-300">
                          Stage: {profile.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODE 2: SINGLE MESSAGE PARSER ─────────────────────────────────── */}
        {mode === 'single' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Paste Single Introduction Message</label>
                <button
                  type="button"
                  onClick={() => setRawText(INTRO_TEMPLATE)}
                  className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  <Copy size={12} /> Insert Sample Template
                </button>
              </div>
              <textarea
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste an introduction text here. The parser will clean and structure it into a business profile."
                className="input resize-none font-mono text-sm leading-relaxed p-4"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleParseSingle}
                disabled={singleLoading || !rawText.trim()}
                className="btn-primary"
              >
                {singleLoading ? <LoadingSpinner size="sm" /> : <Sparkles size={17} />}
                {singleLoading ? 'Parsing Profile...' : 'Parse & Clean Profile'}
              </button>
              {rawText && (
                <button onClick={() => setRawText('')} className="btn-secondary">
                  Clear Text
                </button>
              )}
            </div>

            {singleParsedResult && (
              <div className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-800 space-y-4 animate-slide-up">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" size={22} /> Review Parsed Profile
                  </h3>
                </div>
                <ManualForm
                  initialData={singleParsedResult}
                  onSaved={() => {
                    setSingleParsedResult(null);
                    setRawText('');
                    setActiveTab('directory');
                  }}
                  onCancel={() => setSingleParsedResult(null)}
                />
              </div>
            )}
          </div>
        )}

        {/* ── MODE 3: MANUAL FORM ────────────────────────────────────────────── */}
        {mode === 'manual' && <ManualForm onSaved={() => setActiveTab('directory')} />}
      </div>

      {/* ── Edit Modal for Staged Profile ────────────────────────────────────── */}
      {editingProfile && (
        <Modal
          isOpen={Boolean(editingProfile)}
          onClose={() => setEditingProfile(null)}
          title={`Edit Staged: ${editingProfile.name}`}
          size="lg"
        >
          <ManualForm
            initialData={editingProfile}
            isEdit={true}
            onSaved={(updated) => {
              setStagedProfiles((prev) =>
                prev.map((p) => (p.id === editingProfile.id ? { ...p, ...updated } : p))
              );
              setEditingProfile(null);
              notify(`Updated ${updated.name}'s staged profile!`);
            }}
            onCancel={() => setEditingProfile(null)}
          />
        </Modal>
      )}
    </div>
  );
}
