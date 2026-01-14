import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceRequestForm } from './ServiceRequestForm';
import { ServiceSearch } from './ServiceSearch';

interface ServiceRequest {
  request_id: number;
  service_name: string;
  details: string;
  address: string;
  status: string;
  created_at: string;
}

export const CustomerDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchServiceRequests();
    }
  }, [user]);

  const fetchServiceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests_2025_10_21_05_26')
        .select(`
          request_id,
          details,
          address,
          status,
          created_at,
          services_2025_10_21_05_26 (
            service_name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching service requests:', error);
      } else {
        const formattedData = data.map(item => ({
          request_id: item.request_id,
          service_name: item.services_2025_10_21_05_26?.service_name || 'Unknown Service',
          details: item.details,
          address: item.address,
          status: item.status,
          created_at: item.created_at,
        }));
        setRequests(formattedData);
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleRequestService = (providerId: number) => {
    setShowRequestForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Dashboard</h2>
          <p className="text-gray-600">Find services and manage your requests</p>
        </div>
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {showRequestForm && (
        <ServiceRequestForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={() => {
            setShowRequestForm(false);
            fetchServiceRequests();
          }}
        />
      )}

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="search">Find Providers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-500 mb-4">No service requests yet</div>
              <Button onClick={() => setShowRequestForm(true)}>
                Create Your First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.request_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.service_name}</CardTitle>
                    <CardDescription>{request.address}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      {request.status.replace('_', ' ')}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{request.details}</p>
                <p className="text-sm text-gray-500">
                  Requested on {new Date(request.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
          </div>
        </TabsContent>
        
        <TabsContent value="search">
          <ServiceSearch onRequestService={handleRequestService} />
        </TabsContent>
      </Tabs>
    </div>
  );
};