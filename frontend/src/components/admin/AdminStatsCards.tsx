import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp, Clock, MessageSquare } from 'lucide-react';
import { classApi, teacherApi, activityApi, sessionApi } from '@/lib/api';

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
      // Total classes
      const classes = await classApi.getBySchoolId(schoolId);
      const classCount = classes.length;

      // Total teachers
      const teachers = await teacherApi.getBySchoolId(schoolId);
      const teacherCount = teachers.length;

      // Total activities - convert both to strings for type-safe comparison
      const activities = await activityApi.getAll();
      const schoolActivities = activities.filter((a: any) => String(a.schoolId) === String(schoolId));
      const activityCount = schoolActivities.length;

      // Total sessions - get all sessions and filter by school (convert to strings)
      const allSessions = await sessionApi.getAll();
      const sessions = allSessions.filter((s: any) => String(s.schoolId) === String(schoolId));
      const sessionCount = sessions.length;

      // Average progress
      const avgProgress = sessions && sessions.length > 0
        ? Math.round(sessions.reduce((acc: number, s: any) => acc + (s.percentageAcquired || 0), 0) / sessions.length)
        : 0;

      // Active users (last 7 days)
      // TODO: Implement user activity tracking endpoint on backend
      // For now, set to 0 or estimate based on recent sessions
      const activeCount = 0;

      setStats({
        totalClasses: classCount || 0,
        totalTeachers: teacherCount || 0,
        totalActivities: activityCount || 0,
        totalSessions: sessionCount || 0,
        avgProgress,
        activeUsers: activeCount || 0,
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
