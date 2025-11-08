import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from 'react';
import logo from "@/assets/logo-lsta.png";
import logoPedagoria from "@/assets/logo-pedagoria.png";
import MethodeSection from "@/components/MethodeSection";

const Methode = () => {
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-sm border-b-4 border-[hsl(var(--edu-blue))]">
        <div className="container mx-auto px-6 py-3">
          <nav className="flex items-center justify-between">
            {/* Logos */}
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer">
              <img src={logo} alt="L.S.T.A. ACADEMY" className="h-16 w-auto" />
              <div className="h-14 w-px bg-[hsl(var(--edu-blue))]" />
              <img src={logoPedagoria} alt="Pedagoria" className="h-14 w-auto" />
            </a>

            {/* Desktop Navigation */}
            <ul className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href || "#"}
                    onClick={(e) => handleNavClick(e, item.onClick)}
                    className="flex items-center gap-1 text-foreground hover:text-[hsl(var(--edu-blue))] transition-colors font-bold text-lg cursor-pointer"
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
                className="hidden sm:inline-flex border-2 border-[hsl(var(--edu-blue))] text-[hsl(var(--edu-blue))] hover:bg-[hsl(var(--edu-blue))] hover:text-white font-bold"
                onClick={() => navigate('/login')}
              >
                Connexion
              </Button>
              <Button 
                className="hidden sm:inline-flex bg-[hsl(var(--edu-blue))] hover:bg-[hsl(200_90%_45%)] text-white font-bold shadow-[var(--shadow-button)]"
                onClick={() => navigate('/schools')}
              >
                Mon espace
              </Button>
              
              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-foreground" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-4 animate-in slide-in-from-top">
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href || "#"}
                      onClick={(e) => handleNavClick(e, item.onClick)}
                      className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium py-2 cursor-pointer"
                    >
                      {item.label}
                      {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                  Connexion
                </Button>
                <Button className="w-full" onClick={() => navigate('/schools')}>Mon espace</Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="pt-20">
        <MethodeSection />
      </main>
    </div>
  );
};

export default Methode;
