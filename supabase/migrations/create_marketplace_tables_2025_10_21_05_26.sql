-- Create Services table (standardized list of services)
CREATE TABLE IF NOT EXISTS public.services_2025_10_21_05_26 (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create User Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles_2025_10_21_05_26 (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    user_type VARCHAR(20) CHECK (user_type IN ('customer', 'provider')) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Service Providers table (specific details for workers)
CREATE TABLE IF NOT EXISTS public.service_providers_2025_10_21_05_26 (
    provider_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles_2025_10_21_05_26(user_id) ON DELETE CASCADE,
    hourly_rate DECIMAL(10,2),
    bio TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Service Requests table (details of service requests)
CREATE TABLE IF NOT EXISTS public.service_requests_2025_10_21_05_26 (
    request_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles_2025_10_21_05_26(user_id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES public.services_2025_10_21_05_26(service_id) ON DELETE CASCADE,
    details TEXT NOT NULL,
    address TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Assignments table (links requests to providers)
CREATE TABLE IF NOT EXISTS public.assignments_2025_10_21_05_26 (
    assignment_id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES public.service_requests_2025_10_21_05_26(request_id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES public.service_providers_2025_10_21_05_26(provider_id) ON DELETE CASCADE,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) CHECK (status IN ('assigned', 'accepted', 'declined', 'completed')) DEFAULT 'assigned'
);

-- Insert sample services
INSERT INTO public.services_2025_10_21_05_26 (service_name, description) VALUES
('Plumbing', 'Professional plumbing services including repairs, installations, and maintenance'),
('Electrician', 'Electrical work including wiring, repairs, and installations'),
('House Cleaning', 'Professional house cleaning and maintenance services'),
('Gardening', 'Garden maintenance, landscaping, and plant care'),
('Handyman', 'General home repairs and maintenance tasks'),
('Painting', 'Interior and exterior painting services'),
('Carpentry', 'Custom woodwork, furniture repair, and carpentry services'),
('HVAC', 'Heating, ventilation, and air conditioning services')
ON CONFLICT (service_name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.user_profiles_2025_10_21_05_26 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers_2025_10_21_05_26 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests_2025_10_21_05_26 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments_2025_10_21_05_26 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_2025_10_21_05_26 ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles_2025_10_21_05_26
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles_2025_10_21_05_26
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles_2025_10_21_05_26
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for service_providers
CREATE POLICY "Anyone can view service providers" ON public.service_providers_2025_10_21_05_26
    FOR SELECT USING (true);

CREATE POLICY "Providers can manage their own profile" ON public.service_providers_2025_10_21_05_26
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for service_requests
CREATE POLICY "Users can view their own requests" ON public.service_requests_2025_10_21_05_26
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Providers can view all pending requests" ON public.service_requests_2025_10_21_05_26
    FOR SELECT USING (status = 'pending' OR EXISTS (
        SELECT 1 FROM public.assignments_2025_10_21_05_26 a
        JOIN public.service_providers_2025_10_21_05_26 sp ON a.provider_id = sp.provider_id
        WHERE a.request_id = service_requests_2025_10_21_05_26.request_id AND sp.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own requests" ON public.service_requests_2025_10_21_05_26
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests" ON public.service_requests_2025_10_21_05_26
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for assignments
CREATE POLICY "View assignments for involved parties" ON public.assignments_2025_10_21_05_26
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.service_requests_2025_10_21_05_26 sr
            WHERE sr.request_id = assignments_2025_10_21_05_26.request_id AND sr.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.service_providers_2025_10_21_05_26 sp
            WHERE sp.provider_id = assignments_2025_10_21_05_26.provider_id AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "Providers can create assignments" ON public.assignments_2025_10_21_05_26
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.service_providers_2025_10_21_05_26 sp
            WHERE sp.provider_id = assignments_2025_10_21_05_26.provider_id AND sp.user_id = auth.uid()
        )
    );

-- RLS Policies for services (public read access)
CREATE POLICY "Anyone can view services" ON public.services_2025_10_21_05_26
    FOR SELECT USING (true);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_2025_10_21_05_26()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles_2025_10_21_05_26 (user_id, full_name, phone_number, user_type)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created_2025_10_21_05_26
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_2025_10_21_05_26();