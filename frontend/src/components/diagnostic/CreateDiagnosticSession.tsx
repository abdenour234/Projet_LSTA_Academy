import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { diagnosticApi, classApi, auth } from '@/lib/api';
import { DIAGNOSTIC_GRIDS, GRADE_LEVELS } from '@/config/diagnosticGrids';
import { DiagnosticType } from '@/types/diagnostic';

const CreateDiagnosticSession = () => {
  const { id: schoolId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gradeLevel, setGradeLevel] = useState('');
  const [diagnosticType, setDiagnosticType] = useState<DiagnosticType | ''>('');
  const [className, setClassName] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  useEffect(() => {
    loadClasses();
  }, [schoolId]);

  const loadClasses = async () => {
    try {
      const data = await classApi.getBySchoolId(schoolId!);
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les classes',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleClassChange = (selectedClassId: string) => {
    setClassId(selectedClassId);
    const cls = classes.find(c => c.id === selectedClassId);
    setSelectedClass(cls);
    if (cls) {
      setClassName(cls.name);
      setGradeLevel(cls.level);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradeLevel || !diagnosticType || !classId) {
      toast({
        title: 'Informations manquantes',
        description: 'Veuillez remplir tous les champs et sélectionner une classe',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Créer la session - les étudiants seront automatiquement récupérés depuis la classe
      const session = await diagnosticApi.createSession({
        schoolId: parseInt(schoolId!),
        teacherId: user.id,
        diagnosticType: diagnosticType,
        gradeLevel: gradeLevel,
        className: className,
        classId: classId,
      });

      toast({
        title: 'Session créée',
        description: `${session.totalStudents} élèves chargés depuis la classe ${className}`,
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
        {/* Class Selection */}
        <div className="space-y-2">
          <Label>Classe *</Label>
          <Select value={classId} onValueChange={handleClassChange} required disabled={isLoadingClasses}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingClasses ? "Chargement..." : "Sélectionnez une classe"} />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - {cls.level} ({cls.effectif} élèves)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClass && (
            <p className="text-sm text-muted-foreground">
              {selectedClass.effectif} élève(s) seront automatiquement ajoutés à la session
            </p>
          )}
        </div>

        {/* Grade Level (Auto-filled from class) */}
        <div className="space-y-2">
          <Label>Niveau scolaire *</Label>
          <Input
            value={gradeLevel}
            placeholder="Rempli automatiquement depuis la classe"
            disabled
            className="bg-muted"
          />
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

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading || !classId} className="flex-1">
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