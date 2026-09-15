export type UserRole = 'admin' | 'sales_rep';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'Site Visit'
  | 'Interested'
  | 'Negotiation'
  | 'Booked'
  | 'Lost';

export const LEAD_STAGES: LeadStage[] = [
  'New',
  'Contacted',
  'Site Visit',
  'Interested',
  'Negotiation',
  'Booked',
  'Lost',
];

export type LeadSource =
  | 'Website'
  | 'Walk-in'
  | 'Referral'
  | 'Social Media'
  | 'Real Estate Portal'
  | 'Cold Call';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone: string;
  budget_min: number;
  budget_max: number;
  preferred_type?: string | null;
  source: LeadSource;
  stage: LeadStage;
  assigned_to?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  assigned_profile?: Profile | null;
  latest_follow_up?: string | null;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id?: string | null;
  note: string;
  follow_up_date?: string | null;
  is_completed?: boolean;
  created_at: string;
  author_profile?: Profile | null;
}

export type ProjectStatus = 'Planning' | 'Under Construction' | 'Ready to Move' | 'Sold Out';

export interface Project {
  id: string;
  name: string;
  location: string;
  city?: string;
  description?: string | null;
  status: ProjectStatus;
  featured_image?: string | null;
  created_at: string;
  updated_at: string;
  buildings?: Building[];
}

export interface Building {
  id: string;
  project_id: string;
  name: string;
  total_floors: number;
  created_at: string;
  project?: Project;
  units?: PropertyUnit[];
}

export type UnitType = '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Penthouse' | 'Studio' | 'Villa';
export type UnitStatus = 'Available' | 'Booked';

export interface PropertyUnit {
  id: string;
  building_id: string;
  unit_number: string;
  type: UnitType;
  floor: number;
  area_sqft: number;
  price: number;
  status: UnitStatus;
  created_at: string;
  updated_at: string;
  building?: Building & { project?: Project };
}

export type BookingStatus = 'Confirmed' | 'Cancelled';

export interface Booking {
  id: string;
  lead_id: string;
  unit_id: string;
  booked_by?: string | null;
  booking_amount: number;
  booking_date: string;
  status: BookingStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  unit?: PropertyUnit;
  booked_by_profile?: Profile | null;
}

export interface DashboardMetrics {
  totalLeads: number;
  activeLeads: number;
  bookedLeads: number;
  totalRevenue: number;
  availableUnits: number;
  bookedUnits: number;
  followUpsToday: number;
  leadsByStage: Record<LeadStage, number>;
  recentBookings: Booking[];
  upcomingFollowUps: (LeadNote & { lead?: Lead })[];
}
