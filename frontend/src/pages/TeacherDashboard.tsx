import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, ClipboardList, Plus, ArrowRight, BarChart3, Eye, Calendar, MessageSquare, Loader2, CheckCircle, UserCheck, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authApi, schoolApi, activityApi, auth, teacherActivityApi } from '@/lib/api';
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
  const [hasDiagnostic, setHasDiagnostic] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
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
      
      if (!['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(userRole)) {
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
          console.error('[TEACHER_DASHBOARD] School ID mismatch:', { 
            userSchoolId: user.schoolId, 
            urlSchoolId: id 
          });
          toast({
            title: 'Accès refusé',
            description: 'Vous ne pouvez pas accéder aux données d\'une autre école.',
            variant: 'destructive',
          });
          navigate(`/school/${user.schoolId}/teacher/dashboard`, { replace: true });
          return;
        }
      }

      // Set user info
      setUserName(user.fullName || user.email?.split('@')[0] || 'Professeur');

      // Load school data
      const school = await schoolApi.getById(id!);
      if (school) {
        setSchoolName(school.name);
        setSchoolLogo(school.logoUrl || '');
      }

      // Load activities
      const activitiesData = await activityApi.getAll();
      const schoolActivities = activitiesData?.filter((a: any) => 
        String(a.schoolId) === String(id)
      ) || [];
      setActivities(schoolActivities);

      // Load pending activities count for notification badge
      if (userRole === 'TEACHER') {
        try {
          const countData = await teacherActivityApi.getPendingCount();
          setPendingCount(countData.count || 0);
        } catch (error) {
          console.error('[TEACHER_DASHBOARD] Error loading pending count:', error);
          setPendingCount(0);
        }
      }

      // Load diagnostic sessions
      try {
        const sessions = await diagnosticApi.getSessionsByTeacher(user.id);
        setDiagnosticSessions(sessions || []);
        setHasDiagnostic(sessions && sessions.length > 0);
      } catch (error) {
        console.error('[TEACHER_DASHBOARD] Error loading diagnostic sessions:', error);
        setDiagnosticSessions([]);
        setHasDiagnostic(false);
      }

    } catch (error: any) {
      console.error('[TEACHER_DASHBOARD] Error fetching data:', error);
      toast({
        title: 'Erreur',
        description: error?.message || 'Impossible de charger les données',
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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
  {/* Quick Actions */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
    <Card 
      className="p-5 cursor-pointer hover:bg-emerald-50 hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-emerald-400 rounded-lg relative"
      onClick={() => navigate(`/school/${id}/teacher/activities/approval`)}
    >
      <CheckCircle className="h-5 w-5 text-blue-500 mb-2" />
      <h3 className="font-semibold text-blue-600 text-sm">Approbation</h3>
      <p className="text-xs text-blue-500">Approuver les activités</p>
      {pendingCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
        >
          {pendingCount}
        </Badge>
      )}
    </Card>
    
    <Card 
      className="p-5 cursor-pointer hover:bg-emerald-50 hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-emerald-400 rounded-lg"
      onClick={() => navigate(`/school/${id}/teacher/sessions`)}
    >
      <Calendar className="h-5 w-5 text-blue-500 mb-2" />
      <h3 className="font-semibold text-blue-600 text-sm">Mes Séances</h3>
      <p className="text-xs text-blue-500">Enregistrer une séance</p>
    </Card>
    
    <Card 
      className="p-5 cursor-pointer hover:bg-emerald-50 hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-emerald-400 rounded-lg"
      onClick={handleCreateNewDiagnostic}
    >
      <ClipboardList className="h-5 w-5 text-blue-500 mb-2" />
      <h3 className="font-semibold text-blue-600 text-sm">Diagnostic</h3>
      <p className="text-xs text-blue-500">Nouveau diagnostic</p>
    </Card>
    
    <Card 
      className="p-5 cursor-pointer hover:bg-emerald-50 hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-emerald-400 rounded-lg"
      onClick={() => navigate(`/school/${id}/messages`)}
    >
      <MessageSquare className="h-5 w-5 text-blue-500 mb-2" />
      <h3 className="font-semibold text-blue-600 text-sm">Messagerie</h3>
      <p className="text-xs text-blue-500">Mes messages</p>
    </Card>
  </div>

  {/* Student Attendance Actions */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
    <Card 
      className="p-5 cursor-pointer hover:bg-purple-50 hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-400 rounded-lg"
      onClick={() => navigate(`/school/${id}/teacher/student-attendance/mark`)}
    >
      <UserCheck className="h-5 w-5 text-purple-500 mb-2" />
      <h3 className="font-semibold text-purple-600 text-sm">Marquer les Absences</h3>
      <p className="text-xs text-purple-500">Enregistrer les absences étudiants</p>
    </Card>
    
    <Card 
      className="p-5 cursor-pointer hover:bg-purple-50 hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-400 rounded-lg"
      onClick={() => navigate(`/school/${id}/teacher/student-attendance/track`)}
    >
      <BarChart2 className="h-5 w-5 text-purple-500 mb-2" />
      <h3 className="font-semibold text-purple-600 text-sm">Suivi des Absences</h3>
      <p className="text-xs text-purple-500">Consulter et gérer les absences</p>
    </Card>
  </div>

  {/* Diagnostics Section */}
  <Card className="p-6 border-2 border-blue-200 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-blue-800">Mes Diagnostics Pédagogiques</h2>
          <p className="text-sm text-blue-600">Suivez et analysez les progrès de vos élèves</p>
        </div>
      </div>
      <Button 
        onClick={handleCreateNewDiagnostic}
        size="lg"
      >
        <Plus className="mr-2 h-5 w-5" />
        Nouveau diagnostic
      </Button>
    </div>

    {loading ? (
      <div className="text-center py-12">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
        <p className="text-blue-600 mt-4">Chargement de vos diagnostics...</p>
      </div>
    ) : diagnosticSessions.length > 0 ? (
      <div className="space-y-4">
        {diagnosticSessions.map((session) => {
          const gridInfo = DIAGNOSTIC_GRIDS.find(g => g.type === session.diagnosticType);
          
          // Safe date formatting
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
            <Card 
              key={session.id} 
              className="p-5 border-2 border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white hover:border-emerald-400 hover:shadow-lg transition-all duration-300 rounded-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <h4 className="font-bold text-blue-800 text-base">
                      {gridInfo?.title || session.diagnosticType}
                    </h4>
                    <span className="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">
                      {session.gradeLevel}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                    {session.className ? (
                      <span>
                        Classe: <strong className="text-blue-700">{session.className}</strong>
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Classe non précisée</span>
                    )}
                    <span>
                      Élèves: <strong className="text-blue-700">{session.totalStudents}</strong>
                    </span>
                    <span className="text-gray-600">{formattedDate}</span>
                    {session.status && (
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        session.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {session.status === 'completed' ? 'Terminé' : 'En cours'}
                      </span>
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewResults(session.id)}
                  className="whitespace-nowrap"
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
      <div className="text-center py-12 bg-blue-50 rounded-xl border-2 border-dashed border-blue-300">
        <ClipboardList className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-blue-700 mb-2">Aucun diagnostic réalisé</h3>
        <p className="text-blue-600 text-sm mb-6 max-w-md mx-auto">
          Commencez par créer votre premier diagnostic pour évaluer vos élèves et débloquer des activités personnalisées.
        </p>
        <Button 
          onClick={handleCreateNewDiagnostic} 
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Créer mon premier diagnostic
        </Button>
      </div>
    )}
  </Card>

  {/* Activities Section */}
  <Card className="p-6 border-2 border-blue-200 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center gap-3 mb-6">
      <BookOpen className="h-6 w-6 text-blue-600" />
      <div>
        <h2 className="text-xl font-bold text-blue-800">Activités pédagogiques</h2>
        <p className="text-sm text-blue-600">Activités disponibles après réalisation d'un diagnostic</p>
      </div>
    </div>

    {!hasDiagnostic ? (
      <div className="text-center py-10 bg-blue-50 rounded-xl border-2 border-blue-200">
        <ClipboardList className="h-14 w-14 text-blue-400 mx-auto mb-3" />
        <p className="text-blue-700 font-semibold text-base mb-2">
          Diagnostic requis
        </p>
        <p className="text-blue-600 text-sm mb-5 max-w-md mx-auto">
          Veuillez d'abord réaliser un diagnostic avant d'accéder aux activités correspondantes.
        </p>
        <Button 
          onClick={handleCreateNewDiagnostic} 
          variant="outline"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Réaliser un diagnostic
        </Button>
      </div>
    ) : activities.length > 0 ? (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <Card 
            key={activity.id} 
            className="p-5 border-2 border-blue-200 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 rounded-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  activity.type === 'Orale' ? 'bg-blue-100 text-blue-700' :
                  activity.type === 'Lecture' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {activity.type}
                </span>
                <span className="text-xs text-blue-600 font-medium">{activity.level}</span>
              </div>
              
              <h4 className="font-bold text-blue-800">{activity.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
              
              <Button 
                className="w-full mt-2"
                onClick={() => navigate(`/activity/${activity.id}`)}
              >
                Démarrer l'activité
              </Button>
            </div>
          </Card>
        ))}
      </div>
    ) : (
      <div className="text-center py-10">
        <p className="text-blue-600 text-sm">
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