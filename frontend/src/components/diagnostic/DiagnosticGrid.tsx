import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDiagnosticGrid } from '@/config/diagnosticGrids';
import { Student, DiagnosticSession } from '@/types/diagnostic';
import { Loader2, Save } from 'lucide-react';

const DiagnosticGrid = () => {
  const { id: schoolId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>({});
  const [finalResults, setFinalResults] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
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

      // Initialize responses object
      const initialResponses: Record<string, Record<string, string>> = {};
      studentsData.forEach(student => {
        initialResponses[student.id] = {};
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseChange = (studentId: string, criteriaId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [criteriaId]: value
      }
    }));
  };

  const handleFinalResultChange = (studentId: string, result: string) => {
    setFinalResults(prev => ({
      ...prev,
      [studentId]: result
    }));
  };

  const handleSave = async () => {
    // Validate that all students have responses and final results
    const incompleteStudents = students.filter(student => {
      const studentResponses = responses[student.id];
      const hasFinalResult = finalResults[student.id];
      const hasAllResponses = grid?.criteria.every(c => studentResponses?.[c.id]);
      return !hasAllResponses || !hasFinalResult;
    });

    if (incompleteStudents.length > 0) {
      toast({
        title: 'Diagnostic incomplet',
        description: `Veuillez compléter l'évaluation pour tous les élèves`,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Save results for each student
      const resultsData = students.map(student => ({
        session_id: sessionId,
        student_id: student.id,
        criteria_data: responses[student.id],
        final_result: finalResults[student.id]
      }));

      const { error } = await supabase
        .from('diagnostic_results')
        .insert(resultsData);

      if (error) throw error;

      toast({
        title: 'Diagnostic enregistré',
        description: 'Les résultats ont été sauvegardés avec succès',
      });

      navigate(`/school/${schoolId}/teacher/diagnostic/${sessionId}/results`);
    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer les résultats',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">{grid.title}</h2>
          <p className="text-muted-foreground">{grid.description}</p>
          <div className="mt-4 flex gap-4 text-sm">
            <span className="text-muted-foreground">Niveau: <strong className="text-foreground">{session.grade_level}</strong></span>
            {session.class_name && (
              <span className="text-muted-foreground">Classe: <strong className="text-foreground">{session.class_name}</strong></span>
            )}
            <span className="text-muted-foreground">Élèves: <strong className="text-foreground">{students.length}</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="p-3 text-left font-semibold text-foreground min-w-[150px]">
                  Nom de l'élève
                </th>
                {grid.criteria.map(criteria => (
                  <th key={criteria.id} className="p-3 text-left font-semibold text-foreground min-w-[180px]">
                    {criteria.label}
                  </th>
                ))}
                <th className="p-3 text-left font-semibold text-foreground min-w-[180px]">
                  Résultat final
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={student.id} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                  <td className="p-3 font-medium text-foreground">
                    {student.name}
                  </td>
                  {grid.criteria.map(criteria => (
                    <td key={criteria.id} className="p-3">
                      <RadioGroup
                        value={responses[student.id]?.[criteria.id] || ''}
                        onValueChange={(value) => handleResponseChange(student.id, criteria.id, value)}
                      >
                        {criteria.options.map(option => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${student.id}-${criteria.id}-${option}`} />
                            <Label 
                              htmlFor={`${student.id}-${criteria.id}-${option}`}
                              className="text-sm cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </td>
                  ))}
                  <td className="p-3">
                    <RadioGroup
                      value={finalResults[student.id] || ''}
                      onValueChange={(value) => handleFinalResultChange(student.id, value)}
                    >
                      {grid.resultOptions.map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${student.id}-result-${option}`} />
                          <Label 
                            htmlFor={`${student.id}-result-${option}`}
                            className="text-sm font-semibold cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les résultats
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/school/${schoolId}/teacher/dashboard`)}
            size="lg"
          >
            Annuler
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DiagnosticGrid;
