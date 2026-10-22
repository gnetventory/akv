import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Users,
  Compass,
  RotateCw,
} from 'lucide-react';
import {
  getRecentMembers,
  isMemberProfileUpdate,
} from '../../utils/welcomeAnnouncements';
import { getAvatarGradient, getInitials, parseMemberName } from '../../utils/helpers';
import { getCountryFlag, STAGES } from '../../utils/constants';

export default function NewMemberSpotlight({ members, onSelectMember }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('sed_dismiss_new_member_spotlight') === 'true';
    } catch {
      return false;
    }
  });

  const recentMembers = getRecentMembers(members, 14, 6);

  if (isDismissed || !recentMembers || recentMembers.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('sed_dismiss_new_member_spotlight', 'true');
    } catch {
      // ignore
    }
  };

  return (
    <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-amber-50/50 dark:from-emerald-950/40 dark:via-stone-900/80 dark:to-stone-900/80 border border-emerald-200/90 dark:border-emerald-800/60 p-4 sm:p-5 shadow-sm backdrop-blur-md transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles size={17} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white tracking-tight">
                🎉 Welcome Our Newest Members!
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                Fresh In The Network
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 font-medium mt-0.5 hidden sm:block">
              Meet the latest founders to join BGM. Explore their profiles, ventures, and uncover strategic synergies!
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 border border-emerald-200/60 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title={isCollapsed ? 'Expand Spotlight' : 'Collapse Spotlight'}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span className="text-[11px] hidden sm:inline">
              {isCollapsed ? 'Show' : 'Minimize'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl bg-white/80 dark:bg-stone-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-emerald-200/60 dark:border-stone-700 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
            title="Dismiss for this session"
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Expandable Carousel / Card Strip */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4 mt-3 border-t border-emerald-200/60 dark:border-stone-800">
          {recentMembers.map((m) => {
            const { english, arabic, primary } = parseMemberName(m.name);
            const stageObj = STAGES[m.stage] || STAGES.starting;
            const flag = getCountryFlag(m.location?.country);
            const isUpdate = isMemberProfileUpdate(m);

            return (
              <div
                key={m.id}
                onClick={() => onSelectMember?.(m)}
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-emerald-100 dark:border-stone-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar with subtle live pulse dot */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(
                            m.name
                          )} text-white font-extrabold text-xs flex items-center justify-center shadow-xs`}
                        >
                          {getInitials(m.name)}
                        </div>
                        <span
                          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-stone-900 shadow-xs ${
                            isUpdate ? 'bg-cyan-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {english || primary}
                        </h4>
                        {arabic && (
                          <p className="text-[10px] text-stone-500 font-semibold truncate" dir="rtl">
                            {arabic}
                          </p>
                        )}
                        <p className="text-[10.5px] text-stone-500 truncate mt-0.5">
                          {m.role || 'Founder'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${stageObj.bg} ${stageObj.text} ${stageObj.border}`}>
                      {stageObj.label}
                    </span>
                  </div>

                  {/* Venture Pitch highlight */}
                  <div className="text-[11px] text-stone-700 dark:text-stone-300 font-medium line-clamp-2 leading-snug">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      {m.business || 'Venture'}:
                    </span>{' '}
                    {m.lookingFor || m.canHelp || 'Exploring ecosystem partnerships.'}
                  </div>

                  {/* Location & Status badge */}
                  <div className="text-[10.5px] text-stone-500 flex items-center gap-1.5 flex-wrap">
                    <span>{flag}</span>
                    <span>{m.location?.city || 'Egypt'}</span>
                    <span>•</span>
                    {isUpdate ? (
                      <span className="text-[9.5px] text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 px-1.5 py-0.2 rounded-md font-extrabold flex items-center gap-0.5">
                        <RotateCw size={9} /> Profile Updated
                      </span>
                    ) : (
                      <span className="text-[9.5px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-md font-extrabold flex items-center gap-0.5">
                        <Sparkles size={9} /> Fresh Join
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Click Interactive Action: View Profile Card */}
                <div className="flex items-center gap-2 pt-3 mt-2.5 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMember?.(m);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    title="View Profile Card"
                  >
                    <Compass size={13} />
                    <span>View Profile Card</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
