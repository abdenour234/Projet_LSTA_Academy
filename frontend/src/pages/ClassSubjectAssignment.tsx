import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classSubjectApi, subjectApi, teacherManagementApi, classApi } from '@/lib/api';
import { Subject, Teacher, ClassSubject } from '@/types/school';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, ArrowLeft, BookOpen, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

/**
 * ClassSubjectAssignment Component
 * Allows admins to assign subjects and teachers to a class
 */
export default function ClassSubjectAssignment() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [classInfo, setClassInfo] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: '',
    hoursPerWeek: 0,
  });

  useEffect(() => {
    if (classId && user?.schoolId) {
      loadData();
    }
  }, [classId, user?.schoolId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [classData, subjectsData, teachersData, assignmentsData] = await Promise.all([
        classApi.getById(classId!),
        subjectApi.getBySchoolId(user!.schoolId, true),
        teacherManagementApi.getBySchoolId(user!.schoolId, undefined, true),
        classSubjectApi.getSubjectsForClass(classId!),
      ]);

      // Enhance assignments with subject and teacher details
      const enhancedAssignments = assignmentsData.map((assignment: any) => {
        const subject = subjectsData.find((s: Subject) => s.id === assignment.subjectId);
        const teacher = teachersData.find((t: any) => t.id === assignment.teacherId);
        return { ...assignment, subject, teacher };
      });

      setClassInfo(classData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
      setAssignments(enhancedAssignments);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (assignment?: any) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        subjectId: assignment.subjectId,
        teacherId: assignment.teacherId || '',
        hoursPerWeek: assignment.hoursPerWeek || 0,
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        subjectId: '',
        teacherId: '',
        hoursPerWeek: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAssignment(null);
    setFormData({
      subjectId: '',
      teacherId: '',
      hoursPerWeek: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAssignment) {
        // Update existing assignment
        await classSubjectApi.updateAssignment(editingAssignment.id, {
          classId: classId!,
          subjectId: formData.subjectId,
          teacherId: formData.teacherId || undefined,
          hoursPerWeek: formData.hoursPerWeek || undefined,
        });
        toast({
          title: 'Succès',
          description: 'Matière mise à jour avec succès',
        });
      } else {
        // Create new assignment
        await classSubjectApi.assignSubject({
          classId: classId!,
          subjectId: formData.subjectId,
          teacherId: formData.teacherId || undefined,
          hoursPerWeek: formData.hoursPerWeek || undefined,
        });
        toast({
          title: 'Succès',
          description: 'Matière ajoutée avec succès',
        });
      }
      handleCloseDialog();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAssignment = async (assignment: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${assignment.subject?.name} de cette classe ?`)) {
      return;
    }

    try {
      await classSubjectApi.removeSubject(classId!, assignment.subjectId);
      toast({
        title: 'Succès',
        description: 'Matière retirée avec succès',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de retirer la matière',
        variant: 'destructive',
      });
    }
  };

  // Get available subjects (not yet assigned to this class)
  const availableSubjects = subjects.filter(
    (subject) =>
      !assignments.some((a) => a.subjectId === subject.id) ||
      editingAssignment?.subjectId === subject.id
  );

  // Filter teachers by selected subject specialty
  const getTeachersForSubject = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return teachers;
    
    // Case-insensitive and trimmed comparison for better matching
    const subjectName = subject.name.toLowerCase().trim();
    return teachers.filter((t) => {
      const teacherSpecialty = (t.specialty || '').toLowerCase().trim();
      return teacherSpecialty === subjectName;
    });
  };

  const filteredTeachers = formData.subjectId
    ? getTeachersForSubject(formData.subjectId)
    : teachers;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {classInfo?.name || 'Classe'}
                </CardTitle>
                <CardDescription>
                  {classInfo?.level} • Année {classInfo?.academicYear}
                </CardDescription>
              </div>
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                {classInfo?.studentCount || 0} élèves
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Matières et Enseignants</CardTitle>
              <CardDescription>
                Gérez les matières enseignées et assignez des enseignants
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une Matière
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matière</TableHead>
                <TableHead>Enseignant</TableHead>
                <TableHead>Heures/Semaine</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Aucune matière assignée. Ajoutez-en une pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {assignment.subject?.name || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.teacher ? (
                        <div>
                          <div className="font-medium">
                            {assignment.teacher.profile?.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.teacher.specialty}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary">Non assigné</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.hoursPerWeek ? (
                        <span>{assignment.hoursPerWeek}h</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(assignment)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? 'Modifier la Matière' : 'Ajouter une Matière'}
            </DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? 'Modifiez l\'enseignant ou les heures'
                : 'Sélectionnez une matière et assignez un enseignant'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Matière *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subjectId: value, teacherId: '' })
                  }
                  disabled={!!editingAssignment}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!editingAssignment && availableSubjects.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Toutes les matières ont été assignées.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacher">Enseignant</Label>
                <Select
                  value={formData.teacherId || 'unassigned'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teacherId: value === 'unassigned' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un enseignant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Non assigné</SelectItem>
                    {filteredTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.profile?.fullName || 'N/A'} ({teacher.specialty})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.subjectId && filteredTeachers.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Aucun enseignant avec cette spécialité.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Heures par Semaine</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Ex: 4"
                  value={formData.hoursPerWeek || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hoursPerWeek: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={availableSubjects.length === 0 && !editingAssignment}
              >
                {editingAssignment ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
