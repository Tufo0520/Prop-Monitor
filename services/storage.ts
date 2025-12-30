
import { Account, GlobalConfig } from '../types';

const ACCOUNTS_KEY = 'payout_monitor_accounts';
const CONFIG_KEY = 'payout_monitor_config';

export const loadAccounts = (): Account[] => {
  const data = localStorage.getItem(ACCOUNTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAccounts = (accounts: Account[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const loadConfig = (): GlobalConfig => {
  const data = localStorage.getItem(CONFIG_KEY);
  return data ? JSON.parse(data) : { targetProfitThreshold: 150, requiredDays: 5 };
};

export const saveConfig = (config: GlobalConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};
