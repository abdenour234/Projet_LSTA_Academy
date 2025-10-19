import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, TrendingUp, Activity } from "lucide-react";
import { toast } from "sonner";
import { auth, statsApi } from "@/lib/api";

interface UserActivity {
  user_name: string;
  total_time_seconds: number;
  activity_count: number;
  last_activity: string;
}

export default function ActivityTracking() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    checkAuth();
    loadActivityData();
    trackUserActivity();
  }, [schoolId]);

  const checkAuth = async () => {
    const user = auth.getUser();
    if (!user) {
      navigate(`/school/${schoolId}/login`);
      return;
    }

    setUserRole(user.role || "");

    if (user.role !== "admin") {
      toast.error("Accès réservé aux administrateurs");
      navigate(`/school/${schoolId}/teacher/dashboard`);
    }
  };

  const trackUserActivity = async () => {
    const user = auth.getUser();
    if (!user) return;

    try {
      // Log current activity via API
      await fetch(`${import.meta.env.VITE_API_URL}/api/activity-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          school_id: schoolId,
          activity_type: "page_visit",
          activity_date: new Date().toISOString().split("T")[0],
          duration_seconds: 60,
          metadata: { page: "activity_tracking" },
        }),
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const loadActivityData = async () => {
    try {
      // Utiliser statsApi pour récupérer les stats d'activité de l'école
      const stats = await statsApi.getSchoolStats(schoolId!);
      
      // Mapper les données de stats vers notre interface
      const mappedActivities: UserActivity[] = stats.userActivities?.map((activity: any) => ({
        user_name: activity.user_name,
        total_time_seconds: activity.total_time_seconds || 0,
        activity_count: activity.activity_count || 0,
        last_activity: activity.last_activity || new Date().toISOString(),
      })) || [];

      setActivities(mappedActivities);
    } catch (error: any) {
      toast.error("Erreur lors du chargement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getEngagementScore = (timeSeconds: number) => {
    const hours = timeSeconds / 3600;
    if (hours >= 10) return 100;
    return Math.round((hours / 10) * 100);
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  const totalTime = activities.reduce((sum, a) => sum + a.total_time_seconds, 0);
  const avgTime = activities.length > 0 ? totalTime / activities.length : 0;

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Suivi du Temps d'Utilisation</h1>
        <p className="text-muted-foreground mt-2">
          Analysez l'engagement des utilisateurs sur la plateforme
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Temps total</p>
              <p className="text-2xl font-bold">{formatTime(totalTime)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Temps moyen</p>
              <p className="text-2xl font-bold">{formatTime(avgTime)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
              <p className="text-2xl font-bold">{activities.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Détails par utilisateur</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Temps total</TableHead>
              <TableHead>Activités</TableHead>
              <TableHead>Score d'engagement</TableHead>
              <TableHead>Dernière activité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity, index) => {
              const score = getEngagementScore(activity.total_time_seconds);
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {activity.user_name}
                  </TableCell>
                  <TableCell>{formatTime(activity.total_time_seconds)}</TableCell>
                  <TableCell>{activity.activity_count}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={score} className="h-2" />
                      <p className="text-xs text-muted-foreground">{score}%</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(activity.last_activity).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}