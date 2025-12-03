import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Plus, Calendar, ArrowLeft, LogOut, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  auth,
  classSubjectApi,
  sessionApi,
  authApi,
  classApi,
  teacherActivityApi, // CELLE-CI EST LA CLÉ
} from "@/lib/api";

interface Class {
  id: string;
  name: string;
}

interface Activity {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  nature: string;
  approvalStatus?: string;
}

interface Session {
  id: string;
  classId: string;
  className: string;
  sessionDate: string;
  notes: string;
  percentageAcquired: number;
  activityId: string | null;
}

export default function TeacherSessions() {
  const { id: schoolId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<Class[]>([]);
  const [allMyActivities, setAllMyActivities] = useState<Activity[]>([]); // Toutes les activités du prof
  const [formActivities, setFormActivities] = useState<Activity[]>([]);   // Pour le formulaire
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    class_id: "",
    activity_id: "",
    session_date: new Date().toISOString().split("T")[0],
    percentage_acquired: 50,
    remarks: "",
  });

  // Récupérer le teacherId
  useEffect(() => {
    const init = async () => {
      const user = auth.getUser();
      if (!user) {
        navigate(`/school/${schoolId}/login`);
        return;
      }
      const teacherId =
        user.teacherId ||
        user.profile_id ||
        user.teacher_id ||
        (user.teacher && user.teacher.id) ||
        user.id;
      if (!teacherId) {
        toast.error("Profil enseignant non reconnu");
        navigate(`/school/${schoolId}/login`);
        return;
      }
      setUserId(teacherId);
    };
    init();
  }, [schoolId, navigate]);

  // Chargement principal : classes + toutes mes activités + séances
  useEffect(() => {
    if (!userId || !schoolId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Classes du prof
        const assignments = await classSubjectApi.getClassesForTeacher(userId);
        const classIds = [...new Set(assignments.map((a: any) => a.classId))];
        let teacherClasses: Class[] = [];
        if (classIds.length > 0) {
          const allClasses = await classApi.getBySchoolId(schoolId);
          teacherClasses = allClasses
            .filter((c: any) => classIds.includes(c.id))
            .map((c: any) => ({ id: c.id, name: c.name }));
        }
        setClasses(teacherClasses);

        // 2. Toutes MES activités (comme dans le dashboard) → 1 seul appel
        const myActivities = await teacherActivityApi.getMyActivities();
        setAllMyActivities(myActivities || []);

        // 3. Séances du prof
        const sessionsData = await sessionApi.getByTeacherId(userId);
        const enriched = (sessionsData || []).map((s: any) => {
          const className = teacherClasses.find(c => c.id === s.classId)?.name || "Classe inconnue";
          return {
            id: s.id,
            classId: s.classId,
            className,
            sessionDate: s.sessionDate,
            notes: s.notes || "",
            percentageAcquired: s.percentageAcquired || 0,
            activityId: s.activityId,
          };
        });
        setSessions(enriched);

      } catch (error: any) {
        toast.error("Erreur de chargement");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, schoolId]);

  // Quand on change de classe → on filtre les activités "Classe" du prof pour cette classe
  useEffect(() => {
  if (!formData.class_id) {
    setFormActivities([]);
    return;
  }

  const selectedClass = classes.find(c => c.id === formData.class_id);
  if (!selectedClass) {
    setFormActivities([]);
    return;
  }

  const filtered = allMyActivities.filter((act: any) => {
    // On compare par le NOM de la classe (puisque classId est undefined)
    return act.className === selectedClass.name &&
           act.nature === "Classe" &&
           act.isPublished === true;
  });

  console.log("Classe sélectionnée :", selectedClass.name);
  console.log("Activités filtrées par nom :", filtered.map(a => a.title));

  setFormActivities(filtered);
}, [formData.class_id, allMyActivities, classes]);

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.activity_id) {
      toast.error("Veuillez sélectionner une classe et une activité");
      return;
    }

    try {
      await sessionApi.create({
        schoolId: Number(schoolId),
        teacherId: userId,
        classId: formData.class_id,
        activityId: formData.activity_id,
        sessionDate: formData.session_date,
        subject: "Français",
        notes: formData.remarks,
        percentageAcquired: formData.percentage_acquired,
      });

      toast.success("Séance enregistrée !");
      setIsDialogOpen(false);
      setFormData({
        ...formData,
        activity_id: "",
        remarks: "",
        percentage_acquired: 50,
      });

      // Recharger les séances
      const fresh = await sessionApi.getByTeacherId(userId);
      const enriched = fresh.map((s: any) => {
        const className = classes.find(c => c.id === s.classId)?.name || "Classe inconnue";
        return { ...s, className };
      });
      setSessions(enriched);

    } catch (error: any) {
      toast.error(error.message || "Erreur d'enregistrement");
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Supprimer cette séance ? Cette action est irréversible.")) return;
    try {
      await sessionApi.delete(sessionId);
      toast.success("Séance supprimée");
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      toast.error("Impossible de supprimer la séance");
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    navigate(`/school/${schoolId}/login`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <header className="h-16 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/school/${schoolId}/teacher/dashboard`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-base font-semibold text-blue-600">Suivi des Séances</h1>
              <p className="text-xs text-blue-500">Enregistrez vos séances réalisées en classe</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Nouvelle Séance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl text-blue-600">Nouvelle séance réalisée</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Classe *</Label>
                    <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v, activity_id: "" })}>
                      <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date de la séance</Label>
                    <Input type="date" value={formData.session_date} onChange={(e) => setFormData({ ...formData, session_date: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label>Activité réalisée *</Label>
                  <Select value={formData.activity_id} onValueChange={(v) => setFormData({ ...formData, activity_id: v })} disabled={!formData.class_id}>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.class_id ? "Choisir l'activité" : "Sélectionnez d'abord une classe"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formActivities.length === 0 ? (
                        <SelectItem value="none" disabled>Aucune activité "en classe" disponible</SelectItem>
                      ) : (
                        formActivities.map((act) => (
                          <SelectItem key={act.id} value={act.id}>{act.title}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg">
                  <Label>Progression estimée : <strong className="text-emerald-700">{formData.percentage_acquired}%</strong></Label>
                  <Input type="range" min="0" max="100" step="5" value={formData.percentage_acquired}
                    onChange={(e) => setFormData({ ...formData, percentage_acquired: Number(e.target.value) })} className="mt-2" />
                </div>

                <div>
                  <Label>Remarques (facultatif)</Label>
                  <Textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Observations sur la séance..." rows={3} />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={!formData.class_id || !formData.activity_id}>
                    Enregistrer la séance
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des séances */}
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-4 text-blue-600">Chargement...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">
            Aucune séance enregistrée.<br />Commencez par en créer une !
          </Card>
        ) : (
          <div className="grid gap-6">
            {sessions.map((s) => {
              const activity = allMyActivities.find(a => a.id === s.activityId);
              const activityTitle = activity?.title || "Activité réalisée";

              return (
                <Card key={s.id} className="p-6 hover:shadow-lg transition-all duration-200 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blue-800">{s.className}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(s.sessionDate).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-emerald-600">{s.percentageAcquired}%</div>
                      <div className="text-sm text-gray-500">acquis</div>
                    </div>
                  </div>

                  {s.activityId && (
                    <div className="mt-5">
                      <p className="font-medium text-gray-700 text-sm">Activité réalisée :</p>
                      <span className="inline-block mt-2 px-5 py-2.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded-full text-sm font-semibold shadow-sm">
                        {activityTitle}
                      </span>
                    </div>
                  )}

                  {s.notes && (
                    <div className="mt-5 p-4 bg-gray-50 rounded-lg text-sm italic text-gray-700 border-l-4 border-blue-300">
                      {s.notes}
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <Button variant="destructive" size="sm" className="flex items-center gap-2" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}