// src/components/router/AppRouter.js (updated to include the new routes)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AlpacaProvider } from '../../context/AlpacaContext';
import PrivateRoute from '../auth/PrivateRoute';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import LoginPage from '../auth/LoginPage';
import RegisterPage from '../auth/RegisterPage';
import Dashboard from '../dashboard/Dashboard';
import StrategyBuilderPage from '../trading/StrategyBuilder';
import BacktestPage from '../trading/Backtest';
import PaperTradingPage from '../trading/PaperTrade';
import LiveTradingPage from '../trading/LiveTrade';
import AccountSettings from '../account/AccountSettings';
import LandingPage from '../landing/LandingPage';

const AppRouter = () => {
  return (
    <AlpacaProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/strategy-builder" element={<StrategyBuilderPage />} />
            <Route path="/strategy-builder/:id" element={<StrategyBuilderPage />} />
            <Route path="/backtest" element={<BacktestPage />} />
            <Route path="/backtest/:id" element={<BacktestPage />} />
            <Route path="/paper-trading" element={<PaperTradingPage />} />
            <Route path="/paper-trading/:id" element={<PaperTradingPage />} />
            <Route path="/live-trading" element={<LiveTradingPage />} />
            <Route path="/live-trading/:id" element={<LiveTradingPage />} />
            <Route path="/account" element={<AccountSettings />} />
          </Route>
        </Route>

        {/* Redirect to dashboard if authenticated, login if not */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AlpacaProvider>
  );
};

export default AppRouter;