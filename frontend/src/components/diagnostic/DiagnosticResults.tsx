import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { diagnosticApi } from '@/lib/api';
import { getDiagnosticGrid } from '@/config/diagnosticGrids';
import { Loader2, ArrowLeft, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2B6EEA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const DiagnosticResults = () => {
  const { id: schoolId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    try {
      // Charger la session
      const sessionData = await diagnosticApi.getSession(sessionId!);
      setSession(sessionData);

      // Charger les statistiques
      const statsData = await diagnosticApi.getStats(sessionId!);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les résultats',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !session || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const grid = getDiagnosticGrid(session.diagnosticType);
  if (!grid) return null;

  // Préparer les données pour le graphique circulaire
  const totalStudents = Object.values(stats.resultDistribution).reduce((a: any, b: any) => a + b, 0);
  const pieData = Object.entries(stats.resultDistribution).map(([name, value]: [string, any]) => ({
    name,
    value,
    percentage: ((value / totalStudents) * 100).toFixed(1)
  }));

  // Préparer les données pour le graphique en barres
  const barData = grid.criteria.map(criteria => {
    const data: any = { name: criteria.label };
    criteria.options.forEach(option => {
      data[option] = stats.criteriaStats[criteria.id]?.[option] || 0;
    });
    return data;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/school/${schoolId}/teacher/dashboard`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{grid.title}</h1>
          <p className="text-muted-foreground">Résultats du diagnostic</p>
        </div>
      </div>

      {/* Session Info */}
      <Card className="p-6">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Niveau: </span>
            <strong className="text-foreground">{session.gradeLevel}</strong>
          </div>
          {session.className && (
            <div>
              <span className="text-muted-foreground">Classe: </span>
              <strong className="text-foreground">{session.className}</strong>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Élèves: </span>
            <strong className="text-foreground">{session.totalStudents}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Date: </span>
            <strong className="text-foreground">
              {new Date(session.sessionDate).toLocaleDateString('fr-FR')}
            </strong>
          </div>
        </div>
      </Card>

      {/* Distribution of Final Results */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-primary/10">
            <PieChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Distribution des résultats finaux</h2>
            <p className="text-sm text-muted-foreground">
              Répartition des élèves par catégorie
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">{item.value} élèves</div>
                  <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Criteria Analysis */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-accent/10">
            <BarChart3 className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Analyse détaillée par critère</h2>
            <p className="text-sm text-muted-foreground">
              Performance des élèves sur chaque critère d'évaluation
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            {grid.criteria[0].options.map((option, index) => (
              <Bar key={option} dataKey={option} fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Individual Results Table */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Résultats individuels</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="p-3 text-left font-semibold text-foreground">Élève</th>
                {grid.criteria.map(criteria => (
                  <th key={criteria.id} className="p-3 text-left font-semibold text-foreground">
                    {criteria.label}
                  </th>
                ))}
                <th className="p-3 text-left font-semibold text-foreground">Résultat final</th>
              </tr>
            </thead>
            <tbody>
              {stats.studentResults.map((student: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                  <td className="p-3 font-medium text-foreground">{student.studentName}</td>
                  {grid.criteria.map(criteria => (
                    <td key={criteria.id} className="p-3 text-sm">
                      {student.criteriaData[criteria.id]}
                    </td>
                  ))}
                  <td className="p-3">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                      {student.finalResult}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DiagnosticResults;