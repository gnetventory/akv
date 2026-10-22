import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  MessageCircle,
  ExternalLink,
  RotateCcw,
  Eye,
  Edit3,
  Phone,
  ShieldCheck,
  Building,
  MapPin,
  Tag,
  RotateCw,
  UserPlus,
} from 'lucide-react';
import Modal from '../common/Modal';
import {
  generateWelcomeAnnouncement,
  generateDirectWelcome,
  getWhatsAppGroupShareUrl,
  getWhatsAppDirectChatUrl,
  isMemberProfileUpdate,
} from '../../utils/welcomeAnnouncements';
import { generateAIWelcomeHook } from '../../utils/gemini';
import { getAvatarGradient, getInitials, parseMemberName, copyToClipboard } from '../../utils/helpers';
import { getCountryFlag, STAGES } from '../../utils/constants';
import { useApp } from '../../contexts/AppContext';

export default function CommunityWelcomeDispatcherModal({ isOpen, onClose, member }) {
  const { notify } = useApp();
  const [tone, setTone] = useState('egyptian'); // 'egyptian' | 'english' | 'arabic'
  const [announcementMode, setAnnouncementMode] = useState(() =>
    isMemberProfileUpdate(member) ? 'update' : 'new'
  );
  const [customHook, setCustomHook] = useState('');
  const [isGeneratingHook, setIsGeneratingHook] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [copiedGroup, setCopiedGroup] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [activeTab, setActiveTab] = useState('group'); // 'group' | 'direct'
  const [directText, setDirectText] = useState('');

  // Keep announcementMode synchronized if the member changes
  useEffect(() => {
    if (member) {
      setAnnouncementMode(isMemberProfileUpdate(member) ? 'update' : 'new');
    }
  }, [member]);

  // Re-generate deterministic template whenever member, tone, mode, or hook changes
  useEffect(() => {
    if (!member) return;
    const generated = generateWelcomeAnnouncement(member, {
      tone,
      customHook,
      mode: announcementMode,
    });
    setAnnouncementText(generated);

    const directMsg = generateDirectWelcome(member, {
      tone,
      mode: announcementMode,
    });
    setDirectText(directMsg);
  }, [member, tone, customHook, announcementMode]);

  if (!member) return null;

  const { english, arabic, primary } = parseMemberName(member.name);
  const stageObj = STAGES[member.stage] || STAGES.starting;
  const flag = getCountryFlag(member.location?.country);

  const handleGenerateAIHook = async () => {
    setIsGeneratingHook(true);
    try {
      const hook = await generateAIWelcomeHook(member, tone);
      if (hook) {
        setCustomHook(hook);
        notify('✨ AI conversation hook generated!');
      } else {
        notify('Could not generate AI hook. Check your Gemini API key.', 'warning');
      }
    } catch (err) {
      notify(`AI hook error: ${err.message}`, 'error');
    } finally {
      setIsGeneratingHook(false);
    }
  };

  const handleCopy = (type = 'group') => {
    const textToCopy = type === 'group' ? announcementText : directText;
    copyToClipboard(textToCopy);
    navigator.vibrate?.([15]);
    if (type === 'group') {
      setCopiedGroup(true);
      setTimeout(() => setCopiedGroup(false), 2000);
      notify('📋 Announcement copied to clipboard!');
    } else {
      setCopiedDirect(true);
      setTimeout(() => setCopiedDirect(false), 2000);
      notify('📋 Direct welcome copied to clipboard!');
    }
  };

  const handleDispatchGroup = () => {
    navigator.vibrate?.([20]);
    const url = getWhatsAppGroupShareUrl(announcementText);
    window.open(url, '_blank', 'noopener,noreferrer');
    notify('🚀 WhatsApp group dispatch opened!');
  };

  const handleDispatchDirect = () => {
    if (!member.phone) {
      notify('No phone number on record for this member', 'warning');
      return;
    }
    navigator.vibrate?.([20]);
    const url = getWhatsAppDirectChatUrl(member.phone, directText);
    window.open(url, '_blank', 'noopener,noreferrer');
    notify(`🚀 Direct chat opened with ${primary}!`);
  };

  // Convert basic WhatsApp formatting to HTML for visual preview
  const formatWhatsAppMarkdown = (text) => {
    if (!text) return '';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped
      .replace(/\*(.*?)\*/g, '<strong class="font-extrabold text-stone-950 dark:text-white">$1</strong>')
      .replace(/_(.*?)_/g, '<em class="italic text-stone-700 dark:text-stone-300">$1</em>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-emerald-600 dark:text-emerald-400 underline font-semibold break-all">$1</a>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📣 Dispatch Community Welcome Announcement"
      size="xl"
    >
      <div className="space-y-5 text-xs text-stone-900 dark:text-stone-100">
        {/* Top Member Card Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-orange-50/30 dark:from-emerald-950/40 dark:via-stone-900 dark:to-stone-900 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                member.name
              )} text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm`}
            >
              {getInitials(member.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">
                  {english || primary}
                </h4>
                {arabic && (
                  <span className="text-xs text-stone-500 font-semibold" dir="rtl">
                    ({arabic})
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageObj.bg} ${stageObj.text} ${stageObj.border}`}>
                  {stageObj.icon} {stageObj.label}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium flex items-center gap-2 mt-0.5">
                <span>{member.role || 'Founder'}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {member.business || 'Venture'}
                </span>
                <span>•</span>
                <span>
                  {flag} {member.location?.city || 'Egypt'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                announcementMode === 'update'
                  ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                  : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {announcementMode === 'update' ? <RotateCw size={10} /> : <Sparkles size={10} />}
              {announcementMode === 'update' ? 'Profile Update' : 'New Joiner'}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-stone-850/80 border border-stone-200 dark:border-stone-700 text-[11px] font-bold text-stone-600 dark:text-stone-400">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Admin Dispatch Only</span>
            </div>
          </div>
        </div>

        {/* Announcement Mode Segmented Switcher (New Member vs Profile Update) */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-stone-100/80 dark:bg-stone-850 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-stone-500">Announcement Type:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setAnnouncementMode('new')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                announcementMode === 'new'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <UserPlus size={13} />
              <span>🎉 New Member Welcome</span>
            </button>
            <button
              type="button"
              onClick={() => setAnnouncementMode('update')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                announcementMode === 'update'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <RotateCw size={13} />
              <span>🔄 Profile Update Refresh</span>
            </button>
          </div>
        </div>

        {/* Tone Selector & AI Hook Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-stone-50 dark:bg-stone-850/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
          {/* Tone Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <span className="text-[11px] font-bold text-stone-500 mr-1 w-full sm:w-auto">Tone:</span>
            <button
              type="button"
              onClick={() => setTone('egyptian')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none ${
                tone === 'egyptian'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700'
              }`}
            >
              <span>🇪🇬</span>
              <span>المصرية الودودة</span>
            </button>

            <button
              type="button"
              onClick={() => setTone('english')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none ${
                tone === 'english'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700'
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>

            <button
              type="button"
              onClick={() => setTone('arabic')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none ${
                tone === 'arabic'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700'
              }`}
            >
              <span>🇸🇦</span>
              <span>الفصحى</span>
            </button>
          </div>

          {/* AI Hook Generation Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateAIHook}
              disabled={isGeneratingHook}
              className="btn-secondary py-1.5 px-3 font-extrabold text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/60 hover:bg-orange-50 dark:hover:bg-orange-950/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={13} className={isGeneratingHook ? 'animate-spin' : ''} />
              <span>{isGeneratingHook ? 'Generating Hook...' : '✨ Polish with AI'}</span>
            </button>

            {customHook && (
              <button
                type="button"
                onClick={() => setCustomHook('')}
                className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 underline font-semibold cursor-pointer"
              >
                Reset Hook
              </button>
            )}
          </div>
        </div>

        {/* Dispatch Mode Tabs: WhatsApp Group Announcement vs Direct Welcome */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('group')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'group'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Share2 size={14} />
            <span>Community Group Announcement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'direct'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <MessageCircle size={14} />
            <span>1-on-1 Welcome to Founder</span>
            {member.phone ? (
              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                Phone Available
              </span>
            ) : (
              <span className="text-[9px] bg-stone-100 dark:bg-stone-800 text-stone-500 px-1.5 py-0.2 rounded-full">
                No Phone
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Group Announcement */}
        {activeTab === 'group' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Left: Editable Text Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label text-[11px] font-bold flex items-center gap-1.5">
                  <Edit3 size={13} className="text-stone-500" />
                  <span>Editable WhatsApp Announcement</span>
                </label>
                <span className="text-[10px] text-stone-400 font-mono">
                  {announcementText.length} chars
                </span>
              </div>
              <textarea
                rows={13}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                dir={tone === 'english' ? 'ltr' : 'rtl'}
                className="input font-mono text-[11px] leading-relaxed p-3.5 resize-none w-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-750 focus:ring-2 focus:ring-emerald-500/30"
              />
              <p className="text-[10.5px] text-stone-500">
                You can freely edit or add personal shoutouts before dispatching to the group chat.
              </p>
            </div>

            {/* Right: WhatsApp Bubble Live Simulation */}
            <div className="space-y-2">
              <label className="label text-[11px] font-bold flex items-center gap-1.5">
                <Eye size={13} className="text-emerald-600" />
                <span>WhatsApp Simulation Preview</span>
              </label>

              <div className="p-4 rounded-2xl bg-[#EFEAE2] dark:bg-stone-950 border border-stone-300 dark:border-stone-800 min-h-[300px] flex flex-col justify-start relative">
                {/* Simulated Chat Bubble */}
                <div
                  className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl rounded-tr-none shadow-sm border border-stone-200 dark:border-stone-800 text-[11.5px] leading-relaxed space-y-1 text-stone-900 dark:text-stone-100 max-w-full"
                  dir={tone === 'english' ? 'ltr' : 'rtl'}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatWhatsAppMarkdown(announcementText),
                    }}
                  />
                  <div className="text-[9px] text-stone-400 pt-1 text-right font-mono">
                    Just now · WhatsApp Preview
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 1-on-1 Direct Welcome */}
        {activeTab === 'direct' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label text-[11px] font-bold flex items-center gap-1.5">
                  <Phone size={13} className="text-stone-500" />
                  <span>Direct Message to Founder</span>
                </label>
                <span className="text-[10px] text-stone-400 font-mono">
                  {directText.length} chars
                </span>
              </div>
              <textarea
                rows={9}
                value={directText}
                onChange={(e) => setDirectText(e.target.value)}
                dir={tone === 'english' ? 'ltr' : 'rtl'}
                className="input font-mono text-[11px] leading-relaxed p-3.5 resize-none w-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-750 focus:ring-2 focus:ring-emerald-500/30"
              />
              {member.phone ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <Phone size={13} />
                  <span>Target Phone: {member.phone}</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                  ⚠️ No phone number provided in intake. You can copy the message to send via LinkedIn or email.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="label text-[11px] font-bold flex items-center gap-1.5">
                <Eye size={13} className="text-emerald-600" />
                <span>Direct Chat Preview</span>
              </label>

              <div className="p-4 rounded-2xl bg-[#EFEAE2] dark:bg-stone-950 border border-stone-300 dark:border-stone-800 min-h-[220px] flex flex-col justify-start">
                <div
                  className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl rounded-tr-none shadow-sm border border-stone-200 dark:border-stone-800 text-[11.5px] leading-relaxed space-y-1 text-stone-900 dark:text-stone-100"
                  dir={tone === 'english' ? 'ltr' : 'rtl'}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatWhatsAppMarkdown(directText),
                    }}
                  />
                  <div className="text-[9px] text-stone-400 pt-1 text-right font-mono">
                    Direct 1-on-1 Message
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-2.5 px-4 text-xs font-bold cursor-pointer justify-center"
          >
            Close
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {activeTab === 'group' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleCopy('group')}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto min-h-[44px] sm:min-h-0"
                >
                  {copiedGroup ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedGroup ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDispatchGroup}
                  className="btn-primary py-2.5 px-5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-tactile-sm cursor-pointer w-full sm:w-auto min-h-[44px] sm:min-h-0"
                >
                  <Share2 size={14} />
                  <span>📣 Dispatch to WhatsApp Group</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleCopy('direct')}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto min-h-[44px] sm:min-h-0"
                >
                  {copiedDirect ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedDirect ? 'Copied!' : 'Copy Direct Message'}</span>
                </button>

                {member.phone && (
                  <button
                    type="button"
                    onClick={handleDispatchDirect}
                    className="btn-primary py-2.5 px-5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-tactile-sm cursor-pointer w-full sm:w-auto min-h-[44px] sm:min-h-0"
                  >
                    <MessageCircle size={14} />
                    <span>💬 Open WhatsApp with {primary.split(' ')[0]}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
