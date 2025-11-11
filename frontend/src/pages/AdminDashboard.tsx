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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {schoolLogo && (
                <img 
                  src={schoolLogo} 
                  alt="Logo de l'école" 
                  className="h-12 w-12 object-contain rounded-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{schoolName}</h1>
                <p className="text-muted-foreground">Administration - {userName}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Statistics Dashboard */}
        <div>
          <h2 className="text-2xl font-bold mb-6">📊 Tableau de bord</h2>
          <AdminStatsCards schoolId={id!} />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-6">⚡ Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-smooth"
            onClick={() => navigate(`/school/${id}/admin/classes`)}
          >
            <Users className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Classes</h3>
            <p className="text-sm text-muted-foreground">Gérer les classesssss</p>
          </Card>
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-smooth"
            onClick={() => navigate(`/school/${id}/admin/teachers`)}
          >
            <GraduationCap className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Enseignants</h3>
            <p className="text-sm text-muted-foreground">Gérer les enseignants</p>
          </Card>
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-smooth"
            onClick={() => navigate(`/school/${id}/admin/activity-tracking`)}
          >
            <Clock className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Suivi d'activité</h3>
            <p className="text-sm text-muted-foreground">Temps d'utilisation</p>
          </Card>
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-smooth"
            onClick={() => navigate(`/school/${id}/messages`)}
          >
            <MessageSquare className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Messagerie</h3>
            <p className="text-sm text-muted-foreground">Communications</p>
          </Card>
          </div>
        </div>
        
        {/* Diagnostic Sessions Section */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-accent/10">
              <BarChart3 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Diagnostics pédagogiques</h2>
              <p className="text-sm text-muted-foreground">Tous les diagnostics réalisés par les professeurs</p>
            </div>
          </div>

          {diagnosticSessions.length > 0 ? (
            <div className="grid gap-4">
              {diagnosticSessions.map((session) => {
                const gridInfo = DIAGNOSTIC_GRIDS.find(g => g.type === session.diagnostic_type);
                return (
                  <Card key={session.id} className="p-4 border-border hover:shadow-card-hover transition-smooth">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-accent" />
                          <h4 className="font-semibold text-foreground">{gridInfo?.title || session.diagnostic_type}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{gridInfo?.description}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Niveau: <strong className="text-foreground">{session.grade_level}</strong></span>
                          {session.class_name && (
                            <span>Classe: <strong className="text-foreground">{session.class_name}</strong></span>
                          )}
                          <span>Élèves: <strong className="text-foreground">{session.total_students}</strong></span>
                          <span>Date: <strong className="text-foreground">{new Date(session.session_date).toLocaleDateString('fr-FR')}</strong></span>
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
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun diagnostic disponible</p>
            </div>
          )}
        </Card>

        {/* Activities Management Section */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Activités disponibles</h2>
              <p className="text-sm text-muted-foreground">Les activités créées par le SuperAdmin pour votre école</p>
            </div>
          </div>

          {activities.length > 0 ? (
            <div className="grid gap-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="p-4 border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          activity.type === 'Orale' ? 'bg-orale/10 text-orale' :
                          activity.type === 'Lecture' ? 'bg-lecture/10 text-lecture' :
                          'bg-ecriture/10 text-ecriture'
                        }`}>
                          {activity.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{activity.level}</span>
                      </div>
                      <h4 className="font-semibold text-foreground mb-1">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/activity/${activity.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucune activité créée</p>
          )}
        </Card>

        {/* Teachers List Section */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Enseignants</h2>
                <p className="text-sm text-muted-foreground">Liste complète des enseignants de l'école</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/school/${id}/admin/teachers`)}>
              <Plus className="h-4 w-4 mr-2" />
              Gérer
            </Button>
          </div>

          {loadingTeachers ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : teachers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => (
                <Card key={teacher.id} className="p-4 border-border hover:shadow-card-hover transition-smooth">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {teacher.fullName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()}
                      </h4>
                      {teacher.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      )}
                      {teacher.specialty && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <BookOpen className="h-3 w-3" />
                          <span className="truncate">{teacher.specialty}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun enseignant enregistré</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate(`/school/${id}/admin/teachers`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un enseignant
              </Button>
            </div>
          )}
        </Card>

        {/* Classes List Section */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Classes</h2>
                <p className="text-sm text-muted-foreground">Liste des classes avec élèves et activités</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/school/${id}/admin/classes`)}>
              <Plus className="h-4 w-4 mr-2" />
              Gérer
            </Button>
          </div>

          {loadingClasses ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : classes.length > 0 ? (
            <div className="space-y-4">
              {classes.map((classe) => {
                const classStudents = studentsMap.get(classe.id) || [];
                const classActivities = activities.filter(
                  (activity) => activity.targetClasses?.includes(classe.id) || activity.level === classe.level
                );
                
                return (
                  <Card key={classe.id} className="p-4 border-border hover:shadow-card-hover transition-smooth">
                    <div className="space-y-3">
                      {/* Class Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground text-lg">{classe.name}</h4>
                            {classe.level && (
                              <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                                {classe.level}
                              </span>
                            )}
                            {classe.filiere && (
                              <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent">
                                {classe.filiere}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Année: <strong className="text-foreground">{classe.academicYear}</strong></span>
                            <span>Élèves: <strong className="text-foreground">{classStudents.length}</strong></span>
                            <span>Activités: <strong className="text-foreground">{classActivities.length}</strong></span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/school/${id}/admin/classes`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Students List */}
                      {classStudents.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Élèves ({classStudents.length}):</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {classStudents.slice(0, 8).map((student) => (
                              <div key={student.id} className="text-sm text-foreground bg-muted/50 rounded px-2 py-1 truncate">
                                {student.firstName} {student.lastName}
                              </div>
                            ))}
                            {classStudents.length > 8 && (
                              <div className="text-sm text-muted-foreground bg-muted/30 rounded px-2 py-1">
                                +{classStudents.length - 8} autres
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Activities List */}
                      {classActivities.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Activités assignées ({classActivities.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {classActivities.slice(0, 5).map((activity) => (
                              <div 
                                key={activity.id}
                                className={`text-xs font-medium px-2 py-1 rounded cursor-pointer hover:opacity-80 ${
                                  activity.type === 'Orale' ? 'bg-orale/10 text-orale' :
                                  activity.type === 'Lecture' ? 'bg-lecture/10 text-lecture' :
                                  'bg-ecriture/10 text-ecriture'
                                }`}
                                onClick={() => navigate(`/activity/${activity.id}`)}
                              >
                                {activity.title}
                              </div>
                            ))}
                            {classActivities.length > 5 && (
                              <div className="text-xs text-muted-foreground px-2 py-1">
                                +{classActivities.length - 5} autres
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune classe créée</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate(`/school/${id}/admin/classes`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une classe
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
