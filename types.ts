
export type AccountType = 'Manual' | 'Algo';

export interface PayoutHistory {
  amount: number;
  postBalance: number;
  date: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  dailyProfits: number[];
  historyPayouts: PayoutHistory[];
}

export interface GlobalConfig {
  targetProfitThreshold: number;
  requiredDays: number;
}

export interface AccountStatus {
  canPayout: boolean;
  reason: string;
  isBlown: boolean;
  qualifiedDays: number;
}
