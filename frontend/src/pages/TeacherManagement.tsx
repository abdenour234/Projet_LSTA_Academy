import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Mail, Phone, Key, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authApi, teacherManagementApi, subjectApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface Teacher {
  id: string;
  profile?: {
    fullName: string;
    email: string;
  };
  specialty: string;
  phoneNumber?: string;
  isActive: boolean;
}

interface Subject {
  id: string;
  name: string;
}

export default function TeacherManagement() {
  const { id: schoolId } = useParams();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    full_name: '',
    matiere: '',
    phone: '',
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    try {
      if (!schoolId) return;
      setLoading(true);
      
      const [teachersData, subjectsData] = await Promise.all([
        teacherManagementApi.getBySchoolId(Number(schoolId), undefined, false),
        subjectApi.getBySchoolId(Number(schoolId), true),
      ]);

      setTeachers(teachersData);
      setSubjects(subjectsData);
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
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateEmail = (fullName: string) => {
    const namePart = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '')
      .split(' ')
      .filter((w) => w)
      .join('.');
    const randomNum = Math.floor(Math.random() * 1000);
    return `${namePart}.${randomNum}@school${schoolId}.com`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copié',
      description: 'Copié dans le presse-papiers',
    });
  };

  const handleAddTeacher = async () => {
    if (!schoolId) return;

    // Generate email and password
    const email = generateEmail(newTeacher.full_name);
    const password = generatePassword();

    try {
      // Step 1: Create user account with registerByAdmin
      const registerResponse = await authApi.registerByAdmin({
        email,
        password,
        fullName: newTeacher.full_name,
        role: 'TEACHER',
        schoolId: Number(schoolId),
        phone: newTeacher.phone || undefined,
      });

      // Step 2: Create teacher entity with the profile ID
      await teacherManagementApi.create({
        profileId: registerResponse.userId,
        schoolId: Number(schoolId),
        specialty: newTeacher.matiere,
        phoneNumber: newTeacher.phone || '',
        isActive: true,
      });

      setGeneratedCredentials({ email, password });
      setNewTeacher({ full_name: '', matiere: '', phone: '' });
      
      toast({
        title: 'Succès',
        description: 'Enseignant créé avec succès',
      });

      loadData();
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création de l\'enseignant',
        variant: 'destructive',
      });
    }
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
    setNewTeacher({ full_name: '', matiere: '', phone: '' });
    setGeneratedCredentials(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Enseignants</h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez les enseignants de votre établissement
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} disabled={subjects.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Enseignant
        </Button>
      </div>

      {subjects.length === 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800">
            Veuillez d'abord créer des matières dans la section "Gestion des Matières" avant d'ajouter des enseignants.
          </p>
        </div>
      )}

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom Complet</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Matière (Spécialité)</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucun enseignant. Cliquez sur "Nouvel Enseignant" pour commencer.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">
                    {teacher.profile?.fullName || 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {teacher.profile?.email || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{teacher.specialty}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {teacher.phoneNumber || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.isActive ? 'default' : 'secondary'}>
                      {teacher.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {generatedCredentials ? 'Identifiants Générés' : 'Nouvel Enseignant'}
            </DialogTitle>
            <DialogDescription>
              {generatedCredentials
                ? 'Communiquez ces identifiants à l\'enseignant'
                : 'Ajoutez un nouvel enseignant avec sa spécialité'}
            </DialogDescription>
          </DialogHeader>

          {!generatedCredentials ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom Complet *</Label>
                <Input
                  id="full_name"
                  placeholder="Ex: Jean Dupont"
                  value={newTeacher.full_name}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="matiere">Spécialité (Matière) *</Label>
                <Select
                  value={newTeacher.matiere}
                  onValueChange={(value) =>
                    setNewTeacher({ ...newTeacher, matiere: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ex: 0612345678"
                  value={newTeacher.phone}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, phone: e.target.value })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Email:</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedCredentials.email)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm font-mono break-all">{generatedCredentials.email}</p>
              </div>

              <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Mot de passe:</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedCredentials.password)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm font-mono">{generatedCredentials.password}</p>
              </div>

              <p className="text-sm text-amber-600">
                ⚠️ Conservez ces identifiants en lieu sûr. Ils ne seront plus affichés.
              </p>
            </div>
          )}

          <DialogFooter>
            {!generatedCredentials ? (
              <>
                <Button type="button" variant="outline" onClick={handleCloseAddDialog}>
                  Annuler
                </Button>
                <Button
                  onClick={handleAddTeacher}
                  disabled={
                    !newTeacher.full_name || !newTeacher.matiere || subjects.length === 0
                  }
                >
                  Créer
                </Button>
              </>
            ) : (
              <Button onClick={handleCloseAddDialog}>Fermer</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
