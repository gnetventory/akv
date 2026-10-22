import React, { useState } from 'react';
import {
  Sparkles,
  UserPlus,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Save,
  RotateCcw,
  Tag,
  X,
  Plus,
  MessageSquare,
  Globe,
  Linkedin,
  MapPin,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { parseIntro } from '../../utils/gemini';
import { addMember } from '../../utils/storage';
import { STAGES, STAGE_OPTIONS, INDUSTRY_TAGS, getCountryFlag } from '../../utils/constants';
import {
  getInitials,
  getAvatarGradient,
  getMemberWebsites,
  extractUrls,
  formatWebsiteUrl,
  getPlatformLabel,
  getPlatformBadgeStyle,
} from '../../utils/helpers';
import ProfileCard from '../directory/ProfileCard';
import CommunityWelcomeDispatcherModal from '../admin/CommunityWelcomeDispatcherModal';

const SAMPLE_MOSELHY_INTRO = `السلام عليكم اتمني تكونوا بخير 
انا لسه داخل الجروب حبيت اعرف عن نفسي 

انا محمد مصيلحي خريج اقتصاد وعلوم سياسيه و founder of Phoenix Growth Partners لتطوير الاعمال 
بنقدم خدمات استشارات تنميه اعمال وبنساعد في حل مشاكل زي Growth Ceiling و Founder dependency عن طريق تقديم حلول وتحديد الاولويات و نساعد في Commercial Infrastructure 
ومش بنقدم مجرد استشارات وخلاص بنكونوا مع المؤسس على مدار رحلته في البيزنس لحد ما يوصل لمرحله Investment 

لينك اللينكدان لو حد حابب يعرف اكتر 
 https://www.linkedin.com/company/phoenix-growth-agency1/


ومبسوط جدا اني موجود مع حضراتكم هنا و لو حد عنده اقتراح شراكه استراتيجية أو محتاج مساعده في البيزنس الخاص بيه 🙏🏻🤍`;

const SAMPLE_MOLLY_INTRO = `Hello guys,
هاللوز باللوز😍
This is M♡lly 
أنا عندي خبره في التدريس في المدارس الإنترناشيونال و شغاله في مدرسة إنترناشيونال، 
عندي أكاديمية صغننه كده، لسه بدايه يعني، بدي كورسات إنجلش أونلاين لل adults
*from beginners to advanced 
*Conversation courses
*Business English 
*ESP (English for specific purpose)

و بالنسبة لكورسات ال kids ففي teachers بيشتغلوا معايا و انا ال supervisor. 
و إن شاء الله ربنا يكرمني و نكبر الأكاديمية، هي أونلاين بس.  و عندي صفحات و بعمل محتوى إنجلش فيديوهات و غيره.
ده كده الكارير😊
الحياة الإجتماعيه بقى فأنا حد بيحب السفر جداا، لفيت أماكن كتير جوه مصر، لو حد حابب أساعده في حاجه زي دي، انا بحب السفر اللي يعلم مهارات، بساطه و camping و الجو ده. و عندي إهتمامات تانيه كتير. بحب أتعلم و اجرب حاجات جديد عموما كل فتره 🥰
tiktok.com/@english.venglish
https://www.facebook.com/share/1FALyWoBYn/
https://www.facebook.com/share/1BzFqHUyRp/`;

const EMPTY_FORM = {
  name: '',
  role: '',
  business: '',
  stage: 'starting',
  lookingFor: '',
  canHelp: '',
  location: { country: 'Egypt', city: 'Cairo' },
  phone: '',
  linkedin: '',
  website: '',
  secondaryWebsite: '',
  websites: [],
  tags: [],
  originalLanguage: 'ar',
  originalText: '',
  status: 'active',
  appStatus: 'ACTIVE',
};

export default function NiaAddMember({ onMemberAdded }) {
  const { apiKey, notify, refreshMembers } = useApp();
  const [tab, setTab] = useState('whatsapp'); // 'whatsapp' | 'manual'
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newTagInput, setNewTagInput] = useState('');
  const [lastAddedMember, setLastAddedMember] = useState(null);
  const [dispatcherMember, setDispatcherMember] = useState(null);

  const setField = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));
  const setLocationField = (field, val) =>
    setForm((prev) => ({ ...prev, location: { ...prev.location, [field]: val } }));

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setRawText(text.trim());
          notify('📋 Pasted message from clipboard!');
          navigator.vibrate?.([15]);
          return;
        }
      }
      notify('Clipboard is empty or access denied', 'warning');
    } catch {
      notify('Could not access clipboard — please paste manually', 'warning');
    }
  };

  // ── Parse WhatsApp Message using Gemini AI ──────────────────────────────────
  const handleParseWhatsApp = async () => {
    if (!rawText.trim()) {
      notify('Please paste a WhatsApp message to parse', 'warning');
      return;
    }

    setIsParsing(true);
    setLastAddedMember(null);
    try {
      const result = await parseIntro(rawText.trim());
      if (!result || (!result.name && !result.business)) {
        throw new Error('Could not extract member details from message');
      }

      const websitesList = Array.isArray(result.websites) ? result.websites.filter(Boolean) : [];

      const populatedForm = {
        ...EMPTY_FORM,
        ...result,
        location: {
          country: result.location?.country || 'Egypt',
          city: result.location?.city || 'Cairo',
        },
        tags: Array.isArray(result.tags) && result.tags.length > 0 ? result.tags : ['Education'],
        website: result.website || websitesList[0] || '',
        secondaryWebsite: result.secondaryWebsite || websitesList[1] || '',
        websites: websitesList,
        originalText: rawText.trim(),
        status: 'active',
        appStatus: 'ACTIVE',
      };

      setParsedData(populatedForm);
      setForm(populatedForm);
      notify(`✨ Successfully extracted ${populatedForm.name}'s profile!`);
    } catch (err) {
      console.error(err);
      notify(`Parsing error: ${err.message}`, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadSample = (sampleType = 'moselhy') => {
    if (sampleType === 'moselhy') {
      setRawText(SAMPLE_MOSELHY_INTRO);
    } else {
      setRawText(SAMPLE_MOLLY_INTRO);
    }
  };

  const handleAddTag = (tag) => {
    const clean = (tag || newTagInput).trim();
    if (clean && !form.tags.includes(clean)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  };

  // ── Dynamic Website & Social Link Handlers ──────────────────────────────────
  const currentWebsites =
    Array.isArray(form.websites) && form.websites.length > 0
      ? form.websites
      : [form.website, form.secondaryWebsite].filter(Boolean);

  const handleUpdateWebsite = (index, val) => {
    const updated = [...(currentWebsites.length > 0 ? currentWebsites : [''])];
    updated[index] = val;
    setForm((prev) => ({
      ...prev,
      websites: updated,
      website: updated[0] || '',
      secondaryWebsite: updated[1] || '',
    }));
  };

  const handleAddWebsiteLink = () => {
    const updated = [...currentWebsites, ''];
    setForm((prev) => ({
      ...prev,
      websites: updated,
      website: updated[0] || '',
      secondaryWebsite: updated[1] || '',
    }));
  };

  const handleRemoveWebsiteLink = (index) => {
    const updated = currentWebsites.filter((_, i) => i !== index);
    setForm((prev) => ({
      ...prev,
      websites: updated,
      website: updated[0] || '',
      secondaryWebsite: updated[1] || '',
    }));
  };

  // ── Save Member to Directory ───────────────────────────────────────────────
  const handleSaveMember = (e) => {
    e?.preventDefault();
    if (!form.name.trim()) {
      notify('Member full name is required', 'warning');
      return;
    }

    const newMember = addMember({
      ...form,
      name: form.name.trim(),
      role: form.role.trim() || 'Founder & Entrepreneur',
      business: form.business.trim() || 'Business Venture',
      status: 'active',
      appStatus: 'ACTIVE',
    });

    refreshMembers();
    setLastAddedMember(newMember);
    setDispatcherMember(newMember);
    setParsedData(null);
    setForm(EMPTY_FORM);
    setRawText('');
    notify(`🎉 Added ${newMember.name} to the public directory!`);
    onMemberAdded?.(newMember);
  };

  const handleReset = () => {
    setParsedData(null);
    setForm(EMPTY_FORM);
    setRawText('');
    setLastAddedMember(null);
  };

  return (
    <div className="card p-5 sm:p-6 space-y-5 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            <UserPlus size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Add Member Manually & WhatsApp Parser
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                NIA Only
              </span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Paste raw WhatsApp introductions or enter founder profiles manually with automatic AI
              structuring.
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 sm:flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTab('whatsapp')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'whatsapp'
                ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles size={13} className="text-amber-500" />
            WhatsApp AI Parser
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('manual');
              if (!parsedData) setForm(EMPTY_FORM);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'manual'
                ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200'
            }`}
          >
            <UserPlus size={13} className="text-emerald-500" />
            Manual Form
          </button>
        </div>
      </div>

      {/* Success Banner if recently added */}
      {lastAddedMember && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                {lastAddedMember.name} successfully added!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Profile is saved to disk storage and is live in the directory.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setDispatcherMember(lastAddedMember)}
              className="btn-primary text-xs py-1.5 px-3 font-extrabold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              <Share2 size={13} />
              <span>📣 Dispatch Announcement</span>
            </button>
            <a
              href="/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3 font-bold"
            >
              <ExternalLink size={12} /> View in Directory
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary text-xs py-1.5 px-3 font-bold"
            >
              Add Another Member
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 1: WhatsApp AI Parser ────────────────────────────────────────── */}
      {tab === 'whatsapp' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="label text-[11px] font-bold text-stone-700 dark:text-stone-300">
                Paste Raw WhatsApp Introduction Message
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="btn-secondary text-[11px] py-1 px-2.5 font-bold flex items-center gap-1.5 cursor-pointer text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                  title="Read from device clipboard"
                >
                  <Copy size={12} />
                  <span>Paste from Clipboard</span>
                </button>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider hidden sm:inline">
                  Test Samples:
                </span>
                <button
                  type="button"
                  onClick={() => handleLoadSample('moselhy')}
                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800"
                >
                  ⚡ Moselhy
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('molly')}
                  className="text-[11px] font-bold text-stone-600 dark:text-stone-400 hover:underline cursor-pointer bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-700"
                >
                  Molly
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste WhatsApp introduction text here (Arabic, English, mixed with emojis, bio, links)..."
              className="input text-xs font-mono leading-relaxed resize-y w-full"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleParseWhatsApp}
                disabled={isParsing || !rawText.trim()}
                className="btn-primary text-xs py-2.5 px-4 font-bold shadow-tactile-sm flex items-center gap-2 cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Parsing with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-amber-300" />
                    <span>Parse Message with AI</span>
                  </>
                )}
              </button>

              {rawText && (
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="btn-secondary text-xs py-2 px-3 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <span className="text-[11px] text-stone-500 font-medium">
              Powered by Google Gemini 2.0 Flash with automated entity mapping
            </span>
          </div>
        </div>
      )}

      {/* ── Parsed Result Preview & Form Editor ────────────────────────────────── */}
      {(parsedData || tab === 'manual') && (
        <div className="space-y-5 pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>
                {parsedData ? '✨ Structured Profile Preview & Editor' : '📝 Founder Details'}
              </span>
            </h4>
            {parsedData && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Ready to Save
              </span>
            )}
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSaveMember} className="space-y-4">
            {/* Row 1: Name + Role */}
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label className="label text-[10.5px]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Molly (or Sherif ElMenyawy)"
                  className="input text-xs font-semibold py-2"
                />
              </div>
              <div>
                <label className="label text-[10.5px]">Professional Role / Title *</label>
                <input
                  type="text"
                  required
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                  placeholder="e.g. English Language Educator & Online Academy Founder"
                  className="input text-xs py-2"
                />
              </div>
            </div>

            {/* Business Pitch */}
            <div>
              <label className="label text-[10.5px]">Business / Venture Pitch *</label>
              <textarea
                rows={2}
                required
                value={form.business}
                onChange={(e) => setField('business', e.target.value)}
                placeholder="Describe what they do, their academy, startup, or services..."
                className="input text-xs leading-relaxed py-2 resize-none"
              />
            </div>

            {/* Stage Selector */}
            <div>
              <label className="label text-[10.5px]">Business Stage</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STAGE_OPTIONS.map((s) => {
                  const stageObj = STAGES[s];
                  const isSelected = form.stage === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField('stage', s)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? `${stageObj.bg} ${stageObj.text} ${stageObj.border} ring-2 ring-orange-500/20`
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-750 text-stone-600 dark:text-stone-400 hover:border-stone-400'
                      }`}
                    >
                      <span className="text-sm">{stageObj.icon}</span>
                      <div>
                        <div className="leading-tight font-extrabold">{stageObj.label}</div>
                        <div className="text-[10px] opacity-70 font-normal">{stageObj.tenure}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location (Country + City) */}
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label className="label text-[10.5px]">Country</label>
                <input
                  type="text"
                  value={form.location?.country || ''}
                  onChange={(e) => setLocationField('country', e.target.value)}
                  placeholder="e.g. Egypt"
                  className="input text-xs py-2"
                />
              </div>
              <div>
                <label className="label text-[10.5px]">City / Region</label>
                <input
                  type="text"
                  value={form.location?.city || ''}
                  onChange={(e) => setLocationField('city', e.target.value)}
                  placeholder="e.g. Cairo"
                  className="input text-xs py-2"
                />
              </div>
            </div>

            {/* Contact Details (WhatsApp + LinkedIn) */}
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label className="label text-[10.5px]">
                  WhatsApp Number (Restricted to NIA View)
                </label>
                <input
                  type="text"
                  inputMode="tel"
                  value={form.phone || ''}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="e.g. +20 10 1234 5678"
                  className="input text-xs py-2 font-mono"
                />
              </div>
              <div>
                <label className="label text-[10.5px]">LinkedIn Profile URL</label>
                <input
                  type="text"
                  inputMode="url"
                  value={form.linkedin || ''}
                  onChange={(e) => setField('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="input text-xs py-2 font-mono"
                />
              </div>
            </div>

            {/* Websites & Social Links (Labeled Platforms & Multi-Links Support) */}
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-755">
              <div className="flex items-center justify-between">
                <label className="label text-[11px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 mb-0">
                  <Globe size={13} className="text-orange-500" />
                  <span>Websites & Social Media Links ({currentWebsites.length})</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddWebsiteLink}
                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Add Another Link
                </button>
              </div>

              <div className="space-y-2">
                {currentWebsites.map((url, idx) => {
                  const badgeStyle = getPlatformBadgeStyle(url);
                  const platform = getPlatformLabel(url);
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        {/* Platform Badge / Label */}
                        <div
                          className={`px-2.5 py-1 rounded-lg sm:rounded-xl text-xs font-extrabold border flex items-center gap-1.5 shrink-0 min-w-[90px] sm:min-w-[105px] justify-center shadow-xs ${badgeStyle.bg} ${badgeStyle.border}`}
                        >
                          <span>{badgeStyle.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-1 w-full">
                        <input
                          type="text"
                          inputMode="url"
                          value={url}
                          onChange={(e) => handleUpdateWebsite(idx, e.target.value)}
                          placeholder={`e.g. https://${platform.toLowerCase().replace(/[^a-z0-9]/g, '') || 'website'}.com/...`}
                          className="input text-xs py-1.5 font-mono flex-1"
                        />

                        {url && (
                          <a
                            href={formatWebsiteUrl(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors shrink-0"
                            title={`Test open ${platform}`}
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}

                        {currentWebsites.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveWebsiteLink(idx)}
                            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                            title="Remove link"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {currentWebsites.length === 0 && (
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 text-xs text-stone-500">
                    <span>No website or social links added yet.</span>
                    <button
                      type="button"
                      onClick={handleAddWebsiteLink}
                      className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      + Add Link
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Needs (Looking For) + Offers (Can Help With) */}
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label className="label text-[10.5px]">🎯 Looking For / Needs</label>
                <textarea
                  rows={2}
                  value={form.lookingFor || ''}
                  onChange={(e) => setField('lookingFor', e.target.value)}
                  placeholder="What they want to achieve or learn..."
                  className="input text-xs leading-relaxed py-2 resize-none"
                />
              </div>
              <div>
                <label className="label text-[10.5px]">💡 Can Help With / Offering</label>
                <textarea
                  rows={2}
                  value={form.canHelp || ''}
                  onChange={(e) => setField('canHelp', e.target.value)}
                  placeholder="What they offer to the community..."
                  className="input text-xs leading-relaxed py-2 resize-none"
                />
              </div>
            </div>

            {/* Industry Tags */}
            <div className="space-y-1.5">
              <label className="label text-[10.5px]">Industry Tags & Skills</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Custom Tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type tag and press Add (e.g. EdTech, Language Training)..."
                  className="input text-xs py-1.5 flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="btn-secondary text-xs py-1.5 px-3 font-bold"
                >
                  <Plus size={12} /> Add Tag
                </button>
              </div>

              {/* Preset Tag Suggestions */}
              <div className="flex flex-wrap gap-1 pt-1">
                {INDUSTRY_TAGS.filter((t) => !form.tags.includes(t))
                  .slice(0, 10)
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddTag(t)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-orange-100 dark:hover:bg-orange-950 hover:text-orange-700 font-semibold cursor-pointer transition-colors"
                    >
                      + {t}
                    </button>
                  ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary text-xs py-2.5 px-4 font-bold justify-center"
              >
                Reset
              </button>
              <button
                type="submit"
                className="btn-primary text-xs py-3 sm:py-2.5 px-6 font-extrabold shadow-tactile-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px] sm:min-h-0"
              >
                <Save size={14} />
                Save & Add {form.name || 'Member'} to Directory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Community Welcome Announcement Dispatcher Modal ────────────── */}
      {dispatcherMember && (
        <CommunityWelcomeDispatcherModal
          isOpen={!!dispatcherMember}
          onClose={() => setDispatcherMember(null)}
          member={dispatcherMember}
        />
      )}
    </div>
  );
}
