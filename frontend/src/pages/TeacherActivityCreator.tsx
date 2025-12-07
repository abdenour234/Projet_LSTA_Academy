import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, classSubjectApi, classApi, subjectApi } from '@/lib/api';
import { ActivityBuilder } from '@/components/activity/ActivityBuilder';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingState from '@/components/LoadingState';

interface Assignment {
  class: any;
  classId: string;
  subjectId: string;
}

const TeacherActivityCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (user.role !== 'TEACHER') {
          navigate('/teacher/dashboard');
          return;
        }

        // ✅ CORRECTION: Utiliser directement l'ID du profil (user.id)
        // Le backend ClassSubjectController utilise @PreAuthorize et accepte le teacherId
        // qui correspond au profileId pour les enseignants
        const teacherId = user.id; // ou user.teacherId si disponible

        // Récupérer les assignations du prof
        // L'endpoint /api/class-subjects/teacher/{teacherId} existe déjà
        const assignmentsData = await classSubjectApi.getClassesForTeacher(teacherId);

        if (!assignmentsData || assignmentsData.length === 0) {
          toast({ 
            title: 'Aucune classe', 
            description: 'Vous n\'êtes assigné à aucune classe.', 
            variant: 'destructive' 
          });
          navigate('/teacher/dashboard');
          return;
        }

        // Récupérer le nom de la matière (toutes les assignations ont la même matière)
        const subjectId = assignmentsData[0].subjectId;
        const subject = await subjectApi.getById(subjectId);
        setSubjectName(subject.name);

        // Charger les détails des classes
        const formatted = await Promise.all(
          assignmentsData.map(async (item: any) => {
            const cls = await classApi.getById(item.classId);
            return {
              class: cls,
              classId: item.classId,
              subjectId: item.subjectId,
            };
          })
        );

        setAssignments(formatted);
        setSelectedClassId(formatted[0].classId);

      } catch (err) {
        console.error('Error loading teacher assignments:', err);
        toast({ 
          title: 'Erreur', 
          description: 'Impossible de charger vos classes', 
          variant: 'destructive' 
        });
        navigate('/teacher/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, toast]);

  const selected = assignments.find(a => a.classId === selectedClassId);

  if (loading) return <LoadingState />;
  if (assignments.length === 0) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Créer une activité — {subjectName}</h1>
        </div>

        <Card className="p-6 bg-muted/30 border">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-center gap-4">
              <BookOpen className="h-10 w-10 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Matière enseignée</p>
                <p className="text-2xl font-bold text-emerald-700">{subjectName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Users className="h-10 w-10 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Classe cible</p>
                {assignments.length === 1 ? (
                  <p className="text-2xl font-bold">{selected?.class?.name || 'Classe'}</p>
                ) : (
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignments.map(a => (
                        <SelectItem key={a.classId} value={a.classId}>
                          {a.class?.name || 'Classe'} {a.class?.level && `• ${a.class.level}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </Card>

        {selected && (
          <ActivityBuilder
            schoolId={selected.class.schoolId}
            classId={selected.classId}
            subjectId={selected.subjectId}
            nature="fait maison"
            approvalStatus="APPROVED"
            initialData={{ level: selected.class.level || 'Primaire' }}
            onSave={() => {
              toast({ 
                title: 'Activité créée !', 
                description: `Pour la classe ${selected.class.name}. En attente d'approbation.` 
              });
              navigate(-1);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TeacherActivityCreator;