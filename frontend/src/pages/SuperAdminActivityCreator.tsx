import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/lib/api';
import { ArrowLeft, Plus, Save, School, FileText, GraduationCap } from 'lucide-react';

interface School {
  id: number;
  name: string;
  city: string;
  region: string;
  level: string;
}

const SuperAdminActivityCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'lesson',
    difficulty: 'medium',
    duration: '',
    subject: '',
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl('/superadmin/schools'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load schools');
      const data = await response.json();
      setSchools(data);
    } catch (error) {
      console.error('Error loading schools:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les écoles',
        variant: 'destructive',
      });
    }
  };

  const handleSchoolToggle = (schoolId: number) => {
    setSelectedSchools(prev =>
      prev.includes(schoolId)
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSchools.length === schools.length) {
      setSelectedSchools([]);
    } else {
      setSelectedSchools(schools.map(s => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSchools.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins une école',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_CONFIG.getUrl('/superadmin/activities'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          ...formData,
          schoolIds: selectedSchools,
        }),
      });

      if (!response.ok) throw new Error('Failed to create activity');

      toast({
        title: 'Succès',
        description: `Activité créée et distribuée à ${selectedSchools.length} école(s)`,
      });

      navigate('/superadmin/dashboard');
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'activité',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed 64px */}
      <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center gap-4 h-full">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/superadmin/dashboard')}
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900">Créer une Activité</h1>
                <p className="text-xs text-slate-600">Distribuer aux écoles sélectionnées</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Activity Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Détails de l'Activité</CardTitle>
                  <CardDescription>Informations sur le contenu pédagogique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre de l'activité *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Les fractions - Introduction"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Matière *</Label>
                    <Input
                      id="subject"
                      placeholder="Ex: Mathématiques, Français, Sciences..."
                      value={formData.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type d'activité</Label>
                      <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lesson">Leçon</SelectItem>
                          <SelectItem value="exercise">Exercice</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="project">Projet</SelectItem>
                          <SelectItem value="evaluation">Évaluation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Niveau de difficulté</Label>
                      <Select value={formData.difficulty} onValueChange={(value) => handleChange('difficulty', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Facile</SelectItem>
                          <SelectItem value="medium">Moyen</SelectItem>
                          <SelectItem value="hard">Difficile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée estimée (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="Ex: 45"
                      value={formData.duration}
                      onChange={(e) => handleChange('duration', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez l'objectif et le contenu de cette activité..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Contenu de l'activité</Label>
                    <Textarea
                      id="content"
                      placeholder="Le contenu détaillé de l'activité (instructions, exercices, etc.)..."
                      value={formData.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                      rows={8}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - School Selection */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    Écoles Destinataires
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez les écoles qui recevront cette activité
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm font-medium">
                      {selectedSchools.length} / {schools.length} sélectionnée(s)
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedSchools.length === schools.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {schools.map((school) => (
                      <div
                        key={school.id}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`school-${school.id}`}
                          checked={selectedSchools.includes(school.id)}
                          onCheckedChange={() => handleSchoolToggle(school.id)}
                        />
                        <label
                          htmlFor={`school-${school.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{school.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {school.city}, {school.region}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                              {school.level}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}

                    {schools.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune école disponible</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/superadmin/dashboard')}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    'Création en cours...'
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Créer et Distribuer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
};

export default SuperAdminActivityCreator;
