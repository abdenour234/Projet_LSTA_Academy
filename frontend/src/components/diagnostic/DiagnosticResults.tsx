import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDiagnosticGrid } from '@/config/diagnosticGrids';
import { Student, DiagnosticSession, DiagnosticResult } from '@/types/diagnostic';
import { Loader2, ArrowLeft, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2B6EEA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const DiagnosticResults = () => {
  const { id: schoolId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    try {
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('diagnostic_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('diagnostic_students')
        .select('*')
        .eq('session_id', sessionId)
        .order('student_order');

      if (studentsError) throw studentsError;
      setStudents(studentsData.map(s => ({
        id: s.id,
        name: s.student_name,
        order: s.student_order
      })));

      // Load results
      const { data: resultsData, error: resultsError } = await supabase
        .from('diagnostic_results')
        .select('*')
        .eq('session_id', sessionId);

      if (resultsError) throw resultsError;
      setResults(resultsData);
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

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const grid = getDiagnosticGrid(session.diagnostic_type);
  if (!grid) return null;

  // Calculate statistics
  const resultDistribution: Record<string, number> = {};
  results.forEach(result => {
    resultDistribution[result.final_result] = (resultDistribution[result.final_result] || 0) + 1;
  });

  const pieData = Object.entries(resultDistribution).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / results.length) * 100).toFixed(1)
  }));

  // Calculate criteria statistics
  const criteriaStats: Record<string, Record<string, number>> = {};
  grid.criteria.forEach(criteria => {
    criteriaStats[criteria.id] = {};
    criteria.options.forEach(option => {
      criteriaStats[criteria.id][option] = 0;
    });
  });

  results.forEach(result => {
    Object.entries(result.criteria_data as Record<string, string>).forEach(([criteriaId, value]) => {
      if (criteriaStats[criteriaId] && criteriaStats[criteriaId][value] !== undefined) {
        criteriaStats[criteriaId][value]++;
      }
    });
  });

  const barData = grid.criteria.map(criteria => {
    const data: any = { name: criteria.label };
    criteria.options.forEach(option => {
      data[option] = criteriaStats[criteria.id][option] || 0;
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
            <strong className="text-foreground">{session.grade_level}</strong>
          </div>
          {session.class_name && (
            <div>
              <span className="text-muted-foreground">Classe: </span>
              <strong className="text-foreground">{session.class_name}</strong>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Élèves: </span>
            <strong className="text-foreground">{students.length}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Date: </span>
            <strong className="text-foreground">
              {new Date(session.session_date).toLocaleDateString('fr-FR')}
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
              {students.map((student, idx) => {
                const result = results.find(r => r.student_id === student.id);
                if (!result) return null;
                
                return (
                  <tr key={student.id} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                    <td className="p-3 font-medium text-foreground">{student.name}</td>
                    {grid.criteria.map(criteria => (
                      <td key={criteria.id} className="p-3 text-sm">
                        {(result.criteria_data as Record<string, string>)[criteria.id]}
                      </td>
                    ))}
                    <td className="p-3">
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                        {result.final_result}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DiagnosticResults;
