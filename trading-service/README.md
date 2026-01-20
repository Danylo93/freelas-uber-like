# Freelas Trading Bot Service

This service is a specialized trading module designed to automate trading strategies on the MetaTrader 5 (MT5) platform.

## Strategy Description

The bot implements a Trend Following strategy combined with Dow Theory and Fibonacci Retracements.

1.  **Trend Filter**: Uses a 200-period Moving Average (MA) to determine the macro trend.
    - Price > 200 MA = Uptrend (Look for Buys)
    - Price < 200 MA = Downtrend (Look for Sells)
2.  **Dow Theory**: Analyzes Market Structure for Highs and Lows.
    - Uptrend: Higher Highs (HH) and Higher Lows (HL).
    - Downtrend: Lower Lows (LL) and Lower Highs (LH).
3.  **Entry Trigger**:
    - Waits for a pullback (retracement) after a confirmed structure break.
    - Retracement must hit Fibonacci Golden Zone (e.g., 50% - 61.8%).
4.  **Exits**:
    - **Stop Loss**: Technical Stop placed at the previous Swing Low (for Buy) or Swing High (for Sell).
    - **Take Profit 1**: 100% extension or Risk:Reward 1:1.
    - **Take Profit 2**: 161.8% extension or Risk:Reward 1:2.

## Risk Management (Prop Firm Mode)

Designed to pass challenges with strict rules:
- **Phase 1 Target**: 10% profit.
- **Phase 2 Target**: 5% profit.
- **Max Daily Loss**: 4% (Hard stop for the day).
- **Daily Goal**: 2% (Optional stop to preserve gains).

## Requirements

- Windows OS (Required for MetaTrader 5 Terminal)
- Python 3.8+
- MetaTrader 5 Terminal installed and logged in.

## Installation

1.  Navigate to this directory:
    ```bash
    cd trading-service
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

Edit `config.py` (created on first run or manually) to set your parameters:
- `RISK_PER_TRADE`: % of equity to risk per trade.
- `MAX_DAILY_LOSS`: 4.0
- `DAILY_TARGET`: 2.0
- `SYMBOL_LIST`: List of pairs to trade (e.g., ["EURUSD", "GBPUSD"]).

## Running

```bash
python main.py
```

## Mock Mode (Development)

If run on a non-Windows environment or without MT5, the bot defaults to **Mock Mode**, simulating price data to demonstrate the logic.
