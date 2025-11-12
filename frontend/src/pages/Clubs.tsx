import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from 'react';
import logo from "@/assets/logo-lsta.png";
import logoPedagoria from "@/assets/logo-pedagoria.png";
import ClubsSection from "@/components/ClubsSection";

const Clubs = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Accueil", onClick: () => navigate('/') },
    { label: "Méthode", onClick: () => navigate('/methode'), hasDropdown: true },
    { label: "Espace", onClick: () => navigate('/espace'), hasDropdown: true },
    { label: "Activités", href: "#activites", hasDropdown: true },
    { label: "Clubs", onClick: () => navigate('/clubs') },
    { label: "Contact", onClick: () => navigate('/contact') },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, onClick?: () => void) => {
    if (onClick) {
      e.preventDefault();
      onClick();
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Professional Design */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 py-3">
          <nav className="flex items-center justify-between">
            {/* Logos */}
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer">
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
                    onClick={(e) => handleNavClick(e, item.onClick)}
                    className="flex items-center gap-1 text-slate-700 hover:text-slate-900 transition-colors font-medium text-base cursor-pointer"
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
                className="hidden sm:inline-flex border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                onClick={() => navigate('/login')}
              >
                Connexion
              </Button>
              <Button 
                className="hidden sm:inline-flex bg-slate-900 hover:bg-slate-800 text-white font-medium"
                onClick={() => navigate('/schools')}
              >
                Mon espace
              </Button>
              
              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-slate-900" />
                ) : (
                  <Menu className="h-6 w-6 text-slate-900" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-4 border-t border-slate-200">
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href || "#"}
                      onClick={(e) => handleNavClick(e, item.onClick)}
                      className="flex items-center gap-1 text-slate-700 hover:text-slate-900 transition-colors font-medium py-2 cursor-pointer"
                    >
                      {item.label}
                      {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-200">
                <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium" onClick={() => navigate('/login')}>
                  Connexion
                </Button>
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium" onClick={() => navigate('/schools')}>Mon espace</Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="pt-20">
        <ClubsSection />
      </main>
    </div>
  );
};

export default Clubs;
