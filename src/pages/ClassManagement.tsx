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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Class {
  id: string;
  name: string;
  level: string;
  filiere: string | null;
  annee_scolaire: string;
  effectif: number;
  school_id: string;
}

export default function ClassManagement() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    filiere: "",
    annee_scolaire: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    effectif: 0,
  });

  useEffect(() => {
    checkAuth();
    loadClasses();
  }, [schoolId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate(`/school/${schoolId}/login`);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)
        .order("level", { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des classes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClass) {
        const { error } = await supabase
          .from("classes")
          .update(formData)
          .eq("id", editingClass.id);

        if (error) throw error;
        toast.success("Classe modifiée avec succès");
      } else {
        const { error } = await supabase
          .from("classes")
          .insert([{ ...formData, school_id: schoolId }]);

        if (error) throw error;
        toast.success("Classe créée avec succès");
      }

      setIsDialogOpen(false);
      resetForm();
      loadClasses();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      level: classItem.level,
      filiere: classItem.filiere || "",
      annee_scolaire: classItem.annee_scolaire,
      effectif: classItem.effectif,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette classe ?")) return;

    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Classe supprimée");
      loadClasses();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: "",
      filiere: "",
      annee_scolaire: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      effectif: 0,
    });
    setEditingClass(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Classes</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les classes et leurs effectifs
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
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
                <Label htmlFor="filiere">Filière (optionnel)</Label>
                <Input
                  id="filiere"
                  value={formData.filiere}
                  onChange={(e) =>
                    setFormData({ ...formData, filiere: e.target.value })
                  }
                  placeholder="Sciences, Lettres..."
                />
              </div>
              <div>
                <Label htmlFor="annee">Année scolaire</Label>
                <Input
                  id="annee"
                  value={formData.annee_scolaire}
                  onChange={(e) =>
                    setFormData({ ...formData, annee_scolaire: e.target.value })
                  }
                  placeholder="2024-2025"
                  required
                />
              </div>
              <div>
                <Label htmlFor="effectif">Effectif</Label>
                <Input
                  id="effectif"
                  type="number"
                  min="0"
                  value={formData.effectif}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      effectif: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingClass ? "Modifier" : "Créer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
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
              <TableHead>Filière</TableHead>
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
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucune classe enregistrée
                </TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">{classItem.name}</TableCell>
                  <TableCell>{classItem.level}</TableCell>
                  <TableCell>{classItem.filiere || "-"}</TableCell>
                  <TableCell>{classItem.annee_scolaire}</TableCell>
                  <TableCell>{classItem.effectif}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
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
    </div>
  );
}
