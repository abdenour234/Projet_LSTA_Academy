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
import { Plus, Edit, Users, Mail, Phone, Key, Copy, Calendar, User, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authApi, auth, ApiError } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Student {
  id: string;
  full_name: string | null;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  parent_contact: string | null;
  class_name?: string | null;
}

export default function StudentManagement() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    parentContact: "",
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

      // Load students from backend API
      const studentsData = await authApi.getStudentsBySchool(schoolId);
      setStudents(studentsData);

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

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateEmail = (firstName: string, lastName: string) => {
    const firstPart = firstName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .substring(0, 3);
    const lastPart = lastName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .substring(0, 3);
    return `${firstPart}${lastPart}${Math.floor(Math.random() * 100)}@${schoolId}.ma`;
  };

  const handleAddStudent = async () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.dateOfBirth || !newStudent.gender) {
    toast({
      title: 'Erreur',
      description: 'Veuillez remplir tous les champs obligatoires',
      variant: 'destructive',
    });
    return;
  }

  if (!schoolId) return;

  // Generate email and password
  const email = generateEmail(newStudent.firstName, newStudent.lastName);
  const password = generatePassword();
  const fullName = `${newStudent.firstName} ${newStudent.lastName}`;

  try {
    // 1. Register PROFILE (OK ✅)
    await authApi.register({
      email,
      password,
      fullName,
      role: 'student',
      schoolId,
    });

    // 2. Create STUDENT RECORD (FIXED ✅)
    await authApi.createStudentRecord({
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      dateOfBirth: `${newStudent.dateOfBirth}T00:00:00`, // ✅ FIXED !
      gender: newStudent.gender,
      parentContact: newStudent.parentContact || undefined,
      schoolId,
    });

    setGeneratedCredentials({ email, password });
    
    toast({
      title: 'Succès',
      description: 'Étudiant créé avec succès',
    });

    await loadData();
    setNewStudent({ firstName: "", lastName: "", dateOfBirth: "", gender: "", parentContact: "" });
    } catch (error) {
      console.error('Error creating student:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(`/admin/${schoolId}/dashboard`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Gestion des Étudiants</h1>
                <p className="text-sm text-muted-foreground">Gérez les étudiants et leurs informations</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        <Card className="p-6">
        <div className="flex justify-end mb-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setGeneratedCredentials(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un étudiant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un étudiant</DialogTitle>
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
                      ⚠️ Veuillez transmettre ces identifiants aux parents. Ils ne seront plus affichés.
                    </p>
                  </div>
                  <Button onClick={() => setIsAddDialogOpen(false)} className="w-full">
                    Fermer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={newStudent.firstName}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, firstName: e.target.value })
                      }
                      placeholder="Ex: Marie"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={newStudent.lastName}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, lastName: e.target.value })
                      }
                      placeholder="Ex: Martin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newStudent.dateOfBirth}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, dateOfBirth: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Genre *</Label>
                    <Select
                      value={newStudent.gender}
                      onValueChange={(value) =>
                        setNewStudent({ ...newStudent, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculin</SelectItem>
                        <SelectItem value="F">Féminin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="parentContact">Contact parent</Label>
                    <Input
                      id="parentContact"
                      value={newStudent.parentContact}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, parentContact: e.target.value })
                      }
                      placeholder="Ex: 0612345678"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddStudent} className="flex-1">
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
              <TableHead>Étudiant</TableHead>
              <TableHead>Date de naissance</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Contact parent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun étudiant trouvé
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div>{student.first_name} {student.last_name}</div>
                      {student.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(student.date_of_birth)}</TableCell>
                  <TableCell>
                    {student.gender === 'M' ? 'Masculin' : 'Féminin'}
                  </TableCell>
                  <TableCell>
                    {student.parent_contact ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {student.parent_contact}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      </main>
    </div>
  );
}