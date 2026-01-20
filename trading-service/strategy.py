import indicators
import config

class Strategy:
    def __init__(self):
        pass

    def check_signal(self, df):
        """
        Analyzes the dataframe for entry signals based on:
        1. Trend (EMA/SMA 200)
        2. Dow Theory (Structure)
        3. Fibonacci Retracement
        """
        if df is None or len(df) < config.SMA_PERIOD + 10:
            return None

        # 1. Trend Filter
        df = indicators.calculate_sma(df, config.SMA_PERIOD)
        current_price = df['close'].iloc[-1]
        sma = df[f'SMA_{config.SMA_PERIOD}'].iloc[-1]

        # Determine Trend
        trend = "UP" if current_price > sma else "DOWN"

        # 2. Market Structure (Swings)
        swings = indicators.identify_swings(df, window=5)
        if len(swings) < 4:
            return None

        # Get the most recent completed swings
        # Note: identify_swings window means the last 'window' candles can't be confirmed swings yet.
        # So swings[-1] is the last *confirmed* swing, which happened 'window' bars ago.

        last_swing = swings[-1]
        prev_swing = swings[-2]

        # We need to know if we are currently retracing from the last swing.

        signal = None

        if trend == "UP":
            # Scenario: Impulse UP (Low -> High), now retracing DOWN.
            # So last confirmed swing should be the HIGH of the impulse.
            if last_swing['type'] != 'HIGH':
                return None

            # The swing before must be the LOW
            if prev_swing['type'] != 'LOW':
                return None

            # Dow Theory: Check if this High is higher than previous High
            prev_high = next((s for s in reversed(swings[:-2]) if s['type'] == 'HIGH'), None)
            if prev_high and last_swing['price'] <= prev_high['price']:
                # Not a higher high, maybe consolidation or reversal
                return None

            # Fibonacci Levels from Low (prev) to High (last)
            levels = indicators.calculate_fib_levels(prev_swing['price'], last_swing['price'], 'UP')

            # Check Zone: Between 50% and 61.8%
            # For Uptrend Retracement: Price drops.
            # 0.0 is High. 1.0 is Low.
            # 0.5 is Mid. 0.618 is Lower.

            upper_limit = levels['0.5']
            lower_limit = levels['0.618']

            # Allow some tolerance or check if inside
            if lower_limit <= current_price <= upper_limit:
                 return {
                    "type": "BUY",
                    "sl": prev_swing['price'], # Stop at previous Low
                    "tp1": levels['ext_1.0'],
                    "tp2": levels['ext_1.618'],
                    "price": current_price,
                    "reason": f"Uptrend pullback to Fib Zone ({lower_limit:.4f}-{upper_limit:.4f})"
                }

        elif trend == "DOWN":
            # Scenario: Impulse DOWN (High -> Low), now retracing UP.
            # Last confirmed swing should be LOW.
            if last_swing['type'] != 'LOW':
                return None

            if prev_swing['type'] != 'HIGH':
                return None

            # Dow Theory: Lower Lows
            prev_low = next((s for s in reversed(swings[:-2]) if s['type'] == 'LOW'), None)
            if prev_low and last_swing['price'] >= prev_low['price']:
                return None

            # Fib Levels from High (prev) to Low (last)
            levels = indicators.calculate_fib_levels(prev_swing['price'], last_swing['price'], 'DOWN')

            # Check Zone
            # For Downtrend Retracement: Price rises.
            # 0.5 is Mid. 0.618 is Higher.

            lower_limit = levels['0.5']
            upper_limit = levels['0.618']

            if lower_limit <= current_price <= upper_limit:
                return {
                    "type": "SELL",
                    "sl": prev_swing['price'], # Stop at previous High
                    "tp1": levels['ext_1.0'],
                    "tp2": levels['ext_1.618'],
                    "price": current_price,
                    "reason": f"Downtrend pullback to Fib Zone ({lower_limit:.4f}-{upper_limit:.4f})"
                }

        return None
