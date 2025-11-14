import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, ClipboardList, Plus, Eye, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authApi, schoolApi, activityApi, auth } from '@/lib/api';
import { diagnosticApi } from '@/lib/api';
import { DIAGNOSTIC_GRIDS } from '@/config/diagnosticGrids';
import { normalizeRole, getRoleDashboardRoute } from '@/lib/roleUtils';

// Type mis à jour avec les vrais champs du backend
interface DiagnosticSession {
  id: string;
  diagnosticType: string;
  gradeLevel: string;
  className?: string;
  totalStudents: number;
  status?: string;
  sessionDate?: string;
  createdAt: string;
}

const TeacherDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [diagnosticSessions, setDiagnosticSessions] = useState<DiagnosticSession[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = auth.getUser();
        if (!user) {
          toast({ title: 'Accès refusé', description: 'Vous devez être connecté.', variant: 'destructive' });
          navigate('/login', { replace: true });
          return;
        }

        const userRole = normalizeRole(user.role);
        if (!['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(userRole)) {
          toast({ title: 'Accès refusé', description: 'Réservé aux enseignants.', variant: 'destructive' });
          navigate(getRoleDashboardRoute(userRole, user.schoolId), { replace: true });
          return;
        }

        if (userRole === 'TEACHER' && String(user.schoolId) !== String(id)) {
          toast({ title: 'Accès refusé', description: 'Accès non autorisé à cette école.', variant: 'destructive' });
          navigate(`/school/${user.schoolId}/teacher/dashboard`, { replace: true });
          return;
        }

        setUserName(user.fullName || user.email?.split('@')[0] || 'Professeur');

        const school = await schoolApi.getById(id!);
        if (school) {
          setSchoolName(school.name);
          setSchoolLogo(school.logoUrl || '');
        }

        const activitiesData = await activityApi.getAll();
        const schoolActivities = activitiesData?.filter((a: any) => String(a.schoolId) === String(id)) || [];
        setActivities(schoolActivities);

        // Chargement des sessions avec les vrais champs
        const sessions = await diagnosticApi.getSessionsByTeacher(user.id);
        setDiagnosticSessions(sessions || []);

      } catch (error: any) {
        console.error('[TEACHER_DASHBOARD] Erreur:', error);
        toast({
          title: 'Erreur',
          description: error?.message || 'Impossible de charger les données.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, toast]);

  const handleCreateNewDiagnostic = () => {
    navigate(`/school/${id}/teacher/diagnostic/new`);
  };

  const handleViewResults = (sessionId: string) => {
    navigate(`/school/${id}/teacher/diagnostic/${sessionId}/results`);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast({ title: 'Déconnexion réussie', description: 'À bientôt !' });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      navigate(`/school/${id}/login`);
    }
  };

  const hasDiagnostic = diagnosticSessions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="h-16 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {schoolLogo && (
              <img src={schoolLogo} alt="Logo" className="h-9 w-9 object-contain hover:scale-110 transition-transform" />
            )}
            <div className="border-l-2 border-blue-200 pl-4">
              <h1 className="text-base font-semibold text-blue-600">{schoolName}</h1>
              <div className="flex items-center gap-2 text-xs text-blue-500">
                <span>{userName}</span>
                <span>·</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300">Enseignant</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 cursor-pointer hover:scale-105 transition-all border-2 border-blue-200 hover:border-emerald-400 rounded-xl shadow-sm" onClick={() => navigate(`/school/${id}/teacher/sessions`)}>
            <Calendar className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="font-bold text-blue-700">Mes Séances</h3>
            <p className="text-sm text-blue-500 mt-1">Gérer les séances de classe</p>
          </Card>

          <Card className="p-6 cursor-pointer hover:scale-105 transition-all border-2 border-blue-200 hover:border-emerald-400 rounded-xl shadow-sm" onClick={handleCreateNewDiagnostic}>
            <ClipboardList className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="font-bold text-blue-700">Nouveau Diagnostic</h3>
            <p className="text-sm text-blue-500 mt-1">Évaluer mes élèves</p>
          </Card>

          <Card className="p-6 cursor-pointer hover:scale-105 transition-all border-2 border-blue-200 hover:border-emerald-400 rounded-xl shadow-sm" onClick={() => navigate(`/school/${id}/messages`)}>
            <MessageSquare className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="font-bold text-blue-700">Messagerie</h3>
            <p className="text-sm text-blue-500 mt-1">Échanger avec l'équipe</p>
          </Card>
        </div>

        {/* Diagnostics Pédagogiques */}
        <Card className="p-8 border-2 border-blue-200 shadow-lg rounded-2xl bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <ClipboardList className="h-10 w-10 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-blue-800">Mes Diagnostics Pédagogiques</h2>
                <p className="text-blue-600">Suivez et analysez les progrès de vos élèves</p>
              </div>
            </div>
            <Button size="lg" onClick={handleCreateNewDiagnostic}>
              <Plus className="mr-2 h-5 w-5" />
              Nouveau diagnostic
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
              <p className="text-blue-600 mt-4 text-lg">Chargement de vos diagnostics...</p>
            </div>
          ) : diagnosticSessions.length > 0 ? (
            <div className="space-y-6">
              {diagnosticSessions.map((session) => {
                const grid = DIAGNOSTIC_GRIDS.find(g => g.type === session.diagnosticType);

                // Formatage sécurisé de la date
                let formattedDate = 'Date non définie';
                if (session.sessionDate) {
                  const date = new Date(session.sessionDate);
                  if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  }
                }

                return (
                  <Card key={session.id} className="p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-xl font-bold text-blue-800">
                            {grid?.title || session.diagnosticType}
                          </h3>
                          <span className="px-4 py-1.5 text-sm font-bold text-blue-700 bg-blue-100 rounded-full">
                            {session.gradeLevel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-gray-700">
                          {session.className ? (
                            <span className="font-medium">
                              Classe : <strong className="text-blue-700">{session.className}</strong>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Classe non précisée</span>
                          )}
                          <span className="font-medium">
                            <strong className="text-blue-700">{session.totalStudents}</strong> élève{session.totalStudents > 1 ? 's' : ''}
                          </span>
                          <span className="text-gray-600">
                            {formattedDate}
                          </span>
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                            session.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {session.status === 'completed' ? 'Terminé' : 'En cours'}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        onClick={() => handleViewResults(session.id)}
                        className="whitespace-nowrap"
                      >
                        <Eye className="mr-2 h-5 w-5" />
                        Voir les résultats
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-300">
              <ClipboardList className="h-20 w-20 text-blue-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-blue-700 mb-3">Aucun diagnostic réalisé</h3>
              <p className="text-blue-600 mb-8 max-w-md mx-auto">
                Commencez par créer votre premier diagnostic pour évaluer vos élèves et débloquer des activités personnalisées.
              </p>
              <Button size="lg" onClick={handleCreateNewDiagnostic}>
                <Plus className="mr-2 h-5 w-5" />
                Créer mon premier diagnostic
              </Button>
            </div>
          )}
        </Card>

        {/* Activités pédagogiques */}
        {hasDiagnostic && activities.length > 0 && (
          <Card className="p-8 border-2 border-emerald-200 shadow-lg rounded-2xl bg-white">
            <div className="flex items-center gap-4 mb-8">
              <BookOpen className="h-10 w-10 text-emerald-600" />
              <h2 className="text-2xl font-bold text-emerald-700">Activités pédagogiques disponibles</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => (
                <Card key={activity.id} className="p-6 hover:shadow-lg transition-shadow rounded-xl border border-emerald-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        {activity.type}
                      </span>
                      <span className="ml-3 text-sm text-gray-600">{activity.level}</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-lg text-emerald-800 mb-2">{activity.title}</h4>
                  <p className="text-sm text-gray-600 mb-6">{activity.description}</p>
                  <Button className="w-full" onClick={() => navigate(`/activity/${activity.id}`)}>
                    Démarrer l'activité
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;