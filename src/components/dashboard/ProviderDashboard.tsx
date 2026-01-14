import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MapPin, Clock, User, DollarSign, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ServiceRequest {
  request_id: number;
  service_name: string;
  details: string;
  address: string;
  status: string;
  created_at: string;
  customer_name: string;
}

interface ProviderProfile {
  provider_id: number;
  hourly_rate: number;
  bio: string;
  is_available: boolean;
}

export const ProviderDashboard: React.FC = () => {
  const [availableRequests, setAvailableRequests] = useState<ServiceRequest[]>([]);
  const [myAssignments, setMyAssignments] = useState<ServiceRequest[]>([]);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProviderData();
    }
  }, [user]);

  const fetchProviderData = async () => {
    try {
      // Fetch provider profile
      const { data: profileData, error: profileError } = await supabase
        .from('service_providers_2025_10_21_05_26')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching provider profile:', profileError);
      } else {
        setProviderProfile(profileData);
      }

      // Fetch available requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('service_requests_2025_10_21_05_26')
        .select(`
          request_id,
          details,
          address,
          status,
          created_at,
          services_2025_10_21_05_26 (
            service_name
          ),
          user_profiles_2025_10_21_05_26 (
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching available requests:', requestsError);
      } else {
        const formattedRequests = requestsData.map(item => ({
          request_id: item.request_id,
          service_name: item.services_2025_10_21_05_26?.service_name || 'Unknown Service',
          details: item.details,
          address: item.address,
          status: item.status,
          created_at: item.created_at,
          customer_name: item.user_profiles_2025_10_21_05_26?.full_name || 'Unknown Customer',
        }));
        setAvailableRequests(formattedRequests);
      }

      // Fetch my assignments
      if (profileData) {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments_2025_10_21_05_26')
          .select(`
            assignment_id,
            assigned_date,
            status,
            service_requests_2025_10_21_05_26 (
              request_id,
              details,
              address,
              status,
              created_at,
              services_2025_10_21_05_26 (
                service_name
              ),
              user_profiles_2025_10_21_05_26 (
                full_name
              )
            )
          `)
          .eq('provider_id', profileData.provider_id)
          .order('assigned_date', { ascending: false });

        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
        } else {
          const formattedAssignments = assignmentsData.map(item => ({
            request_id: item.service_requests_2025_10_21_05_26.request_id,
            service_name: item.service_requests_2025_10_21_05_26.services_2025_10_21_05_26?.service_name || 'Unknown Service',
            details: item.service_requests_2025_10_21_05_26.details,
            address: item.service_requests_2025_10_21_05_26.address,
            status: item.service_requests_2025_10_21_05_26.status,
            created_at: item.service_requests_2025_10_21_05_26.created_at,
            customer_name: item.service_requests_2025_10_21_05_26.user_profiles_2025_10_21_05_26?.full_name || 'Unknown Customer',
          }));
          setMyAssignments(formattedAssignments);
        }
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProviderProfile = async (hourlyRate: number, bio: string) => {
    try {
      const { data, error } = await supabase
        .from('service_providers_2025_10_21_05_26')
        .insert({
          user_id: user?.id,
          hourly_rate: hourlyRate,
          bio: bio,
          is_available: true,
        })
        .select()
        .single();

      if (error) throw error;

      setProviderProfile(data);
      toast({
        title: "Success",
        description: "Provider profile created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProviderProfile = async (updates: Partial<ProviderProfile>) => {
    if (!providerProfile) return;

    try {
      const { data, error } = await supabase
        .from('service_providers_2025_10_21_05_26')
        .update(updates)
        .eq('provider_id', providerProfile.provider_id)
        .select()
        .single();

      if (error) throw error;

      setProviderProfile(data);
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const acceptRequest = async (requestId: number) => {
    if (!providerProfile) return;

    try {
      const { error } = await supabase
        .from('assignments_2025_10_21_05_26')
        .insert({
          request_id: requestId,
          provider_id: providerProfile.provider_id,
          status: 'assigned',
        });

      if (error) throw error;

      // Update request status
      await supabase
        .from('service_requests_2025_10_21_05_26')
        .update({ status: 'assigned' })
        .eq('request_id', requestId);

      toast({
        title: "Success",
        description: "Request accepted successfully.",
      });

      fetchProviderData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!providerProfile) {
    return <ProviderSetup onComplete={createProviderProfile} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Provider Dashboard</h2>
          <p className="text-gray-600">Manage your services and view available requests</p>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {showSettings && (
        <ProviderSettings
          profile={providerProfile}
          onUpdate={updateProviderProfile}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Requests</h3>
          <div className="space-y-4">
            {availableRequests.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-gray-500">No available requests</div>
                </CardContent>
              </Card>
            ) : (
              availableRequests.map((request) => (
                <Card key={request.request_id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{request.service_name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {request.customer_name}
                        </CardDescription>
                      </div>
                      <Button size="sm" onClick={() => acceptRequest(request.request_id)}>
                        Accept
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-2">{request.details}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                      <MapPin className="h-3 w-3" />
                      {request.address}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">My Assignments</h3>
          <div className="space-y-4">
            {myAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-gray-500">No assignments yet</div>
                </CardContent>
              </Card>
            ) : (
              myAssignments.map((assignment) => (
                <Card key={assignment.request_id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{assignment.service_name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {assignment.customer_name}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{assignment.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-2">{assignment.details}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {assignment.address}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProviderSetup: React.FC<{ onComplete: (hourlyRate: number, bio: string) => void }> = ({ onComplete }) => {
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(hourlyRate);
    if (rate > 0 && bio.trim()) {
      onComplete(rate, bio.trim());
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Provider Profile</CardTitle>
        <CardDescription>
          Set up your profile to start receiving service requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              required
              placeholder="Enter your hourly rate"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              placeholder="Tell customers about your experience and services..."
              rows={4}
            />
          </div>
          <Button type="submit" className="w-full">
            Complete Setup
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const ProviderSettings: React.FC<{
  profile: ProviderProfile;
  onUpdate: (updates: Partial<ProviderProfile>) => void;
  onClose: () => void;
}> = ({ profile, onUpdate, onClose }) => {
  const [hourlyRate, setHourlyRate] = useState(profile.hourly_rate.toString());
  const [bio, setBio] = useState(profile.bio);
  const [isAvailable, setIsAvailable] = useState(profile.is_available);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      hourly_rate: parseFloat(hourlyRate),
      bio: bio.trim(),
      is_available: isAvailable,
    });
    onClose();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              rows={4}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="availability"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="availability">Available for new requests</Label>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};