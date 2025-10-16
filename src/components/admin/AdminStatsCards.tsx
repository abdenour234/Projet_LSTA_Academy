import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId);

      // Total teachers - get all profiles for this school
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('school_id', schoolId);

      // Then filter only teachers by checking their roles
      const profileIds = profiles?.map(p => p.id) || [];
      
      const { data: teacherRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher')
        .in('user_id', profileIds);

      // Total activities
      const { count: activityCount } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId);

      // Total sessions
      const { count: sessionCount } = await supabase
        .from('teaching_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId);

      // Average progress
      const { data: sessions } = await supabase
        .from('teaching_sessions')
        .select('percentage_acquired')
        .eq('school_id', schoolId);

      const avgProgress = sessions && sessions.length > 0
        ? Math.round(sessions.reduce((acc: number, s: any) => acc + (s.percentage_acquired || 0), 0) / sessions.length)
        : 0;

      // Active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: activeCount } = await supabase
        .from('user_activity_logs')
        .select('user_id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('activity_date', sevenDaysAgo.toISOString().split('T')[0]);

      setStats({
        totalClasses: classCount || 0,
        totalTeachers: teacherRoles?.length || 0,
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
