import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, ClipboardList, Plus, ArrowRight, BarChart3, Eye, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authApi, schoolApi, activityApi } from '@/lib/api';
import { DIAGNOSTIC_GRIDS } from '@/config/diagnosticGrids';

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
        const user = await authApi.getCurrentUser();
        if (!user) {
          navigate(`/school/${id}/login`);
          return;
        }

        setUserName(user.fullName || user.email?.split('@')[0] || 'Professeur');

        const school = await schoolApi.getById(id!);
        if (school) {
          setSchoolName(school.name);
          setSchoolLogo(school.logoUrl || '');
        }

        const activitiesData = await activityApi.getAll();
        const schoolActivities = activitiesData?.filter((a: any) => a.schoolId === id) || [];
        setActivities(schoolActivities);

        // TODO: Load diagnostic sessions
        // const sessionsData = await api.get(`/diagnostic-sessions/teacher/${user.id}`);
        setDiagnosticSessions([]);
        setHasDiagnostic(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        navigate(`/school/${id}/login`);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleCreateNewDiagnostic = () => {
    navigate(`/school/${id}/teacher/diagnostic/new`);
  };

  const handleViewResults = (sessionId: string) => {
    navigate(`/school/${id}/teacher/diagnostic/${sessionId}/results`);
  };

  const handleLogout = async () => {
    await authApi.logout();
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
                <p className="text-muted-foreground">Bienvenue, {userName}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-smooth"
            onClick={() => navigate(`/school/${id}/teacher/sessions`)}
          >
            <Calendar className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Mes Séances</h3>
            <p className="text-sm text-muted-foreground">Enregistrer une séance</p>
          </Card>
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-smooth"
            onClick={handleCreateNewDiagnostic}
          >
            <ClipboardList className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Diagnostic</h3>
            <p className="text-sm text-muted-foreground">Nouveau diagnostic</p>
          </Card>
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-smooth"
            onClick={() => navigate(`/school/${id}/messages`)}
          >
            <MessageSquare className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Messagerie</h3>
            <p className="text-sm text-muted-foreground">Mes messages</p>
          </Card>
        </div>
        {/* Diagnostics Section */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Diagnostics pédagogiques</h2>
                <p className="text-sm text-muted-foreground">Réalisez des diagnostics selon les grilles officielles</p>
              </div>
            </div>
            <Button onClick={handleCreateNewDiagnostic}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau diagnostic
            </Button>
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
                          <BarChart3 className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-foreground">{gridInfo?.title || session.diagnostic_type}</h4>
                        </div>
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
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                Aucun diagnostic réalisé pour le moment
              </p>
              <Button onClick={handleCreateNewDiagnostic} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Créer votre premier diagnostic
              </Button>
            </div>
          )}
        </Card>

        {/* Activities Section */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-accent/10">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Activités pédagogiques</h2>
              <p className="text-sm text-muted-foreground">Activités disponibles après réalisation d'un diagnostic</p>
            </div>
          </div>

          {!hasDiagnostic ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium mb-2">
                Diagnostic requis
              </p>
              <p className="text-muted-foreground mb-4">
                Veuillez d'abord réaliser un diagnostic avant d'accéder aux activités correspondantes.
              </p>
              <Button onClick={handleCreateNewDiagnostic} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Réaliser un diagnostic
              </Button>
            </div>
          ) : activities.length > 0 ? (
            <div className="grid gap-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="p-4 border-border hover:shadow-card-hover transition-smooth">
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/activity/${activity.id}`)}
                    >
                      Démarrer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
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
