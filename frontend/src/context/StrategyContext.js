// src/context/StrategyContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../components/router/AuthContext';
import { 
  fetchUserStrategies, 
  saveStrategy, 
  updateStrategy, 
  deleteStrategy 
} from '../api/AlpacaService';

const StrategyContext = createContext();

export function StrategyProvider({ children }) {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getStrategies = async () => {
      if (!user) {
        setStrategies([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchUserStrategies(user.id);
        
        if (result.success) {
          setStrategies(result.strategies || []);
        } else {
          setError(result.error || 'Failed to fetch strategies');
          setStrategies([]);
        }
      } catch (error) {
        console.error('Error in getStrategies:', error);
        setError('An unexpected error occurred');
        setStrategies([]);
      } finally {
        setLoading(false);
      }
    };

    getStrategies();
  }, [user]);

  const addStrategy = async (strategy) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await saveStrategy(strategy, user.id);
      
      if (result.success && result.strategy) {
        setStrategies([...strategies, result.strategy]);
        return { success: true, strategy: result.strategy };
      } else {
        setError(result.error || 'Failed to add strategy');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error in addStrategy:', error);
      setError('An unexpected error occurred');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const updateUserStrategy = async (id, strategy) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await updateStrategy(id, strategy, user.id);
      
      if (result.success && result.strategy) {
        setStrategies(strategies.map(s => s.id === id ? result.strategy : s));
        return { success: true, strategy: result.strategy };
      } else {
        setError(result.error || 'Failed to update strategy');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error in updateUserStrategy:', error);
      setError('An unexpected error occurred');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const deleteUserStrategy = async (id) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await deleteStrategy(id, user.id);
      
      if (result.success) {
        setStrategies(strategies.filter(s => s.id !== id));
        return { success: true };
      } else {
        setError(result.error || 'Failed to delete strategy');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error in deleteUserStrategy:', error);
      setError('An unexpected error occurred');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    strategies,
    loading,
    error,
    addStrategy,
    updateStrategy: updateUserStrategy,
    deleteStrategy: deleteUserStrategy,
    refreshStrategies: () => fetchUserStrategies(user?.id)
  };

  return <StrategyContext.Provider value={value}>{children}</StrategyContext.Provider>;
}

export function useStrategy() {
  return useContext(StrategyContext);
}