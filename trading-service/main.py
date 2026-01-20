import time
import sys
import pandas as pd
from termcolor import colored
import config
import indicators
from connector import get_connector, MockConnector
from risk_manager import RiskManager
from strategy import Strategy

def main():
    print("Starting Freelas Trading Bot...")

    # 1. Connect
    connector = get_connector()
    if not connector.initialize():
        print("Failed to connect.")
        sys.exit(1)

    # 2. Setup
    risk_manager = RiskManager()
    strategy = Strategy()

    # Daily Reset Logic (Mock: Reset if we start fresh)
    account_info = connector.get_account_info()
    if account_info:
        risk_manager.reset_day(account_info['balance'])

    print(f"Connected. Balance: ${account_info['balance']:.2f}")

    try:
        while True:
            # Sync Account
            account_info = connector.get_account_info()
            if not account_info:
                print("Error fetching account info.")
                time.sleep(5)
                continue

            # Update Risk Manager
            status = risk_manager.update(account_info['balance'], account_info['equity'])

            # Print Dashboard
            print("\033[H\033[J", end="")
            print(colored("=== FREELAS TRADER BOT ===", "cyan", attrs=['bold']))
            print(f"Time: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Balance: ${account_info['balance']:.2f} | Equity: ${account_info['equity']:.2f}")

            report = risk_manager.get_progress_report()
            pnl_color = "green" if report['daily_pnl'] >= 0 else "red"
            print(f"Daily PnL: {colored(f'${report['daily_pnl']:.2f}', pnl_color)} ({report['daily_target_pct']:.2f}%)")
            print(f"Target Remaining (Phase {config.PHASE}): ${report['target_remaining']:.2f}")

            status_color = "green" if report['status']=='TRADING' else "red"
            print(f"Status: {colored(report['status'], status_color)}")

            if not risk_manager.can_trade():
                print(colored(f"Trading Stopped due to Risk Rules: {status}", "red", attrs=['bold']))
                if isinstance(connector, MockConnector):
                     time.sleep(5)
                     continue
                else:
                    time.sleep(60)
                    continue

            # Trading Loop
            print("-" * 55)
            print(f"{'SYMBOL':<10} {'PRICE':<10} {'TREND':<10} {'ACTION'}")
            print("-" * 55)

            for symbol in config.SYMBOLS:
                # Fetch Data
                df = connector.get_rates(symbol, config.TIMEFRAME)
                if df is None: continue

                # Add Indicators for Main Loop display
                df = indicators.calculate_sma(df, config.SMA_PERIOD)

                current_price = df['close'].iloc[-1]
                sma = df[f'SMA_{config.SMA_PERIOD}'].iloc[-1]
                trend = "UP" if current_price > sma else "DOWN"
                trend_color = "green" if trend == "UP" else "red"

                # Check for existing positions to avoid spamming
                open_positions = connector.get_positions(symbol)
                if len(open_positions) > 0:
                     print(f"{symbol:<10} {current_price:<10.5f} {colored(trend, trend_color):<10} {colored('HOLDING', 'blue')}")
                     continue

                # Check Signal
                signal = strategy.check_signal(df)

                print(f"{symbol:<10} {current_price:<10.5f} {colored(trend, trend_color):<10}", end="")

                if signal:
                    print(colored(f" SIGNAL: {signal['type']}", "magenta", attrs=['bold']))
                    print(f"    > Reason: {signal['reason']}")

                    # Execute Trade
                    # Calculate dynamic lots
                    risk_amt = account_info['balance'] * config.RISK_PER_TRADE_PCT
                    dist = abs(signal['price'] - signal['sl'])
                    if dist == 0: dist = 0.0001

                    # Standard Lot = 100,000 units.
                    # Lots = Risk / (Dist * ContractSize)
                    # Simplified for Forex pairs approx
                    lots = risk_amt / (dist * 100000)
                    lots = round(lots, 2)
                    if lots < 0.01: lots = 0.01

                    print(f"    > Risking ${risk_amt:.2f} | Lots: {lots}")

                    res = connector.place_trade(symbol, signal['type'], lots, signal['sl'], signal['tp1'])
                    if res:
                         print(colored("    > Trade Executed!", "green"))
                else:
                    print(" -")

            print("-" * 55)

            # If Mock, tick the engine to simulate time passing
            if isinstance(connector, MockConnector):
                connector.tick()
                time.sleep(2) # 2 seconds per "tick"
            else:
                time.sleep(10) # Live check every 10s

    except KeyboardInterrupt:
        print("\nExiting...")
        connector.shutdown()

if __name__ == "__main__":
    main()
