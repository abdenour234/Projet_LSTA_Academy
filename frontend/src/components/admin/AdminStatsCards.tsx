import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, Clock } from 'lucide-react';
import { classApi, teacherApi, activityApi, sessionApi, studentApi } from '@/lib/api';

interface AdminStatsCardsProps {
  schoolId: string;
}

interface LevelDistribution {
  level: string;
  count: number;
  percentage: number;
}

interface ActivityTypeDistribution {
  type: string;
  count: number;
  color: string;
}

export const AdminStatsCards = ({ schoolId }: AdminStatsCardsProps) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalTeachers: 0,
    totalActivities: 0,
  });

  const [levelDistribution, setLevelDistribution] = useState<LevelDistribution[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [schoolId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Total classes
      const classes = await classApi.getBySchoolId(schoolId);
      const classCount = classes.length;

      // Total students across all classes and calculate level distribution
      let totalStudents = 0;
      const levelCounts = new Map<string, number>();
      
      for (const classe of classes) {
        try {
          const classStudents = await studentApi.getByClass(classe.id);
          totalStudents += classStudents.length;
          
          // Count by level
          if (classe.level) {
            levelCounts.set(classe.level, (levelCounts.get(classe.level) || 0) + classStudents.length);
          }
        } catch (err) {
          console.error(`Error loading students for class ${classe.id}:`, err);
        }
      }

      // Calculate level distribution
      const distributions: LevelDistribution[] = Array.from(levelCounts.entries())
        .map(([level, count]) => ({
          level,
          count,
          percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      setLevelDistribution(distributions);

      // Total teachers
      const teachers = await teacherApi.getBySchoolId(schoolId);
      const teacherCount = teachers.length;

      // Total activities and calculate type distribution
      const activities = await activityApi.getAll();
      const schoolActivities = activities.filter((a: any) => String(a.schoolId) === String(schoolId));
      const activityCount = schoolActivities.length;

      // Calculate activity type distribution
      const typeCounts = new Map<string, number>();
      schoolActivities.forEach((activity: any) => {
        if (activity.type) {
          typeCounts.set(activity.type, (typeCounts.get(activity.type) || 0) + 1);
        }
      });

      const typeColors: Record<string, string> = {
        'Orale': 'bg-blue-600',
        'Lecture': 'bg-emerald-600',
        'Ecriture': 'bg-amber-600',
      };

      const typeDistributions: ActivityTypeDistribution[] = Array.from(typeCounts.entries())
        .map(([type, count]) => ({
          type,
          count,
          color: typeColors[type] || 'bg-slate-600',
        }))
        .sort((a, b) => b.count - a.count);

      setActivityTypes(typeDistributions);

      setStats({
        totalStudents,
        totalClasses: classCount || 0,
        totalTeachers: teacherCount || 0,
        totalActivities: activityCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-5 bg-white">
            <div className="animate-pulse space-y-3">
              <div className="h-3 bg-slate-200 rounded w-20"></div>
              <div className="h-8 bg-slate-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Primary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Primary Metric - Students (double width, largest emphasis) */}
        <Card className="col-span-1 md:col-span-2 border border-slate-200 bg-white p-6 hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-normal text-slate-600 mb-2 tracking-normal">Élèves inscrits</p>
              <p className="text-5xl font-bold text-slate-900 tracking-tight leading-none">{stats.totalStudents}</p>
              <p className="text-xs text-slate-500 mt-3 font-normal">Total des élèves de l'école</p>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <Users className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </Card>

        {/* Secondary Metrics - Classes & Teachers (grouped, medium emphasis) */}
        <Card className="border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Classes</p>
              <p className="text-4xl font-bold text-slate-900 tracking-tight leading-none">{stats.totalClasses}</p>
            </div>
            <div className="p-2 rounded bg-slate-50">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Enseignants</p>
              <p className="text-4xl font-bold text-slate-900 tracking-tight leading-none">{stats.totalTeachers}</p>
            </div>
            <div className="p-2 rounded bg-slate-50">
              <GraduationCap className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Distribution Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level Distribution Widget */}
        <Card className="border border-slate-200 bg-white p-5">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-slate-900">Répartition par niveau</h3>
            <p className="text-xs text-slate-500 mt-0.5">Élèves par classe</p>
          </div>
          {levelDistribution.length > 0 ? (
            <div className="space-y-3">
              {levelDistribution.map((dist) => (
                <div key={dist.level}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{dist.level}</span>
                    <span className="text-slate-600">{dist.count} ({dist.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div 
                      className="bg-slate-700 h-1.5 rounded-full transition-all"
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Aucune donnée disponible</p>
          )}
        </Card>

        {/* Activity Type Distribution Widget */}
        <Card className="border border-slate-200 bg-white p-5">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-slate-900">Types d'activités</h3>
            <p className="text-xs text-slate-500 mt-0.5">{stats.totalActivities} activités</p>
          </div>
          {activityTypes.length > 0 ? (
            <div className="space-y-3">
              {activityTypes.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${type.color}`} />
                    <span className="text-sm text-slate-700">{type.type}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{type.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Aucune activité créée</p>
          )}
        </Card>

        {/* Quick Stats Widget */}
        <Card className="border border-slate-200 bg-white p-5">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-slate-900">Statistiques rapides</h3>
            <p className="text-xs text-slate-500 mt-0.5">Ratios moyens</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Élèves par classe</span>
              <span className="text-lg font-bold text-slate-900">
                {stats.totalClasses > 0 ? Math.round(stats.totalStudents / stats.totalClasses) : 0}
              </span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Classes par enseignant</span>
              <span className="text-lg font-bold text-slate-900">
                {stats.totalTeachers > 0 ? (stats.totalClasses / stats.totalTeachers).toFixed(1) : 0}
              </span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Activités disponibles</span>
              <span className="text-lg font-bold text-slate-900">{stats.totalActivities}</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};
