
import { Account, GlobalConfig, AccountStatus } from '../types';

export const calculateStatus = (acc: Account, config: GlobalConfig): AccountStatus => {
  const { balance, dailyProfits, historyPayouts } = acc;
  
  // 1. Qualified Days Statistics
  const qualifiedDays = dailyProfits.filter(p => p >= config.targetProfitThreshold).length;
  
  // 2. Comprehensive Risk Check
  let isBlown = false;
  let reason = "";

  // --- Rule 1: Drawdown / Liquidation Limit (Two-Stage) ---
  const hasPayouts = historyPayouts.length > 0;
  
  if (!hasPayouts) {
    // Stage 1: Before any payout, use Max Drawdown setting
    if (balance <= -config.maxDrawdown) {
      isBlown = true;
      reason = `Drawdown Limit Hit ($${balance.toLocaleString()})`;
    }
  } else {
    // Stage 2: After first payout, account blows if balance hits liquidation level
    if (balance <= config.postPayoutLiquidationLevel) {
      isBlown = true;
      reason = `Liquidated at $${config.postPayoutLiquidationLevel}`;
    }
  }
  
  // 3. Payout Eligibility Determination (if not blown)
  let canPayout = false;
  
  if (!isBlown) {
    if (historyPayouts.length === 0) {
      if (qualifiedDays >= config.requiredDays && balance > 0) {
        canPayout = true;
        reason = "First Payout Ready";
      } else {
        reason = `Need ${config.requiredDays - qualifiedDays} more qualified days`;
      }
    } else {
      const lastPayout = historyPayouts[historyPayouts.length - 1];
      const lastPayoutBal = lastPayout.postBalance;
      
      // Subsequent payout logic
      if (qualifiedDays >= config.requiredDays && balance > lastPayoutBal) {
        canPayout = true;
        reason = "Subsequent Payout Ready";
      } else if (balance <= lastPayoutBal) {
        reason = "Growth required since last payout";
      } else {
        reason = `Need ${config.requiredDays - qualifiedDays} more qualified days`;
      }
    }
  }
  
  return { canPayout, reason, isBlown, qualifiedDays };
};
