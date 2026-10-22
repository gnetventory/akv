import React from 'react';
import { Users, UserPlus, Sparkles, Globe, Map, BarChart3, Radio, TrendingUp, HelpCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { NAV_TABS } from '../../utils/constants';

const ICONS = {
  Users,
  UserPlus,
  Sparkles,
  Globe,
  Map,
  BarChart3,
  Radio,
  HelpCircle,
};

export default function Sidebar() {
  const { activeTab, setActiveTab, activeMembers: members, sidebarOpen, setSidebarOpen } = useApp();

  const handleNav = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-stone-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-30 h-full w-64
        bg-[#FAFAF7] dark:bg-stone-950/95
        border-r border-stone-200/80 dark:border-stone-800
        lg:bg-transparent lg:border-none
        flex flex-col pt-20 pb-4
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:sticky lg:top-[69px] lg:translate-x-0 lg:h-[calc(100vh-69px)] lg:z-10 lg:pt-6 lg:pb-6
      `}
      >
        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1 lg:pr-2">
          {NAV_TABS.map((tab) => {
            const Icon = ICONS[tab.icon];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.id)}
                title={tab.description}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left
                  transition-all duration-150 group relative border
                  ${
                    isActive
                      ? 'bg-stone-900 text-white font-bold border-stone-900 shadow-sm'
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850 hover:text-stone-950 dark:hover:text-white font-semibold shadow-xs'
                  }
                `}
              >
                {Icon && (
                  <Icon
                    size={17}
                    className={
                      isActive
                        ? 'text-white flex-shrink-0'
                        : 'text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white flex-shrink-0 transition-colors'
                    }
                  />
                )}

                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-medium leading-none tracking-tight">{tab.label}</span>
                </div>

                {/* Member count badge on Directory tab */}
                {tab.id === 'directory' && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {members.length}
                  </span>
                )}

                {/* Dashboard "home" badge */}
                {tab.id === 'dashboard' && !isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold uppercase tracking-wider flex-shrink-0">
                    Home
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="pt-3 space-y-2 border-t border-stone-200/80 dark:border-stone-800 mt-3">
          {/* Community stats card */}
          <div className="card p-4 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-2 shadow-xs">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={14}
                className="text-emerald-600 flex-shrink-0"
              />
              <span className="text-[10.5px] font-bold text-stone-500 uppercase tracking-widest">
                Community Scale
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 font-display">
                {members.length}
              </span>
              <span className="text-xs text-stone-500 font-medium">community members</span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden border border-stone-200/60 dark:border-stone-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (members.length / 200) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
