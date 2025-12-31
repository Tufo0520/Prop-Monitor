
import { Account, GlobalConfig } from '../types';

const ACCOUNTS_KEY = 'payout_monitor_accounts';
const CONFIG_KEY = 'payout_monitor_config';

export const loadAccounts = (): Account[] => {
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load accounts", e);
    return [];
  }
};

export const saveAccounts = (accounts: Account[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const loadConfig = (): GlobalConfig => {
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    const defaultVal: GlobalConfig = { 
      targetProfitThreshold: 150, 
      requiredDays: 5,
      maxDrawdown: 2000,
      postPayoutLiquidationLevel: 0,
      subsequentPayoutRatio: 50
    };
    if (!data) return defaultVal;
    
    const parsed = JSON.parse(data);
    return {
      targetProfitThreshold: parsed.targetProfitThreshold ?? defaultVal.targetProfitThreshold,
      requiredDays: parsed.requiredDays ?? defaultVal.requiredDays,
      maxDrawdown: parsed.maxDrawdown ?? defaultVal.maxDrawdown,
      postPayoutLiquidationLevel: parsed.postPayoutLiquidationLevel ?? defaultVal.postPayoutLiquidationLevel,
      subsequentPayoutRatio: parsed.subsequentPayoutRatio ?? defaultVal.subsequentPayoutRatio
    };
  } catch (e) {
    return { 
      targetProfitThreshold: 150, 
      requiredDays: 5, 
      maxDrawdown: 2000,
      postPayoutLiquidationLevel: 0,
      subsequentPayoutRatio: 50
    };
  }
};

export const saveConfig = (config: GlobalConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};
