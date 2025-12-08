import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, ClipboardList, Plus, BarChart3, Eye, Calendar, Loader2, CheckCircle, UserCheck, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authApi, schoolApi, auth, teacherActivityApi, classApi, teacherManagementApi, sessionApi, activityApi, classSubjectApi } from '@/lib/api';
import { diagnosticApi } from '@/lib/api';
import { DIAGNOSTIC_GRIDS } from '@/config/diagnosticGrids';
import { normalizeRole, getRoleDashboardRoute } from '@/lib/roleUtils';

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

interface Session {
  id: string;
  classId: string;
  className: string;
  sessionDate: string;
  notes: string;
  percentageAcquired: number;
  activityId: string;
  activityTitle?: string;
}

interface Activity {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
}

interface Class {
  id: string;
  name: string;
}

const TeacherDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [diagnosticSessions, setDiagnosticSessions] = useState<DiagnosticSession[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userName, setUserName] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");

  // Fonction pour enrichir les séances avec les noms
  const enrichSessions = (rawSessions: any[], currentClasses: Class[], currentActivities: Activity[]) => {
    return rawSessions.map((s: any) => {
      const className = currentClasses.find(c => c.id === s.classId)?.name || "Classe inconnue";
      const activityTitle = currentActivities.find(a => a.id === s.activityId)?.title || "Activité réalisée";

      return {
        id: s.id,
        classId: s.classId,
        className,
        sessionDate: s.sessionDate,
        notes: s.notes || "",
        percentageAcquired: s.percentageAcquired || 0,
        activityId: s.activityId,
        activityTitle,
      };
    });
  };

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
          const correctDashboard = getRoleDashboardRoute(userRole, user.schoolId);
          navigate(correctDashboard, { replace: true });
          return;
        }

        if (userRole === 'TEACHER' && String(user.schoolId) !== String(id)) {
          navigate(`/school/${user.schoolId}/teacher/dashboard`, { replace: true });
          return;
        }

        const teacherId =
          user.teacherId ||
          user.profile_id ||
          user.teacher_id ||
          (user.teacher && user.teacher.id) ||
          user.id;

        setUserId(teacherId);
        setUserName(user.fullName || user.email?.split('@')[0] || 'Professeur');

        // School
        const school = await schoolApi.getById(id!);
        if (school) {
          setSchoolName(school.name);
          setSchoolLogo(school.logoUrl || '');
        }

        // Classes
        const classesData = await classApi.getBySchoolId(id!);
        setClasses(classesData || []);

        // ACTIVITÉS : on charge via le bon endpoint + on filtre les "Classe"
        try {
          const allMyActivities = await teacherActivityApi.getMyActivities();
          const officialActivities = allMyActivities.filter((a: any) => a.nature === 'Classe');
          setActivities(officialActivities);
        } catch (err) {
          console.error('Erreur chargement activités prof :', err);
          setActivities([]);
        }

        // Pending count
        // Dans le useEffect, remplacer la section "Pending count" par :

// Pending activities count
if (userRole === 'TEACHER') {
  try {
    // Utiliser l'endpoint dédié aux profs au lieu de teacherManagementApi
    const response = await teacherActivityApi.getPendingCount();
    setPendingCount(response.count || 0);
  } catch (err) {
    console.error('Erreur chargement count pending:', err);
    setPendingCount(0);
  }
}

        // Diagnostics
        const diagnostics = await diagnosticApi.getSessionsByTeacher(user.id);
        setDiagnosticSessions(diagnostics || []);

        // SÉANCES DU PROF
        try {
          // 1. Classes du prof
          const assignments = await classSubjectApi.getClassesForTeacher(teacherId);
          const classIds = [...new Set(assignments.map((a: any) => a.classId))];

          let teacherClasses: Class[] = [];
          if (classIds.length > 0) {
            const allClasses = await classApi.getBySchoolId(id!);
            teacherClasses = allClasses
              .filter((c: any) => classIds.includes(c.id))
              .map((c: any) => ({ id: c.id, name: c.name }));
          }

          // 2. CHARGER TOUTES LES ACTIVITÉS
          const allActivities: Activity[] = [];
          for (const cls of teacherClasses) {
            try {
              const acts = await activityApi.getPublished({
                schoolId: id!,
                classId: cls.id,
                teacherId: teacherId,
                approvalStatus: "APPROVED",
              });
              allActivities.push(...(acts || []));
            } catch (e) { /* ignore */ }
          }

          // 3. Séances du prof
          const sessionsData = await sessionApi.getByTeacherId(teacherId);
          const enriched = enrichSessions(sessionsData || [], teacherClasses, allActivities);
          setSessions(enriched);
        } catch (err) {
          console.error('Erreur chargement séances:', err);
          setSessions([]);
        }

      } catch (error: any) {
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
    await authApi.logout();
    navigate(`/school/${id}/login`);
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
          <Card className="p-5 cursor-pointer hover:bg-emerald-50 hover:scale-105 transition-all border-2 border-blue-200 hover:border-emerald-400 rounded-lg relative"
            onClick={() => navigate(`/school/${id}/teacher/activities/approval`)}>
            <CheckCircle className="h-5 w-5 text-blue-500 mb-2" />
            <h3 className="font-semibold text-blue-600 text-sm">Approbation</h3>
            <p className="text-xs text-blue-500">Approuver les activités</p>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold">
                {pendingCount}
              </Badge>
            )}
          </Card>

          <Card className="p-5 cursor-pointer hover:bg-emerald-50 hover:scale-105 transition-all border-2 border-blue-200 hover:border-emerald-400 rounded-lg"
            onClick={() => navigate(`/school/${id}/teacher/sessions`)}>
            <Calendar className="h-5 w-5 text-blue-500 mb-2" />
            <h3 className="font-semibold text-blue-600 text-sm">Mes Séances</h3>
            <p className="text-xs text-blue-500">Enregistrer une séance</p>
          </Card>

          <Card className="p-5 cursor-pointer hover:bg-emerald-50 hover:scale-105 transition-all border-2 border-blue-200 hover:border-emerald-400 rounded-lg"
            onClick={handleCreateNewDiagnostic}>
            <ClipboardList className="h-5 w-5 text-blue-500 mb-2" />
            <h3 className="font-semibold text-blue-600 text-sm">Diagnostic</h3>
            <p className="text-xs text-blue-500">Nouveau diagnostic</p>
          </Card>

          <Card className="p-5 cursor-pointer hover:bg-emerald-50 hover:scale-105 transition-all border-2 border-blue-200 hover:border-emerald-400 rounded-lg"
            onClick={() => navigate(`/school/${id}/teacher/student-attendance/mark`)}>
            <UserCheck className="h-5 w-5 text-blue-500 mb-2" />
            <h3 className="font-semibold text-blue-600 text-sm">Marquer Absences</h3>
            <p className="text-xs text-blue-500">Absences étudiants</p>
          </Card>

          <Card className="p-5 cursor-pointer hover:bg-emerald-50 hover:scale-105 transition-all border-2 border-blue-200 hover:border-emerald-400 rounded-lg"
            onClick={() => navigate(`/school/${id}/teacher/student-attendance/track`)}>
            <ClipboardCheck className="h-5 w-5 text-blue-500 mb-2" />
            <h3 className="font-semibold text-blue-600 text-sm">Suivi Absences</h3>
            <p className="text-xs text-blue-500">Consulter absences</p>
          </Card>
        </div>

        {/* MES SÉANCES RÉALISÉES */}
        <Card className="p-6 border-2 border-blue-200 shadow-lg rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-blue-800">Mes Séances Réalisées</h2>
                <p className="text-sm text-blue-600">Historique de vos séances en classe</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/school/${id}/teacher/sessions`)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle séance
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
              <p className="text-blue-600 mt-4">Chargement...</p>
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.slice(0, 5).map((s) => (
                <Card key={s.id} className="p-5 border-2 border-blue-200 hover:border-emerald-400 transition-all rounded-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-blue-800">{s.className}</h3>
                        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                          {s.percentageAcquired}% acquis
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4" />
                        {new Date(s.sessionDate).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {s.activityTitle && (
                        <div className="mb-3">
                          <span className="text-xs text-gray-600">Activité : </span>
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {s.activityTitle}
                          </span>
                        </div>
                      )}
                      {s.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm italic text-gray-700 border-l-4 border-blue-300">
                          {s.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {sessions.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => navigate(`/school/${id}/teacher/sessions`)}>
                    Voir toutes les séances ({sessions.length})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-blue-50 rounded-xl border-2 border-dashed border-blue-300">
              <Calendar className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-blue-700 mb-2">Aucune séance enregistrée</h3>
              <p className="text-blue-600 text-sm mb-6 max-w-md mx-auto">
                Commencez par enregistrer votre première séance de classe.
              </p>
              <Button onClick={() => navigate(`/school/${id}/teacher/sessions`)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Enregistrer une séance
              </Button>
            </div>
          )}
        </Card>

        {/* Diagnostics */}
        <Card className="p-6 border-2 border-blue-200 shadow-lg rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-blue-800">Mes Diagnostics Pédagogiques</h2>
                <p className="text-sm text-blue-600">Suivez et analysez les progrès de vos élèves</p>
              </div>
            </div>
            <Button onClick={handleCreateNewDiagnostic} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau diagnostic
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
              <p className="text-blue-600 mt-4">Chargement...</p>
            </div>
          ) : diagnosticSessions.length > 0 ? (
            <div className="space-y-4">
              {diagnosticSessions.map((session) => {
                const gridInfo = DIAGNOSTIC_GRIDS.find(g => g.type === session.diagnosticType);
                const formattedDate = session.sessionDate
                  ? new Date(session.sessionDate).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                  : 'Date non définie';

                return (
                  <Card key={session.id} className="p-5 border-2 border-blue-200 hover:border-emerald-400 transition-all rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <BarChart3 className="h-5 w-5 text-blue-500" />
                          <h4 className="font-bold text-blue-800 text-base">{gridInfo?.title || session.diagnosticType}</h4>
                          <span className="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">{session.gradeLevel}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                          {session.className ? <span>Classe: <strong className="text-blue-700">{session.className}</strong></span> : <span className="text-gray-400 italic">Classe non précisée</span>}
                          <span>Élèves: <strong className="text-blue-700">{session.totalStudents}</strong></span>
                          <span className="text-gray-600">{formattedDate}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleViewResults(session.id)}>
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
                Commencez par créer votre premier diagnostic.
              </p>
              <Button onClick={handleCreateNewDiagnostic} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Créer mon premier diagnostic
              </Button>
            </div>
          )}
        </Card>

        {/* ACTIVITÉS OFFICIELLES "CLASSE" */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-blue-800">Activités de Classe Disponibles</h2>
              <p className="text-sm text-blue-600">Activités officielles prêtes à être utilisées en séance</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
              <p className="text-blue-600 mt-4">Chargement des activités...</p>
            </div>
          ) : activities.length > 0 ? (
            <Card className="border-2 border-blue-200 shadow-lg rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-50 border-b-2 border-blue-200">
                      <th className="text-left px-6 py-4 text-xs font-medium text-blue-700 uppercase tracking-wide">Titre</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-blue-700 uppercase tracking-wide">Type</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-blue-700 uppercase tracking-wide">Créée le</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-blue-700 uppercase tracking-wide">Classe</th>
                      <th className="text-right px-6 py-4 text-xs font-medium text-blue-700 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity, index) => {
                      const classDisplayName = activity.className 
                        || (activity.classId ? classes.find(c => c.id === activity.classId)?.name : null)
                        || 'Toutes les classes';

                      const createdDate = new Date(activity.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });

                      return (
                        <tr
                          key={activity.id}
                          className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-emerald-50 transition-colors cursor-pointer`}
                          onClick={() => navigate(`/activity/${activity.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-blue-800">{activity.title}</div>
                            {activity.description && (
                              <div className="text-xs text-blue-500 mt-1 line-clamp-2">
                                {activity.description}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                              activity.type === 'Orale' ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : activity.type === 'Lecture' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                              : 'bg-amber-100 text-amber-700 border-amber-300'
                            }`}>
                              {activity.type || '—'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-700">
                            {createdDate}
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {activity.className 
                                ? activity.className 
                                : activity.classId 
                                  ? classes.find(c => c.id === activity.classId)?.name || 'Toutes les classes'
                                  : 'Toutes les classes'
                              }
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/activity/${activity.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center border-2 border-dashed border-blue-300 bg-blue-50">
              <BookOpen className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-blue-700 mb-2">
                Aucune activité de classe disponible
              </h3>
              <p className="text-blue-600 text-sm max-w-md mx-auto">
                Les activités officielles validées par l'administration apparaîtront ici.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;