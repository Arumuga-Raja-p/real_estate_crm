-- ==============================================================================
-- REAL ESTATE CRM SEED DATA
-- Migration: seed.sql
-- ==============================================================================

-- 1. Sample Projects
INSERT INTO public.projects (id, name, location, city, description, status) VALUES
('11111111-1111-1111-1111-111111111111', 'The Grand Horizon', '104 Oceanfront Boulevard', 'Marina Bay', 'Ultra-luxury waterfront residences with panoramic sea views and private beach club.', 'Under Construction'),
('22222222-2222-2222-2222-222222222222', 'Silverstone Heights', '45 Financial District Way', 'Downtown', 'Modern urban skyscrapers tailored for executives, featuring rooftop infinity pools.', 'Ready to Move'),
('33333333-3333-3333-3333-333333333333', 'Emerald Eco Villas', '12 Greenwood Valley', 'Suburbs', 'Sustainable forest sanctuary villas built with solar architecture and smart home tech.', 'Planning')
ON CONFLICT (id) DO NOTHING;

-- 2. Sample Buildings
INSERT INTO public.buildings (id, project_id, name, total_floors) VALUES
('bbbbbbbb-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Tower A - Azure', 24),
('bbbbbbbb-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Tower B - Coral', 20),
('bbbbbbbb-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Pinnacle Tower', 32),
('bbbbbbbb-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Phase 1 - Garden Enclave', 2)
ON CONFLICT (id) DO NOTHING;

-- 3. Sample Units
INSERT INTO public.units (id, building_id, unit_number, type, floor, area_sqft, price, status) VALUES
-- Tower A - Azure
('uuuuuuuu-0101-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111111', 'A-101', '1BHK', 1, 750, 240000, 'Available'),
('uuuuuuuu-0102-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111111', 'A-102', '2BHK', 1, 1150, 380000, 'Available'),
('uuuuuuuu-0201-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111111', 'A-201', '2BHK', 2, 1200, 395000, 'Available'),
('uuuuuuuu-0401-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111111', 'A-401', '3BHK', 4, 1850, 620000, 'Available'),
('uuuuuuuu-1201-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111111', 'A-1201', '3BHK', 12, 1920, 710000, 'Available'),
('uuuuuuuu-2401-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111111', 'A-PH01', 'Penthouse', 24, 3400, 1450000, 'Available'),

-- Tower B - Coral
('uuuuuuuu-0101-2222-2222-222222222222', 'bbbbbbbb-2222-2222-2222-222222222222', 'B-101', '1BHK', 1, 720, 230000, 'Available'),
('uuuuuuuu-0301-2222-2222-222222222222', 'bbbbbbbb-2222-2222-2222-222222222222', 'B-301', '2BHK', 3, 1180, 385000, 'Available'),
('uuuuuuuu-0501-2222-2222-222222222222', 'bbbbbbbb-2222-2222-2222-222222222222', 'B-501', '3BHK', 5, 1750, 590000, 'Available'),

-- Pinnacle Tower
('uuuuuuuu-1001-3333-3333-333333333333', 'bbbbbbbb-3333-3333-3333-333333333333', 'P-1001', '2BHK', 10, 1250, 480000, 'Available'),
('uuuuuuuu-2001-3333-3333-333333333333', 'bbbbbbbb-3333-3333-3333-333333333333', 'P-2001', '3BHK', 20, 2100, 890000, 'Available'),
('uuuuuuuu-3201-3333-3333-333333333333', 'bbbbbbbb-3333-3333-3333-333333333333', 'P-PH32', 'Penthouse', 32, 4200, 2100000, 'Available'),

-- Emerald Eco Villas
('uuuuuuuu-0001-4444-4444-444444444444', 'bbbbbbbb-4444-4444-4444-444444444444', 'Villa-01', 'Villa', 1, 3800, 1250000, 'Available'),
('uuuuuuuu-0002-4444-4444-444444444444', 'bbbbbbbb-4444-4444-4444-444444444444', 'Villa-02', 'Villa', 1, 4500, 1600000, 'Available')
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Leads Across Diverse Pipeline Stages
INSERT INTO public.leads (id, first_name, last_name, email, phone, budget_min, budget_max, preferred_type, source, stage) VALUES
('eeeeeeee-1111-1111-1111-111111111111', 'Alexander', 'Wright', 'alex.wright@example.com', '+1 (555) 234-5678', 350000, 450000, '2BHK', 'Website', 'New'),
('eeeeeeee-2222-2222-2222-222222222222', 'Sophia', 'Chen', 'sophia.chen@example.com', '+1 (555) 345-6789', 600000, 800000, '3BHK', 'Walk-in', 'Contacted'),
('eeeeeeee-3333-3333-3333-333333333333', 'Marcus', 'Vance', 'marcus.v@example.com', '+1 (555) 456-7890', 1200000, 1800000, 'Penthouse', 'Referral', 'Site Visit'),
('eeeeeeee-4444-4444-4444-444444444444', 'Elena', 'Rostova', 'elena.r@example.com', '+1 (555) 567-8901', 500000, 700000, '3BHK', 'Social Media', 'Interested'),
('eeeeeeee-5555-5555-5555-555555555555', 'David', 'Miller', 'david.miller@example.com', '+1 (555) 678-9012', 380000, 420000, '2BHK', 'Real Estate Portal', 'Negotiation'),
('eeeeeeee-6666-6666-6666-666666666666', 'Liam', 'O’Connor', 'liam.oc@example.com', '+1 (555) 789-0123', 200000, 260000, '1BHK', 'Cold Call', 'Lost')
ON CONFLICT (id) DO NOTHING;

-- 5. Sample Notes & Follow-ups
INSERT INTO public.lead_notes (lead_id, note, follow_up_date) VALUES
('eeeeeeee-1111-1111-1111-111111111111', 'Lead captured from Landing Page form. Interested in Marina Bay projects.', NOW() + INTERVAL '1 day'),
('eeeeeeee-2222-2222-2222-222222222222', 'Called client. Discussed 3BHK options in Tower A. Requested brochure sent to email.', NOW() + INTERVAL '2 days'),
('eeeeeeee-3333-3333-3333-333333333333', 'Site visit scheduled for Saturday 11 AM at The Grand Horizon Penthouse.', NOW() + INTERVAL '4 days'),
('eeeeeeee-4444-4444-4444-444444444444', 'Client reviewed floor plans, loved high floor sea-facing corner units.', NOW() + INTERVAL '3 days'),
('eeeeeeee-5555-5555-5555-555555555555', 'Offered 2% early-bird incentive on unit A-201. Final decision pending by Friday.', NOW() + INTERVAL '1 day');
