import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, ChevronDown, Menu, X } from "lucide-react";
import { authApi } from '@/lib/api';
import logo from "@/assets/logo-lsta.png";
import logoPedagoria from "@/assets/logo-pedagoria.png";
import heroImage from "@/assets/hero-transparent.png";
import HeroSection from '@/components/HeroSection';
import PedagoriaSection from '@/components/PedagoriaSection';
import DedicatedSpaces from '@/components/DedicatedSpaces';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await authApi.getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMonEspace = () => {
    if (isAuthenticated) {
      navigate('/schools');
    } else {
      navigate('/login');
    }
  };

  const handleConnexion = () => {
    navigate('/login');
  };

  const handleMethodeClick = () => {
    navigate('/methode');
  };

  const handleEspaceClick = () => {
    navigate('/espace');
  };

  const handleClubsClick = () => {
    navigate('/clubs');
  };

  const handleContactClick = () => {
    navigate('/contact');
  };

  const navItems = [
    { label: "Accueil", href: "/" },
    { label: "Méthode", onClick: handleMethodeClick, hasDropdown: true },
    { label: "Espace", onClick: handleEspaceClick, hasDropdown: true },
    { label: "Activités", href: "#activites", hasDropdown: true },
    { label: "Clubs", onClick: handleClubsClick },
    { label: "Contact", onClick: handleContactClick },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, onClick?: () => void) => {
    if (onClick) {
      e.preventDefault();
      onClick();
      setMobileMenuOpen(false);
      return;
    }
    
    if (href.startsWith("#") && href !== "#") {
      e.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
        
        setMobileMenuOpen(false);
      }
    } else {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Professional Header - Keep branding, update styling */}
  <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-50 to-white border-b-2 border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <nav className="flex items-center justify-between">
            {/* Logos */}
              <a href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <img src={logo} alt="L.S.T.A. ACADEMY" className="h-16 w-auto" />
              <div className="h-14 w-px bg-blue-600" />
              <img src={logoPedagoria} alt="Pedagoria" className="h-14 w-auto" />
            </a>

            {/* Desktop Navigation */}
            <ul className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href || "#"}
                    onClick={(e) => handleNavClick(e, item.href || "#", item.onClick)}
                    className="flex items-center gap-1 text-blue-600 hover:text-emerald-600 transition-colors font-semibold text-base cursor-pointer"
                  >
                    {item.label}
                    {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                  </a>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="hidden sm:inline-flex border-2 border-blue-200 text-blue-600 hover:bg-emerald-500 hover:text-white font-semibold"
                onClick={handleConnexion}
              >
                Connexion
              </Button>
              <Button 
                className="hidden sm:inline-flex bg-blue-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                onClick={handleMonEspace}
              >
                Mon espace
              </Button>
              
              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-blue-600" />
                ) : (
                  <Menu className="h-6 w-6 text-blue-600" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-4 border-t-2 border-blue-200 pt-4">
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href || "#"}
                      onClick={(e) => handleNavClick(e, item.href || "#", item.onClick)}
                      className="flex items-center gap-1 text-blue-600 hover:text-emerald-600 transition-colors font-semibold py-2 cursor-pointer"
                    >
                      {item.label}
                      {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-200">
                <Button variant="outline" className="w-full border-2 border-blue-200 text-blue-600 hover:bg-emerald-500 hover:text-white" onClick={handleConnexion}>
                  Connexion
                </Button>
                <Button className="w-full bg-blue-600 hover:bg-emerald-500 text-white" onClick={handleMonEspace}>Mon espace</Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content with New UI Components */}
      <main>
        <HeroSection />
        <PedagoriaSection />
        <DedicatedSpaces />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-medium">&copy; 2025 LSTA Academy - Pedagoria. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
