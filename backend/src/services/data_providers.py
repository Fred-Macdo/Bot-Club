"""
Data providers for fetching financial data
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import pandas as pd

logger = logging.getLogger(__name__)

class DataProvider:
    """Base class for data providers"""
    
    def get_historical_data(self, symbol: str, start_date: str, end_date: str, timeframe: str = '1d') -> pd.DataFrame:
        """Fetch historical data for a symbol"""
        raise NotImplementedError
    
class MockDataProvider(DataProvider):
    """Mock data provider for testing and development"""
    
    def get_historical_data(self, symbol: str, start_date: str, end_date: str, timeframe: str = '1d') -> pd.DataFrame:
        """Generate mock historical data"""
        logger.info(f"Generating mock data for {symbol} from {start_date} to {end_date}")
        
        # Generate sample OHLCV data
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        
        # Create realistic-looking price data
        base_price = 100.0
        data = []
        
        for i, date in enumerate(date_range):
            # Simple random walk with some volatility
            price_change = (i * 0.01) + (hash(str(date)) % 20 - 10) * 0.1
            price = base_price + price_change
            
            high = price * (1 + abs(hash(str(date + pd.Timedelta(hours=1))) % 5) * 0.001)
            low = price * (1 - abs(hash(str(date + pd.Timedelta(hours=2))) % 5) * 0.001)
            volume = 1000000 + (hash(str(date + pd.Timedelta(hours=3))) % 500000)
            
            data.append({
                'timestamp': date,
                'open': price,
                'high': high,
                'low': low,
                'close': price + (hash(str(date + pd.Timedelta(hours=4))) % 10 - 5) * 0.01,
                'volume': volume
            })
        
        df = pd.DataFrame(data)
        df.set_index('timestamp', inplace=True)
        return df

class DataProviderFactory:
    """Factory for creating data providers"""
    
    _providers = {
        'mock': MockDataProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_name: str = 'mock') -> DataProvider:
        """Get a data provider instance"""
        if provider_name not in cls._providers:
            logger.warning(f"Unknown data provider '{provider_name}', using mock provider")
            provider_name = 'mock'
            
        return cls._providers[provider_name]()
    
    @classmethod
    def register_provider(cls, name: str, provider_class: type):
        """Register a new data provider"""
        cls._providers[name] = provider_class
