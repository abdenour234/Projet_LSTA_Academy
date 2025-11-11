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
import { Plus, Edit, Users, Mail, Phone, Key, Copy, ArrowLeft, LogOut } from "lucide-react";
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

  const handleLogout = async () => {
    await authApi.logout();
    navigate(`/school/${schoolId}/login`);
  };

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
      // ✅ Use registerByAdmin to prevent auto-login when admin creates teachers
      await authApi.registerByAdmin({
        email,
        password,
        fullName: newTeacher.full_name,
        role: 'TEACHER',
        schoolId,
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
    <div className="min-h-screen bg-white">
      {/* Fixed Header - 64px height, professional style */}
      <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(`/school/${schoolId}/admin/dashboard`)}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Gestion des Enseignants</h1>
              <p className="text-sm text-slate-600">Gérez les enseignants et leurs affectations</p>
            </div>
          </div>
          <Button 
            variant="ghost"
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-9"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main content - max-w-7xl, consistent spacing */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Enseignants</h2>
              <p className="text-sm text-slate-600 mt-0.5">Liste des enseignants de l'école</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setGeneratedCredentials(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium h-9"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un enseignant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-slate-900">Ajouter un enseignant</DialogTitle>
                </DialogHeader>
                {generatedCredentials ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
                      <p className="font-semibold text-emerald-700">✅ Compte créé avec succès!</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">Email:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-slate-200">
                              {generatedCredentials.email}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyToClipboard(generatedCredentials.email)}
                              className="h-8 w-8 text-slate-600 hover:text-slate-900"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">Mot de passe:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-slate-200">
                              {generatedCredentials.password}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyToClipboard(generatedCredentials.password)}
                              className="h-8 w-8 text-slate-600 hover:text-slate-900"
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
        </div>

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
      </main>
    </div>
  );
}
