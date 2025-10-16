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
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

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

    if (!formData.class_id) {
      toast.error("Veuillez sélectionner une classe");
      return;
    }

    try {
      const activitiesList = Array.from(selectedActivities);
      const { error } = await supabase.from("teaching_sessions").insert([
        {
          ...formData,
          activities_realized: activitiesList,
          teacher_id: userId,
          school_id: schoolId,
        },
      ]);

      if (error) throw error;

      toast.success("Séance validée avec succès ✅");
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const toggleActivity = (activityTitle: string) => {
    setSelectedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityTitle)) {
        newSet.delete(activityTitle);
      } else {
        newSet.add(activityTitle);
      }
      return newSet;
    });
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
    setSelectedActivities(new Set());
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">📝 Enregistrement rapide de séance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class">Classe *</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, class_id: value })
                    }
                  >
                    <SelectTrigger className="bg-card">
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
                <div>
                  <Label htmlFor="date">Date (auto-détectée)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.session_date}
                    onChange={(e) =>
                      setFormData({ ...formData, session_date: e.target.value })
                    }
                    className="bg-card"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-lg mb-3 block">✅ Activités réalisées (cochez)</Label>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 bg-muted/30 rounded-lg">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-smooth ${
                        selectedActivities.has(activity.title)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                      onClick={() => toggleActivity(activity.title)}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedActivities.has(activity.title)
                            ? "bg-primary border-primary"
                            : "border-border"
                        }`}
                      >
                        {selectedActivities.has(activity.title) && (
                          <span className="text-primary-foreground text-xs">✓</span>
                        )}
                      </div>
                      <span className="text-sm font-medium flex-1">
                        {activity.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          activity.type === "Orale"
                            ? "bg-orale/10 text-orale"
                            : activity.type === "Lecture"
                            ? "bg-lecture/10 text-lecture"
                            : "bg-ecriture/10 text-ecriture"
                        }`}
                      >
                        {activity.type}
                      </span>
                    </div>
                  ))}
                </div>
                {selectedActivities.size > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedActivities.size} activité(s) sélectionnée(s)
                  </p>
                )}
              </div>

              <div className="p-4 bg-accent/5 rounded-lg">
                <Label htmlFor="percentage" className="text-base mb-3 block">
                  📊 Progression des élèves: <span className="font-bold text-accent">{formData.percentage_acquired}%</span>
                </Label>
                <div className="relative">
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
                    className="w-full h-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="remarks">💭 Remarques pédagogiques</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  placeholder="Observations, difficultés rencontrées, points à améliorer..."
                  rows={3}
                  className="bg-card"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 h-12 text-lg font-semibold"
                  disabled={selectedActivities.size === 0 || !formData.class_id}
                >
                  ✅ Valider la séance
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-12"
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
