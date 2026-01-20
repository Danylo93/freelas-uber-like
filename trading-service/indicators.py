import pandas as pd
import numpy as np

def calculate_sma(df, period=200):
    """Adds SMA column to DataFrame."""
    df[f'SMA_{period}'] = df['close'].rolling(window=period).mean()
    return df

def identify_swings(df, window=5):
    """
    Identifies fractal highs and lows.
    Returns list of {'index': i, 'price': p, 'type': 'HIGH'/'LOW', 'time': t}
    """
    highs = []
    lows = []

    # Iterate through dataframe (skipping edges)
    # Only check last N candles for performance in real-time loop?
    # For backtest/mock, check all.

    for i in range(window, len(df) - window):
        current_high = df['high'].iloc[i]
        current_low = df['low'].iloc[i]

        # Check High
        is_high = True
        for k in range(1, window + 1):
            if df['high'].iloc[i-k] >= current_high or df['high'].iloc[i+k] > current_high:
                is_high = False
                break
        if is_high:
            highs.append({'index': i, 'price': current_high, 'type': 'HIGH', 'time': df['time'].iloc[i]})

        # Check Low
        is_low = True
        for k in range(1, window + 1):
            if df['low'].iloc[i-k] <= current_low or df['low'].iloc[i+k] < current_low:
                is_low = False
                break
        if is_low:
            lows.append({'index': i, 'price': current_low, 'type': 'LOW', 'time': df['time'].iloc[i]})

    # Merge and sort by index
    swings = sorted(highs + lows, key=lambda x: x['index'])
    return swings

def calculate_fib_levels(p1, p2, type_trend):
    """
    p1: Start of impulse (Low for Uptrend)
    p2: End of impulse (High for Uptrend)
    Returns levels dictionary.
    """
    diff = abs(p2 - p1)
    levels = {}

    # Retracements
    # Uptrend: We retrace down from High (p2) towards Low (p1)
    # Level 50% = p2 - 0.5 * diff

    if type_trend == 'UP':
        levels['0.0'] = p2
        levels['0.382'] = p2 - (0.382 * diff)
        levels['0.5'] = p2 - (0.5 * diff)
        levels['0.618'] = p2 - (0.618 * diff)
        levels['1.0'] = p1
        # Extensions (Targets)
        levels['ext_1.0'] = p2 + diff # 100% extension
        levels['ext_1.618'] = p2 + (1.618 * diff)
    else: # DOWN
        levels['0.0'] = p2 # Low
        levels['0.382'] = p2 + (0.382 * diff)
        levels['0.5'] = p2 + (0.5 * diff)
        levels['0.618'] = p2 + (0.618 * diff)
        levels['1.0'] = p1 # High
        # Extensions
        levels['ext_1.0'] = p2 - diff
        levels['ext_1.618'] = p2 - (1.618 * diff)

    return levels
