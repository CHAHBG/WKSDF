import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Transfers from './pages/Transfers';
import MobileMoney from './pages/MobileMoney';
import Sales from './pages/Sales';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AgentManagement from './pages/AgentManagement';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';

const AppRoutes = () => {
  const { user, loading } = useAuth();
  console.log('AppRoutes render. User:', user?.id, 'Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {user ? (
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
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
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
