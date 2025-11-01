import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import { Shield, GraduationCap, UserCheck, BookOpen, LogIn } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await authApi.login(formData.email, formData.password);
    
    // Stockage du token et des infos utilisateur
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    // EXTRACTION DES DONNÉES
    const role = response.user.role;
    const mustChangePassword = response.user.mustChangePassword; // <-- NOUVEAU

    toast({
      title: 'Connexion réussie',
      description: `Bienvenue ${response.user.fullName || response.user.email}!`,
    });

    // 1. SI C'EST UN ÉTUDIANT ET QU'IL DOIT CHANGER SON MOT DE PASSE
    if (mustChangePassword && role === 'student') {
      navigate('/change-password'); // Redirection vers le changement de mot de passe
      return; // On arrête ici → on ne fait pas la redirection habituelle
    }

    // 2. SINON → REDIRECTION NORMALE SELON LE RÔLE
    const schoolId = response.user.schoolId;

    switch (role) {
      case 'superadmin':
        navigate('/superadmin/dashboard');
        break;
      case 'admin':
        navigate(`/school/${schoolId}/admin/dashboard`);
        break;
      case 'teacher':
        navigate(`/school/${schoolId}/teacher/dashboard`);
        break;
      case 'student':
        navigate('/student/dashboard'); // ← Étudiant qui a déjà changé son mot de passe
        break;
      default:
        toast({
          title: 'Erreur',
          description: 'Rôle utilisateur non reconnu',
          variant: 'destructive',
        });
        navigate('/');
    }
  } catch (error: any) {
    // ... gestion d'erreur
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto">
            <LogIn className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl text-center">Connexion</CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre compte pour accéder à la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
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

          {/* Roles Info */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Accès selon votre rôle:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>SuperAdmin</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCheck className="h-3 w-3" />
                <span>Admin École</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-3 w-3" />
                <span>Enseignant</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>Étudiant</span>
              </div>
            </div>
          </div>

          {/* Signup Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte?{' '}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate('/signup')}
              >
                Créer un compte admin
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
