import polars as pl
import polars_talib as plta

class IndicatorFactory:
    def __init__(self, df, params=None):
        """
        Initialize with polars DataFrame and optional parameter dictionary
        for technical indicators.
        Args:
            df: DataFrame with OHLCV data
            params: Dictionary of parameters for each indicator
        """
        self.df = df.clone()
        # Default parameters if none provided
        self.params = params or {
            'sma': {'period': 20},
            'ema': {'period': 20},
            'rsi': {'period': 14},
            'bollinger_bands': {'period': 20, 'std_dev': 2},
            'atr': {'period': 14},
            #'keltner_channels': {'period': 20, 'atr_multiplier': 2},
            'adx': {'period': 14},
            'obv': {},  # No parameters needed
            'mfi': {'period': 14},
            'cci': {'period': 20},
            'vwap': {'period': 5}
        }

    def calculate_sma(self, period):
        """
        Calculate Simple Moving Average (SMA)
        
        Args:
            period: Period for SMA
        """
        return pl.col("close").ta.sma(period).over("symbol").alias(f'sma_{period}')
    
    def calculate_ema(self, period):
        """
        Calculate Exponential Moving Average (EMA)
        
        Args:
            period: Period for EMA
        """
        return pl.col("close").ta.ema(period).over("symbol").alias(f'ema_{period}')

    def calculate_rsi(self, period):
        """
        Calculate Relative Strength Index (RSI)
        
        Args:
            period: Period for RSI
        """
        return pl.col("close").ta.rsi(period).over("symbol").alias(f'rsi')
    
    def calculate_bollinger_bands(self, period, std_dev):
        """
        Calculate Bollinger Bands
        
        Args:
            period: Period for Bollinger Bands
            std_dev: Standard deviation multiplier
        """
        # Bollinger Bands returns a struct with upper, middle, and lower bands
        return [
            pl.col("close").ta.bbands(period, std_dev).struct.field("upperband").over("symbol").alias(f'bb_upper'),
            pl.col("close").ta.bbands(period, std_dev).struct.field("middleband").over("symbol").alias(f'bb_middle'),
            pl.col("close").ta.bbands(period, std_dev).struct.field("lowerband").over("symbol").alias(f'bb_lower')
        ]
    
    def calculate_atr(self, period):
        """
        Calculate Average True Range (ATR)
        
        Args:
            period: Period for ATR
        """
        return plta.atr(
            pl.col("high"),
            pl.col("low"),
            pl.col("close"),
            timeperiod=period
        ).over("symbol").alias(f'atr')
    
    '''
    def calculate_keltner_channels(self, period, atr_multiplier):
        """
        Calculate Keltner Channels
        
        Args:
            period: Period for Keltner Channels
            atr_multiplier: ATR multiplier for Keltner Channels
        """
        # Keltner returns a struct with upper, middle, and lower channels
        return [
            plta.keltner(
                pl.col("high"),
                pl.col("low"),
                pl.col("close"),
                timeperiod=period,
                multiplier=atr_multiplier
            ).struct.field("upperband").over("symbol").alias(f'kc_upper'),
            plta.keltner(
                pl.col("high"),
                pl.col("low"),
                pl.col("close"),
                timeperiod=period,
                multiplier=atr_multiplier
            ).struct.field("middleband").over("symbol").alias(f'kc_middle'),
            plta.keltner(
                pl.col("high"),
                pl.col("low"),
                pl.col("close"),
                timeperiod=period,
                multiplier=atr_multiplier
            ).struct.field("lowerband").over("symbol").alias(f'kc_lower')
        ]'''
    
    def calculate_adx(self, period):
        """
        Calculate Average Directional Index (ADX)
        
        Args:
            period: Period for ADX
        """
        return plta.adx(
            pl.col("high"),
            pl.col("low"),
            pl.col("close"),
            timeperiod=period
        ).over("symbol").alias(f'adx')
    
    def calculate_obv(self):
        """
        Calculate On Balance Volume (OBV)
        """
        return plta.obv(
            pl.col("close"),
            pl.col("volume")
        ).over("symbol").alias(f'obv')
    
    def calculate_mfi(self, period):
        """
        Calculate Money Flow Index (MFI)
        
        Args:
            period: Period for MFI
        """
        return plta.mfi(
            pl.col("high"),
            pl.col("low"),
            pl.col("close"),
            pl.col("volume"),
            timeperiod=period
        ).over("symbol").alias(f'mfi')
    
    def calculate_cci(self, period):
        """
        Calculate Commodity Channel Index (CCI)
        
        Args:
            period: Period for CCI
        """
        return plta.cci(
            pl.col("high"),
            pl.col("low"),
            pl.col("close"),
            timeperiod=period
        ).over("symbol").alias(f'cci')
    
    def calculate_vwap(self, period):
        """
        Calculate Volume Weighted Average Price (VWAP)
        
        Args:
            period: Period for VWAP (for rolling window)
        """
        # VWAP is typically calculated as (price * volume) / volume over a period
        # Using a rolling window approach
        return (
            (pl.col("close") * pl.col("volume"))
            .rolling_sum(window_size=period, min_periods=1)
            .over("symbol") / 
            pl.col("volume").rolling_sum(window_size=period, min_periods=1).over("symbol")
        ).alias(f'vwap_calc')

    def calculate_indicators(self):
        """
        Calculate all technical indicators using parameters from self.params
        """
        # Dictionary mapping indicator names to their calculation methods
        indicator_methods = {
            'sma': lambda params: self.calculate_sma(params['period']),
            'ema': lambda params: self.calculate_ema(params['period']),
            'rsi': lambda params: self.calculate_rsi(params['period']),
            'bollinger_bands': lambda params: self.calculate_bollinger_bands(params['period'], params['std_dev']),
            'atr': lambda params: self.calculate_atr(params['period']),
            #'keltner_channels': lambda params: self.calculate_keltner_channels(params['period'], params['atr_multiplier']),
            'adx': lambda params: self.calculate_adx(params['period']),
            'obv': lambda params: self.calculate_obv(),
            'mfi': lambda params: self.calculate_mfi(params['period']),
            'cci': lambda params: self.calculate_cci(params['period']),
            'vwap': lambda params: self.calculate_vwap(params['period'])
        }
        
        # Collect all expressions to apply
        expressions = []
        
        # Process each indicator
        for indicator_name, indicator_params in self.params.items():
            if indicator_name in indicator_methods:
                result = indicator_methods[indicator_name](indicator_params)
                # Handle both single expressions and lists of expressions
                if isinstance(result, list):
                    expressions.extend(result)
                else:
                    expressions.append(result)
        
        # Apply all expressions at once for efficiency
        if expressions:
            self.df = self.df.with_columns(expressions)
        
        return self.df

    def _calculate_previous_values(self) -> pl.DataFrame:
        '''
        Get all the previous values for close + indicator columns
        '''
        result_df = self.df.clone()
        exclude_cols = ['open', 'high', 'low', 'volume', 'trade_count', 'vwap'] # don't get prev values
        prev_col_list = [col for col in result_df.columns if col not in exclude_cols]
        
        # Create expressions for all previous value columns
        prev_expressions = []
        for col in prev_col_list:
            if col in result_df.columns:
                prev_expressions.append(
                    pl.col(col).shift(1).over("symbol").alias(f'{col}_prev')
                )
        
        # Apply all shift operations at once
        if prev_expressions:
            result_df = result_df.with_columns(prev_expressions)

        return result_df
    
    def get_indicators(self) -> pl.DataFrame:
        """
        Main method to calculate all indicators and return the enhanced DataFrame
        """
        # Calculate all indicators
        self.calculate_indicators()
        
        # Calculate previous values
        result_df = self._calculate_previous_values()
        
        return result_df