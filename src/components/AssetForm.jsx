import React, { useState } from 'react';

function AssetForm({ onAddAsset }) {
  const [valuation, setValuation] = useState('');
  const [equity, setEquity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valuation || !equity) return;

    onAddAsset(Number(valuation), Number(equity));

    setValuation('');
    setEquity('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">Add Equity Investment</h3>
      
      <div>
        <label className="block text-xs text-slate-400 mb-1">Share Valuation ($)</label>
        <input 
          type="number" 
          placeholder="e.g. 150"
          value={valuation}
          onChange={(e) => setValuation(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Quantity (Number of Shares)</label>
        <input 
          type="number" 
          placeholder="e.g. 10"
          value={equity}
          onChange={(e) => setEquity(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
          required
        />
      </div>

      <button 
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-2.5 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
      >
        Calculate & Add Asset
      </button>
    </form>
  );
}

export default AssetForm;

