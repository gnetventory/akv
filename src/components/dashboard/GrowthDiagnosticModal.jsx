import React, { useState } from 'react';
import {
  TrendingUp,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  Send,
  Sparkles,
  Building2,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import Modal from '../common/Modal';
import { getNiaPhone } from '../../utils/storage';

const COMMON_BLOCKERS = [
  'Growth Ceiling (وصلت لحد معين ومش عارف أكبر أكتر من كده)',
  'Founder Dependency (البيزنس واقف كله عليا ومش عارف أفوض أو أتوسع)',
  'Lead Gen & Customer Acquisition (تكلفة الـ CAC عالية والعملاء قليلين)',
  'B2B Sales & Conversion (في Leads بس الـ Closing بطيء أو بيقف)',
  'Product / Market Fit & Positioning (مش متأكد من الشريحة المستهدفة أو الـ Pricing)',
  'Operations & Team Scaling (التسليم والمتابعة ملخبطين مع كبر حجم الشغل)',
  'Strategic Direction (مش متأكد أكمل في نفس الاتجاه ولا أعمل Pivot)',
];

const VENTURE_STAGES = [
  { id: 'working_scaling', label: 'Working Business — Ready to Scale (بيزنس شغال وعاوز يتوسع)' },
  { id: 'hit_ceiling', label: 'Hit a Growth Ceiling / Stuck (شغال بس واصل لحيطة مسدودة)' },
  { id: 'starting_mvp', label: 'Early Traction / Starting (في بداياته ومعاه عملاء أوليين)' },
  { id: 'pivot_redirection', label: 'Re-evaluating Strategy / Pivot (محتاج إعادة توجيه للاستراتيجية)' },
];

export default function GrowthDiagnosticModal({ isOpen, onClose, defaultMember = null }) {
  const [founderName, setFounderName] = useState(defaultMember?.name || '');
  const [businessName, setBusinessName] = useState(defaultMember?.business || '');
  const [stage, setStage] = useState('hit_ceiling');
  const [selectedBlocker, setSelectedBlocker] = useState(COMMON_BLOCKERS[0]);
  const [customDetails, setCustomDetails] = useState('');
  const [preferredFormat, setPreferredFormat] = useState('1on1_deep_dive');

  const niaPhone = getNiaPhone();

  // Generate intelligent Arabic/English pre-filled diagnostic message
  const buildWhatsAppMessage = () => {
    const stageObj = VENTURE_STAGES.find((s) => s.id === stage);
    const stageLabel = stageObj ? stageObj.label.split('(')[0].trim() : 'Working Business';

    let msg = `أهلاً نيا! 👋\n\n`;
    msg += `أنا ${founderName.trim() || 'أحد أعضاء مجتمع BGM'}`;
    if (businessName.trim()) {
      msg += `، مؤسس "${businessName.trim()}"`;
    }
    msg += `.\n\n`;
    msg += `🎯 مرحلة البيزنس: ${stageLabel}\n`;
    msg += `⚠️ الـ Block أو العائق الرئيسي اللي معطل النمو عندي حالياً:\n`;
    msg += `• ${selectedBlocker}\n`;

    if (customDetails.trim()) {
      msg += `\nتفاصيل إضافية عن المشكلة:\n"${customDetails.trim()}"\n`;
    }

    msg += `\n💡 حابب نقعد سوا في Growth Diagnostic Session نشخص الـ Gaps في البيزنس ونبني استراتيجية واضحة نفك بيها الـ Bottleneck ده. 🚀`;

    return msg;
  };

  const handleLaunchWhatsApp = (e) => {
    e.preventDefault();
    const message = buildWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    const cleanPhone = niaPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="1-on-1 Growth Gap Diagnostic with Nia"
      size="lg"
    >
      <form onSubmit={handleLaunchWhatsApp} className="space-y-5 text-stone-800 dark:text-stone-200">
        {/* Nia Vision Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/25 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">
            <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Nia&apos;s Growth Advisory Promise</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed italic">
            &ldquo;If you already have a working business but you&apos;ve reached a point where you don&apos;t know how to grow further, what&apos;s actually blocking you, or whether you should keep going in the same direction — that&apos;s exactly where I can help. We can sit together, identify the gaps, and build a strategy around them.&rdquo;
          </p>
        </div>

        {/* Founder & Venture Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Your Name / اسم المؤسس <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
              placeholder="e.g. أحمد علي"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Business / Venture Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. CloudOps Agency / متجر نيل"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Stage Selection */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
            <Building2 size={14} className="text-emerald-600" />
            <span>Where is your business right now? / وضع البيزنس الحالي</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VENTURE_STAGES.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setStage(s.id)}
                className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer flex items-center justify-between ${
                  stage === s.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-400'
                }`}
              >
                <span>{s.label}</span>
                {stage === s.id && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Blocker */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
            <Layers size={14} className="text-emerald-600" />
            <span>What is the core bottleneck blocking your growth? / الـ Block الرئيسي</span>
          </label>
          <select
            value={selectedBlocker}
            onChange={(e) => setSelectedBlocker(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            {COMMON_BLOCKERS.map((b, i) => (
              <option key={i} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Context */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
            Briefly describe the block / احكي باختصار إيه اللي واقف معاك
          </label>
          <textarea
            rows={3}
            value={customDetails}
            onChange={(e) => setCustomDetails(e.target.value)}
            placeholder="e.g. عندنا عملاء وطلب كويس بس مش عارفين نكبر التيم ومفيش نظام واضح للمبيعات... عاوزين استراتيجية تفك ده."
            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
          />
        </div>

        {/* Preview Message */}
        <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-750 space-y-1">
          <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <MessageCircle size={13} className="text-emerald-600" />
            <span>WhatsApp Diagnostic Request Preview:</span>
          </div>
          <p className="text-[11px] font-mono whitespace-pre-line text-stone-700 dark:text-stone-300 line-clamp-3">
            {buildWhatsAppMessage()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold text-xs cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer hover:scale-102"
          >
            <Send size={15} />
            <span>Send Diagnostic Request via WhatsApp</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
