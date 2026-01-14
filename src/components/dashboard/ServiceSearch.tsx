import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign, Star, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ServiceProvider {
  provider_id: number;
  full_name: string;
  hourly_rate: number;
  bio: string;
  is_available: boolean;
  service_names: string[];
}

interface ServiceSearchProps {
  onRequestService: (providerId: number) => void;
}

export const ServiceSearch: React.FC<ServiceSearchProps> = ({ onRequestService }) => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [searchTerm, providers]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_providers_2025_10_21_05_26')
        .select(`
          provider_id,
          hourly_rate,
          bio,
          is_available,
          user_profiles_2025_10_21_05_26 (
            full_name
          )
        `)
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching providers:', error);
      } else {
        const formattedProviders = data.map(provider => ({
          provider_id: provider.provider_id,
          full_name: provider.user_profiles_2025_10_21_05_26?.full_name || 'Unknown Provider',
          hourly_rate: provider.hourly_rate,
          bio: provider.bio,
          is_available: provider.is_available,
          service_names: ['General Services'], // Simplified for now
        }));
        setProviders(formattedProviders);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProviders = () => {
    if (!searchTerm.trim()) {
      setFilteredProviders(providers);
    } else {
      const filtered = providers.filter(provider =>
        provider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.service_names.some(service => 
          service.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredProviders(filtered);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading providers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Find Service Providers</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search providers by name, service, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-gray-500">
                {searchTerm ? 'No providers found matching your search' : 'No providers available'}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredProviders.map((provider) => (
            <Card key={provider.provider_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {provider.full_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${provider.hourly_rate}/hour
                      </div>
                      {provider.is_available && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Available
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onRequestService(provider.provider_id)}
                    disabled={!provider.is_available}
                  >
                    Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{provider.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {provider.service_names.map((service, index) => (
                    <Badge key={index} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};