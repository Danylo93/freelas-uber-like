import config

class RiskManager:
    def __init__(self, initial_balance=config.INITIAL_BALANCE):
        self.initial_balance = initial_balance
        self.current_balance = initial_balance
        self.daily_start_balance = initial_balance
        self.daily_pnl = 0.0
        self.can_trade_flag = True

        # Targets
        self.phase_target = config.TARGET_PHASE_1 if config.PHASE == 1 else config.TARGET_PHASE_2
        self.total_target_amount = initial_balance * self.phase_target

        print(f"[Risk] Initialized. Target Phase {config.PHASE}: ${self.total_target_amount:,.2f}")

    def reset_day(self, current_balance):
        """Call this at the start of a new trading day."""
        self.daily_start_balance = current_balance
        self.daily_pnl = 0.0
        self.can_trade_flag = True
        print(f"[Risk] New Day Reset. Start Balance: ${self.daily_start_balance:,.2f}")

    def update(self, current_balance, current_equity):
        """
        Update state with latest account info.
        Returns a status string indicating the state of risk limits.
        """
        self.current_balance = current_balance

        # Daily PnL is based on Equity vs Daily Start Balance
        # This accounts for open floating losses/gains
        self.daily_pnl = current_equity - self.daily_start_balance

        status = "OK"

        # 1. Check Daily Loss Limit (Hard Stop)
        # 4% of the *Daily Start Balance* (or Initial, depending on firm rules, usually daily start)
        max_loss_amount = self.daily_start_balance * config.MAX_DAILY_LOSS_PCT
        if self.daily_pnl <= -max_loss_amount:
            self.can_trade_flag = False
            status = "DAILY_LOSS_HIT"

        # 2. Check Daily Target (Soft Stop / Goal)
        target_amount = self.daily_start_balance * config.DAILY_TARGET_PCT
        if self.daily_pnl >= target_amount:
            # We don't stop trading automatically unless specified, but we flag it
            status = "DAILY_TARGET_HIT"

        # 3. Check Overall Phase Target
        total_profit = current_balance - self.initial_balance
        if total_profit >= self.total_target_amount:
            status = "PHASE_TARGET_HIT"
            self.can_trade_flag = False # Stop if passed

        return status

    def can_trade(self):
        return self.can_trade_flag

    def get_progress_report(self):
        total_profit = self.current_balance - self.initial_balance
        remaining = self.total_target_amount - total_profit

        return {
            "daily_pnl": self.daily_pnl,
            "daily_target_pct": (self.daily_pnl / self.daily_start_balance) * 100,
            "total_profit": total_profit,
            "target_remaining": remaining if remaining > 0 else 0.0,
            "status": "TRADING" if self.can_trade_flag else "STOPPED"
        }
