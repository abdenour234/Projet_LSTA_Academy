import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, Clock } from 'lucide-react';
import { classApi, teacherApi, activityApi, sessionApi, studentApi } from '@/lib/api';

interface AdminStatsCardsProps {
  schoolId: string;
}

export const AdminStatsCards = ({ schoolId }: AdminStatsCardsProps) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalTeachers: 0,
    totalActivities: 0,
  });

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

      // Total students across all classes
      let totalStudents = 0;
      for (const classe of classes) {
        try {
          const classStudents = await studentApi.getByClass(classe.id);
          totalStudents += classStudents.length;
        } catch (err) {
          console.error(`Error loading students for class ${classe.id}:`, err);
        }
      }

      // Total teachers
      const teachers = await teacherApi.getBySchoolId(schoolId);
      const teacherCount = teachers.length;

      // Total activities
      const activities = await activityApi.getAll();
      const schoolActivities = activities.filter((a: any) => String(a.schoolId) === String(schoolId));
      const activityCount = schoolActivities.length;

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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Tertiary Metric - Activities (smallest emphasis) */}
      <Card className="border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Activités</p>
            <p className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">{stats.totalActivities}</p>
          </div>
          <div className="p-2 rounded bg-slate-50">
            <BookOpen className="h-4 w-4 text-slate-600" />
          </div>
        </div>
      </Card>
    </div>
  );
};
