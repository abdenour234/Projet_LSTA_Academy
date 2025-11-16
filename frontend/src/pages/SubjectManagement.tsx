import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subjectApi } from '@/lib/api';
import { Subject, SubjectDTO } from '@/types/school';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * SubjectManagement Component
 * Allows admins to manage school subjects
 */
export default function SubjectManagement() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectDTO>({
    schoolId: user?.schoolId || 0,
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (user?.schoolId) {
      loadSubjects();
    }
  }, [user?.schoolId]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectApi.getBySchoolId(user!.schoolId, false);
      setSubjects(data);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les matières',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        schoolId: subject.schoolId,
        name: subject.name,
        description: subject.description || '',
        isActive: subject.isActive,
      });
    } else {
      setEditingSubject(null);
      setFormData({
        schoolId: user!.schoolId,
        name: '',
        description: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSubject(null);
    setFormData({
      schoolId: user!.schoolId,
      name: '',
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubject) {
        await subjectApi.update(editingSubject.id, formData);
        toast({
          title: 'Succès',
          description: 'Matière mise à jour avec succès',
        });
      } else {
        await subjectApi.create(formData);
        toast({
          title: 'Succès',
          description: 'Matière créée avec succès',
        });
      }
      handleCloseDialog();
      loadSubjects();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (subject: Subject) => {
    try {
      await subjectApi.toggleStatus(subject.id);
      toast({
        title: 'Succès',
        description: `Matière ${subject.isActive ? 'désactivée' : 'activée'} avec succès`,
      });
      loadSubjects();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
      return;
    }

    try {
      await subjectApi.delete(id);
      toast({
        title: 'Succès',
        description: 'Matière supprimée avec succès',
      });
      loadSubjects();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la matière',
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
          <h1 className="text-3xl font-bold">Gestion des Matières</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les matières enseignées dans votre établissement
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Matière
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Aucune matière trouvée. Créez-en une pour commencer.
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate">
                    {subject.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subject.isActive ? 'default' : 'secondary'}>
                      {subject.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(subject)}
                        title={subject.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {subject.isActive ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(subject)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subject.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Modifier la Matière' : 'Nouvelle Matière'}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? 'Modifiez les informations de la matière'
                : 'Ajoutez une nouvelle matière à votre établissement'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la Matière *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Mathématiques, Physique, Français..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description de la matière (optionnel)"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">
                {editingSubject ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
