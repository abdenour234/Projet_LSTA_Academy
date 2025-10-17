import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import FiltersPanel, { Filters } from '@/components/FiltersPanel';
import SchoolCard from '@/components/SchoolCard';
import EmptyState from '@/components/EmptyState';
import { SetupDemo } from '@/components/SetupDemo';
import { SchoolFormDialog } from '@/components/SchoolFormDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { schoolApi } from '@/lib/api';
import LoadingState from '@/components/LoadingState';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    region: 'Toutes les régions',
    level: 'Tous les niveaux',
    status: 'Tous les statuts',
  });
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const data = await schoolApi.getAll();
      setSchools(data || []);
    } catch (error) {
      console.error('Error loading schools:', error);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.region.toLowerCase().includes(searchQuery.toLowerCase());

      // Region filter
      const matchesRegion =
        filters.region === 'Toutes les régions' || school.region === filters.region;

      // Level filter
      const matchesLevel =
        filters.level === 'Tous les niveaux' || school.level === filters.level;

      // Status filter
      const matchesStatus =
        filters.status === 'Tous les statuts' || school.status === filters.status;

      return matchesSearch && matchesRegion && matchesLevel && matchesStatus;
    });
  }, [searchQuery, filters, schools]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      region: 'Toutes les régions',
      level: 'Tous les niveaux',
      status: 'Tous les statuts',
    });
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Setup Demo */}
        <div className="mb-8 animate-fade-in">
          <SetupDemo />
        </div>

        {/* Page Title */}
        <div className="mb-8 animate-fade-in flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Annuaire des écoles</h1>
            <p className="text-muted-foreground">
              Sélectionnez une école pour vous connecter et accéder au tableau de bord
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle école
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-8 animate-fade-in">
          <FiltersPanel filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Results Count */}
        <div className="mb-6 animate-fade-in">
          <p className="text-sm text-muted-foreground">
            {filteredSchools.length} école{filteredSchools.length !== 1 ? 's' : ''} trouvée
            {filteredSchools.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Schools Grid */}
        {filteredSchools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school, index) => (
              <div
                key={school.id}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <SchoolCard school={school} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState onReset={resetFilters} />
        )}
      </main>

      <SchoolFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={loadSchools}
      />
    </div>
  );
};

export default Index;
