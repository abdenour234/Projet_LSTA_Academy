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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 rounded-full bg-blue-100 p-6 hover:bg-emerald-100 transition-colors duration-300">
        <Search className="h-12 w-12 text-blue-500" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-blue-600">{title}</h3>
      <p className="mb-6 max-w-md text-blue-500">{description}</p>
      {onReset && (
        <Button onClick={onReset} variant="default" className="bg-blue-600 hover:bg-emerald-500">
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
