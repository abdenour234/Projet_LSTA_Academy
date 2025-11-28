import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { authApi, auth } from '@/lib/api';
import { Shield, GraduationCap, UserCheck, BookOpen, LogIn } from 'lucide-react';
import { normalizeRole, getRoleDashboardRoute } from '@/lib/roleUtils';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // ✅ STEP 1: Login (api.ts already clears old session data completely)
    const response = await authApi.login(formData.email, formData.password);
    
    console.log('[LOGIN] Response received:', { 
      email: response.user.email, 
      role: response.user.role,
      schoolId: response.user.schoolId,
      mustChangePassword: response.user.mustChangePassword
    });

    // ✅ STEP 2: Validate and normalize role
    const userRole = normalizeRole(response.user.role);
    console.log('[LOGIN] Normalized role:', userRole);
    
    if (!userRole) {
      console.error('[LOGIN] Invalid role detected:', response.user.role);
      auth.clearAllAuthData();
      toast({
        title: 'Erreur de configuration',
        description: `Rôle utilisateur invalide: ${response.user.role}. Contactez un administrateur.`,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // ✅ STEP 3: Verify schoolId for roles that require it
    if ((userRole === 'ADMIN' || userRole === 'TEACHER') && !response.user.schoolId) {
      console.error('[LOGIN] Missing schoolId for role:', userRole);
      auth.clearAllAuthData();
      toast({
        title: 'Erreur de configuration',
        description: 'Aucune école associée à votre compte. Contactez un administrateur.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // ✅ STEP 4: Double-check localStorage has data (synchronous verification)
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('current_user');
    
    if (!storedToken || !storedUser) {
      console.error('[LOGIN] Storage verification failed - data not saved');
      auth.clearAllAuthData();
      toast({
        title: 'Erreur de connexion',
        description: 'Impossible de sauvegarder la session. Veuillez réessayer.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    
    console.log('[LOGIN] Storage verified - token and user data present');

    // ✅ STEP 5: Show success message
    toast({
      title: 'Connexion réussie',
      description: `Bienvenue ${response.user.fullName || response.user.email}!`,
    });

    // ✅ STEP 6: Force AuthContext to refresh with new user data
    await checkAuth();
    console.log('[LOGIN] AuthContext refreshed with new user');

    // ✅ STEP 7: Check if password change is required (for students)
    if (response.user.mustChangePassword && userRole === 'STUDENT') {
      console.log('[LOGIN] Redirecting to password change');
      navigate('/change-password', { replace: true });
      return;
    }

    // ✅ STEP 8: Get correct dashboard route and redirect
    const dashboardRoute = getRoleDashboardRoute(userRole, response.user.schoolId);
    console.log('[LOGIN] Redirecting to:', dashboardRoute);
    
    // Use replace to prevent back button from returning to login
    navigate(dashboardRoute, { replace: true });
    
  } catch (error: any) {
    console.error('[LOGIN] Login error:', error);
    
    // Clear any partial authentication data using auth helper
    auth.clearAllAuthData();
    
    toast({
      title: 'Erreur de connexion',
      description: error.message || 'Email ou mot de passe incorrect',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-blue-200 shadow-xl rounded-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader className="p-6 space-y-2 bg-gradient-to-r from-blue-50 to-white rounded-t-xl">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto overflow-hidden hover:scale-110 transition-transform duration-200">
            <img src="/lsta-logo.svg" alt="L.S.T.A. ACADEMY" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-lg font-semibold text-blue-600 text-center">Connexion</CardTitle>
          <CardDescription className="text-xs text-blue-500 text-center">
            Connectez-vous à votre compte L.S.T.A. ACADEMY
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-slate-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="border-2 border-blue-200 text-sm focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-blue-600">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="border-2 border-blue-200 text-sm focus:border-emerald-400"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full text-sm font-medium h-9" 
              disabled={loading}
            >
              {loading ? (
                'Connexion en cours...'
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
