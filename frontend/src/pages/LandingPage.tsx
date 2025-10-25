import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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
      // Redirect to user's appropriate dashboard
      // We'll need to check user role and redirect accordingly
      navigate('/schools'); // Default, can be customized based on role
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

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="LSTA Academy Logo" 
                className="h-12 w-auto"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const span = document.createElement('span');
                    span.className = 'text-2xl font-bold text-[#0B5F7F]';
                    span.textContent = 'LSTA ACADEMY';
                    parent.appendChild(span);
                  }
                }}
              />
            </div>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a 
                href="#" 
                className="text-gray-900 hover:text-[#0B5F7F] font-medium transition-colors"
              >
                Acceuil
              </a>
              <button
                onClick={handleMethodeClick}
                className="text-gray-700 hover:text-[#0B5F7F] font-medium transition-colors"
              >
                Méthode ▾
              </button>
              <button
                onClick={handleEspaceClick}
                className="text-gray-700 hover:text-[#0B5F7F] font-medium transition-colors"
              >
                Espace ▾
              </button>
              <button
                onClick={handleClubsClick}
                className="text-gray-700 hover:text-[#0B5F7F] font-medium transition-colors"
              >
                Clubs ▾
              </button>
              <button
                onClick={handleContactClick}
                className="text-gray-700 hover:text-[#0B5F7F] font-medium transition-colors"
              >
                Contact
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleConnexion}
                className="border-[#0B5F7F] text-[#0B5F7F] hover:bg-[#0B5F7F] hover:text-white"
              >
                Connexion
              </Button>
              <Button
                onClick={handleMonEspace}
                className="bg-[#0B5F7F] hover:bg-[#094A63] text-white"
              >
                Mon espace
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              <span className="font-handwriting text-6xl text-[#0B5F7F]">Une</span>{' '}
              <span className="relative">
                pédagogie qui 
                <span className="absolute -right-8 -top-4 text-4xl">💡</span>
              </span>
              <br />
              s'adapte à chaque élève
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              Diagnostic personnalisé, coaching enseignant,<br />
              suivi familial et activités interactives.
            </p>

            <div className="flex space-x-4 pt-4">
              <Button
                onClick={() => navigate('/schools')}
                className="bg-[#0B5F7F] hover:bg-[#094A63] text-white px-8 py-6 text-lg"
              >
                Découvrez notre plateforme
              </Button>
              <Button
                variant="outline"
                onClick={handleMethodeClick}
                className="border-2 border-[#0B5F7F] text-[#0B5F7F] hover:bg-[#0B5F7F] hover:text-white px-8 py-6 text-lg"
              >
                Notre méthode
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src="/image.png" 
                alt="Students learning" 
                className="w-full h-auto rounded-3xl shadow-2xl"
                onError={(e) => {
                  // Fallback placeholder if image doesn't exist
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%230B5F7F" width="800" height="600"/%3E%3Ctext fill="white" font-family="Arial" font-size="40" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage will be here%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            
            {/* Decorative waves at the bottom */}
            <div className="absolute -bottom-10 left-0 right-0 z-0">
              <svg viewBox="0 0 1440 320" className="w-full">
                <path 
                  fill="#B8E6F5" 
                  fillOpacity="0.3" 
                  d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                />
              </svg>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section (Optional) */}
      <section className="bg-gradient-to-br from-[#E8F5F9] to-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Diagnostic personnalisé</h3>
              <p className="text-gray-600">Évaluation adaptée aux besoins de chaque élève</p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Coaching enseignant</h3>
              <p className="text-gray-600">Accompagnement professionnel et personnalisé</p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Activités interactives</h3>
              <p className="text-gray-600">Apprentissage ludique et engageant</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B5F7F] text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 LSTA Academy. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
