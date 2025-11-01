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
import { Plus, Edit, Trash2, Users, Download, UserPlus, Copy } from "lucide-react";
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
  massar: string;
}

interface Credential {
  fullName: string;
  email: string;
  password: string;
}

// ============= PATTERNS REGEX POUR LES COLONNES =============
const columnPatterns = {
  firstName: /^(pr[ée]nom|first\s*name|firstname|nom\s*de\s*famille\s*\(pr[ée]nom\)|student\s*first\s*name)$/i,
  lastName: /^(nom|last\s*name|lastname|nom\s*de\s*famille|family\s*name|student\s*last\s*name)$/i,
  dateOfBirth: /^(date\s*de\s*naissance|date\s*naissance|dob|birth\s*date|birthdate|date\s*of\s*birth|n[ée]\s*le)$/i,
  gender: /^(genre|sexe|gender|sex|g)$/i,
  parentContact: /^(contact\s*parent|contact\s*du\s*parent|parent\s*contact|t[ée]l[ée]phone\s*parent|phone\s*parent|contact\s*familial|tel\s*parent)$/i,
  massar: /^(massar|code\s*massar|num[ée]ro\s*massar|massar\s*code|id\s*massar)$/i,
};

const findColumnIndex = (headers: string[], patterns: RegExp): number => {
  return headers.findIndex(header => patterns.test(header.trim()));
};

const mapHeaders = (headers: string[]): Record<string, number> => {
  const mapping: Record<string, number> = {};
  for (const [field, pattern] of Object.entries(columnPatterns)) {
    const index = findColumnIndex(headers, pattern);
    if (index !== -1) {
      mapping[field] = index;
    }
  }
  return mapping;
};

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

  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    parentContact: "",
    massar: "",
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<Credential | null>(null);

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

  // ============= PARSING AMÉLIORÉ =============
  const parseDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    
    // Format DD/MM/YYYY ou D/M/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmyMatch) {
      const [_, dd, mm, yyyy] = dmyMatch;
      const paddedMonth = mm.padStart(2, '0');
      const paddedDay = dd.padStart(2, '0');
      const isoDate = `${yyyy}-${paddedMonth}-${paddedDay}`;
      const dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
      if (!isNaN(dateObj.getTime())) return isoDate;
    }
    
    // Format YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (ymdMatch) {
      const [_, yyyy, mm, dd] = ymdMatch;
      const paddedMonth = mm.padStart(2, '0');
      const paddedDay = dd.padStart(2, '0');
      const isoDate = `${yyyy}-${paddedMonth}-${paddedDay}`;
      const dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
      if (!isNaN(dateObj.getTime())) return isoDate;
    }
    
    return '';
  };

  const parseGender = (gender: string): string => {
    const normalized = gender.toLowerCase().trim();
    if (/^(m|male|masculin|homme|h|garcon|gar[çc]on|boy)$/.test(normalized)) return 'M';
    if (/^(f|female|f[ée]minin|femme|fille|girl)$/.test(normalized)) return 'F';
    if (gender.toUpperCase() === 'M' || gender.toUpperCase() === 'F') {
      return gender.toUpperCase();
    }
    return gender;
  };

  // ============= UPLOAD CSV GÉNÉRALISÉ =============
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(row => row.trim());
      
      if (lines.length < 2) {
        toast.error("Fichier CSV invalide : pas assez de lignes");
        return;
      }

      // Détecter le séparateur
      const firstLine = lines[0];
      let separator = ';';
      if (firstLine.split(',').length > firstLine.split(';').length) {
        separator = ',';
      } else if (firstLine.split('\t').length > firstLine.split(';').length) {
        separator = '\t';
      }

      // Parser les headers
      const headers = lines[0].split(separator).map(h => h.trim());
      const columnMapping = mapHeaders(headers);

      // Vérifier colonnes obligatoires
      const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender'];
      const missingFields = requiredFields.filter(field => columnMapping[field] === undefined);
      
      if (missingFields.length > 0) {
        toast.error(
          `Colonnes obligatoires manquantes.\n` +
          `Colonnes trouvées: ${headers.join(', ')}\n\n` +
          `Assurez-vous d'avoir: Prénom, Nom, Date de naissance, Genre`
        );
        return;
      }

      // Parser les données
      const data: ImportedStudent[] = lines.slice(1).map(row => {
        const values = row.split(separator).map(v => v.trim());
        
        return {
          firstName: values[columnMapping.firstName] || '',
          lastName: values[columnMapping.lastName] || '',
          dateOfBirth: parseDate(values[columnMapping.dateOfBirth] || ''),
          gender: parseGender(values[columnMapping.gender] || ''),
          parentContact: columnMapping.parentContact !== undefined 
            ? values[columnMapping.parentContact] || '' 
            : '',
          massar: columnMapping.massar !== undefined 
            ? values[columnMapping.massar] || '' 
            : '',
        };
      }).filter(student => 
        student.firstName && 
        student.lastName && 
        student.dateOfBirth && 
        student.gender
      );

      if (data.length === 0) {
        toast.error("Aucun étudiant valide trouvé dans le CSV");
        return;
      }

      setImportedStudents(data);
      setFormData({ ...formData, studentCount: data.length });
      toast.success(`${data.length} étudiants importés du CSV`);
    };
    
    reader.onerror = () => {
      toast.error("Erreur lors de la lecture du fichier");
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
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
        for (const student of importedStudents) {
          const fullName = `${student.firstName} ${student.lastName}`;
          const email = generateEmail(student.firstName, student.lastName);
          const password = generatePassword();

          const userData = {
            email,
            password,
            fullName,
            role: 'student',
            schoolId: schoolId!,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            parentContact: student.parentContact,
            massar: student.massar,
            classId: savedClass.id,
          };

          try {
            await authApi.register(userData);
            credentials.push({ fullName, email, password });
          } catch (error: any) {
            if (error.status === 400 && error.message.includes('already exists')) {
              console.warn(`Utilisateur ${fullName} existe déjà`);
              continue;
            }
            throw error;
          }
        }

        if (credentials.length > 0) {
          downloadCredentialsCSV(credentials, savedClass.name);
          toast.success(`${credentials.length} étudiants créés`);
        }
      }

      setIsDialogOpen(false);
      resetForm();
      await loadClasses();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.dateOfBirth || !newStudent.gender) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const parsedDate = parseDate(newStudent.dateOfBirth);
    if (!parsedDate) {
      toast.error("Format de date invalide. Utilisez JJ/MM/AAAA");
      return;
    }

    const email = generateEmail(newStudent.firstName, newStudent.lastName);
    const password = generatePassword();
    const fullName = `${newStudent.firstName} ${newStudent.lastName}`;

    try {
      await authApi.register({
        email,
        password,
        fullName,
        role: 'student',
        schoolId: schoolId!,
        dateOfBirth: parsedDate,
        gender: newStudent.gender,
        parentContact: newStudent.parentContact,
        massar: newStudent.massar,
        classId: selectedClass!.id,
      });

      setGeneratedCredentials({ fullName, email, password });
      toast.success("Étudiant ajouté avec succès !");

      setNewStudent({ firstName: "", lastName: "", dateOfBirth: "", gender: "", parentContact: "" , massar: "" });
      setIsStudentDialogOpen(false);
      await loadClasses();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier !");
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
      const students = await studentApi.getByClass(classItem.id);
      if (!students || students.length === 0) {
        toast.error("Aucun étudiant trouvé");
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

      toast.success("Export CSV terminé");
    } catch (error: any) {
      toast.error("Erreur lors de l'export");
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
    if (!confirm("Supprimer cette classe ?")) return;
    try {
      await classApi.delete(id);
      toast.success("Classe supprimée");
      loadClasses();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
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
    if (!open) resetForm();
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Classes</h1>
          <p className="text-muted-foreground mt-2">Gérez les classes et leurs effectifs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Classe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClass ? "Modifier" : "Nouvelle"} Classe</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la classe</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="6ème A" required />
              </div>
              <div>
                <Label htmlFor="level">Niveau</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primaire">Primaire</SelectItem>
                    <SelectItem value="Collège">Collège</SelectItem>
                    <SelectItem value="Lycée">Lycée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="annee">Année scolaire</Label>
                <Input id="annee" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} placeholder="2024-2025" required />
              </div>
              {!editingClass && (
                <div>
                  <Label htmlFor="csv">Importer CSV Étudiants (optionnel)</Label>
                  <Input id="csv" type="file" accept=".csv" onChange={handleFileUpload} />
                  <p className="text-sm text-muted-foreground mt-1">
                    Colonnes acceptées: Prénom, Nom, Date de naissance, Genre, Contact parent, Massar (formats flexibles)
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="studentCount">Effectif</Label>
                <Input id="studentCount" type="number" min="0" value={formData.studentCount} onChange={(e) => setFormData({ ...formData, studentCount: parseInt(e.target.value) || 0 })} disabled={importedStudents.length > 0} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "En cours..." : (editingClass ? "Modifier" : "Créer")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
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
              <TableHead><Users className="w-4 h-4 inline mr-2" />Effectif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Aucune classe enregistrée</TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">{classItem.name}</TableCell>
                  <TableCell>{classItem.level}</TableCell>
                  <TableCell>{classItem.academicYear}</TableCell>
                  <TableCell>{classItem.studentCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleExportClass(classItem)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedClass(classItem); setIsStudentDialogOpen(true); }}>
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(classItem)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(classItem.id)}>
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

      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un étudiant à {selectedClass?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Prénom *</Label>
              <Input value={newStudent.firstName} onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })} placeholder="Jean" />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={newStudent.lastName} onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })} placeholder="Dupont" />
            </div>
            <div>
              <Label>Date de naissance (JJ/MM/AAAA) *</Label>
              <Input value={newStudent.dateOfBirth} onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })} placeholder="15/03/2010" />
            </div>
            <div>
              <Label>Genre *</Label>
              <Select value={newStudent.gender} onValueChange={(v) => setNewStudent({ ...newStudent, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contact parent (optionnel)</Label>
              <Input value={newStudent.parentContact} onChange={(e) => setNewStudent({ ...newStudent, parentContact: e.target.value })} placeholder="06..." />
            </div>
            <div>
              <Label>Massar (optionnel)</Label>
              <Input value={newStudent.massar} onChange={(e) => setNewStudent({ ...newStudent, massar: e.target.value })} placeholder="Massar de l'étudiant" />
            </div>

            {generatedCredentials && (
              <Card className="p-4 bg-green-50 border-green-200">
                <p className="text-sm font-semibold mb-2">Identifiants générés :</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Email :</span>
                    <div className="flex items-center gap-1">
                      <code className="bg-white px-2 py-1 rounded">{generatedCredentials.email}</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generatedCredentials.email)}><Copy className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mot de passe :</span>
                    <div className="flex items-center gap-1">
                      <code className="bg-white px-2 py-1 rounded">{generatedCredentials.password}</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generatedCredentials.password)}><Copy className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddStudent} className="flex-1">
                Ajouter l'étudiant
              </Button>
              <Button variant="outline" onClick={() => { setIsStudentDialogOpen(false); setGeneratedCredentials(null); }}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}