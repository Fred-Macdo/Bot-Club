import os
import yaml
from pathlib import Path
from typing import List
from src.models.strategy import StrategyCreate, StrategyConfig, Condition, Indicator, RiskManagement

def load_strategy_from_yaml(yaml_path: str) -> StrategyCreate:
    """Load a strategy from a YAML file"""
    with open(yaml_path, 'r', encoding='utf-8') as file:
        data = yaml.safe_load(file)
    
    # Parse indicators
    indicators = []
    for indicator_data in data.get('indicators', []):
        indicators.append(Indicator(
            name=indicator_data['name'],
            params=indicator_data.get('params', {})
        ))
    
    # Parse entry conditions
    entry_conditions = []
    for condition_data in data.get('entry_conditions', []):
        entry_conditions.append(Condition(
            indicator=condition_data['indicator'],
            comparison=condition_data['comparison'],
            value=condition_data['value']
        ))
    
    # Parse exit conditions
    exit_conditions = []
    for condition_data in data.get('exit_conditions', []):
        exit_conditions.append(Condition(
            indicator=condition_data['indicator'],
            comparison=condition_data['comparison'],
            value=condition_data['value']
        ))
    
    # Parse risk management
    risk_mgmt_data = data.get('risk_management', {})
    risk_management = RiskManagement(
        position_sizing_method=risk_mgmt_data.get('position_sizing_method', 'risk_based'),
        risk_per_trade=risk_mgmt_data.get('risk_per_trade', 0.02),
        stop_loss=risk_mgmt_data.get('stop_loss', 0.05),
        take_profit=risk_mgmt_data.get('take_profit', 0.10),
        max_position_size=risk_mgmt_data.get('max_position_size', 10000.0),
        atr_multiplier=risk_mgmt_data.get('atr_multiplier', 2.0)
    )
    
    # Create strategy config
    config = StrategyConfig(
        symbols=data.get('symbols', []),
        timeframe=data.get('timeframe', '1d'),
        start_date=data.get('start_date', '2024-01-01'),
        end_date=data.get('end_date', '2024-12-31'),
        entry_conditions=entry_conditions,
        exit_conditions=exit_conditions,
        risk_management=risk_management,
        indicators=indicators
    )
    
    return StrategyCreate(
        name=data['name'],
        description=data.get('description', ''),
        config=config
    )

def get_default_strategies() -> List[StrategyCreate]:
    """Get default strategies loaded from YAML files"""
    strategies = []
    
    # Get the data directory path
    current_dir = Path(__file__).parent.parent.parent  # Go up to backend/
    data_dir = current_dir / 'data'
    
    # List of default strategy YAML files
    strategy_files = [
        'ema_crossover_strategy.yaml',
        'bollinger_bands_strategy.yaml',
        'macd_momentum_strategy.yaml'
    ]
    
    for filename in strategy_files:
        yaml_path = data_dir / filename
        if yaml_path.exists():
            try:
                strategy = load_strategy_from_yaml(str(yaml_path))
                strategies.append(strategy)
            except Exception as e:
                print(f"Error loading strategy from {filename}: {e}")
        else:
            print(f"Strategy file not found: {yaml_path}")
    
    return strategies