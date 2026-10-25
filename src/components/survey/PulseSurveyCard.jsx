import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, ArrowRight, MessageSquareHeart } from 'lucide-react';
import { SURVEY_QUESTIONS } from '../../utils/surveyQuestions';
import { saveSurveyResponse, getSurveyResponses } from '../../utils/storage';
import { pushSurveyToSheets } from '../../utils/sheetsSync';
import { useApp } from '../../contexts/AppContext';

export default function PulseSurveyCard() {
  const { language = 'en', notify } = useApp();
  const isAr = language === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('question'); // 'question' | 'verify' | 'ask_more' | 'finished'
  const [hasDismissed, setHasDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already answered some questions
  useEffect(() => {
    try {
      const saved = getSurveyResponses();
      const answeredIds = new Set(saved.map((r) => r.questionId));
      const nextUnanswered = SURVEY_QUESTIONS.findIndex((q) => !answeredIds.has(q.id));
      if (nextUnanswered !== -1) {
        setCurrentIdx(nextUnanswered);
      } else {
        // All answered
        setHasDismissed(true);
      }
      // Re-use saved email if exists
      const lastWithEmail = saved.find((r) => r.email);
      if (lastWithEmail?.email) {
        setEmail(lastWithEmail.email);
      }
    } catch {
      // ignore
    }
  }, []);

  const currentQ = SURVEY_QUESTIONS[currentIdx] || SURVEY_QUESTIONS[0];

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    // If email is already saved from previous session, skip directly to submit
    if (email && email.includes('@')) {
      handleSubmit(email, option);
    } else {
      setStep('verify');
    }
  };

  const handleSubmit = async (submitEmail, option = selectedOption) => {
    if (!submitEmail || !submitEmail.includes('@')) {
      notify(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email', 'warning');
      return;
    }
    setIsSubmitting(true);
    const payload = {
      email: submitEmail.trim().toLowerCase(),
      questionId: currentQ.id,
      questionText: isAr ? currentQ.questionAr : currentQ.questionEn,
      answerId: option.id,
      answerText: isAr ? option.textAr : option.textEn,
      category: currentQ.category,
      language,
      submittedAt: new Date().toISOString(),
    };

    saveSurveyResponse(payload);
    await pushSurveyToSheets(payload);
    setIsSubmitting(false);

    if (currentIdx + 1 < SURVEY_QUESTIONS.length) {
      setStep('ask_more');
    } else {
      setStep('finished');
      setTimeout(() => {
        setIsOpen(false);
        setHasDismissed(true);
      }, 2500);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setCurrentIdx((prev) => prev + 1);
    setStep('question');
  };

  if (hasDismissed) return null;

  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <div
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[1500] animate-bounce"
          style={{ animationDuration: '3s' }}
        >
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-stone-900/90 dark:bg-emerald-950/90 text-white backdrop-blur-md border border-white/20 dark:border-emerald-700/50 shadow-xl hover:scale-105 transition-all cursor-pointer"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <MessageSquareHeart size={16} className="text-emerald-400" />
            <span className="text-xs font-bold font-sans">
              {isAr ? 'نبض المجتمع' : 'Quick Survey'}
            </span>
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
              {isAr ? 'سؤال سريع' : '10-Sec Pulse'}
            </span>
          </button>
        </div>
      )}

      {/* Interactive Card Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-2xl relative overflow-hidden transition-all"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {currentQ.category}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500 font-semibold">
                  {isAr
                    ? `سؤال ${currentIdx + 1} من ${SURVEY_QUESTIONS.length}`
                    : `Question ${currentIdx + 1} of ${SURVEY_QUESTIONS.length}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setHasDismissed(true);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* STEP 1: Question & Options */}
            {step === 'question' && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100 leading-snug">
                  {isAr ? currentQ.questionAr : currentQ.questionEn}
                </h3>
                <div className="space-y-2">
                  {currentQ.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className="w-full text-left p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200 group-hover:text-emerald-950 dark:group-hover:text-emerald-200">
                        {isAr ? opt.textAr : opt.textEn}
                      </span>
                      <ArrowRight
                        size={15}
                        className="text-stone-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Email Verification */}
            {step === 'verify' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
                    {isAr
                      ? `إجابتك: "${selectedOption?.textAr}"`
                      : `Selected: "${selectedOption?.textEn}"`}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                    {isAr
                      ? 'أدخل بريدك الإلكتروني لتأكيد مشاركتك في المجتمع:'
                      : 'Enter your email to verify your response & community badge:'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-emerald-500"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('question')}
                    className="px-3.5 py-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-bold"
                  >
                    {isAr ? 'رجوع' : 'Back'}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || !email.includes('@')}
                    onClick={() => handleSubmit(email)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>{isAr ? 'جارِ الحفظ...' : 'Saving...'}</span>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>{isAr ? 'تأكيد وإرسال' : 'Submit & Save'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Progression Loop (Ask 1 More Question?) */}
            {step === 'ask_more' && (
              <div className="space-y-4 py-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                    {isAr ? 'شكراً لمشاركتك! 🌟' : 'Awesome, thank you! 🌟'}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {isAr
                      ? 'تم تسجيل رأيك بنجاح. هل تحب الإجابة على سؤال سريع إضافي؟'
                      : 'Your voice shapes AKV. Would you like to answer 1 more quick question?'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setHasDismissed(true);
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    {isAr ? 'أكتفي بهذا الآن' : "I'm done for now"}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isAr ? 'نعم، سؤال آخر' : 'Yes, 1 more!'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Finished all questions */}
            {step === 'finished' && (
              <div className="space-y-3 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Check size={24} />
                </div>
                <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {isAr ? 'أنت بطل حقيقي في المجتمع! 🚀' : 'You are an Ecosystem Pioneer! 🚀'}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {isAr
                    ? 'أجبت على جميع الأسئلة. تم تحديث نقاط مساهمتك في AKV.'
                    : "You've answered all questions. Your community feedback badge is now active."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
