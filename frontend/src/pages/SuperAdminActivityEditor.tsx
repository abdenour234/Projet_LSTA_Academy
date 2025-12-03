import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, activityApi, classApi, schoolApi, subjectApi, classSubjectApi } from '@/lib/api';
import { ActivityBuilder } from '@/components/activity/ActivityBuilder';
import LoadingState from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, School, Users, BookOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { normalizeRole } from '@/lib/roleUtils';

const SuperAdminActivityEditor = () => {
  const { schoolId: urlSchoolId, activityId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [activityData, setActivityData] = useState<any>(null);
  const [nature, setNature] = useState<string>('Classe');

  useEffect(() => {
    loadInitialData();

  }, []);

  const loadInitialData = async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user || normalizeRole(user.role) !== 'SUPERADMIN') {
        toast({ title: 'Accès refusé', variant: 'destructive' });
        navigate('/superadmin/dashboard');
        return;
      }

      const schoolsData = await schoolApi.getAll();
      setSchools(schoolsData || []);

      const defaultSchoolId = urlSchoolId || (schoolsData[0]?.id?.toString()) || '';
      setSelectedSchoolId(defaultSchoolId);

      if (defaultSchoolId) {
        await loadClasses(defaultSchoolId);
      }

      if (activityId) {
        await loadActivity(activityId);
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message || 'Chargement échoué', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (schoolId: string) => {
    try {
      const data = await classApi.getBySchoolId(schoolId);
      setClasses(data || []);
      setSelectedClassId(''); // reset
      setSubjects([]);
      setSelectedSubjectId('');
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de charger les classes', variant: 'destructive' });
    }
  };

 const loadSubjectsForClass = async (classId: string) => {
  if (!classId) {
    setSubjects([]);
    setSelectedSubjectId('');
    return;
  }

  try {
    console.log("Chargement des matières pour la classe :", classId);

    // ON UTILISE TA ROUTE QUI EXISTE DÉJÀ
    const response = await classSubjectApi.getSubjectsForClass(classId);
    const classSubjects = response.data || response;

    if (!classSubjects || classSubjects.length === 0) {
      toast({
        title: 'Aucune matière assignée',
        description: 'Cette classe n\'a pas encore de matières. Tu peux en assigner dans "Gestion des classes".',
        variant: 'default'
      });
      setSubjects([]);
      setSelectedSubjectId('');
      return;
    }

    // On récupère les vraies matières via leurs IDs
    const subjectIds = classSubjects.map((cs: any) => cs.subjectId);
    const subjectPromises = subjectIds.map((id: string) => subjectApi.getById(id));
    const subjects = await Promise.all(subjectPromises);

    setSubjects(subjects);
    setSelectedSubjectId(''); // on laisse le choix

    toast({
      title: `${subjects.length} matière(s) chargée(s)`,
      description: subjects.map((s: any) => s.name).join(', '),
      variant: 'default'
    });

  } catch (err: any) {
    console.error("Erreur chargement matières de la classe :", err);
    toast({
      title: 'Erreur',
      description: 'Impossible de charger les matières assignées à cette classe',
      variant: 'destructive'
    });
    setSubjects([]);
    setSelectedSubjectId('');
  }
};

  const loadActivity = async (id: string) => {
    try {
      const activity = await activityApi.getById(id);
      const layoutData = activity.layoutData ? JSON.parse(activity.layoutData as string) : { elements: [] };

      setNature(activity.nature || 'Classe');
      setActivityData({
        title: activity.title,
        description: activity.description || '',
        type: activity.type,
        level: activity.level,
        elements: layoutData.elements || [],
      });

      if (activity.schoolId) {
        setSelectedSchoolId(activity.schoolId.toString());
        await loadClasses(activity.schoolId.toString());
      }
      if (activity.classId) {
        setSelectedClassId(activity.classId);
        await loadSubjectsForClass(activity.classId);
      }
      if (activity.subjectId) {
        setSelectedSubjectId(activity.subjectId);
      }
    } catch (err) {
      toast({ title: 'Erreur', description: 'Activité introuvable', variant: 'destructive' });
    }
  };

  const handleSchoolChange = async (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setSelectedClassId('');
    setSubjects([]);
    setSelectedSubjectId('');
    await loadClasses(schoolId);
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    await loadSubjectsForClass(classId);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/superadmin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">
            {activityId ? 'Modifier l\'activité' : 'Créer une activité'}
          </h1>
        </div>

        {/* École - caché si imposé */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <School className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-3">École</h3>
              <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choisir une école" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name} • {s.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Classe + Matière */}
        {selectedSchoolId && (
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3">Classe cible</h3>
                  <Select value={selectedClassId} onValueChange={handleClassChange}>
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Choisir une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.level && `• ${c.level}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedClass && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Niveau détecté : <Badge variant="secondary">{selectedClass.level || 'Primaire'}</Badge>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-emerald-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3">Matière</h3>
                  {subjects.length > 0 ? (
                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Choisir une matière" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune matière disponible pour cette classe</p>
                  )}
                  {selectedSubject && (
                    <Badge className="mt-2" variant="outline">{selectedSubject.name}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Nature de l'activité</h4>
              <Select value={nature} onValueChange={setNature}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Classe">En classe</SelectItem>
                  <SelectItem value="fait maison">À la maison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
          
        )}

        {/* Activity Builder */}
        {selectedSchoolId && selectedClassId && selectedSubjectId && (
          <ActivityBuilder
            activityId={activityId}
            initialData={{
              ...activityData,
              level: selectedClass?.level || 'Primaire',
            }}
            schoolId={selectedSchoolId}
            classId={selectedClassId}           // imposé
            subjectId={selectedSubjectId}       // imposé
            nature={nature}
            onSave={() => {
              toast({ title: 'Succès', description: 'Activité sauvegardée !' });
              navigate('/superadmin/dashboard');
            }}
          />
        )}

        {!selectedClassId && selectedSchoolId && (
          <Card className="p-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Veuillez sélectionner une classe pour continuer</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuperAdminActivityEditor;