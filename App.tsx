
import React, { useState, useEffect } from 'react';
import { Account, GlobalConfig } from './types';
import { loadAccounts, saveAccounts, loadConfig, saveConfig } from './services/storage';
import { AccountCard } from './components/AccountCard';
import { calculateStatus } from './services/logic';
import { TrendingUp, Settings, Plus, Wallet, Trash, CheckCircle } from './components/Icons';

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());
  const [config, setConfig] = useState<GlobalConfig>(() => loadConfig());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // Auto-delete blown accounts logic
  useEffect(() => {
    const blownAccount = accounts.find(acc => calculateStatus(acc, config).isBlown);
    
    if (blownAccount) {
      const timer = setTimeout(() => {
        setAccounts(prev => {
          const filtered = prev.filter(a => a.id !== blownAccount.id);
          if (filtered.length < prev.length) {
            setNotification(`Account "${blownAccount.name}" was liquidated and removed.`);
            setTimeout(() => setNotification(null), 4000);
          }
          return filtered;
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [accounts, config]);

  const addAccount = () => {
    const newId = `ACC-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newAccount: Account = {
      id: newId,
      name: `Account ${accounts.length + 1}`,
      type: 'Algo',
      balance: 0,
      dailyProfits: [],
      historyPayouts: []
    };
    setAccounts([...accounts, newAccount]);
  };

  const updateAccount = (updated: Account) => {
    setAccounts(accounts.map(acc => acc.id === updated.id ? updated : acc));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(acc => acc.id !== id));
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    localStorage.removeItem('payout_monitor_accounts');
    localStorage.removeItem('payout_monitor_config');
    setAccounts([]);
    setConfig({ 
      targetProfitThreshold: 150, 
      requiredDays: 5, 
      maxDrawdown: 2000,
      postPayoutLiquidationLevel: 0,
      subsequentPayoutRatio: 50
    });
    setConfirmReset(false);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalPayouts = accounts.reduce((sum, acc) => sum + acc.historyPayouts.reduce((s, p) => s + p.amount, 0), 0);

  return (
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/60 p-6 transform transition-all duration-500 lg:translate-x-0 lg:static lg:flex lg:flex-col ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} flex flex-col h-full`}>
        {/* Sidebar Header */}
        <div className="flex-shrink-0 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">Prop Monitor</h1>
            <p className="text-[9px] font-bold text-slate-400 mt-1 tracking-widest">AIsFuture</p>
          </div>
        </div>

        {/* Sidebar Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-8 mb-6">
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-50 pb-2">Evaluation Rules</h2>
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide group-focus-within:text-indigo-600 transition-colors">Daily Profit Target</label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                   <input 
                    type="number" 
                    value={config.targetProfitThreshold}
                    onChange={(e) => setConfig({ ...config, targetProfitThreshold: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide group-focus-within:text-indigo-600 transition-colors">Qualified Days</label>
                <input 
                  type="number" 
                  value={config.requiredDays}
                  onChange={(e) => setConfig({ ...config, requiredDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-4 border-b border-red-50 pb-2">Risk Controls</h2>
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide group-focus-within:text-red-600 transition-colors">Init Max Drawdown</label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                   <input 
                    type="number" 
                    value={config.maxDrawdown}
                    onChange={(e) => setConfig({ ...config, maxDrawdown: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide group-focus-within:text-red-600 transition-colors">Post-Payout Liq. Level</label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                   <input 
                    type="number" 
                    value={config.postPayoutLiquidationLevel}
                    onChange={(e) => setConfig({ ...config, postPayoutLiquidationLevel: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide group-focus-within:text-indigo-600 transition-colors">Subsequent Payout %</label>
                <div className="relative">
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                   <input 
                    type="number" 
                    value={config.subsequentPayoutRatio}
                    onChange={(e) => setConfig({ ...config, subsequentPayoutRatio: Math.min(100, Math.max(0, Number(e.target.value))) })}
                    className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="flex-shrink-0 flex flex-col gap-2 pt-4 border-t border-slate-100 bg-white">
          <button 
            onClick={addAccount}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transform active:scale-[0.98] transition-all text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            New Account
          </button>
          <button 
            onClick={handleReset}
            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${confirmReset ? 'bg-red-500 text-white animate-pulse' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
          >
            {confirmReset ? 'Confirm Clear?' : <><Trash className="w-3.5 h-3.5" />Reset Data & Settings</>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full p-4 md:p-8 lg:p-10 overflow-hidden relative">
        {notification && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm animate-in slide-in-from-top-8 duration-300 flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            {notification}
          </div>
        )}

        <div className="flex-shrink-0 flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between lg:hidden mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100/50">
                <TrendingUp className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">Prop Monitor</h1>
                <p className="text-[8px] font-bold text-slate-400 mt-0.5 tracking-widest">AIsFuture</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 active:scale-90 transition-all text-slate-600"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-200 overflow-hidden relative group transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Wallet className="w-3 h-3 text-indigo-400" />
                  <p className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em]">Net Balance</p>
                </div>
                <p className="text-xl font-black text-white tracking-tighter">${totalBalance.toLocaleString()}</p>
             </div>
             <div className="bg-emerald-500 p-4 rounded-2xl shadow-xl shadow-emerald-100 overflow-hidden relative group transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="flex items-center gap-2 mb-0.5">
                  <CheckCircle className="w-3 h-3 text-emerald-100" />
                  <p className="text-[8px] text-emerald-100/70 uppercase font-black tracking-[0.2em]">Total Payouts</p>
                </div>
                <p className="text-xl font-black text-white tracking-tighter">${totalPayouts.toLocaleString()}</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {accounts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-50 relative">
                 <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-5"></div>
                 <Wallet className="w-8 h-8 text-indigo-500 relative z-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Empty Vault</h2>
              <p className="text-slate-500 mb-8 text-xs leading-relaxed">Initialize a new account to start tracking payouts.</p>
              <button 
                onClick={addAccount}
                className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-widest text-xs"
              >
                Start Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 animate-in slide-in-from-bottom-2 duration-500 pb-8">
              {accounts.map(acc => (
                <AccountCard 
                  key={acc.id} 
                  account={acc} 
                  config={config} 
                  onUpdate={updateAccount} 
                  onDelete={deleteAccount} 
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="fixed -bottom-12 -right-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
    </div>
  );
};

export default App;
