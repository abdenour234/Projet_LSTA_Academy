import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Construction, ArrowLeft } from 'lucide-react';

interface UnderConstructionProps {
  pageName: string;
}

const UnderConstruction = ({ pageName }: UnderConstructionProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5F9] to-white flex items-center justify-center">
      <div className="text-center px-6">
        <div className="mb-8 animate-bounce">
          <Construction className="w-24 h-24 text-[#0B5F7F] mx-auto" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Page en construction
        </h1>
        
        <p className="text-xl text-gray-600 mb-2">
          La page <span className="font-semibold text-[#0B5F7F]">{pageName}</span> est en cours de développement
        </p>
        
        <p className="text-gray-500 mb-8">
          Nous travaillons dur pour vous offrir la meilleure expérience possible.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-[#0B5F7F] hover:bg-[#094A63] text-white px-8 py-6 text-lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Retour à l'accueil
          </Button>
          
          <Button
            onClick={() => navigate('/schools')}
            variant="outline"
            className="border-2 border-[#0B5F7F] text-[#0B5F7F] hover:bg-[#0B5F7F] hover:text-white px-8 py-6 text-lg"
          >
            Voir les écoles
          </Button>
        </div>
        
        <div className="mt-12 text-gray-400">
          <p className="text-sm">🚧 Cette page sera bientôt disponible 🚧</p>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;
