import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Transfers from './pages/Transfers';
import MobileMoney from './pages/MobileMoney';
import Sales from './pages/Sales';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import ShopSetup from './pages/ShopSetup';
import AgentManagement from './pages/AgentManagement';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';

const AppRoutes = () => {
  const { user, userProfile, loading } = useAuth();
  const requiresShopSetup = Boolean(
    user &&
    userProfile?.role === 'owner' &&
    !userProfile?.shop_id
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />

      {user ? (
        requiresShopSetup ? (
          <>
            <Route path="/setup-shop" element={<ShopSetup />} />
            <Route path="*" element={<Navigate to="/setup-shop" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="transfers" element={<Transfers />} />
              <Route path="mobile-money" element={<MobileMoney />} />
              <Route path="sales" element={<Sales />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="reports" element={<Reports />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="agents" element={<AgentManagement />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="/setup-shop" element={<Navigate to="/" replace />} />
          </>
        )
      ) : (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
