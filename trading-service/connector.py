import sys
import datetime
import random
import pandas as pd
import numpy as np
import config

# Try importing MetaTrader5, handle failure for non-Windows envs
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

class BaseConnector:
    def initialize(self): raise NotImplementedError
    def shutdown(self): raise NotImplementedError
    def get_rates(self, symbol, timeframe, num_candles=500): raise NotImplementedError
    def get_account_info(self): raise NotImplementedError
    def get_positions(self, symbol=None): raise NotImplementedError
    def place_trade(self, symbol, order_type, lots, sl, tp): raise NotImplementedError

class MT5Connector(BaseConnector):
    def initialize(self):
        if not mt5.initialize():
            print("initialize() failed, error code =", mt5.last_error())
            return False
        return True

    def shutdown(self):
        mt5.shutdown()

    def get_rates(self, symbol, timeframe_str, num_candles=500):
        # Map string timeframe to MT5 constant
        tf_map = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "H1": mt5.TIMEFRAME_H1,
        }
        tf = tf_map.get(timeframe_str, mt5.TIMEFRAME_M15)

        rates = mt5.copy_rates_from_pos(symbol, tf, 0, num_candles)
        if rates is None:
            return None

        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        return df

    def get_account_info(self):
        info = mt5.account_info()
        if info is None: return None
        return {"balance": info.balance, "equity": info.equity}

    def get_positions(self, symbol=None):
        if symbol:
            positions = mt5.positions_get(symbol=symbol)
        else:
            positions = mt5.positions_get()
        if positions is None:
            return []
        return positions

    def place_trade(self, symbol, order_type, lots, sl, tp):
        mt5_type = mt5.ORDER_TYPE_BUY if order_type == 'BUY' else mt5.ORDER_TYPE_SELL
        tick = mt5.symbol_info_tick(symbol)
        if not tick: return None

        info = mt5.symbol_info(symbol)
        if not info: return None
        digits = info.digits

        price = tick.ask if order_type == 'BUY' else tick.bid

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": float(lots),
            "type": mt5_type,
            "price": round(price, digits),
            "sl": round(float(sl), digits),
            "tp": round(float(tp), digits),
            "deviation": 20,
            "magic": config.MAGIC_NUMBER,
            "comment": "FreelasBot",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            print("Order send failed, retcode={}".format(result.retcode))
            return None
        return result

class MockConnector(BaseConnector):
    def __init__(self):
        self.balance = config.INITIAL_BALANCE
        self.equity = config.INITIAL_BALANCE
        self.positions = []

        # Initialize synthetic history for supported symbols
        self.history = {}
        for sym in config.SYMBOLS:
            self.history[sym] = self._generate_initial_history()

    def _generate_initial_history(self, num_candles=500):
        dates = pd.date_range(end=datetime.datetime.now(), periods=num_candles, freq='15min')
        # Random walk with trend
        np.random.seed(None)
        returns = np.random.normal(0, 0.0005, num_candles)
        # Add a slight trend sine wave
        t = np.linspace(0, 10, num_candles)
        trend = np.sin(t) * 0.005

        price_path = 1.1000 * (1 + np.cumsum(returns) + trend)

        df = pd.DataFrame(index=dates)
        df['close'] = price_path
        df['open'] = df['close'].shift(1).fillna(1.1000)
        df['high'] = df[['open', 'close']].max(axis=1) + 0.0002
        df['low'] = df[['open', 'close']].min(axis=1) - 0.0002
        df['tick_volume'] = np.random.randint(100, 1000, size=num_candles)
        df['time'] = df.index
        return df

    def tick(self):
        """Advance time and price for simulation."""
        for sym in self.history:
            df = self.history[sym]
            last_close = df.iloc[-1]['close']

            # Random move
            move = np.random.normal(0, 0.0005)
            new_close = last_close + move
            new_open = last_close
            new_high = max(new_open, new_close) + 0.0001
            new_low = min(new_open, new_close) - 0.0001

            new_time = df.iloc[-1]['time'] + datetime.timedelta(minutes=15)

            new_row = pd.DataFrame([{
                'time': new_time,
                'open': new_open,
                'high': new_high,
                'low': new_low,
                'close': new_close,
                'tick_volume': 500
            }]).set_index('time') # Re-index properly if needed, or just append

            # self.history[sym] = pd.concat([df, new_row]).iloc[1:] # Keep size constant?
            # Actually, `df` index is datetime.
            # Let's just append and drop first
            new_row.index = [new_time]
            self.history[sym] = pd.concat([df.iloc[1:], new_row])

            # Randomly update equity to simulate PnL fluctuation
            if len(self.positions) > 0:
                self.equity += np.random.uniform(-10, 20)

    def initialize(self):
        print("[Mock] Initialized virtual broker.")
        return True

    def shutdown(self):
        print("[Mock] Shutdown.")

    def get_rates(self, symbol, timeframe, num_candles=500):
        if symbol in self.history:
            return self.history[symbol]
        return self._generate_initial_history(num_candles)

    def get_account_info(self):
        return {"balance": self.balance, "equity": self.equity}

    def get_positions(self, symbol=None):
        if symbol is None: return self.positions
        return [p for p in self.positions if p['symbol'] == symbol]

    def place_trade(self, symbol, order_type, lots, sl, tp):
        print(f" >>> [Mock TRADE] {order_type} {symbol} | Lots: {lots:.2f} | Price: Market | SL: {sl:.5f} | TP: {tp:.5f}")
        self.positions.append({
            "symbol": symbol,
            "type": order_type,
            "entry_time": datetime.datetime.now()
        })
        return type('obj', (object,), {'retcode': 0, 'deal': 12345})

def get_connector():
    if config.MODE == "LIVE" and MT5_AVAILABLE:
        return MT5Connector()
    else:
        return MockConnector()
