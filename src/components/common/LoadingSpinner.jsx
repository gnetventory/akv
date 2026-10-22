import React from 'react';

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-emerald-500 border-t-transparent animate-spin`}
      />
      {text && <p className="text-sm text-muted animate-pulse">{text}</p>}
    </div>
  );
}

export function LoadingOverlay({ text = 'Processing with AI...' }) {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-3 border-emerald-500/20" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
          <div className="absolute inset-2 text-2xl flex items-center justify-center">✨</div>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{text}</p>
      </div>
    </div>
  );
}
