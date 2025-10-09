import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface Filters {
  region: string;
  level: string;
  status: string;
}

interface FiltersPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const FiltersPanel = ({ filters, onFiltersChange }: FiltersPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const regions = [
    'Toutes les régions',
    'Oriental',
    'Fès-Meknès',
    'Casablanca-Settat',
    'Rabat-Salé-Kénitra',
    'Marrakech-Safi',
    'Tanger-Tétouan-Al Hoceïma',
  ];

  const levels = ['Tous les niveaux', 'Primaire', 'Collège', 'Lycée'];
  const statuses = ['Tous les statuts', 'Public', 'Privé'];

  const activeFiltersCount =
    (filters.region !== 'Toutes les régions' ? 1 : 0) +
    (filters.level !== 'Tous les niveaux' ? 1 : 0) +
    (filters.status !== 'Tous les statuts' ? 1 : 0);

  const resetFilters = () => {
    onFiltersChange({
      region: 'Toutes les régions',
      level: 'Tous les niveaux',
      status: 'Tous les statuts',
    });
  };

  return (
    <Card className="border-border shadow-card">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Filtres</h2>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Région</label>
            <Select
              value={filters.region}
              onValueChange={(value) => onFiltersChange({ ...filters, region: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Niveau</label>
            <Select
              value={filters.level}
              onValueChange={(value) => onFiltersChange({ ...filters, level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un niveau" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Statut</label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FiltersPanel;
