import {
  Lead,
  LeadStage,
  PropertyUnit,
  Project,
  Building,
  Booking,
  LeadNote,
  Profile,
  DashboardMetrics,
} from './types/crm';
import {
  INITIAL_PROFILES,
  INITIAL_PROJECTS,
  INITIAL_BUILDINGS,
  INITIAL_UNITS,
  INITIAL_LEADS,
  INITIAL_NOTES,
} from './mock-data';
import { createClient } from './supabase/client';

const STORAGE_KEY_PREFIX = 'realestate_crm_';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function loadState<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
    return fallback;
  }
}

function saveState<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

// In-memory / localStorage store for robust fallback and interactive testing
class CRMStore {
  profiles: Profile[] = INITIAL_PROFILES;
  projects: Project[] = INITIAL_PROJECTS;
  buildings: Building[] = INITIAL_BUILDINGS;
  units: PropertyUnit[] = INITIAL_UNITS;
  leads: Lead[] = INITIAL_LEADS;
  notes: LeadNote[] = INITIAL_NOTES;
  bookings: Booking[] = [];
  currentUserId: string = INITIAL_PROFILES[0].id; // Default to Admin for testing

  constructor() {
    this.init();
  }

  init() {
    if (!isBrowser()) return;
    if (createClient()) {
      // Live Supabase database mode: wipe local mock storage so only live DB is used
      const keys = ['projects', 'buildings', 'units', 'leads', 'notes', 'bookings'];
      keys.forEach((k) => localStorage.removeItem(STORAGE_KEY_PREFIX + k));
      this.projects = [];
      this.buildings = [];
      this.units = [];
      this.leads = [];
      this.notes = [];
      this.bookings = [];
      this.profiles = INITIAL_PROFILES;
      this.currentUserId = INITIAL_PROFILES[0].id;
      return;
    }
    this.profiles = loadState('profiles', INITIAL_PROFILES);
    this.projects = loadState('projects', INITIAL_PROJECTS);
    this.buildings = loadState('buildings', INITIAL_BUILDINGS);
    this.units = loadState('units', INITIAL_UNITS);
    this.leads = loadState('leads', INITIAL_LEADS);
    this.notes = loadState('notes', INITIAL_NOTES);
    this.bookings = loadState('bookings', []);
    this.currentUserId = loadState('current_user_id', INITIAL_PROFILES[0].id);
  }

  persist() {
    saveState('profiles', this.profiles);
    saveState('projects', this.projects);
    saveState('buildings', this.buildings);
    saveState('units', this.units);
    saveState('leads', this.leads);
    saveState('notes', this.notes);
    saveState('bookings', this.bookings);
    saveState('current_user_id', this.currentUserId);
  }

  resetAll() {
    this.profiles = INITIAL_PROFILES;
    this.projects = INITIAL_PROJECTS;
    this.buildings = INITIAL_BUILDINGS;
    this.units = INITIAL_UNITS;
    this.leads = INITIAL_LEADS;
    this.notes = INITIAL_NOTES;
    this.bookings = [];
    this.currentUserId = INITIAL_PROFILES[0].id;
    this.persist();
  }
}

export const crmStore = new CRMStore();

// ============================================================================
// UNIFIED CRM SERVICE API
// ============================================================================

export const crmService = {
  // Current user & role simulation
  getCurrentUser(): Profile {
    const user = crmStore.profiles.find((p) => p.id === crmStore.currentUserId);
    return user || crmStore.profiles[0];
  },

  setCurrentUser(userId: string): Profile {
    const user = crmStore.profiles.find((p) => p.id === userId);
    if (user) {
      crmStore.currentUserId = user.id;
      crmStore.persist();
      return user;
    }
    return crmStore.profiles[0];
  },

  getAllProfiles(): Profile[] {
    return crmStore.profiles;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const supabase = createClient();
    if (supabase) {
      // Live mode: write straight to Supabase and surface any error.
      // (Never silently fall back to local mock here — otherwise the UI says
      // "saved" while the database never changes.)
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      // Keep the local session copy in sync so Navbar/dropdowns update instantly.
      crmStore.init();
      const liveIndex = crmStore.profiles.findIndex((p) => p.id === userId);
      if (liveIndex !== -1) {
        crmStore.profiles[liveIndex] = {
          ...crmStore.profiles[liveIndex],
          ...(data as Profile),
        };
        crmStore.persist();
      }
      return data as Profile;
    }

    // Mock mode (Supabase not configured): persist locally only.
    crmStore.init();
    const index = crmStore.profiles.findIndex((p) => p.id === userId);
    if (index !== -1) {
      crmStore.profiles[index] = {
        ...crmStore.profiles[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      crmStore.persist();
      return crmStore.profiles[index];
    }
    return crmStore.profiles[0];
  },

  // --------------------------------------------------------------------------
  // LEADS
  // --------------------------------------------------------------------------
  async getLeads(filters?: {
    stage?: LeadStage | 'All';
    assignedTo?: string | 'All';
    search?: string;
  }): Promise<Lead[]> {
    const supabase = createClient();
    if (supabase) {
      try {
        let query = supabase
          .from('leads')
          .select(`*, assigned_profile:profiles!assigned_to(*)`)
          .order('created_at', { ascending: false });

        if (filters?.stage && filters.stage !== 'All') {
          query = query.eq('stage', filters.stage);
        }
        if (filters?.assignedTo && filters.assignedTo !== 'All') {
          query = query.eq('assigned_to', filters.assignedTo);
        }
        if (filters?.search) {
          query = query.or(
            `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query;
        if (!error && data) return data as Lead[];
      } catch {
        // Fallback to local store
      }
    }

    // Local filter fallback
    crmStore.init();
    let result = [...crmStore.leads];

    if (filters?.stage && filters.stage !== 'All') {
      result = result.filter((l) => l.stage === filters.stage);
    }
    if (filters?.assignedTo && filters.assignedTo !== 'All') {
      result = result.filter((l) => l.assigned_to === filters.assignedTo);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.first_name.toLowerCase().includes(q) ||
          l.last_name.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          l.phone.includes(q)
      );
    }

    return result.map((l) => ({
      ...l,
      assigned_profile: crmStore.profiles.find((p) => p.id === l.assigned_to) || null,
    }));
  },

  async getLeadById(id: string): Promise<(Lead & { notes: LeadNote[] }) | null> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data: leadData } = await supabase
          .from('leads')
          .select(`*, assigned_profile:profiles!assigned_to(*)`)
          .eq('id', id)
          .single();

        const { data: notesData } = await supabase
          .from('lead_notes')
          .select(`*, author_profile:profiles!author_id(*)`)
          .eq('lead_id', id)
          .order('created_at', { ascending: false });

        if (leadData) {
          return {
            ...(leadData as Lead),
            notes: (notesData as LeadNote[]) || [],
          };
        }
      } catch {
        // Fallback
      }
    }

    crmStore.init();
    const lead = crmStore.leads.find((l) => l.id === id);
    if (!lead) return null;

    const notes = crmStore.notes
      .filter((n) => n.lead_id === id)
      .map((n) => ({
        ...n,
        author_profile: crmStore.profiles.find((p) => p.id === n.author_id) || null,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      ...lead,
      assigned_profile: crmStore.profiles.find((p) => p.id === lead.assigned_to) || null,
      notes,
    };
  },

  async createLead(input: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const supabase = createClient();
    if (supabase) {
      try {
        const isValidUuid = (val?: string | null) =>
          Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

        const insertPayload: Record<string, string | number | null> = {
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email || null,
          phone: input.phone,
          budget_min: input.budget_min || 0,
          budget_max: input.budget_max || 0,
          preferred_type: input.preferred_type || null,
          source: input.source || 'Website',
          stage: input.stage || 'New',
          assigned_to: input.assigned_to && isValidUuid(input.assigned_to) ? input.assigned_to : null,
          created_by: isValidUuid(crmStore.currentUserId) ? crmStore.currentUserId : null,
        };

        const { data, error } = await supabase
          .from('leads')
          .insert(insertPayload)
          .select(`*, assigned_profile:profiles!assigned_to(*)`)
          .single();

        if (!error && data) return data as Lead;
        if (error) console.error('Supabase createLead error:', error);
      } catch (err) {
        console.error('Failed to create lead in Supabase:', err);
      }
    }

    crmStore.init();
    const newLead: Lead = {
      ...input,
      id: 'lead-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: crmStore.currentUserId,
    };

    crmStore.leads.unshift(newLead);
    crmStore.persist();
    return newLead;
  },

  async updateLeadStage(id: string, stage: LeadStage): Promise<void> {
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.from('leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', id);
        return;
      } catch {
        // Fallback
      }
    }

    crmStore.init();
    const lead = crmStore.leads.find((l) => l.id === id);
    if (lead) {
      lead.stage = stage;
      lead.updated_at = new Date().toISOString();
      crmStore.persist();
    }
  },

  async assignLead(id: string, assignedTo: string): Promise<void> {
    const supabase = createClient();
    if (supabase) {
      try {
        const isValidUuid = (val?: string | null) =>
          Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
        const assignedUuid = isValidUuid(assignedTo) ? assignedTo : null;
        await supabase.from('leads').update({ assigned_to: assignedUuid, updated_at: new Date().toISOString() }).eq('id', id);
        return;
      } catch {
        // Fallback
      }
    }

    crmStore.init();
    const lead = crmStore.leads.find((l) => l.id === id);
    if (lead) {
      lead.assigned_to = assignedTo;
      lead.updated_at = new Date().toISOString();
      crmStore.persist();
    }
  },

  async addLeadNote(leadId: string, note: string, followUpDate?: string): Promise<LeadNote> {
    const currentUser = this.getCurrentUser();
    const supabase = createClient();
    if (supabase) {
      try {
        const isValidUuid = (val?: string | null) =>
          Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
        const authorUuid = isValidUuid(currentUser.id) ? currentUser.id : null;

        const { data, error } = await supabase
          .from('lead_notes')
          .insert({
            lead_id: leadId,
            author_id: authorUuid,
            note,
            follow_up_date: followUpDate || null,
          })
          .select()
          .single();
        if (!error && data) return data as LeadNote;
      } catch {
        // Fallback
      }
    }

    crmStore.init();
    const newNote: LeadNote = {
      id: 'note-' + Date.now(),
      lead_id: leadId,
      author_id: currentUser.id,
      note,
      follow_up_date: followUpDate || null,
      created_at: new Date().toISOString(),
      author_profile: currentUser,
    };

    crmStore.notes.unshift(newNote);
    crmStore.persist();
    return newNote;
  },

  // --------------------------------------------------------------------------
  // INVENTORY & PROPERTIES
  // --------------------------------------------------------------------------
  async getProjects(): Promise<(Project & { building_count: number; unit_count: number })[]> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data: projects, error } = await supabase
          .from('projects')
          .select(`
            *,
            buildings (
              id,
              units (id)
            )
          `)
          .order('created_at', { ascending: true });

        if (!error && projects) {
          type ProjectWithBuildings = Project & { buildings?: { id: string; units?: { id: string }[] }[] };

          return (projects as ProjectWithBuildings[]).map((p) => {
            const buildings = p.buildings || [];
            const totalUnits = buildings.reduce((acc, b) => acc + (b.units?.length || 0), 0);
            return {
              id: p.id,
              name: p.name,
              location: p.location,
              city: p.city,
              description: p.description,
              status: p.status,
              featured_image: p.featured_image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
              created_at: p.created_at,
              updated_at: p.updated_at,
              building_count: buildings.length,
              unit_count: totalUnits,
            };
          });
        }
        return [];
      } catch (err) {
        console.error('Failed to load projects from Supabase:', err);
        return [];
      }
    }

    crmStore.init();
    return crmStore.projects.map((proj) => {
      const buildings = crmStore.buildings.filter((b) => b.project_id === proj.id);
      const buildingIds = buildings.map((b) => b.id);
      const units = crmStore.units.filter((u) => buildingIds.includes(u.building_id));
      return {
        ...proj,
        building_count: buildings.length,
        unit_count: units.length,
      };
    });
  },

  async createProject(input: {
    name: string;
    location: string;
    city: string;
    status: Project['status'];
    buildingName: string;
    totalFloors: number;
  }): Promise<Project> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: input.name,
            location: input.location,
            city: input.city,
            status: input.status,
          })
          .select()
          .single();

        if (projectError) throw new Error(projectError.message);
        if (!projectData) throw new Error('Project was not created.');

        const { error: buildingError } = await supabase
          .from('buildings')
          .insert({
            project_id: projectData.id,
            name: input.buildingName,
            total_floors: input.totalFloors,
          });

        if (buildingError) throw new Error(buildingError.message);
        return projectData as Project;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create property in Supabase.';
        throw new Error(message);
      }
    }

    crmStore.init();
    const now = new Date().toISOString();
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: input.name,
      location: input.location,
      city: input.city,
      description: null,
      status: input.status,
      created_at: now,
      updated_at: now,
    };
    const building: Building = {
      id: `bldg-${Date.now()}`,
      project_id: project.id,
      name: input.buildingName,
      total_floors: input.totalFloors,
      created_at: now,
      project,
    };

    crmStore.projects.unshift(project);
    crmStore.buildings.unshift(building);
    crmStore.persist();
    return project;
  },

  async getBuildings(projectId?: string): Promise<Building[]> {
    const supabase = createClient();
    if (supabase) {
      try {
        let query = supabase
          .from('buildings')
          .select('*, project:projects(*)')
          .order('name', { ascending: true });

        if (projectId && projectId !== 'All') {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (!error && data) return data as Building[];
        return [];
      } catch (err) {
        console.error('Failed to load buildings from Supabase:', err);
        return [];
      }
    }

    crmStore.init();
    return crmStore.buildings
      .filter((building) => !projectId || projectId === 'All' || building.project_id === projectId)
      .map((building) => ({
        ...building,
        project: crmStore.projects.find((project) => project.id === building.project_id),
      }));
  },

  async getUnits(filters?: {
    projectId?: string;
    buildingId?: string;
    status?: 'Available' | 'Booked' | 'All';
    type?: string;
  }): Promise<PropertyUnit[]> {
    const supabase = createClient();
    if (supabase) {
      try {
        let query = supabase
          .from('units')
          .select(`
            *,
            building:buildings (
              *,
              project:projects (*)
            )
          `)
          .order('unit_number', { ascending: true });

        if (filters?.buildingId && filters.buildingId !== 'All') {
          query = query.eq('building_id', filters.buildingId);
        }
        if (filters?.status && filters.status !== 'All') {
          query = query.eq('status', filters.status);
        }
        if (filters?.type && filters.type !== 'All') {
          query = query.eq('type', filters.type);
        }

        const { data, error } = await query;
        if (!error && data) {
          let units = data as PropertyUnit[];
          if (filters?.projectId && filters.projectId !== 'All') {
            units = units.filter(
              (u) =>
                u.building?.project?.id === filters.projectId ||
                u.building?.project_id === filters.projectId
            );
          }
          return units;
        }
        return [];
      } catch (err) {
        console.error('Failed to load units from Supabase:', err);
        return [];
      }
    }

    crmStore.init();
    let units = [...crmStore.units];

    if (filters?.buildingId && filters.buildingId !== 'All') {
      units = units.filter((u) => u.building_id === filters.buildingId);
    } else if (filters?.projectId && filters.projectId !== 'All') {
      const buildings = crmStore.buildings.filter((b) => b.project_id === filters.projectId);
      const bIds = buildings.map((b) => b.id);
      units = units.filter((u) => bIds.includes(u.building_id));
    }

    if (filters?.status && filters.status !== 'All') {
      units = units.filter((u) => u.status === filters.status);
    }

    if (filters?.type && filters.type !== 'All') {
      units = units.filter((u) => u.type === filters.type);
    }

    return units.map((u) => {
      const building = crmStore.buildings.find((b) => b.id === u.building_id);
      const project = building ? crmStore.projects.find((p) => p.id === building.project_id) : undefined;
      return {
        ...u,
        building: building ? { ...building, project } : undefined,
      };
    });
  },

  async createUnit(input: Pick<PropertyUnit, 'building_id' | 'unit_number' | 'type' | 'floor' | 'area_sqft' | 'price'>): Promise<PropertyUnit> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('units')
          .insert({
            building_id: input.building_id,
            unit_number: input.unit_number,
            type: input.type,
            floor: input.floor,
            area_sqft: input.area_sqft,
            price: input.price,
            status: 'Available',
          })
          .select(`
            *,
            building:buildings (
              *,
              project:projects (*)
            )
          `)
          .single();

        if (!error && data) return data as PropertyUnit;
        if (error) throw new Error(error.message);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create unit in Supabase.';
        throw new Error(message);
      }
    }

    crmStore.init();
    const building = crmStore.buildings.find((item) => item.id === input.building_id);
    const project = building ? crmStore.projects.find((item) => item.id === building.project_id) : undefined;
    const now = new Date().toISOString();
    const unit: PropertyUnit = {
      ...input,
      id: `unit-${Date.now()}`,
      status: 'Available',
      created_at: now,
      updated_at: now,
      building: building ? { ...building, project } : undefined,
    };

    crmStore.units.unshift(unit);
    crmStore.persist();
    return unit;
  },

  // --------------------------------------------------------------------------
  // ATOMIC CONCURRENCY BOOKING FLOW
  // --------------------------------------------------------------------------
  async bookPropertyUnit(params: {
    leadId: string;
    unitId: string;
    bookingAmount: number;
    notes?: string;
  }): Promise<{ success: boolean; bookingId: string; message: string }> {
    const currentUser = this.getCurrentUser();
    const supabase = createClient();

    // 1. Try real Supabase Stored Procedure (RPC) with Pessimistic 'FOR UPDATE' row lock
    if (supabase) {
      try {
        const isValidUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const bookedByUuid = isValidUuid(currentUser.id) ? currentUser.id : null;

        const { data, error } = await supabase.rpc('book_property_unit', {
          p_lead_id: params.leadId,
          p_unit_id: params.unitId,
          p_booked_by: bookedByUuid,
          p_amount: params.bookingAmount,
          p_notes: params.notes || null,
        });

        if (error) {
          throw new Error(error.message || 'Booking conflict: Unit is no longer available.');
        }

        return {
          success: true,
          bookingId: data?.booking_id || 'supabase-booked',
          message: data?.message || 'Unit booked successfully!',
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('UNIT_ALREADY_BOOKED')) {
          throw new Error('UNIT_ALREADY_BOOKED: This unit was just reserved or booked by another transaction.');
        }
        // If other error, rethrow
        throw new Error(errorMessage);
      }
    }

    // 2. Offline / Local Store Atomic Concurrency Control Implementation
    crmStore.init();

    // Artificial tiny delay to simulate network & allow testing concurrency races
    await new Promise((resolve) => setTimeout(resolve, 50));

    const unit = crmStore.units.find((u) => u.id === params.unitId);
    if (!unit) {
      throw new Error('Unit not found in inventory.');
    }

    // HARD CONCURRENCY CHECK: Must be Available
    if (unit.status !== 'Available') {
      throw new Error(`UNIT_ALREADY_BOOKED: Unit ${unit.unit_number} is already booked or reserved.`);
    }

    // Lead check
    const lead = crmStore.leads.find((l) => l.id === params.leadId);
    if (!lead) {
      throw new Error('Lead not found.');
    }

    // ATOMIC MUTATIONS:
    // a. Lock unit
    unit.status = 'Booked';
    unit.updated_at = new Date().toISOString();

    // b. Update lead stage to Booked
    lead.stage = 'Booked';
    lead.updated_at = new Date().toISOString();

    // c. Record confirmed booking
    const bookingId = 'booking-' + Date.now();
    const newBooking: Booking = {
      id: bookingId,
      lead_id: params.leadId,
      unit_id: params.unitId,
      booked_by: currentUser.id,
      booking_amount: params.bookingAmount,
      booking_date: new Date().toISOString(),
      status: 'Confirmed',
      notes: params.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lead,
      unit,
      booked_by_profile: currentUser,
    };

    crmStore.bookings.unshift(newBooking);

    // d. Append note audit trail
    crmStore.notes.unshift({
      id: 'note-book-' + Date.now(),
      lead_id: params.leadId,
      author_id: currentUser.id,
      note: `Unit ${unit.unit_number} secured with initial token of $${params.bookingAmount.toLocaleString()}. Booking ID: ${bookingId}`,
      is_completed: true,
      created_at: new Date().toISOString(),
      author_profile: currentUser,
    });

    crmStore.persist();

    return {
      success: true,
      bookingId,
      message: `Unit ${unit.unit_number} successfully secured for ${lead.first_name} ${lead.last_name}!`,
    };
  },

  // --------------------------------------------------------------------------
  // BOOKINGS
  // --------------------------------------------------------------------------
  async getBookings(): Promise<Booking[]> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            lead:leads(*),
            unit:units(
              *,
              building:buildings(
                *,
                project:projects(*)
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as Booking[];
        }
        return [];
      } catch (err) {
        console.error('Failed to load bookings from Supabase:', err);
        return [];
      }
    }

    crmStore.init();
    return crmStore.bookings.map((b) => {
      const lead = crmStore.leads.find((l) => l.id === b.lead_id);
      const unit = crmStore.units.find((u) => u.id === b.unit_id);
      const building = unit ? crmStore.buildings.find((bg) => bg.id === unit.building_id) : undefined;
      const project = building ? crmStore.projects.find((p) => p.id === building.project_id) : undefined;
      const bookedBy = crmStore.profiles.find((p) => p.id === b.booked_by);

      return {
        ...b,
        lead,
        unit: unit ? { ...unit, building: building ? { ...building, project } : undefined } : undefined,
        booked_by_profile: bookedBy,
      };
    });
  },

  // --------------------------------------------------------------------------
  // DASHBOARD METRICS
  // --------------------------------------------------------------------------
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const supabase = createClient();
    if (supabase) {
      try {
        const [leadsRes, unitsRes, bookingsRes, notesRes] = await Promise.all([
          supabase.from('leads').select('*'),
          supabase.from('units').select('id, price, status'),
          supabase.from('bookings').select('*, lead:leads(*), unit:units(*, building:buildings(*, project:projects(*)))').order('created_at', { ascending: false }),
          supabase.from('lead_notes').select('*, lead:leads(*)').order('created_at', { ascending: false }),
        ]);

        if (!leadsRes.error && !unitsRes.error && leadsRes.data && unitsRes.data) {
          const leads = (leadsRes.data || []) as Lead[];
          const units = (unitsRes.data || []) as PropertyUnit[];
          const bookings = (bookingsRes.data || []) as Booking[];
          const notes = (notesRes.data || []) as (LeadNote & { lead?: Lead })[];

          const stageCounts: Record<LeadStage, number> = {
            New: 0,
            Contacted: 0,
            'Site Visit': 0,
            Interested: 0,
            Negotiation: 0,
            Booked: 0,
            Lost: 0,
          };

          leads.forEach((l) => {
            if (stageCounts[l.stage] !== undefined) {
              stageCounts[l.stage]++;
            }
          });

          const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.unit?.price) || Number(b.booking_amount) || 0), 0);
          const availableUnits = units.filter((u) => u.status === 'Available').length;
          const bookedUnits = units.filter((u) => u.status === 'Booked').length;

          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const endOfToday = startOfToday + 24 * 3600 * 1000;

          const upcomingFollowUps = notes
            .filter((n) => n.follow_up_date && !n.is_completed)
            .sort((a, b) => new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime());

          const followUpsToday = upcomingFollowUps.filter((n) => {
            const t = new Date(n.follow_up_date!).getTime();
            return t >= startOfToday && t <= endOfToday;
          }).length;

          return {
            totalLeads: leads.length,
            activeLeads: leads.filter((l) => l.stage !== 'Booked' && l.stage !== 'Lost').length,
            bookedLeads: stageCounts['Booked'] || 0,
            totalRevenue,
            availableUnits,
            bookedUnits,
            followUpsToday,
            leadsByStage: stageCounts,
            recentBookings: bookings.slice(0, 5),
            upcomingFollowUps: upcomingFollowUps.slice(0, 6),
          };
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics from Supabase:', err);
      }
    }

    crmStore.init();
    const leads = crmStore.leads;
    const units = crmStore.units;
    const bookings = await this.getBookings();

    const stageCounts: Record<LeadStage, number> = {
      New: 0,
      Contacted: 0,
      'Site Visit': 0,
      Interested: 0,
      Negotiation: 0,
      Booked: 0,
      Lost: 0,
    };

    leads.forEach((l) => {
      if (stageCounts[l.stage] !== undefined) {
        stageCounts[l.stage]++;
      }
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 3600 * 1000;

    const upcomingFollowUps = crmStore.notes
      .filter((n) => n.follow_up_date && !n.is_completed)
      .map((n) => ({
        ...n,
        lead: crmStore.leads.find((l) => l.id === n.lead_id),
      }))
      .sort((a, b) => new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime());

    const followUpsToday = upcomingFollowUps.filter((n) => {
      const t = new Date(n.follow_up_date!).getTime();
      return t >= startOfToday && t <= endOfToday;
    }).length;

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.unit?.price || b.booking_amount), 0);
    const bookedUnits = units.filter((u) => u.status === 'Booked').length;
    const availableUnits = units.filter((u) => u.status === 'Available').length;

    return {
      totalLeads: leads.length,
      activeLeads: leads.filter((l) => l.stage !== 'Booked' && l.stage !== 'Lost').length,
      bookedLeads: stageCounts['Booked'],
      totalRevenue,
      availableUnits,
      bookedUnits,
      followUpsToday,
      leadsByStage: stageCounts,
      recentBookings: bookings.slice(0, 5),
      upcomingFollowUps: upcomingFollowUps.slice(0, 6),
    };
  },

  resetDemo() {
    crmStore.resetAll();
  },
};
