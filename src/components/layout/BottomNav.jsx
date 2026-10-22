import React from 'react';
import { BarChart3, Users, Radio, Globe, HelpCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Snapshot', icon: BarChart3 },
  { id: 'directory', label: 'Directory', icon: Users, showBadge: true },
  { id: 'exchange', label: 'Problems', icon: HelpCircle },
  { id: 'radar', label: 'Radar', icon: Radio },
  { id: 'map', label: 'Atlas', icon: Globe },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, activeMembers: members } = useApp();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200/90 dark:border-stone-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] safe-area-bottom"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-150 relative cursor-pointer min-h-[48px] ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 font-medium'
              }`}
            >
              {/* Active Tab Accent Bar Pill */}
              {isActive && (
                <span className="absolute -top-1.5 w-8 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              )}

              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />

                {/* Member count badge on Directory */}
                {item.showBadge && (
                  <span className="absolute -top-1 -right-3 text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full bg-emerald-500 text-white leading-none">
                    {members?.length || 138}
                  </span>
                )}
              </div>

              <span className="text-[10.5px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
