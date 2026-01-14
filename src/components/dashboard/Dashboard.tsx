import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerDashboard } from './CustomerDashboard';
import { ProviderDashboard } from './ProviderDashboard';

export const Dashboard: React.FC = () => {
  const { user, userProfile, signOut } = useAuth();

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Service Marketplace
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{userProfile.full_name}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {userProfile.user_type}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile.full_name}!
          </h2>
          <p className="text-gray-600">
            {userProfile.user_type === 'customer' 
              ? 'Find and request services from local providers'
              : 'Manage your services and connect with customers'
            }
          </p>
        </div>

        {userProfile.user_type === 'customer' ? (
          <CustomerDashboard />
        ) : (
          <ProviderDashboard />
        )}
      </main>
    </div>
  );
};