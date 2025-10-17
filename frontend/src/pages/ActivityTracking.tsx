import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Clock, TrendingUp, Calendar, Activity } from "lucide-react";
import { toast } from "sonner";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate(`/school/${schoolId}/login`);
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    setUserRole(roleData?.role || "");

    if (roleData?.role !== "admin") {
      toast.error("Accès réservé aux administrateurs");
      navigate(`/school/${schoolId}/teacher/dashboard`);
    }
  };

  const trackUserActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Log current activity
    await supabase.from("user_activity_logs").insert([
      {
        user_id: user.id,
        school_id: schoolId,
        activity_type: "page_visit",
        activity_date: new Date().toISOString().split("T")[0],
        duration_seconds: 60,
        metadata: { page: "activity_tracking" },
      },
    ]);
  };

  const loadActivityData = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("school_id", schoolId);

      if (profilesError) throw profilesError;

      const { data: logsData, error: logsError } = await supabase
        .from("user_activity_logs")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (logsError) throw logsError;

      // Aggregate data by user
      const userActivityMap: Record<string, any> = {};

      logsData?.forEach((log) => {
        if (!userActivityMap[log.user_id]) {
          const profile = profilesData?.find((p) => p.id === log.user_id);
          userActivityMap[log.user_id] = {
            user_name: profile?.full_name || "Utilisateur",
            total_time_seconds: 0,
            activity_count: 0,
            last_activity: log.created_at,
          };
        }
        userActivityMap[log.user_id].total_time_seconds += log.duration_seconds;
        userActivityMap[log.user_id].activity_count += 1;
      });

      setActivities(Object.values(userActivityMap));
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
