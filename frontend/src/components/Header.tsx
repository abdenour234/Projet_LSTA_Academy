import { Search, Plus, User, Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const Header = ({ searchQuery, onSearchChange }: HeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden hover:scale-110 transition-transform duration-200">
              <img src="/lsta-logo.svg" alt="L.S.T.A. ACADEMY" className="h-full w-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-blue-600">L.S.T.A. ACADEMY</h1>
              <p className="text-xs text-blue-500">Plateforme Éducative</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
            <Input
              type="search"
              placeholder="Rechercher une école..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white border-2 border-blue-200 focus:border-emerald-400 hover:border-blue-300 transition-all duration-200"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/login')}
              className="hidden sm:flex"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Connexion
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/superadmin/login')}
              className="hidden sm:flex"
            >
              <Shield className="mr-2 h-4 w-4" />
              SuperAdmin
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
