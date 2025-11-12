import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, ClipboardList, Plus, ArrowRight, BarChart3, Eye, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authApi, schoolApi, activityApi, auth } from '@/lib/api';
import { DIAGNOSTIC_GRIDS } from '@/config/diagnosticGrids';
import { normalizeRole, getRoleDashboardRoute } from '@/lib/roleUtils';

const TeacherDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [diagnosticSessions, setDiagnosticSessions] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [hasDiagnostic, setHasDiagnostic] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔒 SECURITY: Validate user access
        const user = auth.getUser();
        console.log('[TEACHER_DASHBOARD] Access validation:', { user, schoolId: id });
        
        if (!user) {
          console.error('[TEACHER_DASHBOARD] No user found');
          toast({
            title: 'Accès refusé',
            description: 'Vous devez être connecté.',
            variant: 'destructive',
          });
          navigate('/login', { replace: true });
          return;
        }

        // Validate role
        const userRole = normalizeRole(user.role);
        console.log('[TEACHER_DASHBOARD] Role check:', { original: user.role, normalized: userRole });
        
        if (userRole !== 'TEACHER' && userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
          console.error('[TEACHER_DASHBOARD] Invalid role:', userRole);
          toast({
            title: 'Accès refusé',
            description: 'Cette page est réservée aux enseignants.',
            variant: 'destructive',
          });
          const correctDashboard = getRoleDashboardRoute(userRole, user.schoolId);
          navigate(correctDashboard, { replace: true });
          return;
        }

        // Validate schoolId for TEACHER role
        if (userRole === 'TEACHER') {
          if (!user.schoolId) {
            console.error('[TEACHER_DASHBOARD] Teacher missing schoolId');
            toast({
              title: 'Erreur de configuration',
              description: 'Aucune école associée à votre compte.',
              variant: 'destructive',
            });
            navigate('/login', { replace: true });
            return;
          }
          
          // Convert both to strings for comparison to handle type mismatch
          if (String(user.schoolId) !== String(id)) {
            console.error('[TEACHER_DASHBOARD] School ID mismatch:', { userSchoolId: user.schoolId, urlSchoolId: id });
            toast({
              title: 'Accès refusé',
              description: 'Vous ne pouvez pas accéder aux données d\'une autre école.',
              variant: 'destructive',
            });
            navigate(`/school/${user.schoolId}/teacher/dashboard`, { replace: true });
            return;
          }
        }

        setUserName(user.fullName || user.email?.split('@')[0] || 'Professeur');

        const school = await schoolApi.getById(id!);
        if (school) {
          setSchoolName(school.name);
          setSchoolLogo(school.logoUrl || '');
        }

        const activitiesData = await activityApi.getAll();
        // Convert both to strings for type-safe comparison
        const schoolActivities = activitiesData?.filter((a: any) => String(a.schoolId) === String(id)) || [];
        setActivities(schoolActivities);

        // TODO: Load diagnostic sessions
        // const sessionsData = await api.get(`/diagnostic-sessions/teacher/${user.id}`);
        setDiagnosticSessions([]);
        setHasDiagnostic(false);
      } catch (error) {
        console.error('[TEACHER_DASHBOARD] Error fetching data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données',
          variant: 'destructive',
        });
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
      toast({
        title: 'Déconnexion réussie',
        description: 'À bientôt !',
      });
      navigate(`/school/${id}/login`);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout même en cas d'erreur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate(`/school/${id}/login`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed 64px height */}
      <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              {schoolLogo && (
                <img 
                  src={schoolLogo} 
                  alt="Logo" 
                  className="h-9 w-9 object-contain"
                />
              )}
              <div className="border-l border-slate-200 pl-4">
                <h1 className="text-base font-semibold text-slate-900 tracking-tight leading-tight">{schoolName}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-600">{userName}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
                    Enseignant
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-5">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card 
            className="p-5 cursor-pointer hover:bg-slate-50 transition-colors border-slate-200 shadow-none rounded-lg"
            onClick={() => navigate(`/school/${id}/teacher/sessions`)}
          >
            <Calendar className="h-5 w-5 text-slate-600 mb-2" />
            <h3 className="font-semibold text-slate-900 text-sm">Mes Séances</h3>
            <p className="text-xs text-slate-600">Enregistrer une séance</p>
          </Card>
          <Card 
            className="p-5 cursor-pointer hover:bg-slate-50 transition-colors border-slate-200 shadow-none rounded-lg"
            onClick={handleCreateNewDiagnostic}
          >
            <ClipboardList className="h-5 w-5 text-slate-600 mb-2" />
            <h3 className="font-semibold text-slate-900 text-sm">Diagnostic</h3>
            <p className="text-xs text-slate-600">Nouveau diagnostic</p>
          </Card>
          <Card 
            className="p-5 cursor-pointer hover:bg-slate-50 transition-colors border-slate-200 shadow-none rounded-lg"
            onClick={() => navigate(`/school/${id}/messages`)}
          >
            <MessageSquare className="h-5 w-5 text-slate-600 mb-2" />
            <h3 className="font-semibold text-slate-900 text-sm">Messagerie</h3>
            <p className="text-xs text-slate-600">Mes messages</p>
          </Card>
        </div>

        {/* Diagnostics Section */}
        <Card className="p-5 border-slate-200 shadow-none rounded-lg">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-slate-600" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Diagnostics pédagogiques</h2>
                <p className="text-xs text-slate-600">Réalisez des diagnostics selon les grilles officielles</p>
              </div>
            </div>
            <Button 
              onClick={handleCreateNewDiagnostic}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-9"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau diagnostic
            </Button>
          </div>

          {diagnosticSessions.length > 0 ? (
            <div className="grid gap-3">
              {diagnosticSessions.map((session) => {
                const gridInfo = DIAGNOSTIC_GRIDS.find(g => g.type === session.diagnostic_type);
                return (
                  <Card key={session.id} className="p-4 border-slate-200 hover:bg-slate-50 transition-colors shadow-none rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-slate-600" />
                          <h4 className="font-semibold text-slate-900 text-sm">{gridInfo?.title || session.diagnostic_type}</h4>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-600">
                          <span>Niveau: <strong className="text-slate-900">{session.grade_level}</strong></span>
                          {session.class_name && (
                            <span>Classe: <strong className="text-slate-900">{session.class_name}</strong></span>
                          )}
                          <span>Élèves: <strong className="text-slate-900">{session.total_students}</strong></span>
                          <span>Date: <strong className="text-slate-900">{new Date(session.session_date).toLocaleDateString('fr-FR')}</strong></span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewResults(session.id)}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir résultats
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 text-sm mb-4">
                Aucun diagnostic réalisé pour le moment
              </p>
              <Button 
                onClick={handleCreateNewDiagnostic} 
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer votre premier diagnostic
              </Button>
            </div>
          )}
        </Card>

        {/* Activities Section */}
        <Card className="p-5 border-slate-200 shadow-none rounded-lg">
          <div className="flex items-center gap-3 mb-5">
            <BookOpen className="h-5 w-5 text-slate-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Activités pédagogiques</h2>
              <p className="text-xs text-slate-600">Activités disponibles après réalisation d'un diagnostic</p>
            </div>
          </div>

          {!hasDiagnostic ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg">
              <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-900 font-medium text-sm mb-2">
                Diagnostic requis
              </p>
              <p className="text-slate-600 text-xs mb-4">
                Veuillez d'abord réaliser un diagnostic avant d'accéder aux activités correspondantes.
              </p>
              <Button 
                onClick={handleCreateNewDiagnostic} 
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Réaliser un diagnostic
              </Button>
            </div>
          ) : activities.length > 0 ? (
            <div className="grid gap-3">
              {activities.map((activity) => (
                <Card key={activity.id} className="p-4 border-slate-200 hover:bg-slate-50 transition-colors shadow-none rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          activity.type === 'Orale' ? 'bg-blue-100 text-blue-700' :
                          activity.type === 'Lecture' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {activity.type}
                        </span>
                        <span className="text-xs text-slate-600">{activity.level}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm mb-1">{activity.title}</h4>
                      <p className="text-xs text-slate-600">{activity.description}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/activity/${activity.id}`)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Démarrer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 text-sm">
                Aucune activité disponible pour le moment — veuillez contacter l'administrateur.
              </p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default TeacherDashboard;
