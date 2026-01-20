# Configuration for the Trading Bot

# Trading Settings
SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"]
TIMEFRAME = "M15"  # M1, M5, M15, M30, H1, H4, D1
MAGIC_NUMBER = 123456

# Strategy Settings
SMA_PERIOD = 200
FIB_RETRACTION_LEVELS = [0.5, 0.618]  # The "Golden Zone" for entries
RISK_REWARD_RATIO = 2.0  # Target at least 1:2

# Prop Firm / Risk Management Settings
INITIAL_BALANCE = 100000.0  # Example account size
PHASE = 1  # 1 or 2

# Targets (Percentage)
TARGET_PHASE_1 = 0.10  # 10%
TARGET_PHASE_2 = 0.05  # 5%

# Daily Limits (Percentage of Initial Balance or Daily Starting Balance)
MAX_DAILY_LOSS_PCT = 0.04  # 4%
DAILY_TARGET_PCT = 0.02    # 2%
RISK_PER_TRADE_PCT = 0.01  # 1% risk per trade

# Mode
MODE = "MOCK"  # "LIVE" or "MOCK". Automatically switches to MOCK if MT5 fails.
