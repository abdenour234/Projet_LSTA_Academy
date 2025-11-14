import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { teacherManagementApi, subjectApi } from '@/lib/api';
import { Teacher, TeacherDTO, Subject } from '@/types/school';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * TeacherManagement Component
 * Allows admins to manage teachers with their specialties
 */
export default function TeacherManagement() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<TeacherDTO>({
    profileId: '',
    schoolId: Number(user?.schoolId) || 0,
    specialty: '',
    phoneNumber: '',
    isActive: true,
  });

  useEffect(() => {
    if (user?.schoolId) {
      loadData();
    }
  }, [user?.schoolId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const schoolId = Number(user!.schoolId);
      const [teachersData, subjectsData] = await Promise.all([
        teacherManagementApi.getBySchoolId(schoolId, undefined, false),
        subjectApi.getBySchoolId(schoolId, true), // Only active subjects
      ]);

      // Teachers from API already include profile data
      setTeachers(teachersData);
      setSubjects(subjectsData);
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

  const handleOpenDialog = (teacher?: any) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        profileId: teacher.profileId,
        schoolId: teacher.schoolId,
        specialty: teacher.specialty,
        phoneNumber: teacher.phoneNumber || '',
        isActive: teacher.isActive,
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        profileId: '',
        schoolId: Number(user!.schoolId),
        specialty: '',
        phoneNumber: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTeacher(null);
    setFormData({
      profileId: '',
      schoolId: Number(user!.schoolId),
      specialty: '',
      phoneNumber: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTeacher) {
        await teacherManagementApi.update(editingTeacher.id, formData);
        toast({
          title: 'Succès',
          description: 'Enseignant mis à jour avec succès',
        });
      } else {
        await teacherManagementApi.create(formData);
        toast({
          title: 'Succès',
          description: 'Enseignant créé avec succès',
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

  const handleToggleStatus = async (teacher: Teacher) => {
    try {
      await teacherManagementApi.toggleStatus(teacher.id);
      toast({
        title: 'Succès',
        description: `Enseignant ${teacher.isActive ? 'désactivé' : 'activé'} avec succès`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      return;
    }

    try {
      await teacherManagementApi.delete(id);
      toast({
        title: 'Succès',
        description: 'Enseignant supprimé avec succès',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'enseignant',
        variant: 'destructive',
      });
    }
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
            Gérez les enseignants et leurs spécialités
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Enseignant
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Spécialité</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun enseignant trouvé. Créez-en un pour commencer.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {teacher.profile?.fullName || 'N/A'}
                    </div>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(teacher)}
                        title={teacher.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {teacher.isActive ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(teacher)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(teacher.id)}
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTeacher ? 'Modifier l\'Enseignant' : 'Nouvel Enseignant'}
            </DialogTitle>
            <DialogDescription>
              {editingTeacher
                ? 'Modifiez les informations de l\'enseignant'
                : 'Ajoutez un nouvel enseignant avec sa spécialité'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="profileId">ID du Profil Utilisateur *</Label>
                <Input
                  id="profileId"
                  value={formData.profileId}
                  onChange={(e) =>
                    setFormData({ ...formData, profileId: e.target.value })
                  }
                  disabled={!!editingTeacher}
                  placeholder="Entrez l'ID du profil (UUID)"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  L'ID du profil utilisateur à associer à cet enseignant
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Spécialité *</Label>
                {subjects.length > 0 ? (
                  <Select
                    value={formData.specialty}
                    onValueChange={(value) =>
                      setFormData({ ...formData, specialty: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une spécialité" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Input
                      id="specialty"
                      placeholder="Ex: Mathématiques, Physique..."
                      value={formData.specialty}
                      onChange={(e) =>
                        setFormData({ ...formData, specialty: e.target.value })
                      }
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Aucune matière disponible. Vous pouvez saisir une spécialité personnalisée.
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ex: 0612345678"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">
                {editingTeacher ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
