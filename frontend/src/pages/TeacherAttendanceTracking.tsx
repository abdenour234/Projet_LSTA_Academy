import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarOff, Clock, Filter, BarChart3, PieChart } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Teacher {
  id: string;
  full_name: string;
  matiere: string;
}

interface AttendanceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherSpecialty: string;
  type: "ABSENCE" | "RETARD";
  eventDate: string;
  classId?: string;
  className?: string;
  reason?: string;
  isJustified: boolean;
  durationMinutes?: number;
  adminNotes?: string;
}

interface TeacherStats {
  teacherId: string;
  teacherName: string;
  teacherSpecialty: string;
  totalAbsences: number;
  totalRetards: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  justifiedRetards: number;
  unjustifiedRetards: number;
  monthlyStats: Array<{
    month: string;
    absences: number;
    retards: number;
  }>;
}

const COLORS = {
  absence: "#ef4444",
  retard: "#f59e0b",
  justified: "#10b981",
  unjustified: "#ef4444",
};

export default function TeacherAttendanceTracking() {
  const { id: schoolId } = useParams();
  const [searchParams] = useSearchParams();
  const teacherIdParam = searchParams.get("teacherId");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState({
    teacherId: "",
    type: "ABSENCE" as "ABSENCE" | "RETARD",
    eventDate: new Date().toISOString().split("T")[0],
    reason: "",
    isJustified: false,
    durationMinutes: 0,
    adminNotes: "",
  });

  useEffect(() => {
    loadData();
  }, [schoolId]);

  // Pre-select teacher from URL parameter
  useEffect(() => {
    if (teacherIdParam && teachers.length > 0) {
      setSelectedTeacher(teacherIdParam);
      setFormData(prev => ({ ...prev, teacherId: teacherIdParam }));
    }
  }, [teacherIdParam, teachers]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load teachers (using Supabase for now, will migrate to backend API)
      const teachersResponse = await fetch(`/api/teachers/school/${schoolId}`);
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData);
      }

      // Load attendance records
      await loadAttendanceRecords();
      
      // Load statistics
      await loadStatistics();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      let url = `/api/teacher-attendance/school/${schoolId}`;
      
      if (startDate && endDate) {
        url += `/range?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.error("Error loading attendance records:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(`/api/teacher-attendance/school/${schoolId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setTeacherStats(data);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teacherId || !formData.eventDate) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const response = await fetch(
        `/api/teacher-attendance?schoolId=${schoolId}&recordedBy=${getCurrentUserId()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast.success(
          `${formData.type === "ABSENCE" ? "Absence" : "Retard"} enregistré(e) avec succès`
        );
        setIsAddDialogOpen(false);
        setFormData({
          teacherId: "",
          type: "ABSENCE",
          eventDate: new Date().toISOString().split("T")[0],
          reason: "",
          isJustified: false,
          durationMinutes: 0,
          adminNotes: "",
        });
        await loadData();
      } else {
        const error = await response.text();
        toast.error(error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error creating attendance:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const getCurrentUserId = (): string => {
    // TODO: Get from auth context
    return "current-user-id";
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    if (selectedTeacher !== "all" && record.teacherId !== selectedTeacher) return false;
    if (selectedType !== "all" && record.type !== selectedType) return false;
    return true;
  });

  const prepareChartData = () => {
    return teacherStats.map((stat) => ({
      name: stat.teacherName,
      absences: stat.totalAbsences,
      retards: stat.totalRetards,
    }));
  };

  const preparePieData = () => {
    const totalAbsences = teacherStats.reduce((sum, s) => sum + s.totalAbsences, 0);
    const totalRetards = teacherStats.reduce((sum, s) => sum + s.totalRetards, 0);
    return [
      { name: "Absences", value: totalAbsences },
      { name: "Retards", value: totalRetards },
    ];
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Suivi des Absences et Retards</h1>
        <p className="text-muted-foreground">
          Gérez et visualisez les absences et retards des enseignants
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Enregistrer Absence/Retard
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enregistrer une Absence ou un Retard</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Enseignant *</Label>
                  <Select
                    value={formData.teacherId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, teacherId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un enseignant" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.full_name} - {teacher.matiere}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "ABSENCE" | "RETARD") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ABSENCE">Absence</SelectItem>
                      <SelectItem value="RETARD">Retard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                  />
                </div>
                {formData.type === "RETARD" && (
                  <div>
                    <Label>Durée (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationMinutes: parseInt(e.target.value),
                        })
                      }
                      placeholder="Ex: 15"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Motif/Raison</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Expliquez la raison..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isJustified}
                  onChange={(e) =>
                    setFormData({ ...formData, isJustified: e.target.checked })
                  }
                  id="justified"
                  className="rounded"
                />
                <Label htmlFor="justified">Justifié(e)</Label>
              </div>

              <div>
                <Label>Notes administrateur</Label>
                <Textarea
                  value={formData.adminNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, adminNotes: e.target.value })
                  }
                  placeholder="Notes internes..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Enregistrer</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => setShowCharts(!showCharts)}>
          {showCharts ? <BarChart3 className="w-4 h-4 mr-2" /> : <PieChart className="w-4 h-4 mr-2" />}
          {showCharts ? "Voir Tableau" : "Voir Graphiques"}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 grid grid-cols-4 gap-4">
            <div>
              <Label>Enseignant</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="ABSENCE">Absences</SelectItem>
                  <SelectItem value="RETARD">Retards</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Date fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={loadAttendanceRecords}>Appliquer</Button>
        </div>
      </Card>

      {showCharts ? (
        /* Charts View */
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Absences et Retards par Enseignant</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="absences" fill={COLORS.absence} name="Absences" />
                <Bar dataKey="retards" fill={COLORS.retard} name="Retards" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Répartition Globale</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={preparePieData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {preparePieData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? COLORS.absence : COLORS.retard}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Statistiques Résumées</h2>
              <div className="space-y-4">
                {teacherStats.slice(0, 5).map((stat) => (
                  <div key={stat.teacherId} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{stat.teacherName}</p>
                      <p className="text-sm text-muted-foreground">{stat.teacherSpecialty}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-red-500">{stat.totalAbsences}</p>
                        <p className="text-muted-foreground">Absences</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-orange-500">{stat.totalRetards}</p>
                        <p className="text-muted-foreground">Retards</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tableau Récapitulatif</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead className="text-center">Absences</TableHead>
                  <TableHead className="text-center">Retards</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherStats.map((stat) => (
                  <TableRow key={stat.teacherId}>
                    <TableCell className="font-medium">{stat.teacherName}</TableCell>
                    <TableCell>{stat.teacherSpecialty}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{stat.totalAbsences}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-orange-500">{stat.totalRetards}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {stat.totalAbsences + stat.totalRetards}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Historique Récent</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.slice(0, 20).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.eventDate).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.teacherName}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.teacherSpecialty}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.type === "ABSENCE" ? (
                        <Badge variant="destructive">
                          <CalendarOff className="w-3 h-3 mr-1" />
                          Absence
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Retard ({record.durationMinutes}min)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.reason || "-"}
                    </TableCell>
                    <TableCell>
                      {record.isJustified ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Justifié
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          Non justifié
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
