import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; // Adjust the path as necessary
import PrivateRoute from '../auth/PrivateRoute'; // Adjust the path as necessary
import LoginPage from '../auth/LoginPage'; // Adjust the path as necessary
import RegisterPage from '../auth/RegisterPage'; // Adjust the path as necessary
import StrategyBuilderPage from '../trading_strategy/StrategyBuilder'; // Adjust the path as necessary
import Login from '../auth/Login';
import Navbar from '../common/Navbar';
import { Paper, Button } from '@mui/material';
import LandingPage from '../landing/LandingPage';

// Other imports remain the same

const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Private Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/strategy-builder" element={<StrategyBuilderPage />} />
          </Route>

          {/* Redirect to login if no route matches */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;