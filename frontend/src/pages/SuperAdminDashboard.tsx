import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, School, Users, UserCheck, GraduationCap, 
  LogOut, BarChart3, Activity, TrendingUp, MapPin, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';

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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/superadmin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
    await authApi.logout();
    navigate('/superadmin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">SuperAdmin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Vue globale du système</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/superadmin/activities/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Activité
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Écoles</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.global.totalSchools}</div>
              <p className="text-xs text-muted-foreground">
                {stats.global.totalSchoolStudents.toLocaleString()} élèves total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.global.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Tous rôles confondus
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enseignants</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.global.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">
                Professeurs actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.global.totalAdmins}</div>
              <p className="text-xs text-muted-foreground">
                Admins d'écoles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Distribution par Région
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.distribution.byRegion)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([region, count]) => (
                    <div key={region} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{region}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Par Niveau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.distribution.byLevel).map(([level, count]) => (
                  <div key={level} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{level}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Par Statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.distribution.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Liste des Écoles
            </CardTitle>
            <CardDescription>
              Vue détaillée de toutes les écoles du système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">ID</th>
                    <th className="text-left p-3 font-semibold">École</th>
                    <th className="text-left p-3 font-semibold">Ville</th>
                    <th className="text-left p-3 font-semibold">Région</th>
                    <th className="text-left p-3 font-semibold">Niveau</th>
                    <th className="text-left p-3 font-semibold">Statut</th>
                    <th className="text-right p-3 font-semibold">Élèves</th>
                    <th className="text-right p-3 font-semibold">Profs</th>
                    <th className="text-right p-3 font-semibold">Users</th>
                    <th className="text-center p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.schools.map((school) => (
                    <tr key={school.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono text-sm">{school.id}</td>
                      <td className="p-3 font-medium">{school.name}</td>
                      <td className="p-3 text-sm">{school.city}</td>
                      <td className="p-3 text-sm text-muted-foreground">{school.region}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {school.level}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          school.status === 'Public' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {school.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold">{school.students}</td>
                      <td className="p-3 text-right">{school.teachers}</td>
                      <td className="p-3 text-right">{school.totalUsers}</td>
                      <td className="p-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/superadmin/schools/${school.id}`)}
                        >
                          <Activity className="h-4 w-4 mr-1" />
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
