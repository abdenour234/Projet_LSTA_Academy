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
      <div className="mb-4 rounded-full bg-slate-100 p-6">
        <Search className="h-12 w-12 text-slate-600" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mb-6 max-w-md text-slate-600">{description}</p>
      {onReset && (
        <Button onClick={onReset} variant="default" className="bg-blue-600 hover:bg-blue-700">
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
