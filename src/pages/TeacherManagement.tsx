import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Users, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface Teacher {
  id: string;
  full_name: string | null;
  email: string;
  matiere: string | null;
  phone: string | null;
}

interface Class {
  id: string;
  name: string;
  level: string;
}

export default function TeacherManagement() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
    loadData();
  }, [schoolId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate(`/school/${schoolId}/login`);
    }
  };

  const loadData = async () => {
    try {
      // Load teachers
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, matiere, phone")
        .eq("school_id", schoolId);

      if (profilesError) throw profilesError;

      // Filter only teachers
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher")
        .in("user_id", profilesData?.map(p => p.id) || []);

      if (rolesError) throw rolesError;

      const teacherIds = rolesData?.map(r => r.user_id) || [];
      const filteredTeachers = profilesData?.filter(p => teacherIds.includes(p.id)) || [];
      setTeachers(filteredTeachers);

      // Load classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId);

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Load teacher-class assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("teacher_classes")
        .select("teacher_id, class_id");

      if (assignmentsError) throw assignmentsError;

      const assignments: Record<string, string[]> = {};
      assignmentsData?.forEach(a => {
        if (!assignments[a.teacher_id]) {
          assignments[a.teacher_id] = [];
        }
        assignments[a.teacher_id].push(a.class_id);
      });
      setTeacherClasses(assignments);

    } catch (error: any) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClasses = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClassIds(teacherClasses[teacher.id] || []);
    setIsAssignDialogOpen(true);
  };

  const handleSaveAssignments = async () => {
    if (!selectedTeacher) return;

    try {
      // Delete existing assignments
      await supabase
        .from("teacher_classes")
        .delete()
        .eq("teacher_id", selectedTeacher.id);

      // Insert new assignments
      if (selectedClassIds.length > 0) {
        const assignments = selectedClassIds.map(classId => ({
          teacher_id: selectedTeacher.id,
          class_id: classId,
        }));

        const { error } = await supabase
          .from("teacher_classes")
          .insert(assignments);

        if (error) throw error;
      }

      toast.success("Affectations mises à jour");
      setIsAssignDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const getTeacherClassNames = (teacherId: string) => {
    const classIds = teacherClasses[teacherId] || [];
    return classes
      .filter(c => classIds.includes(c.id))
      .map(c => c.name)
      .join(", ") || "Aucune";
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestion des Enseignants</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les enseignants et leurs affectations
        </p>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Classes assignées</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun enseignant trouvé
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">
                    {teacher.full_name || "Non renseigné"}
                  </TableCell>
                  <TableCell>{teacher.matiere || "-"}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {teacher.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {teacher.email}
                        </div>
                      )}
                      {teacher.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {teacher.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTeacherClassNames(teacher.id)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignClasses(teacher)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Affecter
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Affecter des classes - {selectedTeacher?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {classes.map((classItem) => (
              <div key={classItem.id} className="flex items-center space-x-2">
                <Checkbox
                  id={classItem.id}
                  checked={selectedClassIds.includes(classItem.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedClassIds([...selectedClassIds, classItem.id]);
                    } else {
                      setSelectedClassIds(
                        selectedClassIds.filter((id) => id !== classItem.id)
                      );
                    }
                  }}
                />
                <label
                  htmlFor={classItem.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {classItem.name} - {classItem.level}
                </label>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSaveAssignments} className="flex-1">
              Enregistrer
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
