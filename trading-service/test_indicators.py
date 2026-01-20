import unittest
import pandas as pd
import indicators

class TestIndicators(unittest.TestCase):
    def test_sma(self):
        data = {'close': [1, 2, 3, 4, 5]}
        df = pd.DataFrame(data)
        df = indicators.calculate_sma(df, period=3)
        # SMA of [3,4,5] is 4
        self.assertEqual(df['SMA_3'].iloc[-1], 4.0)

    def test_fib_levels_up(self):
        # Low=100, High=200. Diff=100.
        # Retracement 50% = 200 - 50 = 150.
        levels = indicators.calculate_fib_levels(100, 200, 'UP')
        self.assertEqual(levels['0.5'], 150.0)
        self.assertEqual(levels['0.0'], 200.0)
        self.assertEqual(levels['1.0'], 100.0)

    def test_fib_levels_down(self):
        # High=200, Low=100. Diff=100.
        # Retracement 50% = 100 + 50 = 150.
        levels = indicators.calculate_fib_levels(200, 100, 'DOWN')
        self.assertEqual(levels['0.5'], 150.0)
        self.assertEqual(levels['0.0'], 100.0)
        self.assertEqual(levels['1.0'], 200.0)

if __name__ == '__main__':
    unittest.main()
