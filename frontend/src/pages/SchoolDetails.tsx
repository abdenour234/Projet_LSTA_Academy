import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Eye, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { activityApi, auth } from '@/lib/api';
import LoadingState from '@/components/LoadingState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface School {
  id: number;
  name: string;
  city: string;
  region: string;
  level: string;
  status: string;
  students: number;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  type: string;
  level: string;
  isPublished: boolean;
  createdAt: string;
  createdBy: string;
}

const SchoolDetails = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [school, setSchool] = useState<School | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Verify SUPERADMIN access
    const user = auth.getUser();
    if (!user || user.role !== 'SUPERADMIN') {
      toast({
        title: 'Accès refusé',
        description: 'Cette page est réservée aux super administrateurs.',
        variant: 'destructive',
      });
      navigate('/superadmin/dashboard', { replace: true });
      return;
    }

    loadSchoolData();
  }, [schoolId]);

  const loadSchoolData = async () => {
    setLoading(true);
    try {
      // Load school info
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      const schoolResponse = await fetch(`${API_BASE_URL}/schools/${schoolId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (schoolResponse.ok) {
        const schoolData = await schoolResponse.json();
        setSchool(schoolData);
      }

      // Load all activities for this school
      const activitiesData = await activityApi.getAll();
      const schoolActivities = activitiesData.filter((a: any) => String(a.schoolId) === schoolId);
      setActivities(schoolActivities);
    } catch (error) {
      console.error('Error loading school data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de l\'école.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (activityId: string) => {
    setActivityToDelete(activityId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;

    try {
      await activityApi.delete(activityToDelete);
      toast({
        title: 'Succès',
        description: 'L\'activité a été supprimée avec succès.',
      });
      // Reload activities
      await loadSchoolData();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'activité.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  if (loading) return <LoadingState />;

  if (!school) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">École non trouvée</h2>
          <Button onClick={() => navigate('/superadmin/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/superadmin/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  {school.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {school.city}, {school.region} • {school.level} • {school.status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {activities.length} activités
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activités de l'école
            </CardTitle>
            <CardDescription>
              Liste de toutes les activités créées par cette école
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune activité trouvée pour cette école</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Titre</th>
                      <th className="text-left p-3 font-semibold">Type</th>
                      <th className="text-left p-3 font-semibold">Niveau</th>
                      <th className="text-center p-3 font-semibold">Publié</th>
                      <th className="text-left p-3 font-semibold">Date de création</th>
                      <th className="text-center p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr key={activity.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {activity.type}
                          </span>
                        </td>
                        <td className="p-3 text-sm">{activity.level}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            activity.isPublished 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {activity.isPublished ? 'Oui' : 'Non'}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/activity/${activity.id}`)}
                              title="Voir l'activité"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(activity.id)}
                              className="text-destructive hover:text-destructive"
                              title="Supprimer l'activité"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'activité sera définitivement supprimée
              de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchoolDetails;
