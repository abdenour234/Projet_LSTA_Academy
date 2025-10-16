import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, BarChart3, Eye, Edit, Users, GraduationCap, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { DIAGNOSTIC_GRIDS } from '@/config/diagnosticGrids';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';

const AdminDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [diagnosticSessions, setDiagnosticSessions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user info
        const userData = await api.get<{
          id: string;
          email: string;
          fullName: string;
          schoolId: string;
        }>('/auth/me');

        if (!userData) {
          navigate(`/school/${id}/login`);
          return;
        }

        setUserName(userData.fullName || userData.email?.split('@')[0] || 'Administrateur');

        // Get school info
        const school = await api.get<{ name: string; logoUrl: string }>(`/schools/${id}`);
        if (school) {
          setSchoolName(school.name);
          setSchoolLogo(school.logoUrl || '');
        }

        loadDiagnosticSessions();
        loadActivities();
      } catch (error) {
        console.error('Error fetching data:', error);
        navigate(`/school/${id}/login`);
      }
    };

    fetchData();
  }, [id, navigate]);

  const loadDiagnosticSessions = async () => {
    try {
      const data = await api.get<any[]>(`/diagnostic-sessions?schoolId=${id}&sort=createdAt,desc`);
      if (data) {
        setDiagnosticSessions(data);
      }
    } catch (error) {
      console.error('Error loading diagnostic sessions:', error);
    }
  };

  const handleViewResults = (sessionId: string) => {
    navigate(`/school/${id}/teacher/diagnostic/${sessionId}/results`);
  };

  const loadActivities = async () => {
    try {
      const data = await api.get<any[]>(`/activities?schoolId=${id}&sort=createdAt,desc`);
      if (data) {
        setActivities(data);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await api.delete(`/activities/${activityId}`);

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
    localStorage.removeItem('token');
    navigate('/');
    toast({
      title: 'Déconnexion',
      description: 'À bientôt !',
    });
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
            <p className="text-sm text-muted-foreground">Gérer les classes</p>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Gestion des activités</h2>
                <p className="text-sm text-muted-foreground">Ajouter et gérer les activités pour les professeurs</p>
              </div>
            </div>
            <Button onClick={() => navigate('/activity/editor')}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle activité
            </Button>
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
                        onClick={() => navigate(`/activity/editor/${activity.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/activity/${activity.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteActivity(activity.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
      </main>
    </div>
  );
};

export default AdminDashboard;
