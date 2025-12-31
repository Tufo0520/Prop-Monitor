
import React, { useState } from 'react';
import { Account, GlobalConfig, AccountStatus, PayoutHistory } from '../types';
import { calculateStatus } from '../services/logic';
import { Trash, Wallet, CheckCircle, AlertCircle, TrendingUp, Settings, Plus } from './Icons';
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editingProfitIdx, setEditingProfitIdx] = useState<number | null>(null);
  const [editingProfitVal, setEditingProfitVal] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  // Execute Payout State
  const [isExecutingPayout, setIsExecutingPayout] = useState(false);
  const [payoutAmountInput, setPayoutAmountInput] = useState<number>(0);

  // Manual History Entry State
  const [isAddingPayout, setIsAddingPayout] = useState(false);
  const [manualPayout, setManualPayout] = useState<PayoutHistory>({
    amount: 0,
    postBalance: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const status = calculateStatus(account, config);
  const payoutRatio = config.subsequentPayoutRatio / 100;
  const maxAllowedPayout = Math.max(0, account.balance * payoutRatio);

  const handleAddProfit = () => {
    if (newProfit === 0) return;
    const updated: Account = {
      ...account,
      balance: account.balance + newProfit,
      dailyProfits: [...account.dailyProfits, newProfit]
    };
    onUpdate(updated);
    setNewProfit(0);
  };

  const handleEditHistory = (idx: number) => {
    setEditingProfitIdx(idx);
    setEditingProfitVal(account.dailyProfits[idx].toString());
  };

  const saveHistoryEdit = (idx: number) => {
    const newVal = parseFloat(editingProfitVal);
    if (isNaN(newVal)) return;
    
    const oldVal = account.dailyProfits[idx];
    const diff = newVal - oldVal;
    
    const newDailyProfits = [...account.dailyProfits];
    newDailyProfits[idx] = newVal;
    
    onUpdate({
      ...account,
      balance: account.balance + diff,
      dailyProfits: newDailyProfits
    });
    setEditingProfitIdx(null);
  };

  const deleteHistoryItem = (idx: number) => {
    const deletedVal = account.dailyProfits[idx];
    const newDailyProfits = account.dailyProfits.filter((_, i) => i !== idx);
    
    onUpdate({
      ...account,
      balance: account.balance - deletedVal,
      dailyProfits: newDailyProfits
    });
  };

  const handleAddManualPayout = () => {
    if (manualPayout.amount > maxAllowedPayout && account.balance > 0) {
      alert(`Manual payout cannot exceed ${config.subsequentPayoutRatio}% of balance ($${maxAllowedPayout.toLocaleString()})`);
      return;
    }

    const updated: Account = {
      ...account,
      historyPayouts: [...account.historyPayouts, { ...manualPayout, date: new Date(manualPayout.date).toISOString() }]
    };
    onUpdate(updated);
    setIsAddingPayout(false);
    setManualPayout({ amount: 0, postBalance: 0, date: new Date().toISOString().split('T')[0] });
  };

  const deletePayoutItem = (idx: number) => {
    const newPayouts = account.historyPayouts.filter((_, i) => i !== idx);
    onUpdate({ ...account, historyPayouts: newPayouts });
  };

  const startPayoutExecution = () => {
    setPayoutAmountInput(maxAllowedPayout);
    setIsExecutingPayout(true);
  };

  const handleConfirmPayout = () => {
    if (payoutAmountInput <= 0) return;
    if (payoutAmountInput > maxAllowedPayout) {
      alert(`Payout cannot exceed ${config.subsequentPayoutRatio}% of current balance ($${maxAllowedPayout.toLocaleString()})`);
      return;
    }

    const postBal = account.balance - payoutAmountInput;
    const updated: Account = {
      ...account,
      balance: postBal,
      dailyProfits: [],
      historyPayouts: [
        ...account.historyPayouts,
        { 
          amount: payoutAmountInput, 
          postBalance: postBal, 
          date: new Date().toISOString() 
        }
      ]
    };
    onUpdate(updated);
    setIsExecutingPayout(false);
  };

  const handleManualUpdate = (field: keyof Account, value: any) => {
    onUpdate({ ...account, [field]: value });
  };

  const chartData = account.dailyProfits.map((p, i) => ({ day: i + 1, profit: p }));

  return (
    <div className={`group relative bg-white rounded-3xl shadow-sm border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full ${status.isBlown ? 'border-red-200 bg-red-50/10' : 'border-slate-100'}`}>
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
        
        <div className="flex items-center gap-1">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(false);
                }}
                className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(account.id);
                }}
                className="px-3 py-1 text-[10px] font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 uppercase shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmingDelete(true);
              }}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all lg:opacity-0 group-hover:opacity-100 active:scale-90"
              title="Delete Account"
            >
              <Trash className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 items-stretch">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Current Balance</p>
          <div className="flex items-baseline gap-1">
             <span className="text-slate-400 text-xs font-bold">$</span>
             <p className={`text-2xl font-black tracking-tight ${account.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
               {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
             </p>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border flex flex-col justify-center ${status.isBlown ? 'bg-red-50 border-red-100' : 'bg-indigo-50/30 border-indigo-50'}`}>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Status</p>
          <div className="flex items-start gap-2 mt-1">
            <div className="mt-0.5 shrink-0">
              {status.isBlown ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className={`text-[11px] font-bold uppercase leading-tight ${status.isBlown ? 'text-red-600' : 'text-slate-600'}`}>
              {status.reason}
            </p>
          </div>
        </div>
      </div>

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

      <div className="space-y-4 flex-1">
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

        {status.canPayout && !isExecutingPayout && (
          <button 
            onClick={startPayoutExecution}
            className="w-full py-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <Wallet className="w-5 h-5" />
            Execute Payout
          </button>
        )}

        {isExecutingPayout && (
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-3 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Payout Amount</span>
              <span className="text-[10px] font-bold text-emerald-600">Max: ${maxAllowedPayout.toLocaleString()} ({config.subsequentPayoutRatio}%)</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">$</span>
              <input 
                type="number"
                max={maxAllowedPayout}
                className="w-full pl-7 pr-3 py-3 bg-white border border-emerald-200 rounded-2xl text-sm font-black text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={payoutAmountInput}
                onChange={(e) => setPayoutAmountInput(Number(e.target.value))}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsExecutingPayout(false)}
                className="flex-1 py-3 text-[10px] font-bold text-slate-400 hover:bg-white rounded-xl transition-all"
              >
                CANCEL
              </button>
              <button 
                onClick={handleConfirmPayout}
                className="flex-2 px-6 py-3 bg-emerald-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 transition-all uppercase tracking-widest"
              >
                CONFIRM PAYOUT
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-50 mt-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {showHistory ? 'Hide History' : 'Show History'}
            <div className={`transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`}>▼</div>
          </button>
          
          {showHistory && (
            <div className="mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                  Daily P/L Records
                  <span>Total: {account.dailyProfits.length}</span>
                </p>
                {account.dailyProfits.length === 0 ? (
                  <p className="text-[10px] text-slate-300 italic py-2">No records found.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {account.dailyProfits.map((profit, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100/50 group/item">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono w-4">#{idx + 1}</span>
                          {editingProfitIdx === idx ? (
                            <input 
                              autoFocus
                              type="number"
                              className="text-[11px] font-bold bg-white border border-indigo-200 rounded px-1 w-20 outline-none"
                              value={editingProfitVal}
                              onChange={(e) => setEditingProfitVal(e.target.value)}
                              onBlur={() => saveHistoryEdit(idx)}
                              onKeyDown={(e) => e.key === 'Enter' && saveHistoryEdit(idx)}
                            />
                          ) : (
                            <span className={`text-[11px] font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              ${profit.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditHistory(idx)}
                            className="p-1 hover:text-indigo-500 text-slate-300 transition-colors"
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => deleteHistoryItem(idx)}
                            className="p-1 hover:text-red-500 text-slate-300 transition-colors"
                          >
                            <Trash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )).reverse()}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payout History</p>
                  <button 
                    onClick={() => setIsAddingPayout(!isAddingPayout)}
                    className="p-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {isAddingPayout && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-indigo-100 space-y-3 mb-3 animate-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Amount</label>
                        <input 
                          type="number"
                          className="w-full text-xs font-bold p-2 rounded-xl bg-white border border-slate-200"
                          value={manualPayout.amount || ''}
                          onChange={e => setManualPayout({...manualPayout, amount: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Post Bal.</label>
                        <input 
                          type="number"
                          className="w-full text-xs font-bold p-2 rounded-xl bg-white border border-slate-200"
                          value={manualPayout.postBalance || ''}
                          onChange={e => setManualPayout({...manualPayout, postBalance: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Date</label>
                      <input 
                        type="date"
                        className="w-full text-xs font-bold p-2 rounded-xl bg-white border border-slate-200"
                        value={manualPayout.date}
                        onChange={e => setManualPayout({...manualPayout, date: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setIsAddingPayout(false)} className="flex-1 py-2 text-[10px] font-bold text-slate-400 hover:bg-slate-100 rounded-xl">Cancel</button>
                       <button onClick={handleAddManualPayout} className="flex-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-indigo-100">Add Record</button>
                    </div>
                  </div>
                )}

                {account.historyPayouts.length === 0 ? (
                  <p className="text-[10px] text-slate-300 italic py-2">No payouts yet.</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {account.historyPayouts.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50 group/payout">
                        <div className="flex flex-col">
                           <span className="font-black text-emerald-600">+${p.amount.toLocaleString()}</span>
                           <span className="text-[8px] text-slate-400">Post Bal: ${p.postBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-slate-400 font-medium">{new Date(p.date).toLocaleDateString()}</span>
                           <button 
                            onClick={() => deletePayoutItem(idx)}
                            className="p-1 opacity-0 group-hover/payout:opacity-100 hover:text-red-500 text-slate-300 transition-all"
                           >
                             <Trash className="w-3 h-3" />
                           </button>
                        </div>
                      </div>
                    )).reverse()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
