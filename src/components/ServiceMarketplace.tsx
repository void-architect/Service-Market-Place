import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from './auth/AuthPage';
import { Dashboard } from './dashboard/Dashboard';

export const ServiceMarketplace: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
};