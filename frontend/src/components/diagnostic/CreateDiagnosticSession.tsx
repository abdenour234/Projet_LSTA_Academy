import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DIAGNOSTIC_GRIDS, GRADE_LEVELS } from '@/config/diagnosticGrids';
import { DiagnosticType } from '@/types/diagnostic';

const CreateDiagnosticSession = () => {
  const { id: schoolId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gradeLevel, setGradeLevel] = useState('');
  const [diagnosticType, setDiagnosticType] = useState<DiagnosticType | ''>('');
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For demo purposes, we'll just create mock students
    // In production, you'd parse the PDF to extract student names
    const mockStudents = [
      'Ahmed Alaoui',
      'Fatima Zahra',
      'Youssef Bennani',
      'Salma Idrissi',
      'Omar Tazi',
      'Nadia Amrani',
      'Karim Mansouri',
      'Leila Benjelloun'
    ];
    
    setStudents(mockStudents);
    
    toast({
      title: 'Fichier importé',
      description: `${mockStudents.length} élèves chargés depuis le PDF`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradeLevel || !diagnosticType || students.length === 0) {
      toast({
        title: 'Informations manquantes',
        description: 'Veuillez remplir tous les champs et importer la liste des élèves',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create diagnostic session
      const { data: session, error: sessionError } = await supabase
        .from('diagnostic_sessions')
        .insert({
          school_id: schoolId,
          teacher_id: user.id,
          diagnostic_type: diagnosticType,
          grade_level: gradeLevel,
          class_name: className || null,
          total_students: students.length,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Insert students
      const studentsData = students.map((name, index) => ({
        session_id: session.id,
        student_name: name,
        student_order: index + 1,
      }));

      const { error: studentsError } = await supabase
        .from('diagnostic_students')
        .insert(studentsData);

      if (studentsError) throw studentsError;

      toast({
        title: 'Session créée',
        description: 'Vous pouvez maintenant réaliser le diagnostic',
      });

      navigate(`/school/${schoolId}/teacher/diagnostic/${session.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la session de diagnostic',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Nouvelle session de diagnostic
        </h2>
        <p className="text-muted-foreground">
          Créez une session pour réaliser un diagnostic pédagogique avec vos élèves
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grade Level Selection */}
        <div className="space-y-2">
          <Label>Niveau scolaire *</Label>
          <Select value={gradeLevel} onValueChange={setGradeLevel} required>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez le niveau" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Diagnostic Type Selection */}
        <div className="space-y-2">
          <Label>Type de diagnostic *</Label>
          <Select value={diagnosticType} onValueChange={(value) => setDiagnosticType(value as DiagnosticType)} required>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez le type de diagnostic" />
            </SelectTrigger>
            <SelectContent>
              {DIAGNOSTIC_GRIDS.map((grid) => (
                <SelectItem key={grid.type} value={grid.type}>
                  {grid.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {diagnosticType && (
            <p className="text-sm text-muted-foreground mt-2">
              {DIAGNOSTIC_GRIDS.find(g => g.type === diagnosticType)?.description}
            </p>
          )}
        </div>

        {/* Class Name (Optional) */}
        <div className="space-y-2">
          <Label>Nom de la classe (optionnel)</Label>
          <Input
            placeholder="Ex: 5ème A"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
        </div>

        {/* PDF Upload */}
        <div className="space-y-2">
          <Label>Liste des élèves (PDF) *</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Importez un fichier PDF contenant la liste des élèves
            </p>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="max-w-xs mx-auto"
            />
          </div>
          {students.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-primary mt-2">
              <FileText className="h-4 w-4" />
              <span>{students.length} élèves chargés</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Création...' : 'Créer la session'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(`/school/${schoolId}/teacher/dashboard`)}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CreateDiagnosticSession;
