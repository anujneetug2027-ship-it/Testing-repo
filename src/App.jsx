import React, { useState } from 'react';
import NetWorthDisplay from './components/NetWorthDisplay';
import AssetForm from './components/AssetForm';

function App() {
  const [netWorth, setNetWorth] = useState(1000);

  const handleAddAsset = (valuation, shares) => {
    const totalEquityWorth = valuation * shares;
    setNetWorth((prevWorth) => prevWorth + totalEquityWorth);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center tracking-tight text-white">
          OmniWealth Tracker
        </h1>
        
        <NetWorthDisplay total={netWorth} />
        <AssetForm onAddAsset={handleAddAsset} />
      </div>
    </div>
  );
}

export default App;

