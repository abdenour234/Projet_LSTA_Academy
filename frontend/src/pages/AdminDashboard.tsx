import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, BarChart3, Eye, Edit, Users, GraduationCap, Clock, MessageSquare, Mail, BookOpen, Search, Library } from 'lucide-react';
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
  
  // Filter states
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [classLevelFilter, setClassLevelFilter] = useState<string>('all');
  const [classStatusFilter, setClassStatusFilter] = useState<string>('all');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<string>('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');

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

  // Filter functions
  const getUniqueLevels = () => {
    const levels = new Set(classes.map(c => c.level).filter(Boolean));
    return Array.from(levels).sort();
  };

  const filteredClasses = classes.filter((classe) => {
    const matchesSearch = !classSearchTerm || 
      classe.name?.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
      classe.filiere?.toLowerCase().includes(classSearchTerm.toLowerCase());
    const matchesLevel = classLevelFilter === 'all' || classe.level === classLevelFilter;
    
    // Status filter: active (has students) or empty (no students)
    const classStudents = studentsMap.get(classe.id) || [];
    const matchesStatus = classStatusFilter === 'all' || 
      (classStatusFilter === 'active' && classStudents.length > 0) ||
      (classStatusFilter === 'empty' && classStudents.length === 0);
    
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const filteredTeachers = teachers.filter((teacher) => {
    const fullName = teacher.fullName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
    const matchesSearch = !teacherSearchTerm || 
      fullName.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      teacher.specialty?.toLowerCase().includes(teacherSearchTerm.toLowerCase());
    
    // Status filter: active (has email) or inactive (no email)
    const hasEmail = teacher.email && teacher.email.length > 0;
    const matchesStatus = teacherStatusFilter === 'all' || 
      (teacherStatusFilter === 'active' && hasEmail) ||
      (teacherStatusFilter === 'inactive' && !hasEmail);
    
    return matchesSearch && matchesStatus;
  });

  const filteredActivities = activities.filter((activity) => {
    return activityTypeFilter === 'all' || activity.type === activityTypeFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Fixed Header - 64px height */}
      <header className="h-16 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              {schoolLogo && (
                <img 
                  src={schoolLogo} 
                  alt="Logo" 
                  className="h-9 w-9 object-contain hover:scale-110 transition-transform duration-300"
                />
              )}
              <div className="border-l-2 border-blue-200 pl-4">
                <h1 className="text-base font-semibold text-blue-600 tracking-tight leading-tight">{schoolName}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-blue-500">{userName}</span>
                  <span className="text-xs text-blue-300">·</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">
                    Admin
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => navigate(`/school/${id}/admin/subjects`)}
                variant="ghost"
                className="text-sm h-9 font-medium"
              >
                <Library className="h-4 h-4 mr-2" />
                Matières
              </Button>
              <Button 
                onClick={() => navigate(`/school/${id}/admin/teachers`)}
                variant="ghost"
                className="text-sm h-9 font-medium"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Enseignants
              </Button>
              <Button 
                onClick={() => navigate(`/school/${id}/admin/classes`)}
                className="text-sm font-medium h-9"
              >
                <Users className="h-4 w-4 mr-2" />
                Classes
              </Button>
              <div className="h-6 w-px bg-blue-200 mx-1" />
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="h-9 px-2"
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container - max-w-7xl, consistent spacing: 24px (space-6) */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* Statistics Dashboard */}
        <div>
          <AdminStatsCards schoolId={id!} />
        </div>

        {/* Classes Table - Primary Focus */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-600">Classes</h2>
              <p className="text-sm text-blue-500 mt-0.5">Gérer les classes et leurs élèves</p>
            </div>
            <Button 
              onClick={() => navigate(`/school/${id}/admin/classes`)}
              className="text-sm font-medium h-9"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle classe
            </Button>
          </div>

          {/* Quick Filters - Actionable & Scannable */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[240px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <input
                type="text"
                placeholder="Rechercher une classe..."
                value={classSearchTerm}
                onChange={(e) => setClassSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border-2 border-blue-200 rounded-lg bg-white text-blue-600 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 focus:ring-offset-2 transition-all"
              />
            </div>
            <select
              value={classLevelFilter}
              onChange={(e) => setClassLevelFilter(e.target.value)}
              className="px-3 py-2 text-sm border-2 border-blue-200 rounded-lg bg-white text-blue-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 focus:ring-offset-2 transition-all min-w-[140px]"
            >
              <option value="all">Tous les niveaux</option>
              {getUniqueLevels().map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <select
              value={classStatusFilter}
              onChange={(e) => setClassStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border-2 border-blue-200 rounded-lg bg-white text-blue-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 focus:ring-offset-2 transition-all min-w-[120px]"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="empty">Vide</option>
            </select>
            {(classSearchTerm || classLevelFilter !== 'all' || classStatusFilter !== 'all') && (
              <button
                onClick={() => {
                  setClassSearchTerm('');
                  setClassLevelFilter('all');
                  setClassStatusFilter('all');
                }}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {loadingClasses ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              {/* Loading Skeleton - Maintains layout */}
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b border-blue-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Classe</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Niveau</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Enseignant principal</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Élèves</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Activités</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-blue-200 rounded w-32 animate-pulse" />
                        <div className="h-3 bg-blue-100 rounded w-20 mt-1 animate-pulse" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 bg-blue-200 rounded w-16 animate-pulse" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-blue-200 rounded w-28 animate-pulse" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-blue-200 rounded w-8 animate-pulse" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-blue-200 rounded w-8 animate-pulse" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 bg-blue-200 rounded w-16 animate-pulse" />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="h-8 bg-blue-200 rounded w-8 ml-auto animate-pulse" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="border-2 border-blue-200 rounded-lg overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b-2 border-blue-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Classe</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Niveau</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Enseignant principal</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Élèves</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Activités</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((classe, index) => {
                    const classStudents = studentsMap.get(classe.id) || [];
                    const classActivities = activities.filter(
                      (activity) => activity.targetClasses?.includes(classe.id) || activity.level === classe.level
                    );
                    
                    // Find head teacher if available
                    const headTeacher = classe.headTeacherId 
                      ? teachers.find(t => t.id === classe.headTeacherId)
                      : null;
                    
                    // Determine class status
                    const isActive = classStudents.length > 0;
                    
                    return (
                      <tr 
                        key={classe.id} 
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-blue-50'
                        } hover:bg-emerald-50 transition-colors cursor-pointer`}
                        onClick={() => navigate(`/school/${id}/admin/classes`)}
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-blue-600">{classe.name}</div>
                          {classe.filiere && (
                            <div className="text-xs text-blue-400 mt-0.5">{classe.filiere}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            {classe.level}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-blue-500">
                          {headTeacher 
                            ? headTeacher.fullName || `${headTeacher.firstName || ''} ${headTeacher.lastName || ''}`.trim()
                            : <span className="text-blue-400">Non assigné</span>
                          }
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-blue-600 tabular-nums">
                          {classStudents.length}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-blue-600 tabular-nums">
                          {classActivities.length}
                        </td>
                        <td className="px-4 py-4">
                          {isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-600 border border-blue-200">
                              Vide
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right sticky right-0 bg-inherit" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/school/${id}/admin/classes`)}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-8"
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
          ) : classes.length > 0 ? (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <p className="text-sm text-slate-600">Aucune classe ne correspond aux filtres</p>
              <Button 
                variant="ghost"
                onClick={() => { setClassSearchTerm(''); setClassLevelFilter('all'); }}
                className="mt-3 text-sm"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-blue-600 mb-1">Aucune classe</p>
              <p className="text-sm text-slate-600 mb-4">Commencez par créer votre première classe</p>
              <Button 
                onClick={() => navigate(`/school/${id}/admin/classes`)}
                className="bg-blue-600 hover:bg-emerald-500 text-white text-sm font-medium h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une classe
              </Button>
            </div>
          )}
        </div>

        {/* Teachers Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-blue-600">Enseignants</h2>
              <p className="text-sm text-blue-500 mt-0.5">Personnel enseignant de l'école</p>
            </div>
            <Button 
              onClick={() => navigate(`/school/${id}/admin/teachers`)}
              className="bg-blue-600 hover:bg-emerald-500 text-white text-sm font-medium h-9"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un enseignant
            </Button>
          </div>

          {/* Quick Filters - Teachers */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[240px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <input
                type="text"
                placeholder="Rechercher un enseignant..."
                value={teacherSearchTerm}
                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border-2 border-blue-200 rounded-lg bg-white text-blue-600 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 focus:ring-offset-2 transition-shadow"
              />
            </div>
            <select
              value={teacherStatusFilter}
              onChange={(e) => setTeacherStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border-2 border-blue-200 rounded-lg bg-white text-blue-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 focus:ring-offset-2 transition-shadow min-w-[120px]"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
            {(teacherSearchTerm || teacherStatusFilter !== 'all') && (
              <button
                onClick={() => {
                  setTeacherSearchTerm('');
                  setTeacherStatusFilter('all');
                }}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {loadingTeachers ? (
            <div className="border-2 border-blue-200 rounded-lg overflow-hidden bg-white shadow-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b-2 border-blue-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Nom</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Spécialité</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Classes assignées</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-32"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-40"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-24"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-20"></div></td>
                      <td className="px-4 py-3"><div className="h-5 bg-slate-200 rounded animate-pulse w-16"></div></td>
                      <td className="px-4 py-3 text-right"><div className="h-8 bg-slate-100 rounded animate-pulse w-20 ml-auto"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredTeachers.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b border-blue-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Nom</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Spécialité</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Classes assignées</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher, index) => {
                    // Count classes assigned to this teacher
                    const assignedClasses = classes.filter(c => c.headTeacherId === teacher.id);
                    const hasEmail = teacher.email && teacher.email.length > 0;
                    
                    return (
                      <tr 
                        key={teacher.id} 
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-blue-50'
                        } hover:bg-emerald-50 transition-colors cursor-pointer`}
                        onClick={() => navigate(`/school/${id}/admin/teachers`)}
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-blue-600">
                            {teacher.fullName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-blue-500">
                          {teacher.email || <span className="text-blue-400">—</span>}
                        </td>
                        <td className="px-4 py-4 text-sm text-blue-500">
                          {teacher.specialty || <span className="text-blue-400">—</span>}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-blue-600 tabular-nums">
                          {assignedClasses.length > 0 ? (
                            <span>{assignedClasses.length} classe{assignedClasses.length > 1 ? 's' : ''}</span>
                          ) : (
                            <span className="text-slate-400">Aucune</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {hasEmail ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Incomplet
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right sticky right-0 bg-inherit" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/school/${id}/admin/teachers`)}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-8"
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
          ) : teachers.length > 0 ? (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <p className="text-sm text-slate-600">Aucun enseignant ne correspond à la recherche</p>
              <Button 
                variant="ghost"
                onClick={() => setTeacherSearchTerm('')}
                className="mt-3 text-sm"
              >
                Réinitialiser la recherche
              </Button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-blue-600 mb-1">Aucun enseignant</p>
              <p className="text-sm text-slate-600 mb-4">Ajoutez des enseignants à votre école</p>
              <Button 
                onClick={() => navigate(`/school/${id}/admin/teachers`)}
                className="bg-blue-600 hover:bg-emerald-500 text-white text-sm font-medium h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un enseignant
              </Button>
            </div>
          )}
        </div>
        
        {/* Activities Section - Compact */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-blue-600">Activités disponibles</h2>
              <p className="text-sm text-slate-600 mt-0.5">Créées par le SuperAdmin</p>
            </div>
          </div>

          {/* Filter */}
          {activities.length > 0 && (
            <div className="mb-3">
              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-blue-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 focus:ring-offset-2 transition-shadow"
              >
                <option value="all">Tous les types</option>
                <option value="Orale">Orale</option>
                <option value="Lecture">Lecture</option>
                <option value="Ecriture">Écriture</option>
              </select>
            </div>
          )}

          {filteredActivities.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b border-blue-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Titre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Niveau</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Classes ciblées</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity, index) => {
                    // Count targeted classes
                    const targetedClasses = activity.targetClasses?.length || 0;
                    
                    return (
                      <tr 
                        key={activity.id} 
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-blue-50'
                        } hover:bg-emerald-50 transition-colors cursor-pointer`}
                        onClick={() => navigate(`/activity/${activity.id}`)}
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-blue-600">{activity.title}</div>
                          {activity.description && (
                            <div className="text-xs text-blue-400 mt-0.5 line-clamp-1">{activity.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            activity.type === 'Orale' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            activity.type === 'Lecture' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {activity.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {activity.level}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-blue-600 tabular-nums">
                          {targetedClasses > 0 ? `${targetedClasses} classe${targetedClasses > 1 ? 's' : ''}` : <span className="text-blue-400">Toutes</span>}
                        </td>
                        <td className="px-4 py-4 text-right sticky right-0 bg-inherit" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/activity/${activity.id}`)}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-8"
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
          ) : activities.length > 0 ? (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <p className="text-sm text-slate-600">Aucune activité ne correspond au filtre</p>
              <Button 
                variant="ghost"
                onClick={() => setActivityTypeFilter('all')}
                className="mt-3 text-sm"
              >
                Réinitialiser le filtre
              </Button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-12 text-center bg-white">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-blue-600 mb-1">Aucune activité</p>
              <p className="text-sm text-slate-600">Les activités créées apparaîtront ici</p>
            </div>
          )}
        </div>

        {/* Diagnostic Sessions - Compact */}
        {diagnosticSessions.length > 0 && (
          <div>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-blue-600">Diagnostics pédagogiques</h2>
              <p className="text-sm text-slate-600 mt-0.5">Sessions réalisées par les enseignants</p>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-50 border-b border-blue-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Niveau</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Classe</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Élèves</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-blue-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosticSessions.map((session, index) => {
                    const gridInfo = DIAGNOSTIC_GRIDS.find(g => g.type === session.diagnostic_type);
                    return (
                      <tr 
                        key={session.id} 
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-blue-50'
                        } hover:bg-emerald-50 transition-colors cursor-pointer`}
                        onClick={() => handleViewResults(session.id)}
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-blue-600">{gridInfo?.title || session.diagnostic_type}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {session.grade_level}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-blue-500">
                          {session.class_name || <span className="text-blue-400">—</span>}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-blue-600 tabular-nums">
                          {session.total_students}
                        </td>
                        <td className="px-4 py-4 text-sm text-blue-500">
                          {new Date(session.session_date).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="px-4 py-4 text-right sticky right-0 bg-inherit" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewResults(session.id)}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-8"
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
