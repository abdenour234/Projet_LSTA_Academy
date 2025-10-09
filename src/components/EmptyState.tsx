import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

const EmptyState = ({
  title = 'Aucune école trouvée',
  description = 'Essayez de modifier vos critères de recherche ou filtres.',
  onReset,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="mb-4 rounded-full bg-muted p-6">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-md text-muted-foreground">{description}</p>
      {onReset && (
        <Button onClick={onReset} variant="default">
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
