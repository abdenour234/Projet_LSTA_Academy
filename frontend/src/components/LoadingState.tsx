import { Loader2 } from 'lucide-react';

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Chargement...</h3>
      <p className="text-muted-foreground">Récupération des données des écoles</p>
    </div>
  );
};

export default LoadingState;
