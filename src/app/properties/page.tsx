'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building, Project, ProjectStatus, PropertyUnit, UnitType } from '@/lib/types/crm';
import { crmService } from '@/lib/crm-service';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookingModal } from '@/components/bookings/BookingModal';
import { ConcurrencyTestModal } from '@/components/properties/ConcurrencyTestModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  Zap,
  Filter,
  Sparkles,
  Layers,
  MapPin,
  Plus,
} from 'lucide-react';

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<(Project & { building_count: number; unit_count: number })[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Booked'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [propertyLocation, setPropertyLocation] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyStatus, setPropertyStatus] = useState<ProjectStatus>('Under Construction');
  const [propertyBuildingName, setPropertyBuildingName] = useState('');
  const [propertyTotalFloors, setPropertyTotalFloors] = useState('');
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [addProjectId, setAddProjectId] = useState('');
  const [addBuildingId, setAddBuildingId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('2BHK');
  const [unitFloor, setUnitFloor] = useState('');
  const [unitArea, setUnitArea] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedUnitForBooking, setSelectedUnitForBooking] = useState<PropertyUnit | null>(null);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('testConcurrency') === 'true') {
      void Promise.resolve().then(() => setIsConcurrencyModalOpen(true));
    }
  }, [searchParams]);

  const loadProperties = useCallback(async () => {
    const [pList, bList, uList] = await Promise.all([
      crmService.getProjects(),
      crmService.getBuildings(),
      crmService.getUnits({
        projectId: selectedProjectId,
        status: statusFilter,
        type: typeFilter,
      }),
    ]);
    setProjects(pList);
    setBuildings(bList);
    setUnits(uList);
  }, [selectedProjectId, statusFilter, typeFilter]);

  useEffect(() => {
    void Promise.resolve().then(loadProperties);
  }, [loadProperties]);

  const handleBookUnit = (unit: PropertyUnit) => {
    setSelectedUnitForBooking(unit);
    setIsBookingModalOpen(true);
  };

  const getProjectName = (projectId: string) =>
    projectId === 'All' ? 'All Projects' : projects.find((project) => project.id === projectId)?.name || 'All Projects';

  const resetAddUnitForm = () => {
    setUnitNumber('');
    setUnitType('2BHK');
    setUnitFloor('');
    setUnitArea('');
    setUnitPrice('');
  };

  const resetAddPropertyForm = () => {
    setPropertyName('');
    setPropertyLocation('');
    setPropertyCity('');
    setPropertyStatus('Under Construction');
    setPropertyBuildingName('');
    setPropertyTotalFloors('');
  };

  const handleCreateProperty = async (event: React.FormEvent) => {
    event.preventDefault();
    const totalFloors = Number(propertyTotalFloors);

    if (
      !propertyName.trim() ||
      !propertyLocation.trim() ||
      !propertyCity.trim() ||
      !propertyBuildingName.trim() ||
      totalFloors <= 0
    ) {
      toast.error('Please enter valid property details.');
      return;
    }

    setIsCreatingProperty(true);
    try {
      await crmService.createProject({
        name: propertyName.trim(),
        location: propertyLocation.trim(),
        city: propertyCity.trim(),
        status: propertyStatus,
        buildingName: propertyBuildingName.trim(),
        totalFloors,
      });
      toast.success('Property added successfully.');
      setIsAddPropertyModalOpen(false);
      resetAddPropertyForm();
      await loadProperties();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add property.';
      toast.error(message);
    } finally {
      setIsCreatingProperty(false);
    }
  };

  const openAddUnitModal = () => {
    const initialProjectId = selectedProjectId !== 'All' ? selectedProjectId : projects[0]?.id || '';
    const firstBuilding = buildings.find((building) => building.project_id === initialProjectId) || buildings[0];
    setAddProjectId(initialProjectId || firstBuilding?.project_id || '');
    setAddBuildingId(firstBuilding?.id || '');
    resetAddUnitForm();
    setIsAddUnitModalOpen(true);
  };

  const handleAddProjectChange = (projectId: string) => {
    setAddProjectId(projectId);
    setAddBuildingId(buildings.find((building) => building.project_id === projectId)?.id || '');
  };

  const handleCreateUnit = async (event: React.FormEvent) => {
    event.preventDefault();
    const floor = Number(unitFloor);
    const area = Number(unitArea);
    const price = Number(unitPrice);

    if (!addBuildingId || !unitNumber.trim() || floor <= 0 || area <= 0 || price <= 0) {
      toast.error('Please enter valid unit details.');
      return;
    }

    setIsCreatingUnit(true);
    try {
      await crmService.createUnit({
        building_id: addBuildingId,
        unit_number: unitNumber.trim(),
        type: unitType,
        floor,
        area_sqft: area,
        price,
      });
      toast.success('Unit added successfully.');
      setIsAddUnitModalOpen(false);
      resetAddUnitForm();
      await loadProperties();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add unit.';
      toast.error(message);
    } finally {
      setIsCreatingUnit(false);
    }
  };

  const availableCount = units.filter((u) => u.status === 'Available').length;
  const bookedCount = units.filter((u) => u.status === 'Booked').length;
  const addUnitBuildings = buildings.filter((building) => building.project_id === addProjectId);

  const inventoryActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => {
          resetAddPropertyForm();
          setIsAddPropertyModalOpen(true);
        }}
        variant="outline"
        size="sm"
        className="h-9 rounded-full border-border bg-card px-4 font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Property
      </Button>
      <Button
        onClick={openAddUnitModal}
        size="sm"
        className="h-9 rounded-full bg-primary text-primary-foreground px-4 font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Unit
      </Button>
    </div>
  );

  const headerActions = (
    <Button
      onClick={() => setIsConcurrencyModalOpen(true)}
      variant="outline"
      size="sm"
      className="h-9 rounded-full border-border bg-card text-foreground hover:bg-muted font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
    >
      <Zap className="h-3.5 w-3.5 text-foreground" />
      Simulate Concurrency Collision
    </Button>
  );

  return (
    <DashboardShell
      title="Inventory & Units"
      actionButton={headerActions}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Property Inventory
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse projects, towers, floor inventory, and unit reservation status.
            </p>
          </div>
          {inventoryActions}
        </div>

        {/* Master Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(isSelected ? 'All' : proj.id)}
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-foreground bg-card shadow-sm'
                    : 'border-border/70 bg-card hover:border-foreground/20 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition">
                      {proj.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{proj.location}, {proj.city}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      proj.status === 'Ready to Move'
                        ? 'border-border bg-background text-foreground'
                        : 'border-border bg-muted text-foreground'
                    }`}
                  >
                    {proj.status}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{proj.building_count} Towers/Phases</span>
                  </div>
                  <span className="font-medium text-foreground">{proj.unit_count} Units</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unit Matrix Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/70 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>

            {/* Project Filter */}
            <Select value={selectedProjectId} onValueChange={(val) => val && setSelectedProjectId(val)}>
              <SelectTrigger className="w-[180px] text-xs h-9 rounded-full bg-muted/40 border-transparent">
                <span className="truncate text-left">{getProjectName(selectedProjectId)}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Availability Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => val && setStatusFilter(val as 'All' | 'Available' | 'Booked')}
            >
              <SelectTrigger className="w-[140px] text-xs h-9 rounded-full bg-muted/40 border-transparent">
                <span className="truncate text-left">
                  {statusFilter === 'All' ? 'All Status' : statusFilter}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Booked">Booked</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
              <SelectTrigger className="w-[130px] text-xs h-9 rounded-full bg-muted/40 border-transparent">
                <span className="truncate text-left">
                  {typeFilter === 'All' ? 'All Types' : typeFilter}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="1BHK">1BHK</SelectItem>
                <SelectItem value="2BHK">2BHK</SelectItem>
                <SelectItem value="3BHK">3BHK</SelectItem>
                <SelectItem value="Penthouse">Penthouse</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Availability Counters */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-background text-foreground border border-border font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              {availableCount} Available
            </span>
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              {bookedCount} Booked
            </span>
          </div>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {units.length === 0 ? (
            <div className="col-span-full rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
              No property units found matching current filter parameters.
            </div>
          ) : (
            units.map((unit) => {
              const isBooked = unit.status === 'Booked';

              return (
                <Card
                  key={unit.id}
                  className={`relative overflow-hidden transition-all duration-150 bg-card border ${
                    isBooked
                      ? 'border-border/60 bg-muted/20 opacity-80'
                      : 'border-border hover:border-primary/50 hover:shadow-2xs'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Unit Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-foreground">
                            {unit.unit_number}
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            • Flr {unit.floor}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[170px]">
                          {unit.building?.name || 'Main Tower'}
                        </p>
                      </div>

                      <Badge
                        variant={isBooked ? 'secondary' : 'outline'}
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                          isBooked
                            ? 'bg-muted text-muted-foreground'
                            : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {isBooked ? (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Booked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-emerald-600" /> Available
                          </span>
                        )}
                      </Badge>
                    </div>

                    {/* Unit Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 px-2.5 rounded-md bg-muted/40 border border-border/50">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-medium">Type</span>
                        <span className="font-semibold text-foreground">{unit.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-medium">Area</span>
                        <span className="font-semibold text-foreground">{unit.area_sqft} sqft</span>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase text-muted-foreground font-semibold block">
                          Price
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          ${unit.price.toLocaleString()}
                        </span>
                      </div>

                      {isBooked ? (
                        <span className="text-[11px] text-muted-foreground font-medium italic">
                          Locked
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleBookUnit(unit)}
                          className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-2xs flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Book
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedUnitForBooking(null);
        }}
        defaultUnitId={selectedUnitForBooking?.id}
        onBookingSuccess={() => loadProperties()}
      />

      {/* Concurrency Simulator Modal */}
      <ConcurrencyTestModal
        isOpen={isConcurrencyModalOpen}
        onClose={() => setIsConcurrencyModalOpen(false)}
        onFinished={() => loadProperties()}
      />

      <Dialog open={isAddPropertyModalOpen} onOpenChange={(open) => !open && setIsAddPropertyModalOpen(false)}>
        <DialogContent className="sm:max-w-[560px] p-6">
          <DialogHeader>
            <DialogTitle>Add Property</DialogTitle>
            <DialogDescription>
              Create a new project card with its first tower or phase.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProperty} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="propertyName" className="text-xs">Property Name</Label>
                <Input
                  id="propertyName"
                  value={propertyName}
                  onChange={(event) => setPropertyName(event.target.value)}
                  placeholder="Emerald Eco Villas"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={propertyStatus}
                  onValueChange={(val) => val && setPropertyStatus(val as ProjectStatus)}
                >
                  <SelectTrigger className="w-full bg-muted/30">
                    <span className="truncate text-left">{propertyStatus}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {['Planning', 'Under Construction', 'Ready to Move', 'Sold Out'].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="propertyLocation" className="text-xs">Address / Location</Label>
                <Input
                  id="propertyLocation"
                  value={propertyLocation}
                  onChange={(event) => setPropertyLocation(event.target.value)}
                  placeholder="12 Greenwood Valley"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="propertyCity" className="text-xs">City / Area</Label>
                <Input
                  id="propertyCity"
                  value={propertyCity}
                  onChange={(event) => setPropertyCity(event.target.value)}
                  placeholder="Suburbs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="propertyBuildingName" className="text-xs">First Tower / Phase</Label>
                <Input
                  id="propertyBuildingName"
                  value={propertyBuildingName}
                  onChange={(event) => setPropertyBuildingName(event.target.value)}
                  placeholder="Phase 1"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="propertyTotalFloors" className="text-xs">Total Floors</Label>
                <Input
                  id="propertyTotalFloors"
                  type="number"
                  min="1"
                  value={propertyTotalFloors}
                  onChange={(event) => setPropertyTotalFloors(event.target.value)}
                  placeholder="12"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddPropertyModalOpen(false)}
                disabled={isCreatingProperty}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingProperty}>
                {isCreatingProperty ? 'Adding...' : 'Add Property'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddUnitModalOpen} onOpenChange={(open) => !open && setIsAddUnitModalOpen(false)}>
        <DialogContent className="sm:max-w-[560px] p-6">
          <DialogHeader>
            <DialogTitle>Add Property Unit</DialogTitle>
            <DialogDescription>
              Create a new available unit under a selected project and tower.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUnit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Project</Label>
                <Select value={addProjectId} onValueChange={(val) => val && handleAddProjectChange(val)}>
                  <SelectTrigger className="w-full bg-muted/30">
                    <span className="truncate text-left">{getProjectName(addProjectId)}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Building / Tower</Label>
                <Select value={addBuildingId} onValueChange={(val) => val && setAddBuildingId(val)}>
                  <SelectTrigger className="w-full bg-muted/30">
                    <span className="truncate text-left">
                      {addUnitBuildings.find((building) => building.id === addBuildingId)?.name || 'Select building'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {addUnitBuildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unitNumber" className="text-xs">Unit Number</Label>
                <Input
                  id="unitNumber"
                  value={unitNumber}
                  onChange={(event) => setUnitNumber(event.target.value)}
                  placeholder="A-501"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Unit Type</Label>
                <Select value={unitType} onValueChange={(val) => val && setUnitType(val as UnitType)}>
                  <SelectTrigger className="w-full bg-muted/30">
                    <span className="truncate text-left">{unitType}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {['1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Studio', 'Villa'].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unitFloor" className="text-xs">Floor</Label>
                <Input
                  id="unitFloor"
                  type="number"
                  min="1"
                  value={unitFloor}
                  onChange={(event) => setUnitFloor(event.target.value)}
                  placeholder="5"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unitArea" className="text-xs">Area Sqft</Label>
                <Input
                  id="unitArea"
                  type="number"
                  min="1"
                  value={unitArea}
                  onChange={(event) => setUnitArea(event.target.value)}
                  placeholder="1250"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unitPrice" className="text-xs">Price</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="1"
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                  placeholder="450000"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddUnitModalOpen(false)}
                disabled={isCreatingUnit}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingUnit || !addBuildingId}>
                {isCreatingUnit ? 'Adding...' : 'Add Unit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-muted-foreground">Loading Properties...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}
