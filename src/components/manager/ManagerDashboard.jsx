import React, { useMemo } from 'react';
import {
  TrendingUp,
  MapPin,
  MessageSquareHeart,
  AlertCircle,
  CheckCircle2,
  Users,
  Scale,
  Handshake,
  Download,
} from 'lucide-react';
import { calculateManagerInsights } from '../../utils/managerAnalytics';
import { useApp } from '../../contexts/AppContext';

export default function ManagerDashboard() {
  const { members, language = 'en' } = useApp();
  const isAr = language === 'ar';

  const insights = useMemo(() => calculateManagerInsights(members), [members]);

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white border border-stone-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              {isAr ? 'لوحة تحكم إدارة المجتمع' : 'AKV Community Insights'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight">
            {isAr ? 'مؤشرات الأداء ونبض المجتمع' : 'Executive Business Dashboard'}
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {isAr
              ? 'تحليلات العرض والطلب، احتياجات الأعضاء، وأماكن اللقاءات المقترحة'
              : 'Real-time supply & demand balance, member shortages, and meetup intelligence'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-emerald-300">
            {insights.totalMembers} {isAr ? 'عضو نشط' : 'Total Members'}
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Requests (Asks) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isAr ? 'طلبات المساعدة' : 'Member Requests'}
            </span>
            <AlertCircle size={15} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 font-mono">
            {insights.totalAsks}
          </div>
          <p className="text-[10.5px] text-stone-500">
            {isAr ? 'أعضاء يبحثون عن خدمات' : 'Founders seeking help'}
          </p>
        </div>

        {/* Metric 2: Total Offers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isAr ? 'الخدمات المعروضة' : 'Services Offered'}
            </span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 font-mono">
            {insights.totalOffers}
          </div>
          <p className="text-[10.5px] text-stone-500">
            {isAr ? 'أعضاء يقدمون مساعدة' : 'Founders offering skills'}
          </p>
        </div>

        {/* Metric 3: Supply/Demand Ratio */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isAr ? 'توازن العرض والطلب' : 'Supply & Demand'}
            </span>
            <Scale size={15} className="text-sky-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 font-mono">
            {insights.liquidityRatio}x
          </div>
          <p className="text-[10.5px] text-stone-500">
            {parseFloat(insights.liquidityRatio) >= 1
              ? (isAr ? 'عروض كافية للطلبات' : 'Healthy liquidity ratio')
              : (isAr ? 'نقص في مقدمي الخدمات' : 'Service shortage')}
          </p>
        </div>

        {/* Metric 4: Survey Responses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isAr ? 'إجابات الاستطلاع' : 'Survey Responses'}
            </span>
            <MessageSquareHeart size={15} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 font-mono">
            {insights.totalSurveys}
          </div>
          <p className="text-[10.5px] text-stone-500">
            {isAr ? 'آراء ومقترحات مسجلة' : 'Recorded community pulses'}
          </p>
        </div>
      </div>

      {/* Grid: Service Gaps & Location Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Panel 1: Most Needed Services (Shortages) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                {isAr ? 'الخدمات الأكثر طلباً ونقصاً' : 'Most Needed Services'}
              </h3>
              <p className="text-xs text-stone-500">
                {isAr
                  ? 'المجالات التي يبحث عنها الأعضاء أكثر من مقدميها (فرص للشراكة)'
                  : 'High demand vs low providers — Top opportunities for vetted partnerships'}
              </p>
            </div>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>

          <div className="space-y-3 pt-1">
            {insights.serviceGaps.map((item) => (
              <div
                key={item.category}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-stone-800 dark:text-stone-200 block">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {item.asks} {isAr ? 'طلب' : 'Requests'} · {item.offers} {isAr ? 'مقدم خدمة' : 'Providers'}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold ${
                    item.status === 'High Shortage'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                      : item.status === 'High Supply'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Top Member Locations */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                {isAr ? 'أماكن تواجد الأعضاء' : 'Top Member Locations'}
              </h3>
              <p className="text-xs text-stone-500">
                {isAr
                  ? 'لتحديد أنسب الأماكن لعقد لقاءات القهوة والفعاليات الحصيفة'
                  : 'Geographic distribution for planning in-person meetups & coffee tables'}
              </p>
            </div>
            <MapPin size={16} className="text-amber-500" />
          </div>

          <div className="space-y-3 pt-1">
            {insights.locationBreakdown.map((loc) => (
              <div key={loc.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {loc.name}
                  </span>
                  <span className="font-mono text-stone-500">
                    {loc.count} ({loc.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${Math.min(100, loc.percentage * 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel 3: Live Survey Response Stream */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              {isAr ? 'أحدث إجابات استطلاع الرأي' : 'Recent Survey Responses'}
            </h3>
            <p className="text-xs text-stone-500">
              {isAr
                ? 'إجابات الأعضاء الموثقة عبر البريد الإلكتروني'
                : 'Verified member feedback from the 10-second community pulse'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            {insights.totalSurveys} {isAr ? 'إجابة مسجلة' : 'Total Answers'}
          </span>
        </div>

        {insights.recentSurveys.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center italic">
            {isAr
              ? 'لا توجد إجابات استطلاع بعد. ستظهر هنا فور إجابة أي عضو على نبض المجتمع.'
              : 'No survey answers yet. Responses will appear here as members complete the pulse card.'}
          </p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {insights.recentSurveys.map((s, idx) => (
              <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {s.email}
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-semibold text-stone-600 dark:text-stone-400">
                      {s.category || 'Feedback'}
                    </span>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-[11.5px]">
                    {s.questionText}
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    {s.answerText}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {s.submittedAt || s.createdAt ? new Date(s.submittedAt || s.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel 4: On-Platform Collaboration Requests */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              {isAr ? 'طلبات التواصل والشراكة الداخلية' : 'On-Platform Collaboration Requests'}
            </h3>
            <p className="text-xs text-stone-500">
              {isAr
                ? 'مبادرات التواصل بين الأعضاء داخل المنصة (بدون تحويل لواتساب)'
                : 'Direct founder-to-founder outreach sent through Quick Matches'}
            </p>
          </div>
          <Handshake size={16} className="text-emerald-500" />
        </div>

        {insights.recentCollabs.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center italic">
            {isAr
              ? 'لا توجد طلبات شراكة بعد.'
              : 'No collaboration requests yet.'}
          </p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {insights.recentCollabs.map((c, idx) => (
              <div key={idx} className="py-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    From: {c.senderEmail} ➔ To: {c.targetMemberName}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <p className="text-stone-600 dark:text-stone-300 italic bg-stone-50 dark:bg-stone-850 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800">
                  &ldquo;{c.note}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
