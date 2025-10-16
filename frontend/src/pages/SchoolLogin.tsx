import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { SetupDemo } from '@/components/SetupDemo';

const SchoolLogin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const data = await api.get<{ name: string }>(`/schools/${id}`);
        if (data) {
          setSchoolName(data.name);
        }
      } catch (error) {
        console.error('Error fetching school:', error);
      }
    };

    if (id) {
      fetchSchool();
    }
  }, [id]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login with Spring Boot API
      const authData = await api.post<{ token: string; email: string }>('/auth/login', {
        email,
        password,
      });

      // Store JWT token
      localStorage.setItem('token', authData.token);

      // Get current user profile
      const userData = await api.get<{
        id: string;
        email: string;
        fullName: string;
        schoolId: string;
        roles: string[];
      }>('/auth/me');

      // Verify school access
      if (userData.schoolId !== id) {
        localStorage.removeItem('token');
        toast({
          title: 'Erreur',
          description: 'Vous n\'êtes pas autorisé à accéder à cette école.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Navigate based on role
      if (userData.roles.includes('ADMIN')) {
        navigate(`/school/${id}/admin/dashboard`);
      } else {
        navigate(`/school/${id}/teacher/dashboard`);
      }

      toast({
        title: 'Connexion réussie',
        description: `Bienvenue sur ${schoolName}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: 'Identifiants incorrects. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'annuaire
        </Button>

        <Card className="p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {schoolName || 'Connexion'}
            </h1>
            <p className="text-muted-foreground">
              Connectez-vous pour accéder au tableau de bord
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@ecole.ma"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Admin:</strong> admin.pasteur@ecole.ma / admin123<br />
              <strong>Prof:</strong> prof.pasteur@ecole.ma / prof123
            </p>
          </div>
        </Card>

        <div className="mt-6">
          <SetupDemo />
        </div>
      </div>
    </div>
  );
};

export default SchoolLogin;
