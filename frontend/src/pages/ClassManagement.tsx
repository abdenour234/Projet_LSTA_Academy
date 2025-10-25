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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Users, Download, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import { classApi, authApi } from "@/lib/api";

interface Class {
  id: string;
  name: string;
  level: string;
  academicYear: string;
  studentCount: number;
  schoolId: string;
}

interface ImportedStudent {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  parentContact: string;
}

interface Credential {
  fullName: string;
  email: string;
  password: string;
}

export default function ClassManagement() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    level: "Primaire",
    academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    studentCount: 0,
  });
  const [importedStudents, setImportedStudents] = useState<ImportedStudent[]>([]);

  const handleLogout = async () => {
    await authApi.logout();
    navigate(`/school/${schoolId}/login`);
  };

  useEffect(() => {
    checkAuth();
    loadClasses();
  }, [schoolId]);

  const checkAuth = async () => {
    const user = localStorage.getItem('current_user');
    if (!user) {
      navigate(`/school/${schoolId}/login`);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await classApi.getBySchoolId(schoolId!);
      setClasses(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des classes");
      console.error(error);
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

  const parseDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts;
    const paddedMonth = mm.padStart(2, '0');
    const paddedDay = dd.padStart(2, '0');
    const isoDate = `${yyyy}-${paddedMonth}-${paddedDay}`;
    // Validate the date
    const dateObj = new Date(isoDate);
    if (isNaN(dateObj.getTime())) return '';
    return isoDate;
  };
  const parseGender = (gender: string) => {
    if (gender.toLowerCase() === 'male') return 'M';
    if (gender.toLowerCase() === 'female') return 'F';
    return gender;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim());
      if (rows.length < 2) {
        toast.error("Fichier CSV invalide");
        return;
      }

      const headers = rows[0].split(';').map(h => h.trim());
      const expectedHeaders = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'parentContact'];
      if (!expectedHeaders.every((h, i) => headers[i] === h)) {
        toast.error("Le CSV doit contenir les colonnes exactes: firstName;lastName;dateOfBirth;gender;parentContact");
        return;
      }

      const data: ImportedStudent[] = rows.slice(1).map(row => {
        const values = row.split(';').map(v => v.trim());
        return {
          firstName: values[0] || '',
          lastName: values[1] || '',
          dateOfBirth: parseDate(values[2] || ''),
          gender: parseGender(values[3] || ''),
          parentContact: values[4] || '',
        };
      }).filter(student => student.firstName && student.lastName && student.dateOfBirth && student.gender);

      if (data.length === 0) {
        toast.error("Aucun étudiant valide dans le CSV");
        return;
      }

      setImportedStudents(data);
      setFormData({ ...formData, studentCount: data.length });
      toast.success(`${data.length} étudiants importés du CSV`);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    const submitButton = e.currentTarget.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    setSubmitting(true);

    try {
      let savedClass: Class;
      if (editingClass) {
        savedClass = await classApi.update(editingClass.id, {
          ...formData,
          studentCount: Number(formData.studentCount),
        });
        toast.success("Classe modifiée avec succès");
      } else {
        savedClass = await classApi.create({
          ...formData,
          schoolId: schoolId!,
          studentCount: importedStudents.length > 0 ? importedStudents.length : Number(formData.studentCount),
        });
        toast.success("Classe créée avec succès");
      }

      const credentials: Credential[] = [];

      if (!editingClass && importedStudents.length > 0) {
        console.log("Processing students:", importedStudents);
        for (const student of importedStudents) {
          const fullName = `${student.firstName} ${student.lastName}`;
          const email = generateEmail(student.firstName, student.lastName);
          const password = generatePassword();
          console.log(`Attempting to register student: ${fullName}, email: ${email}`);

          const userData = {
            email,
            password,
            fullName,
            role: 'student',
            schoolId: schoolId!,
            dateOfBirth: student.dateOfBirth || undefined, // Pass undefined if empty
            gender: student.gender,
            parentContact: student.parentContact,
            classId: savedClass.id,
          };

          try {
            const response = await authApi.register(userData);
            credentials.push({ fullName, email, password });
          } catch (error: any) {
            if (error.status === 400 && error.message.includes('already exists')) {
              console.warn(`Utilisateur ${fullName} existe déjà, ignoré`);
              continue;
            }
            throw error;
          }
        }

        if (credentials.length > 0) {
          downloadCredentialsCSV(credentials, savedClass.name);
          toast.success(`${credentials.length} étudiants créés avec succès`);
        }
      }

      setIsDialogOpen(false);
      resetForm();
      await loadClasses();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde");
      console.error(error);
    } finally {
      if (submitButton) submitButton.disabled = false;
      setSubmitting(false);
    }
  };

  const downloadCredentialsCSV = (credentials: Credential[], className: string) => {
    const csvContent = "nom complet;email;mot de passe\n" +
      credentials.map(c => `${c.fullName};${c.email};${c.password}`).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `etudiants_${className}_credentials.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportClass = async (classItem: Class) => {
    try {
      const students = await classApi.getBySchoolId(classItem.id); // Adjust endpoint as needed
      if (!students || students.length === 0) {
        toast.error("Aucun étudiant trouvé pour cette classe");
        return;
      }

      const csvContent = "nom complet;email\n" +
        students.map((s: any) => `${s.firstName} ${s.lastName};${s.email || 'N/A'}`).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `etudiants_${classItem.name}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export CSV terminé. Note : Les mots de passe sont disponibles uniquement dans le CSV généré lors de la création de la classe.");
    } catch (error: any) {
      toast.error("Erreur lors de l'export");
      console.error(error);
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      level: classItem.level,
      academicYear: classItem.academicYear,
      studentCount: classItem.studentCount,
    });
    setImportedStudents([]);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette classe ?")) return;

    try {
      await classApi.delete(id);
      toast.success("Classe supprimée");
      loadClasses();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: "Primaire",
      academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      studentCount: 0,
    });
    setEditingClass(null);
    setImportedStudents([]);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
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
                <h1 className="text-2xl font-bold">Gestion des Classes</h1>
                <p className="text-sm text-muted-foreground">Gérez les classes et leurs effectifs</p>
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
        <div className="flex justify-end items-center mb-8">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Classe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? "Modifier" : "Nouvelle"} Classe
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la classe</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="6ème A"
                  required
                />
              </div>
              <div>
                <Label htmlFor="level">Niveau</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primaire">Primaire</SelectItem>
                    <SelectItem value="Collège">Collège</SelectItem>
                    <SelectItem value="Lycée">Lycée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="annee">Année scolaire</Label>
                <Input
                  id="annee"
                  value={formData.academicYear}
                  onChange={(e) =>
                    setFormData({ ...formData, academicYear: e.target.value })
                  }
                  placeholder="2024-2025"
                  required
                />
              </div>
              {!editingClass && (
                <div>
                  <Label htmlFor="csv">Importer CSV Étudiants (optionnel)</Label>
                  <Input
                    id="csv"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Colonnes requises: firstName;lastName;dateOfBirth (DD/MM/YYYY);gender (Male/Female);parentContact
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="studentCount">Effectif</Label>
                <Input
                  id="studentCount"
                  type="number"
                  min="0"
                  value={formData.studentCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      studentCount: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={importedStudents.length > 0}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "En cours..." : (editingClass ? "Modifier" : "Créer")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Année scolaire</TableHead>
              <TableHead>
                <Users className="w-4 h-4 inline mr-2" />
                Effectif
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucune classe enregistrée
                </TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">{classItem.name}</TableCell>
                  <TableCell>{classItem.level}</TableCell>
                  <TableCell>{classItem.academicYear}</TableCell>
                  <TableCell>{classItem.studentCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportClass(classItem)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(classItem)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(classItem.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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