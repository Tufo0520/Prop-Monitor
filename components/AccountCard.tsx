
import React, { useState } from 'react';
import { Account, GlobalConfig, AccountStatus } from '../types';
import { calculateStatus } from '../services/logic';
import { Trash, Wallet, CheckCircle, AlertCircle, TrendingUp, Settings } from './Icons';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  account: Account;
  config: GlobalConfig;
  onUpdate: (updated: Account) => void;
  onDelete: (id: string) => void;
}

export const AccountCard: React.FC<Props> = ({ account, config, onUpdate, onDelete }) => {
  const [newProfit, setNewProfit] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const status = calculateStatus(account, config);

  const handleAddProfit = () => {
    const updated: Account = {
      ...account,
      balance: account.balance + newProfit,
      dailyProfits: [...account.dailyProfits, newProfit]
    };
    onUpdate(updated);
    setNewProfit(0);
  };

  const handlePayout = () => {
    if (!status.canPayout) return;
    const payoutAmt = account.balance * 0.5;
    const postBal = account.balance - payoutAmt;
    const updated: Account = {
      ...account,
      balance: postBal,
      dailyProfits: [], // Resetting qualified days according to common prop-firm rules
      historyPayouts: [
        ...account.historyPayouts,
        { amount: payoutAmt, postBalance: postBal, date: new Date().toISOString() }
      ]
    };
    onUpdate(updated);
  };

  const handleManualUpdate = (field: keyof Account, value: any) => {
    onUpdate({ ...account, [field]: value });
  };

  const chartData = account.dailyProfits.map((p, i) => ({ day: i + 1, profit: p }));

  return (
    <div className={`group relative bg-white rounded-3xl shadow-sm border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${status.isBlown ? 'border-red-200 bg-red-50/10' : 'border-slate-100'}`}>
      {/* Blown Overlay */}
      {status.isBlown && (
        <div className="absolute top-4 right-16 px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-tighter rounded-full z-10 shadow-lg shadow-red-200">
          Account Blown
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          {isEditing ? (
            <input 
              autoFocus
              className="text-lg font-bold text-slate-800 bg-slate-50 border-b border-indigo-500 outline-none w-full mb-1"
              value={account.name}
              onChange={(e) => handleManualUpdate('name', e.target.value)}
              onBlur={() => setIsEditing(false)}
            />
          ) : (
            <div className="flex items-center gap-2 group/title" onClick={() => setIsEditing(true)}>
              <h3 className="text-lg font-bold text-slate-800 cursor-pointer">{account.name}</h3>
              <Settings className="w-3 h-3 text-slate-300 group-hover/title:text-indigo-400 transition-colors" />
            </div>
          )}
          
          <div className="flex items-center gap-3 mt-1">
            <select 
              className="text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-500 rounded-lg px-2 py-0.5 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
              value={account.type}
              onChange={(e) => handleManualUpdate('type', e.target.value)}
            >
              <option value="Manual">Manual</option>
              <option value="Algo">Algo</option>
            </select>
            <span className="text-[10px] font-mono text-slate-400">{account.id}</span>
          </div>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(account.id);
          }}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all lg:opacity-0 group-hover:opacity-100 active:scale-90"
          title="Delete Account"
        >
          <Trash className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Current Balance</p>
          <div className="flex items-baseline gap-1">
             <span className="text-slate-400 text-xs font-bold">$</span>
             <p className={`text-2xl font-black tracking-tight ${account.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
               {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
             </p>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border ${status.isBlown ? 'bg-red-50 border-red-100' : 'bg-indigo-50/30 border-indigo-50'}`}>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Status</p>
          <div className="flex items-center gap-2 mt-1">
            {status.isBlown ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
            <p className={`text-xs font-bold uppercase ${status.isBlown ? 'text-red-600' : 'text-slate-600'} truncate`}>
              {status.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mb-6 h-20">
        {account.dailyProfits.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                labelClassName="hidden"
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit']}
              />
              <Line type="stepAfter" dataKey="profit" stroke="#6366f1" strokeWidth={3} dot={false} animationDuration={1000} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 text-[10px] uppercase font-bold tracking-widest">
            Awaiting Data...
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payout Progress</span>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {status.qualifiedDays} / {config.requiredDays} Days
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${status.qualifiedDays >= config.requiredDays ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
              style={{ width: `${Math.min(100, (status.qualifiedDays / config.requiredDays) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
            <input 
              type="number" 
              value={newProfit || ''}
              onChange={(e) => setNewProfit(Number(e.target.value))}
              placeholder="Enter P/L"
              className="w-full pl-7 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
            />
          </div>
          <button 
            onClick={handleAddProfit}
            disabled={status.isBlown}
            className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all transform active:scale-95 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            RECORD
          </button>
        </div>

        {status.canPayout && (
          <button 
            onClick={handlePayout}
            className="w-full py-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <Wallet className="w-5 h-5" />
            Execute Payout
          </button>
        )}

        {account.historyPayouts.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Payouts</p>
            <div className="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              {account.historyPayouts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                  <span className="font-bold text-emerald-600">+${p.amount.toLocaleString()}</span>
                  <span className="text-slate-400 font-medium">{new Date(p.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
