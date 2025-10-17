import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authApi, ApiError } from '@/lib/api';

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      const user = response.user;

      // Verify the user is a superadmin
      if (user.role?.toLowerCase() !== 'superadmin') {
        await authApi.logout();
        toast({
          title: 'Accès refusé',
          description: 'Vous n\'avez pas les permissions de SuperAdmin.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Navigate to superadmin dashboard
      navigate('/superadmin/dashboard');

      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue dans le panneau SuperAdmin',
      });
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Identifiants incorrects. Veuillez réessayer.';
      
      if (error instanceof ApiError) {
        errorMessage = typeof error.message === 'string' 
          ? error.message 
          : 'Une erreur est survenue lors de la connexion.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erreur de connexion',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-card border-2 border-primary/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              SuperAdmin
            </h1>
            <p className="text-muted-foreground">
              Panneau d'administration global
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                Identifiants par défaut:<br />
                <span className="font-mono font-semibold">admin@admin.com / admin</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@admin.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground"
            >
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
