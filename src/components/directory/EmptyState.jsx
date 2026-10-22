import React from 'react';
import { UserPlus, Search } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function EmptyState({ isFiltered = false }) {
  const { setActiveTab, setSearchQuery, setStageFilter } = useApp();

  if (isFiltered) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
        <div className="w-14 h-14 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-400 mb-3">
          <Search size={28} />
        </div>
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
          No matching members found
        </h3>
        <p className="text-stone-500 dark:text-stone-400 text-xs mb-5 max-w-xs leading-relaxed">
          Try adjusting your search query or stage/industry filters.
        </p>
        <button
          onClick={() => {
            setSearchQuery('');
            setStageFilter('all');
          }}
          className="btn-secondary text-xs"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  return (
    <div className="card flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-emerald-200 dark:border-emerald-800">
        🌱
      </div>
      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
        Your community directory is empty
      </h3>
      <p className="text-stone-500 dark:text-stone-400 text-xs mb-6 max-w-sm leading-relaxed">
        Submit new member introductions via the intake form — AI will automatically structure their profile,
        role, skills, and stage.
      </p>
      <button onClick={() => setActiveTab('add')} className="btn-primary text-xs">
        <UserPlus size={15} />
        Add First Member
      </button>
    </div>
  );
}
