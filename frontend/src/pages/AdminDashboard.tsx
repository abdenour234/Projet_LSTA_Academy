import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, BarChart3, Eye, Edit, Users, GraduationCap, Clock, MessageSquare, Mail, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authApi, schoolApi, activityApi, auth, teacherApi, classApi, studentApi } from '@/lib/api';
import { DIAGNOSTIC_GRIDS } from '@/config/diagnosticGrids';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { normalizeRole, getRoleDashboardRoute } from '@/lib/roleUtils';

const AdminDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [diagnosticSessions, setDiagnosticSessions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Map<string, any[]>>(new Map());
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔒 SECURITY: Validate user access
        const user = auth.getUser();
        console.log('[ADMIN_DASHBOARD] Access validation:', { user, schoolId: id });
        
        if (!user) {
          console.error('[ADMIN_DASHBOARD] No user found');
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
        console.log('[ADMIN_DASHBOARD] Role check:', { original: user.role, normalized: userRole });
        
        if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
          console.error('[ADMIN_DASHBOARD] Invalid role:', userRole);
          toast({
            title: 'Accès refusé',
            description: 'Cette page est réservée aux administrateurs.',
            variant: 'destructive',
          });
          const correctDashboard = getRoleDashboardRoute(userRole, user.schoolId);
          navigate(correctDashboard, { replace: true });
          return;
        }

        // Validate schoolId for ADMIN role
        if (userRole === 'ADMIN') {
          if (!user.schoolId) {
            console.error('[ADMIN_DASHBOARD] Admin missing schoolId');
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
            console.error('[ADMIN_DASHBOARD] School ID mismatch:', { userSchoolId: user.schoolId, urlSchoolId: id });
            toast({
              title: 'Accès refusé',
              description: 'Vous ne pouvez pas accéder aux données d\'une autre école.',
              variant: 'destructive',
            });
            navigate(`/school/${user.schoolId}/admin/dashboard`, { replace: true });
            return;
          }
        }

        setUserName(user.fullName || user.email?.split('@')[0] || 'Administrateur');

        const school = await schoolApi.getById(id!);
        if (school) {
          setSchoolName(school.name);
          setSchoolLogo(school.logoUrl || '');
        }

        loadDiagnosticSessions();
        loadActivities();
        loadTeachers();
        loadClasses();
      } catch (error) {
        console.error('[ADMIN_DASHBOARD] Error fetching data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [id, navigate, toast]);

  const loadDiagnosticSessions = async () => {
    try {
      // TODO: Add diagnostic sessions API endpoint
      // const data = await api.get(`/diagnostic-sessions/school/${id}`);
      // setDiagnosticSessions(data || []);
      setDiagnosticSessions([]);
    } catch (error) {
      console.error('Error loading diagnostic sessions:', error);
      setDiagnosticSessions([]);
    }
  };

  const handleViewResults = (sessionId: string) => {
    navigate(`/school/${id}/teacher/diagnostic/${sessionId}/results`);
  };

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await teacherApi.getBySchoolId(id!);
      setTeachers(data || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const data = await classApi.getBySchoolId(id!);
      setClasses(data || []);
      
      // Load students for each class
      const studentsData = new Map<string, any[]>();
      for (const classe of data || []) {
        try {
          const classStudents = await studentApi.getByClass(classe.id);
          studentsData.set(classe.id, classStudents || []);
        } catch (err) {
          console.error(`Error loading students for class ${classe.id}:`, err);
          studentsData.set(classe.id, []);
        }
      }
      setStudentsMap(studentsData);
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadActivities = async () => {
    try {
      const data = await activityApi.getAll();
      // Filter by school_id on frontend - convert both to strings for type-safe comparison
      const schoolActivities = data?.filter((a: any) => String(a.schoolId) === String(id)) || [];
      setActivities(schoolActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await activityApi.delete(activityId);

      toast({
        title: 'Activité supprimée',
      });

      loadActivities();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'activité',
        variant: 'destructive',
      });
    }
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
      {/* Fixed Header - 64px height */}
      <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-3">
              {schoolLogo && (
                <img 
                  src={schoolLogo} 
                  alt="Logo" 
                  className="h-8 w-8 object-contain"
                />
              )}
              <div>
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">{schoolName}</h1>
                <p className="text-xs text-slate-600">{userName} · Administrateur</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate(`/school/${id}/admin/classes`)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-9"
              >
                Gérer les classes
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm h-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Dashboard */}
        <div>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Vue d'ensemble</h2>
          <AdminStatsCards schoolId={id!} />
        </div>

        {/* Classes Table - Primary Focus */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Classes</h2>
              <p className="text-sm text-slate-600 mt-0.5">Gérer les classes et leurs élèves</p>
            </div>
            <Button 
              onClick={() => navigate(`/school/${id}/admin/classes`)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium h-9"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle classe
            </Button>
          </div>

          {loadingClasses ? (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <div className="inline-flex items-center gap-2 text-slate-600">
                <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <span className="text-sm">Chargement des classes...</span>
              </div>
            </div>
          ) : classes.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Classe</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Niveau</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Élèves</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Activités</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Année</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider sticky right-0 bg-slate-50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((classe, index) => {
                    const classStudents = studentsMap.get(classe.id) || [];
                    const classActivities = activities.filter(
                      (activity) => activity.targetClasses?.includes(classe.id) || activity.level === classe.level
                    );
                    
                    return (
                      <tr 
                        key={classe.id} 
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        } hover:bg-slate-100 transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{classe.name}</div>
                          {classe.filiere && (
                            <div className="text-xs text-slate-600 mt-0.5">{classe.filiere}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
                            {classe.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          {classStudents.length}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          {classActivities.length}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {classe.academicYear}
                        </td>
                        <td className="px-4 py-3 text-right sticky right-0 bg-inherit">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/school/${id}/admin/classes`)}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 h-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900 mb-1">Aucune classe</p>
              <p className="text-sm text-slate-600 mb-4">Commencez par créer votre première classe</p>
              <Button 
                onClick={() => navigate(`/school/${id}/admin/classes`)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une classe
              </Button>
            </div>
          )}
        </div>

        {/* Teachers Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Enseignants</h2>
              <p className="text-sm text-slate-600 mt-0.5">Personnel enseignant de l'école</p>
            </div>
            <Button 
              onClick={() => navigate(`/school/${id}/admin/teachers`)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium h-9"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un enseignant
            </Button>
          </div>

          {loadingTeachers ? (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <div className="inline-flex items-center gap-2 text-slate-600">
                <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <span className="text-sm">Chargement des enseignants...</span>
              </div>
            </div>
          ) : teachers.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Nom</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Spécialité</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider sticky right-0 bg-slate-50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher, index) => (
                    <tr 
                      key={teacher.id} 
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      } hover:bg-slate-100 transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {teacher.fullName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {teacher.email || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {teacher.specialty || '—'}
                      </td>
                      <td className="px-4 py-3 text-right sticky right-0 bg-inherit">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/school/${id}/admin/teachers`)}
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 h-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900 mb-1">Aucun enseignant</p>
              <p className="text-sm text-slate-600 mb-4">Ajoutez des enseignants à votre école</p>
              <Button 
                onClick={() => navigate(`/school/${id}/admin/teachers`)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un enseignant
              </Button>
            </div>
          )}
        </div>
        
        {/* Activities Section - Compact */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Activités disponibles</h2>
              <p className="text-sm text-slate-600 mt-0.5">Créées par le SuperAdmin</p>
            </div>
          </div>

          {activities.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Titre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Niveau</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider sticky right-0 bg-slate-50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => (
                    <tr 
                      key={activity.id} 
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      } hover:bg-slate-100 transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{activity.title}</div>
                        {activity.description && (
                          <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">{activity.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                          activity.type === 'Orale' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                          activity.type === 'Lecture' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                          'bg-amber-50 text-amber-700 border-amber-300'
                        }`}>
                          {activity.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {activity.level}
                      </td>
                      <td className="px-4 py-3 text-right sticky right-0 bg-inherit">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/activity/${activity.id}`)}
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 h-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900 mb-1">Aucune activité</p>
              <p className="text-sm text-slate-600">Les activités créées apparaîtront ici</p>
            </div>
          )}
        </div>

        {/* Diagnostic Sessions - Compact */}
        {diagnosticSessions.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Diagnostics pédagogiques</h2>
              <p className="text-sm text-slate-600 mt-0.5">Sessions réalisées par les enseignants</p>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Niveau</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Classe</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Élèves</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-700 uppercase tracking-wider sticky right-0 bg-slate-50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosticSessions.map((session, index) => {
                    const gridInfo = DIAGNOSTIC_GRIDS.find(g => g.type === session.diagnostic_type);
                    return (
                      <tr 
                        key={session.id} 
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        } hover:bg-slate-100 transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{gridInfo?.title || session.diagnostic_type}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {session.grade_level}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {session.class_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          {session.total_students}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(session.session_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-right sticky right-0 bg-inherit">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewResults(session.id)}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 h-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
