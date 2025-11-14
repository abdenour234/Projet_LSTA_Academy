import { useEffect, useState } from 'react';
import { teacherActivityApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import LoadingState from '@/components/LoadingState';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  level: string;
  approvalStatus: string;
  classId: string;
  subjectId: string;
  createdAt: string;
  createdBy: string;
}

const TeacherActivityApproval = () => {
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const [pending, all] = await Promise.all([
        teacherActivityApi.getPendingActivities(),
        teacherActivityApi.getMyActivities()
      ]);
      setPendingActivities(pending);
      setMyActivities(all);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les activités',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (activityId: string) => {
    setProcessing(activityId);
    try {
      await teacherActivityApi.approveActivity(activityId);
      toast({
        title: 'Activité approuvée',
        description: 'L\'activité est maintenant visible pour les étudiants'
      });
      loadActivities();
    } catch (error) {
      console.error('Error approving activity:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver l\'activité',
        variant: 'destructive'
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (activityId: string) => {
    setProcessing(activityId);
    try {
      await teacherActivityApi.denyActivity(activityId);
      toast({
        title: 'Activité refusée',
        description: 'L\'activité a été refusée'
      });
      loadActivities();
    } catch (error) {
      console.error('Error denying activity:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de refuser l\'activité',
        variant: 'destructive'
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'DENIED':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderActivityCard = (activity: Activity, showActions: boolean) => (
    <Card key={activity.id} className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{activity.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
        </div>
        {getStatusBadge(activity.approvalStatus)}
      </div>

      <div className="flex gap-2 text-sm text-muted-foreground mb-4">
        <Badge variant="secondary">{activity.type}</Badge>
        <Badge variant="secondary">{activity.level}</Badge>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Créé le {new Date(activity.createdAt).toLocaleDateString('fr-FR')}
        </span>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/activity/${activity.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir
          </Button>

          {showActions && (
            <>
              <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(activity.id)}
                disabled={processing === activity.id}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approuver
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeny(activity.id)}
                disabled={processing === activity.id}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Refuser
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading) return <LoadingState />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Approbation des activités</h1>
        <p className="text-muted-foreground mt-1">
          Gérez et approuvez les activités pour vos matières
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          En attente d'approbation
          {pendingActivities.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingActivities.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'all'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Toutes mes activités
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'pending' ? (
          pendingActivities.length > 0 ? (
            pendingActivities.map((activity) => renderActivityCard(activity, true))
          ) : (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-lg mb-1">Aucune activité en attente</h3>
              <p className="text-muted-foreground">
                Toutes les activités ont été traitées
              </p>
            </Card>
          )
        ) : (
          myActivities.length > 0 ? (
            myActivities.map((activity) => renderActivityCard(activity, false))
          ) : (
            <Card className="p-8 text-center">
              <h3 className="font-semibold text-lg mb-1">Aucune activité</h3>
              <p className="text-muted-foreground">
                Aucune activité pour vos matières
              </p>
            </Card>
          )
        )}
      </div>

      {/* Quick create button */}
      <div className="mt-6">
        <Button
          size="lg"
          onClick={() => navigate('/activity/new')}
          className="w-full"
        >
          Créer une nouvelle activité
        </Button>
      </div>
    </div>
  );
};

export default TeacherActivityApproval;
