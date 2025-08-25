
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Building, Hospital, Plane, MapPin } from 'lucide-react';
import { PatientFilters } from '@/types/patient';
import { useAuth } from '@/hooks/useAuth';
import { useClinics } from '@/hooks/useClinics';
import { useTranslations } from '@/hooks/useTranslations';

interface FilterPanelProps {
  onFilterChange: (filters: PatientFilters) => void;
  currentFilters: PatientFilters;
}

export function FilterPanel({ onFilterChange, currentFilters }: FilterPanelProps) {
  const { profile } = useAuth();
  const { clinics } = useClinics();
  const { patients: patientTranslations } = useTranslations();
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange({ ...currentFilters, search: value });
  };

  // handleStatusChange удалена - теперь используется только status_name из AmoCRM

  const handleClinicChange = (clinic: string) => {
    onFilterChange({ ...currentFilters, clinic: clinic === 'all' ? undefined : clinic });
  };

  return (
    <div className="bg-blue-500 border border-border rounded-lg p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={patientTranslations.searchPlaceholder()}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Filters удалены - теперь используется только status_name из AmoCRM */}

      {/* Clinic Filter (Super Admin only) */}
      {profile?.role === 'super_admin' && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Hospital className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Клиника:</span>
          </div>
          <Select 
            value={currentFilters.clinic || 'all'} 
            onValueChange={handleClinicChange}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Выберите клинику" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="all">Все клиники</SelectItem>
              {clinics.map((clinic) => (
                <SelectItem key={clinic.short_name} value={clinic.short_name}>
                  {clinic.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
