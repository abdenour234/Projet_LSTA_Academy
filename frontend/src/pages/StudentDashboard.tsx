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
            // Nouvelles activités publiées + "fait maison" approuvées seulement
          const publishedActivities = await activityApi.getPublished({
            schoolId: currentUser.schoolId,
            classId: studentDetails.classId,
            nature: 'fait maison',        // Filtre côté backend
            approvalStatus: 'APPROVED'    // Seulement les validées
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header - Fixed 64px height */}
      <header className="h-16 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <h1 className="text-base font-semibold text-blue-600 tracking-tight leading-tight">Espace Étudiant</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-blue-500">{user?.fullName || user?.email || 'Étudiant'}</span>
                    <span className="text-xs text-blue-300">·</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">
                      Étudiant
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-blue-600 hover:text-emerald-600 hover:bg-emerald-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar */}
          <Card className="lg:col-span-2 border-2 border-blue-200 shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-5 pb-3 bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
              <div className="flex items-center gap-3 mb-3">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-sm font-semibold text-blue-600">Calendrier des Activités</CardTitle>
              </div>
              <CardDescription className="text-xs text-blue-500">
                Consultez vos activités publiées
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                tileContent={tileContent}
                className="w-full border-2 border-blue-200 rounded-lg"
                tileClassName="hover:bg-emerald-50 transition-colors duration-200"
              />
            </CardContent>
          </Card>

          {/* Activity Details */}
          <Card className="border-2 border-blue-200 shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-5 pb-3 bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Détails des Activités
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {selectedActivities.length > 0 ? (
                selectedActivities.map((activity) => (
                  <div key={activity.id} className="border-2 border-blue-200 p-3 rounded-lg bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-300">
                    <h3 className="text-sm font-semibold text-blue-600">{activity.title}</h3>
                    <p className="text-xs text-blue-500 mt-1">{activity.description}</p>
                    <p className="text-xs text-blue-400 mt-2">
                      Créée le: {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => navigate(`/activity/${activity.id}`)}
                    >
                      Voir l'activité
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-blue-500 py-8">
                  Sélectionnez une date pour voir les activités
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-5 border-2 border-blue-200 shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="p-5 pb-3 bg-gradient-to-r from-blue-50 to-white rounded-t-lg">
            <CardTitle className="text-sm font-semibold text-blue-600">Actions disponibles</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => navigate('/')}
            >
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