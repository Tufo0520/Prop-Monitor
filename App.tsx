
import React, { useState, useEffect, useRef } from 'react';
import { Account, GlobalConfig } from './types';
import { loadAccounts, saveAccounts, loadConfig, saveConfig } from './services/storage';
import { AccountCard } from './components/AccountCard';
import { TrendingUp, Settings, Plus, Wallet, Trash } from './components/Icons';

const App: React.FC = () => {
  // 使用函数式初始化，确保第一渲染时就拿到存储的数据
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());
  const [config, setConfig] = useState<GlobalConfig>(() => loadConfig());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 监听 accounts 变化并保存
  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  // 监听 config 变化并保存
  useEffect(() => {
    saveConfig(config);
  }, [config]);

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
    if (window.confirm('Delete this account and all its history?')) {
      setAccounts(accounts.filter(acc => acc.id !== id));
    }
  };

  const clearAllData = () => {
    if (window.confirm('DANGER: Clear all data and reset system?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalPayouts = accounts.reduce((sum, acc) => sum + acc.historyPayouts.reduce((s, p) => s + p.amount, 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200/60 p-8 transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl shadow-indigo-200/50' : '-translate-x-full lg:static'}`}>
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 transform rotate-3 hover:rotate-0 transition-transform">
            <TrendingUp className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">PROP MONITOR</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Enterprise Edition</p>
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-2">Global Strategy</h2>
            <div className="space-y-6">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide group-focus-within:text-indigo-600 transition-colors">Daily Target Threshold</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                   <input 
                    type="number" 
                    value={config.targetProfitThreshold}
                    onChange={(e) => setConfig({ ...config, targetProfitThreshold: Number(e.target.value) })}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide group-focus-within:text-indigo-600 transition-colors">Required Qualified Days</label>
                <input 
                  type="number" 
                  value={config.requiredDays}
                  onChange={(e) => setConfig({ ...config, requiredDays: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-2">Network Status</h2>
             <div className="space-y-4">
               <div className="bg-slate-900 p-5 rounded-3xl shadow-xl shadow-slate-200 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                  <p className="text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">Total Active Balance</p>
                  <p className="text-2xl font-black text-white tracking-tighter">${totalBalance.toLocaleString()}</p>
               </div>
               <div className="bg-emerald-500 p-5 rounded-3xl shadow-xl shadow-emerald-100 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12"></div>
                  <p className="text-[10px] text-emerald-100 mb-1 uppercase font-black tracking-widest">Total Payouts Done</p>
                  <p className="text-2xl font-black text-white tracking-tighter">${totalPayouts.toLocaleString()}</p>
               </div>
             </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-3">
          <button 
            onClick={addAccount}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transform hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            <Plus className="w-5 h-5" />
            New Account
          </button>
          <button 
            onClick={clearAllData}
            className="w-full py-3 text-slate-300 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <Trash className="w-3 h-3" />
            Reset Application
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 lg:ml-0 overflow-y-auto">
        {/* Mobile Navbar */}
        <div className="flex items-center justify-between mb-10 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight">Monitor</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 active:scale-90 transition-all"
          >
            <Settings className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Account Grid */}
        {accounts.length === 0 ? (
          <div className="h-[75vh] flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4 animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-indigo-100 relative">
               <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-10"></div>
               <Wallet className="w-10 h-10 text-indigo-500 relative z-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Vault is Empty</h2>
            <p className="text-slate-500 mb-10 leading-relaxed font-medium">Add your funded trading accounts to start monitoring payout targets and drawdown safety levels.</p>
            <button 
              onClick={addAccount}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 transform hover:scale-105 active:scale-95 uppercase tracking-widest text-sm"
            >
              Initialize Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
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
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Background Decor */}
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="fixed top-1/4 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
    </div>
  );
};

export default App;
