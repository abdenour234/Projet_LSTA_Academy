import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, LogOut, Calendar as CalendarIcon } from 'lucide-react';
import { authApi, activityApi, studentApi } from '@/lib/api';
// @ts-ignore - react-calendar types
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useToast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  classId: string;
}

interface Student {
  id: string;
  classId: string;
  // Ajoute d'autres champs si nécessaires (firstName, lastName, etc.)
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]); // Changé pour gérer plusieurs activités

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        console.log('Current User:', currentUser);
        
        if (!currentUser) {
          navigate('/');
          return;
        }

        // 🔒 SECURITY: Validate user role is STUDENT
        const userRole = currentUser.role?.toUpperCase();
        if (userRole !== 'STUDENT' && userRole !== 'SUPERADMIN') {
          toast({
            title: 'Accès refusé',
            description: 'Cette page est réservée aux étudiants',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        // 🔒 SECURITY: Ensure student has a schoolId before fetching data
        if (!currentUser.schoolId) {
          toast({
            title: 'Erreur de configuration',
            description: 'Aucune école associée à votre compte. Contactez un administrateur.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setUser(currentUser);
        
        if (currentUser?.id) {
          const studentDetails = await studentApi.getCurrentStudent();
          console.log('Student Details:', studentDetails);
          setStudent(studentDetails);
          if (studentDetails?.classId) {
            const publishedActivities = await activityApi.getPublished({
              schoolId: currentUser.schoolId,
              classId: studentDetails.classId,
            });
            setActivities(publishedActivities);
          } else {
            toast({
              title: 'Attention',
              description: 'Aucune classe associée à votre compte. Contactez un administrateur.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Erreur',
            description: 'Impossible de récupérer l\'identifiant de l\'utilisateur.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Error loading data:', error);
        if (error.status === 500) {
          toast({
            title: 'Erreur Serveur',
            description: 'Une erreur interne est survenue (étudiant non trouvé). Vérifiez avec l\'administrateur.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erreur',
            description: error.message || 'Impossible de charger les données',
            variant: 'destructive',
          });
        }
      }
    };
    loadData();
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast({
        title: 'Déconnexion réussie',
        description: 'À bientôt !',
      });
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: 'Erreur de déconnexion',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
      // Force logout même en cas d'erreur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const getEventsForDate = (date: Date) => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.createdAt);
      return (
        activityDate.getDate() === date.getDate() &&
        activityDate.getMonth() === date.getMonth() &&
        activityDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const events = getEventsForDate(date);
      return events.length > 0 ? (
        <div className="flex justify-center mt-1">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
            {events.length}
          </span>
        </div>
      ) : null;
    }
    return null;
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const events = getEventsForDate(date);
      setSelectedActivities(events); // Stocke toutes les activités du jour
    } else {
      setSelectedActivities([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Espace Étudiant</h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenue {user?.fullName || user?.email || 'Étudiant'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Calendrier des Activités</CardTitle>
              <CardDescription className="text-base">
                Consultez vos activités publiées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                tileContent={tileContent}
                className="w-full border rounded-lg shadow-sm"
                tileClassName="hover:bg-green-50 transition-colors duration-200"
              />
            </CardContent>
          </Card>

          {/* Activity Details */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-green-600" />
                Détails des Activités
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedActivities.length > 0 ? (
                selectedActivities.map((activity) => (
                  <div key={activity.id} className="border p-2 rounded-md">
                    <h3 className="text-lg font-semibold">{activity.title}</h3>
                    <p className="text-muted-foreground">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Créée le: {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => navigate(`/activity/${activity.id}`)}
                    >
                      Voir l'activité
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">
                  Sélectionnez une date pour voir les activités
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Actions disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/')}>
              <BookOpen className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;