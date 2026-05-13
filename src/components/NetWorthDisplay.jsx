import React from 'react';

function NetWorthDisplay({ total }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Current Net Worth
      </p>
      <p className="text-4xl font-extrabold text-emerald-400 mt-2 transition-all duration-300">
        ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default NetWorthDisplay;

