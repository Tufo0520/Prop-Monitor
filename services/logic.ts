
import { Account, GlobalConfig, AccountStatus } from '../types';

export const calculateStatus = (acc: Account, config: GlobalConfig): AccountStatus => {
  const { balance, dailyProfits, historyPayouts } = acc;
  
  // 1. Qualified Days Statistics
  const qualifiedDays = dailyProfits.filter(p => p >= config.targetProfitThreshold).length;
  
  // 2. Drawdown Check (Simplified logic from source)
  let isBlown = false;
  if (historyPayouts.length === 0) {
    if (balance <= -2000) isBlown = true;
  } else {
    if (balance <= 0) isBlown = true;
  }
  
  // 3. Payout Eligibility Determination
  let canPayout = false;
  let reason = "";
  
  if (isBlown) {
    reason = "Account Blown (爆仓)";
  } else if (historyPayouts.length === 0) {
    if (qualifiedDays >= config.requiredDays) {
      canPayout = true;
      reason = "First Payout Ready";
    } else {
      reason = `Need ${config.requiredDays - qualifiedDays} more qualified days`;
    }
  } else {
    const lastPayout = historyPayouts[historyPayouts.length - 1];
    const lastPayoutBal = lastPayout.postBalance;
    
    if (qualifiedDays >= config.requiredDays && balance > lastPayoutBal) {
      canPayout = true;
      reason = "Subsequent Payout Ready";
    } else if (balance <= lastPayoutBal) {
      reason = "Balance must exceed post-payout level";
    } else {
      reason = `Need ${config.requiredDays - qualifiedDays} more qualified days`;
    }
  }
  
  return { canPayout, reason, isBlown, qualifiedDays };
};
