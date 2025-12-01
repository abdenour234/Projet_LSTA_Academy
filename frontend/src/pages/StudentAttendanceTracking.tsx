import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Filter, TrendingUp, CheckCircle, XCircle, Edit2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Class {
  id: string;
  name: string;
  level: string;
}

interface StudentAttendanceStats {
  studentId: string;
  studentName: string;
  totalAbsences: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  eventDate: string;
  reason: string;
  isJustified: boolean;
  teacherNotes: string;
  createdAt: string;
}

export default function StudentAttendanceTracking() {
  const { id: schoolId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [stats, setStats] = useState<StudentAttendanceStats[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const teacherId = localStorage.getItem('userId');

  // Charger les classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!schoolId || !teacherId) return;

      try {
        setLoading(true);
        const classes = await api.get<Class[]>(`/api/student-attendance/classes/${schoolId}/${teacherId}`);
        setClasses(classes);
      } catch (error) {
        console.error('Erreur lors du chargement des classes:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les classes',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [schoolId, teacherId]);

  // Charger les statistiques et les enregistrements
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass || !schoolId || !teacherId) return;

      try {
        setLoading(true);

        // Charger les statistiques
        const stats = await api.get<StudentAttendanceStats[]>(
          `/api/student-attendance/stats/${schoolId}/${teacherId}/${selectedClass}`
        );
        setStats(stats);

        // Charger les enregistrements
        const records = await api.get<AttendanceRecord[]>(
          `/api/student-attendance/${schoolId}/${teacherId}/${selectedClass}?startDate=${startDate}&endDate=${endDate}`
        );
        setRecords(records);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClass, schoolId, teacherId, startDate, endDate]);

  const handleEditJustification = (record: AttendanceRecord) => {
    setEditingRecord({ ...record });
    setShowEditDialog(true);
  };

  const saveJustificationUpdate = async () => {
    if (!editingRecord || !teacherId) return;

    try {
      await api.patch(
        `/api/student-attendance/${editingRecord.id}/justification/${teacherId}?isJustified=${editingRecord.isJustified}&teacherNotes=${encodeURIComponent(editingRecord.teacherNotes || '')}`
      );

      toast({
        title: 'Succès',
        description: 'Justification mise à jour',
      });

      setShowEditDialog(false);
      setEditingRecord(null);

      // Recharger les données
      const records = await api.get<AttendanceRecord[]>(
        `/api/student-attendance/${schoolId}/${teacherId}/${selectedClass}?startDate=${startDate}&endDate=${endDate}`
      );
      setRecords(records);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour',
        variant: 'destructive',
      });
    }
  };

  const totalAbsences = stats.reduce((sum, s) => sum + s.totalAbsences, 0);
  const totalJustified = stats.reduce((sum, s) => sum + s.justifiedAbsences, 0);
  const totalUnjustified = stats.reduce((sum, s) => sum + s.unjustifiedAbsences, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Suivi des Absences Étudiants</h1>
              <p className="text-gray-600">Consultez et gérez les absences</p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class-select">Classe</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class-select">
                    <SelectValue placeholder="Sélectionnez une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Date de début</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">Date de fin</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        {selectedClass && stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAbsences}</div>
                <p className="text-xs text-muted-foreground">Toutes les absences enregistrées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Justifiées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalJustified}</div>
                <p className="text-xs text-muted-foreground">
                  {totalAbsences > 0 ? Math.round((totalJustified / totalAbsences) * 100) : 0}% du total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Non Justifiées</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totalUnjustified}</div>
                <p className="text-xs text-muted-foreground">
                  {totalAbsences > 0 ? Math.round((totalUnjustified / totalAbsences) * 100) : 0}% du total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tableau des statistiques par étudiant */}
        {selectedClass && stats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Statistiques par Étudiant</CardTitle>
              <CardDescription>Résumé des absences par étudiant</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Étudiant</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Justifiées</TableHead>
                    <TableHead className="text-center">Non Justifiées</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.studentId}>
                      <TableCell className="font-medium">{stat.studentName}</TableCell>
                      <TableCell className="text-center">{stat.totalAbsences}</TableCell>
                      <TableCell className="text-center text-green-600">{stat.justifiedAbsences}</TableCell>
                      <TableCell className="text-center text-red-600">{stat.unjustifiedAbsences}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Tableau des enregistrements détaillés */}
        {selectedClass && records.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des Absences</CardTitle>
              <CardDescription>Liste détaillée de toutes les absences</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Justifiée</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.eventDate).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.reason || '-'}</TableCell>
                      <TableCell>
                        {record.isJustified ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Oui
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            Non
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{record.teacherNotes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditJustification(record)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedClass && records.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune absence enregistrée pour cette période</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog d'édition */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la Justification</DialogTitle>
            <DialogDescription>
              Modifiez le statut et les notes pour {editingRecord?.studentName}
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="justified-switch"
                  checked={editingRecord.isJustified}
                  onCheckedChange={(checked) =>
                    setEditingRecord({ ...editingRecord, isJustified: checked })
                  }
                />
                <Label htmlFor="justified-switch">Absence justifiée</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingRecord.teacherNotes}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, teacherNotes: e.target.value })
                  }
                  placeholder="Remarques supplémentaires..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveJustificationUpdate}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
