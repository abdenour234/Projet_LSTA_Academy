import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp, Clock, MessageSquare } from 'lucide-react';
import api from '@/lib/api';

interface AdminStatsCardsProps {
  schoolId: string;
}

export const AdminStatsCards = ({ schoolId }: AdminStatsCardsProps) => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalTeachers: 0,
    totalActivities: 0,
    totalSessions: 0,
    avgProgress: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    loadStats();
  }, [schoolId]);

  const loadStats = async () => {
    try {
      // Fetch all stats from backend endpoints
      
      // Total classes
      const classes = await api.get<any[]>(`/classes?schoolId=${schoolId}`);
      const totalClasses = classes?.length || 0;

      // Total teachers (need backend endpoint for this - for now use 0)
      const totalTeachers = 0; // TODO: Add GET /api/teachers?schoolId={id} endpoint

      // Total activities
      const activities = await api.get<any[]>(`/activities?schoolId=${schoolId}`);
      const totalActivities = activities?.length || 0;

      // Total sessions
      const sessions = await api.get<any[]>(`/teaching-sessions?schoolId=${schoolId}`);
      const totalSessions = sessions?.length || 0;

      // Average progress from sessions
      const avgProgress = sessions && sessions.length > 0
        ? Math.round(sessions.reduce((acc: number, s: any) => acc + (s.percentageAcquired || 0), 0) / sessions.length)
        : 0;

      // Active users (this would need a backend endpoint - for now use 0)
      const activeUsers = 0; // TODO: Add GET /api/users/active?schoolId={id}&days=7 endpoint

      setStats({
        totalClasses,
        totalTeachers,
        totalActivities,
        totalSessions,
        avgProgress,
        activeUsers,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Classes actives',
      value: stats.totalClasses,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Enseignants',
      value: stats.totalTeachers,
      icon: GraduationCap,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      title: 'Activités créées',
      value: stats.totalActivities,
      icon: BookOpen,
      color: 'text-lecture',
      bg: 'bg-lecture/10',
    },
    {
      title: 'Séances réalisées',
      value: stats.totalSessions,
      icon: Clock,
      color: 'text-orale',
      bg: 'bg-orale/10',
    },
    {
      title: 'Progression moyenne',
      value: `${stats.avgProgress}%`,
      icon: TrendingUp,
      color: 'text-ecriture',
      bg: 'bg-ecriture/10',
    },
    {
      title: 'Utilisateurs actifs (7j)',
      value: stats.activeUsers,
      icon: MessageSquare,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          className="p-6 hover:shadow-card-hover transition-smooth animate-scale-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
            <div className={`p-4 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
