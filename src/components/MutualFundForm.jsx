import React, { useState } from 'react';

function MutualFundForm({ onAddMutualFund }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  
  const [capital, setCapital] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch matching funds based on user search string
  const handleSearchFunds = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    setError('');
    setSelectedFund(null);
    setAnalysisResult(null);

    // FIXED PRODUCTION ROUTE: Cleaned template backticks and added absolute cross-origin pathing parameters
    const targetUrl = `mfapi.in{searchQuery}`;
    const proxyUrl = `corsproxy.io{encodeURIComponent(targetUrl)}`;

    try {
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Server Response Failure. Code: ${response.status}`);
      }

      const data = await response.json();

      // Check if data is array and slice top 5
      if (Array.isArray(data)) {
        setSearchResults(data.slice(0, 5));
        if (data.length === 0) setError('No matching mutual funds found.');
      } else {
        throw new Error("Invalid response format received from data proxy.");
      }
    } catch (err) {
      setError(`Search Error: ${err.message}. Try typing a direct brand word like 'SBI' or 'Tata'.`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch historic NAV records and run investment tracking mathematics
  const handleAnalyzeFund = async () => {
    if (!selectedFund || !capital || !purchaseDate) return;
    setLoading(true);
    setError('');

    // FIXED PRODUCTION ROUTE: Ensures individual scheme code path is isolated correctly
    const targetUrl = `mfapi.in{selectedFund.schemeCode}`;
    const proxyUrl = `corsproxy.io{encodeURIComponent(targetUrl)}`;

    try {
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Data Stream Missing. Code: ${response.status}`);
      }

      const fullPayload = await response.json();
      const priceHistory = fullPayload.data;

      if (!priceHistory || priceHistory.length === 0) {
        throw new Error("Historical evaluation values missing for this fund.");
      }

      // Convert layout input date (YYYY-MM-DD) to matching API format (DD-MM-YYYY)
      const [year, month, day] = purchaseDate.split('-');
      const formattedInputDate = `${day}-${month}-${year}`;

      let selectedHistoryRecord = priceHistory.find(item => item.date === formattedInputDate);

      // Fallback Engine: If market was closed on selection date, match closest available profile
      if (!selectedHistoryRecord) {
        selectedHistoryRecord = priceHistory.reduce((closest, current) => {
          return Math.abs(new Date(current.date.split('-').reverse().join('-')) - new Date(purchaseDate)) <
                 Math.abs(new Date(closest.date.split('-').reverse().join('-')) - new Date(purchaseDate)) ? current : closest;
        });
      }

      const purchaseDayNav = parseFloat(selectedHistoryRecord.nav);
      const currentLatestNav = parseFloat(priceHistory[0].nav); // Fixed: target index 0 for current live NAV

      const totalUnitsAccumulated = Number(capital) / purchaseDayNav;
      const computedCurrentValue = totalUnitsAccumulated * currentLatestNav;
      const netProfitOrLoss = computedCurrentValue - Number(capital);
      const percentageGrowth = (netProfitOrLoss / Number(capital)) * 100;

      setAnalysisResult({
        purchasedNav: purchaseDayNav,
        latestNav: currentLatestNav,
        units: totalUnitsAccumulated,
        currentValue: computedCurrentValue,
        profit: netProfitOrLoss,
        growth: percentageGrowth,
        fundName: fullPayload.meta.scheme_name
      });
    } catch (err) {
      setError(`Calculation Loop Fault: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePushToNetWorth = () => {
    if (!analysisResult) return;
    onAddMutualFund(analysisResult.currentValue);
    
    // Wipe states
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFund(null);
    setCapital('');
    setPurchaseDate('');
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-4 border-t border-slate-800 pt-6">
      <h3 className="text-sm font-semibold text-slate-300">Add Mutual Fund (Live API Check)</h3>
      
      <div className="flex gap-2">
        <input 
          type="text"
          placeholder="Search fund (e.g. Parikh, SBI, Tata)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
        />
        <button 
          onClick={handleSearchFunds}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Find
        </button>
      </div>

      {loading && <p className="text-xs text-slate-400 animate-pulse">Running live network trace...</p>}
      {error && <p className="text-xs text-rose-400 bg-rose-950/20 p-2 border border-rose-900/30 rounded-lg font-mono">{error}</p>}

      {searchResults.length > 0 && !selectedFund && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg divide-y divide-slate-800 overflow-hidden">
          {searchResults.map((fund) => (
            <button
              key={fund.schemeCode}
              type="button"
              onClick={() => {
                setSelectedFund(fund);
                setSearchResults([]);
              }}
              className="w-full text-left p-2.5 text-xs text-slate-300 hover:bg-slate-800 block truncate"
            >
              {fund.schemeName}
            </button>
          ))}
        </div>
      )}

      {selectedFund && (
        <div className="bg-slate-800/30 border border-emerald-900/30 p-3 rounded-lg text-xs text-emerald-400">
          📍 Target: <span className="font-semibold text-slate-200">{selectedFund.schemeName}</span>
        </div>
      )}

      {selectedFund && !analysisResult && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Invested Principal ($ / ₹)</label>
            <input 
              type="number" 
              placeholder="Enter principal amount"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Purchase Date</label>
            <input 
              type="date" 
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAnalyzeFund}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg font-medium"
          >
            Calculate Past Performance & Live Value
          </button>
        </div>
      )}

      {analysisResult && (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5 text-xs">
          <p className="font-bold text-slate-200 text-center border-b border-slate-800 pb-2">Analysis Results</p>
          <div className="flex justify-between"><span className="text-slate-400">Purchase Day NAV:</span> <span className="text-white">${analysisResult.purchasedNav.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Latest Current NAV:</span> <span className="text-white">${analysisResult.latestNav.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Units Owned:</span> <span className="text-white">{analysisResult.units.toFixed(3)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Current Valuation:</span> <span className="font-bold text-white">${analysisResult.currentValue.toFixed(2)}</span></div>
          <div className="flex justify-between">
            <span className="text-slate-400">Net Return P&L:</span> 
            <span className={`font-bold ${analysisResult.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${analysisResult.profit.toFixed(2)} ({analysisResult.growth.toFixed(2)}%)
            </span>
          </div>
          
          <button
            type="button"
            onClick={handlePushToNetWorth}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-2 rounded-lg transition-colors mt-2"
          >
            Push Current Value to Net Worth
          </button>
        </div>
      )}
    </div>
  );
}

export default MutualFundForm;
