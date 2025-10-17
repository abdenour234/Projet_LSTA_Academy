import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Plus, Edit, Users, Mail, Phone, Key, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authApi, auth, ApiError } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    full_name: "",
    matiere: "",
    phone: "",
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null);

  useEffect(() => {
    checkAuth();
    loadData();
  }, [schoolId]);

  const checkAuth = async () => {
    if (!auth.isAuthenticated()) {
      navigate(`/school/${schoolId}/login`);
    }
  };

  const loadData = async () => {
    try {
      if (!schoolId) return;

      // For now, just set empty arrays until we migrate the teacher listing
      // The registration function works with the backend API
      setTeachers([]);
      setClasses([]);
      setTeacherClasses({});

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des données',
        variant: 'destructive',
      });
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
      // TODO: Implement class assignment with backend API
      toast({
        title: 'Info',
        description: 'Fonctionnalité d\'affectation des classes à venir',
      });
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving assignments:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'enregistrement',
        variant: 'destructive',
      });
    }
  };

  const getTeacherClassNames = (teacherId: string) => {
    const classIds = teacherClasses[teacherId] || [];
    return classes
      .filter(c => classIds.includes(c.id))
      .map(c => c.name)
      .join(", ") || "Aucune";
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateEmail = (fullName: string) => {
    const namePart = fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".");
    return `${namePart}@${schoolId}.ma`;
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.full_name || !newTeacher.matiere) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    if (!schoolId) return;

    // Generate email and password
    const email = generateEmail(newTeacher.full_name);
    const password = generatePassword();

    try {
      // Register the teacher using the backend API
      await authApi.register({
        email,
        password,
        fullName: newTeacher.full_name,
        role: 'teacher',
        schoolId,
        matiere: newTeacher.matiere,
        phone: newTeacher.phone || undefined,
      });

      setGeneratedCredentials({ email, password });
      
      toast({
        title: 'Succès',
        description: 'Enseignant créé avec succès',
      });

      await loadData();
      setNewTeacher({ full_name: "", matiere: "", phone: "" });
      
    } catch (error) {
      console.error('Error creating teacher:', error);
      let errorMessage = 'Une erreur est survenue';
      
      if (error instanceof ApiError) {
        errorMessage = typeof error.message === 'string' ? error.message : errorMessage;
      }
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Succès',
      description: 'Copié dans le presse-papier',
    });
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
        <div className="flex justify-end mb-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setGeneratedCredentials(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un enseignant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un enseignant</DialogTitle>
              </DialogHeader>
              {generatedCredentials ? (
                <div className="space-y-4">
                  <div className="p-4 bg-accent/10 rounded-lg space-y-3">
                    <p className="font-semibold text-accent">✅ Compte créé avec succès!</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                            {generatedCredentials.email}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(generatedCredentials.email)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Mot de passe:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                            {generatedCredentials.password}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(generatedCredentials.password)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Veuillez transmettre ces identifiants à l'enseignant. Ils ne seront plus affichés.
                    </p>
                  </div>
                  <Button onClick={() => setIsAddDialogOpen(false)} className="w-full">
                    Fermer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Nom complet *</Label>
                    <Input
                      id="full_name"
                      value={newTeacher.full_name}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, full_name: e.target.value })
                      }
                      placeholder="Ex: Ahmed Bennani"
                    />
                  </div>
                  <div>
                    <Label htmlFor="matiere">Matière *</Label>
                    <Select
                      value={newTeacher.matiere}
                      onValueChange={(value) =>
                        setNewTeacher({ ...newTeacher, matiere: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une matière" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                        <SelectItem value="Français">Français</SelectItem>
                        <SelectItem value="Arabe">Arabe</SelectItem>
                        <SelectItem value="Sciences">Sciences</SelectItem>
                        <SelectItem value="Histoire-Géographie">Histoire-Géographie</SelectItem>
                        <SelectItem value="Éducation Islamique">Éducation Islamique</SelectItem>
                        <SelectItem value="Éducation Physique">Éducation Physique</SelectItem>
                        <SelectItem value="Arts Plastiques">Arts Plastiques</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={newTeacher.phone}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, phone: e.target.value })
                      }
                      placeholder="Ex: 0612345678"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTeacher} className="flex-1">
                      <Key className="w-4 h-4 mr-2" />
                      Créer le compte
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
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
