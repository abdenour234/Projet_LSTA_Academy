import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, School, User, Mail, Lock, MapPin, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authApi, ApiError } from '@/lib/api';

interface AdminSignupData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  schoolName: string;
  schoolCity: string;
  schoolRegion: string;
  schoolLevel: string;
  schoolStatus: string;
  schoolAddress: string;
  schoolStudents: string;
}

const AdminSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AdminSignupData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    schoolCity: '',
    schoolRegion: '',
    schoolLevel: 'Primaire',
    schoolStatus: 'Public',
    schoolAddress: '',
    schoolStudents: '',
  });

  const regions = [
    'Tanger-Tétouan-Al Hoceïma',
    'L\'Oriental',
    'Fès-Meknès',
    'Rabat-Salé-Kénitra',
    'Béni Mellal-Khénifra',
    'Casablanca-Settat',
    'Marrakech-Safi',
    'Drâa-Tafilalet',
    'Souss-Massa',
    'Guelmim-Oued Noun',
    'Laâyoune-Sakia El Hamra',
    'Dakhla-Oued Ed-Dahab',
  ];

  const handleChange = (field: keyof AdminSignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 6 caractères.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.signupAdmin({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        schoolName: formData.schoolName,
        schoolCity: formData.schoolCity,
        schoolRegion: formData.schoolRegion,
        schoolLevel: formData.schoolLevel,
        schoolStatus: formData.schoolStatus,
        schoolAddress: formData.schoolAddress,
        schoolStudents: formData.schoolStudents ? parseInt(formData.schoolStudents) : 0,
      });

      toast({
        title: 'Compte créé avec succès!',
        description: `Bienvenue ${formData.fullName}! Votre école "${formData.schoolName}" a été créée.`,
      });

      // Navigate to admin dashboard
      const schoolId = response.school.id;
      navigate(`/school/${schoolId}/admin/dashboard`);
      
    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = 'Une erreur est survenue lors de la création du compte.';
      
      if (error instanceof ApiError) {
        errorMessage = typeof error.message === 'string' 
          ? error.message 
          : 'Une erreur est survenue lors de la création du compte.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'annuaire
        </Button>

        <Card className="p-8 border-2 border-blue-200 shadow-xl rounded-lg">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden hover:scale-110 transition-transform duration-300">
              <img src="/lsta-logo.svg" alt="L.S.T.A. ACADEMY" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-blue-600 mb-2">
              Créer un compte administrateur
            </h1>
            <p className="text-sm text-blue-500">
              Inscrivez votre école sur L.S.T.A. ACADEMY
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold flex items-center gap-2 text-blue-600">
                <User className="h-5 w-5 text-blue-500" />
                Informations personnelles
              </h2>
              
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-medium text-blue-600">Nom complet *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ahmed Bennani"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  required
                  className="border-2 border-blue-200 text-sm focus:border-emerald-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-blue-600">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@ecole.ma"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10 border-2 border-blue-200 text-sm focus:border-emerald-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium text-blue-600">Mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* School Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l'école
              </h2>

              <div className="space-y-2">
                <Label htmlFor="schoolName">Nom de l'école *</Label>
                <Input
                  id="schoolName"
                  type="text"
                  placeholder="École Primaire Al-Amal"
                  value={formData.schoolName}
                  onChange={(e) => handleChange('schoolName', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolCity">Ville *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="schoolCity"
                      type="text"
                      placeholder="Casablanca"
                      value={formData.schoolCity}
                      onChange={(e) => handleChange('schoolCity', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolRegion">Région *</Label>
                  <Select
                    value={formData.schoolRegion}
                    onValueChange={(value) => handleChange('schoolRegion', value)}
                    required
                  >
                    <SelectTrigger id="schoolRegion">
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolLevel">Niveau *</Label>
                  <Select
                    value={formData.schoolLevel}
                    onValueChange={(value) => handleChange('schoolLevel', value)}
                    required
                  >
                    <SelectTrigger id="schoolLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primaire">Primaire</SelectItem>
                      <SelectItem value="Collège">Collège</SelectItem>
                      <SelectItem value="Lycée">Lycée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolStatus">Statut *</Label>
                  <Select
                    value={formData.schoolStatus}
                    onValueChange={(value) => handleChange('schoolStatus', value)}
                    required
                  >
                    <SelectTrigger id="schoolStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Privé">Privé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolAddress">Adresse</Label>
                <Input
                  id="schoolAddress"
                  type="text"
                  placeholder="123 Rue Mohammed V"
                  value={formData.schoolAddress}
                  onChange={(e) => handleChange('schoolAddress', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolStudents">Nombre d'élèves</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="schoolStudents"
                    type="number"
                    placeholder="250"
                    value={formData.schoolStudents}
                    onChange={(e) => handleChange('schoolStudents', e.target.value)}
                    className="pl-10"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Création du compte...' : 'Créer mon compte'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Vous avez déjà un compte?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-semibold"
                  onClick={() => navigate('/')}
                >
                  Se connecter
                </Button>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminSignup;
