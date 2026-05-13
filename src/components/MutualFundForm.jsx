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

  // 1. Fetch matching funds based on user typed text string
  const handleSearchFunds = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    setError('');
    setSelectedFund(null);
    setAnalysisResult(null);

    try {
      const response = await fetch(`mfapi.in{searchQuery}`);
      const data = await response.json();
      setSearchResults(data.slice(0, 5)); // Restrict to top 5 results for clean UI
      if (data.length === 0) setError('No matching mutual funds found.');
    } catch (err) {
      setError('Failed to fetch fund schemes. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch history and run investment growth simulations
  const handleAnalyzeFund = async () => {
    if (!selectedFund || !capital || !purchaseDate) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`mfapi.in{selectedFund.schemeCode}`);
      const fullPayload = await response.json();
      const priceHistory = fullPayload.data;

      if (!priceHistory || priceHistory.length === 0) {
        throw new Error("No pricing history data found for this fund scheme.");
      }

      // Format input date (YYYY-MM-DD) to match API payload text format (DD-MM-YYYY)
      const [year, month, day] = purchaseDate.split('-');
      const formattedInputDate = `${day}-${month}-${year}`;

      // Search for the historical price matching the specific purchase date
      let purchaseDayNav = null;
      let selectedHistoryRecord = priceHistory.find(item => item.date === formattedInputDate);

      // fallback: if market was closed on that date, find the closest previous date profile available
      if (!selectedHistoryRecord) {
        selectedHistoryRecord = priceHistory.reduce((closest, current) => {
          return Math.abs(new Date(current.date.split('-').reverse().join('-')) - new Date(purchaseDate)) <
                 Math.abs(new Date(closest.date.split('-').reverse().join('-')) - new Date(purchaseDate)) ? current : closest;
        });
      }

      purchaseDayNav = parseFloat(selectedHistoryRecord.nav);
      const currentLatestNav = parseFloat(priceHistory[0].nav);

      // Financial formulas to evaluate total valuation metrics
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
      setError('Could not trace historic calculations for selected date.');
    } finally {
      setLoading(false);
    }
  };

  const handlePushToNetWorth = () => {
    if (!analysisResult) return;
    onAddMutualFund(analysisResult.currentValue);
    
    // Clear state inputs completely
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
      
      {/* Search Input Panel */}
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
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Find
        </button>
      </div>

      {loading && <p className="text-xs text-slate-400 animate-pulse">Querying public servers...</p>}
      {error && <p className="text-xs text-rose-400">{error}</p>}

      {/* Select Box Results dropdown */}
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

      {/* If a fund is chosen, unlock valuation form fields */}
      {selectedFund && (
        <div className="bg-slate-800/30 border border-emerald-900/30 p-3 rounded-lg text-xs text-emerald-400">
          📍 Selected: <span className="font-semibold text-slate-200">{selectedFund.schemeName}</span>
        </div>
      )}

      {selectedFund && !analysisResult && (
        <div className="space-y-3 animate-fadeIn">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Invested Principal ($ / ₹)</label>
            <input 
              type="number" 
              placeholder="Total principal capital input"
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

      {/* Analysis Outputs Engine */}
      {analysisResult && (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5 text-xs animate-fadeIn">
          <p className="font-bold text-slate-200 text-center border-b border-slate-800 pb-2">Analysis Results</p>
          <div className="flex justify-between"><span class="text-slate-400">Purchase Day NAV:</span> <span class="text-white">${analysisResult.purchasedNav.toFixed(2)}</span></div>
          <div className="flex justify-between"><span class="text-slate-400">Latest Current NAV:</span> <span class="text-white">${analysisResult.latestNav.toFixed(2)}</span></div>
          <div className="flex justify-between"><span class="text-slate-400">Units Owned:</span> <span class="text-white">{analysisResult.units.toFixed(3)}</span></div>
          <div className="flex justify-between"><span class="text-slate-400">Current Valuation:</span> <span class="font-bold text-white">${analysisResult.currentValue.toFixed(2)}</span></div>
          <div className="flex justify-between">
            <span class="text-slate-400">Net Return P&L:</span> 
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

