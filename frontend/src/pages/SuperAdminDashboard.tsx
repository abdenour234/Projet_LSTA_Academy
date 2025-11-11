import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, School, UserCheck, GraduationCap,
  LogOut, BarChart3, Activity, TrendingUp, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authApi, auth } from '@/lib/api';
import { normalizeRole, getRoleDashboardRoute } from '@/lib/roleUtils';

interface GlobalStats {
  totalSchools: number;
  totalUsers: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalSchoolStudents: number;
}

interface SchoolStat {
  id: number;
  name: string;
  city: string;
  region: string;
  level: string;
  status: string;
  students: number;
  totalUsers: number;
  teachers: number;
  createdAt: string;
}

interface SuperAdminStats {
  global: GlobalStats;
  schools: SchoolStat[];
  distribution: {
    byRegion: Record<string, number>;
    byLevel: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ SECURITY: Validate access to this page
  useEffect(() => {
    const validateAccess = () => {
      const user = auth.getUser();
      console.log('[SUPERADMIN_DASHBOARD] Access validation:', user);
      
      if (!user) {
        console.error('[SUPERADMIN_DASHBOARD] No user found, redirecting to login');
        toast({
          title: 'Accès refusé',
          description: 'Vous devez être connecté.',
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
        return false;
      }

      const userRole = normalizeRole(user.role);
      console.log('[SUPERADMIN_DASHBOARD] Role check:', { original: user.role, normalized: userRole });
      
      if (userRole !== 'SUPERADMIN') {
        console.error('[SUPERADMIN_DASHBOARD] Invalid role, redirecting:', userRole);
        toast({
          title: 'Accès refusé',
          description: 'Cette page est réservée aux super administrateurs.',
          variant: 'destructive',
        });
        const correctDashboard = getRoleDashboardRoute(userRole, user.schoolId);
        navigate(correctDashboard, { replace: true });
        return false;
      }

      return true;
    };

    if (validateAccess()) {
      loadStats();
    }
  }, [navigate, toast]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${API_BASE_URL}/superadmin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast({
        title: 'Déconnexion réussie',
        description: 'À bientôt !',
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout même en cas d'erreur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-400" />
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-12 gap-5 mb-8">
            <div className="col-span-12 md:col-span-6 h-40 bg-white border border-slate-200 rounded-lg animate-pulse" />
            <div className="col-span-6 md:col-span-3 h-40 bg-white border border-slate-200 rounded-lg animate-pulse" />
            <div className="col-span-6 md:col-span-3 h-40 bg-white border border-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-12 gap-5 mb-8">
            <div className="col-span-12 md:col-span-5 h-56 bg-white border border-slate-200 rounded-lg animate-pulse" />
            <div className="col-span-12 md:col-span-4 h-56 bg-white border border-slate-200 rounded-lg animate-pulse" />
            <div className="col-span-12 md:col-span-3 h-56 bg-white border border-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-96 bg-white border border-slate-200 rounded-lg animate-pulse" />
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-8 h-full flex items-center">
            <Shield className="h-5 w-5 text-slate-600 mr-3" />
            <h1 className="text-base font-semibold text-slate-900">Tableau de Bord SuperAdmin</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-8 py-8">
          <Card className="p-8 border-slate-200 shadow-none">
            <p className="text-sm text-slate-600">Aucune donnée disponible</p>
          </Card>
        </main>
      </div>
    );
  }

  const user = auth.getUser();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Fixed 64px height */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-slate-600" />
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                Tableau de Bord SuperAdmin
              </h1>
              <p className="text-xs text-slate-500">
                {user?.firstName} {user?.lastName} • {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Global Stats - Asymmetric Layout */}
        <div className="grid grid-cols-12 gap-5 mb-8">
          {/* Primary Metric - Takes more space */}
          <Card className="col-span-12 md:col-span-6 border-slate-200 shadow-none rounded-lg">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Total Écoles
                  </CardTitle>
                  <div className="text-5xl font-bold text-slate-900 tracking-tight">
                    {stats.global.totalSchools}
                  </div>
                </div>
                <School className="h-7 w-7 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.global.totalSchoolStudents.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Élèves au total</div>
                </div>
                <div className="h-12 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.global.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Utilisateurs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Metrics - Compact */}
          <Card className="col-span-6 md:col-span-3 border-slate-200 shadow-none rounded-lg">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Enseignants
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {stats.global.totalTeachers}
                </div>
                <GraduationCap className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600 font-medium mt-2">Professeurs actifs</p>
            </CardContent>
          </Card>

          <Card className="col-span-6 md:col-span-3 border-slate-200 shadow-none rounded-lg">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Administrateurs
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {stats.global.totalAdmins}
                </div>
                <UserCheck className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600 font-medium mt-2">Admins d'écoles</p>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Cards - Improved with visual bars */}
        <div className="grid grid-cols-12 gap-5 mb-8">
          <Card className="col-span-12 md:col-span-5 border-slate-200 shadow-none rounded-lg">
            <CardHeader className="p-5 pb-4">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-600" />
                Distribution par Région
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-4">
                {Object.entries(stats.distribution.byRegion)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([region, count]) => {
                    const maxCount = Math.max(...Object.values(stats.distribution.byRegion));
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={region}>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-sm font-medium text-slate-700">{region}</span>
                          <span className="text-sm font-bold text-slate-900">{count}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-sm h-2">
                          <div
                            className="bg-slate-700 h-2 rounded-sm transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-12 md:col-span-4 border-slate-200 shadow-none rounded-lg">
            <CardHeader className="p-5 pb-4">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-600" />
                Par Niveau
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-4">
                {Object.entries(stats.distribution.byLevel).map(([level, count]) => {
                  const maxCount = Math.max(...Object.values(stats.distribution.byLevel));
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={level}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-medium text-slate-700">{level}</span>
                        <span className="text-sm font-bold text-slate-900">{count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-sm h-2">
                        <div
                          className="bg-slate-700 h-2 rounded-sm transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-12 md:col-span-3 border-slate-200 shadow-none rounded-lg">
            <CardHeader className="p-5 pb-4">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-600" />
                Par Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3">
                {Object.entries(stats.distribution.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-baseline py-2.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{status}</span>
                    <span className="text-xl font-bold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools Table */}
        <Card className="border-slate-200 shadow-none rounded-lg">
          <CardHeader className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <School className="h-4 w-4 text-slate-600" />
                  Liste des Écoles
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 mt-1">
                  {stats.schools.length} écoles au total
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">ID</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">École</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Ville</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Région</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Niveau</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Statut</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Élèves</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Profs</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Users</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.schools.map((school, idx) => (
                    <tr
                      key={school.id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}
                    >
                      <td className="px-5 py-4 text-sm font-mono text-slate-500">{school.id}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{school.name}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{school.city}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{school.region}</td>
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-xs font-medium rounded">
                          {school.level}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-medium border rounded ${
                          school.status === 'Public' 
                            ? 'bg-slate-50 border-slate-300 text-slate-700' 
                            : 'bg-slate-100 border-slate-400 text-slate-800'
                        }`}>
                          {school.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{school.students}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{school.teachers}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{school.totalUsers}</td>
                      <td className="px-5 py-4 text-center">
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="text-slate-700 hover:text-slate-900 hover:bg-slate-200 font-medium"
                          onClick={() => navigate(`/superadmin/schools/${school.id}`)}
                        >
                          <Activity className="h-4 w-4 mr-1.5" />
                          Détails
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
