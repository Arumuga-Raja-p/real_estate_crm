'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Project, PropertyUnit } from '@/lib/types/crm';
import { crmService } from '@/lib/crm-service';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookingModal } from '@/components/bookings/BookingModal';
import { ConcurrencyTestModal } from '@/components/properties/ConcurrencyTestModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  CheckCircle,
  XCircle,
  Zap,
  Filter,
  Sparkles,
  Layers,
  MapPin,
} from 'lucide-react';

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<(Project & { building_count: number; unit_count: number })[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Booked'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedUnitForBooking, setSelectedUnitForBooking] = useState<PropertyUnit | null>(null);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('testConcurrency') === 'true') {
      setIsConcurrencyModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadProperties();
  }, [selectedProjectId, statusFilter, typeFilter]);

  const loadProperties = async () => {
    const pList = await crmService.getProjects();
    setProjects(pList);

    const uList = await crmService.getUnits({
      projectId: selectedProjectId,
      status: statusFilter,
      type: typeFilter,
    });
    setUnits(uList);
  };

  const handleBookUnit = (unit: PropertyUnit) => {
    setSelectedUnitForBooking(unit);
    setIsBookingModalOpen(true);
  };

  const availableCount = units.filter((u) => u.status === 'Available').length;
  const bookedCount = units.filter((u) => u.status === 'Booked').length;

  const headerActions = (
    <Button
      onClick={() => setIsConcurrencyModalOpen(true)}
      variant="outline"
      size="sm"
      className="h-8 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
    >
      <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
      Simulate Concurrency Collision
    </Button>
  );

  return (
    <DashboardShell
      title="Property Inventory"
      subtitle="Browse projects, towers, floor inventory, and unit reservation status."
      actionButton={headerActions}
    >
      <div className="space-y-6">
        {/* Master Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(isSelected ? 'All' : proj.id)}
                className={`group relative overflow-hidden rounded-lg border p-4 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-card shadow-sm'
                    : 'border-border bg-card hover:border-border/80 hover:shadow-2xs'
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
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-blue-200 bg-blue-50 text-blue-700'
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>

            {/* Project Filter */}
            <Select value={selectedProjectId} onValueChange={(val) => val && setSelectedProjectId(val)}>
              <SelectTrigger className="w-[180px] text-xs h-9 bg-muted/30">
                <SelectValue placeholder="All Projects" />
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
              <SelectTrigger className="w-[140px] text-xs h-9 bg-muted/30">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Booked">Booked</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
              <SelectTrigger className="w-[130px] text-xs h-9 bg-muted/30">
                <SelectValue placeholder="All Types" />
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
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {availableCount} Available
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border font-medium">
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
                            : 'border-emerald-300 bg-emerald-50 text-emerald-700'
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
