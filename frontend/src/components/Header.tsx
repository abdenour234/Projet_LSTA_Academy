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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <span className="text-lg font-bold">ÉP</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">Plateforme Éducative</h1>
              <p className="text-xs text-muted-foreground">Annuaire des écoles</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une école..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-muted/50 border-border focus:bg-background transition-smooth"
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
