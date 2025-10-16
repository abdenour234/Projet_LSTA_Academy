import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Class {
  id: string;
  name: string;
}

export default function TeacherSessions() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    class_id: "",
    session_date: new Date().toISOString().split("T")[0],
    duration_minutes: 60,
    activities_realized: [] as string[],
    percentage_acquired: 50,
    remarks: "",
  });

  useEffect(() => {
    checkAuth();
    loadData();
  }, [schoolId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate(`/school/${schoolId}/login`);
      return;
    }
    setUserId(user.id);
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load teacher's classes
      const { data: teacherClassesData, error: tcError } = await supabase
        .from("teacher_classes")
        .select("class_id, classes(id, name)")
        .eq("teacher_id", user.id);

      if (tcError) throw tcError;

      const classesData = teacherClassesData?.map((tc: any) => ({
        id: tc.classes.id,
        name: tc.classes.name,
      })) || [];
      setClasses(classesData);

      // Load activities
      const { data: activitiesData, error: actError } = await supabase
        .from("activities")
        .select("id, title")
        .eq("school_id", schoolId)
        .eq("is_published", true);

      if (actError) throw actError;
      setActivities(activitiesData || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement");
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("teaching_sessions").insert([
        {
          ...formData,
          teacher_id: userId,
          school_id: schoolId,
        },
      ]);

      if (error) throw error;

      toast.success("Séance enregistrée avec succès");
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      class_id: "",
      session_date: new Date().toISOString().split("T")[0],
      duration_minutes: 60,
      activities_realized: [],
      percentage_acquired: 50,
      remarks: "",
    });
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Suivi des Séances</h1>
          <p className="text-muted-foreground mt-2">
            Enregistrez vos séances et la progression des élèves
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Séance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enregistrer une séance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="class">Classe</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, class_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.session_date}
                    onChange={(e) =>
                      setFormData({ ...formData, session_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Durée (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="activities">Activités réalisées</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (!formData.activities_realized.includes(value)) {
                      setFormData({
                        ...formData,
                        activities_realized: [
                          ...formData.activities_realized,
                          value,
                        ],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ajouter une activité" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((a) => (
                      <SelectItem key={a.id} value={a.title}>
                        {a.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.activities_realized.map((activity, index) => (
                    <span
                      key={index}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {activity}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            activities_realized:
                              formData.activities_realized.filter(
                                (_, i) => i !== index
                              ),
                          })
                        }
                        className="text-primary hover:text-primary/80"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="percentage">
                  Pourcentage d'élèves ayant acquis: {formData.percentage_acquired}%
                </Label>
                <Input
                  id="percentage"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.percentage_acquired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      percentage_acquired: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="remarks">Remarques pédagogiques</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  placeholder="Observations, difficultés rencontrées, points à améliorer..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Enregistrer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Cliquez sur "Nouvelle Séance" pour enregistrer votre travail
        </p>
      </Card>
    </div>
  );
}
