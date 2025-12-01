import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, XCircle, Save, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import api from '@/lib/api';


interface Class {
  id: string;
  name: string;
  level: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface AbsentStudent {
  studentId: string;
  name: string;
  reason: string;
  isJustified: boolean;
  teacherNotes: string;
}

export default function StudentAttendanceMarking() {
  const { id: schoolId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  

// Récupérer le teacherId avec fallback sur userId si le rôle est TEACHER
  const teacherId = (() => {
    const storedTeacherId = localStorage.getItem('teacherId');
    if (storedTeacherId) return storedTeacherId;
    
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    if (role === 'TEACHER' && userId) {
      // Sauvegarder pour les prochaines fois
      localStorage.setItem('teacherId', userId);
      return userId;
    }
    
    return null;
  })();


  // Charger uniquement les classes du teacher
  useEffect(() => {
    const fetchClasses = async () => {
      if (!schoolId || !teacherId) {
        console.error('Missing parameters:', { schoolId, teacherId });
        toast({
          title: 'Erreur',
          description: 'ID école ou enseignant manquant',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Fetching classes for:', { schoolId, teacherId });
      
      try {
        setLoading(true);
        // Enlever le /api/ du début si votre BASE_URL contient déjà /api
        const classes = await api.get<Class[]>(`/student-attendance/classes/${schoolId}/${teacherId}`);
        console.log('Classes loaded:', classes);
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
  }, [schoolId, teacherId, toast]);

  // Charger les étudiants de la classe sélectionnée
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !schoolId || !teacherId) return;

      try {
        setLoading(true);
        const students = await api.get<Student[]>(`/api/student-attendance/students/${schoolId}/${teacherId}/${selectedClass}`);
        setStudents(students);
        setAbsentStudents([]); // Réinitialiser les absents
      } catch (error) {
        console.error('Erreur lors du chargement des étudiants:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les étudiants',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, schoolId, teacherId]);

  const toggleStudentAbsence = (student: Student) => {
    const isAbsent = absentStudents.some((s) => s.studentId === student.id);

    if (isAbsent) {
      // Retirer de la liste des absents
      setAbsentStudents(absentStudents.filter((s) => s.studentId !== student.id));
    } else {
      // Ajouter à la liste des absents
      setAbsentStudents([
        ...absentStudents,
        {
          studentId: student.id,
          name: student.name,
          reason: '',
          isJustified: false,
          teacherNotes: '',
        },
      ]);
    }
  };

  const updateAbsentStudent = (studentId: string, field: keyof AbsentStudent, value: string | boolean) => {
    setAbsentStudents(
      absentStudents.map((student) =>
        student.studentId === studentId ? { ...student, [field]: value } : student
      )
    );
  };

  const handleSubmit = async () => {
    if (!selectedClass || absentStudents.length === 0) {
      toast({
        title: 'Attention',
        description: 'Veuillez sélectionner une classe et au moins un étudiant absent',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const request = {
        schoolId: Number(schoolId),
        classId: selectedClass,
        eventDate: selectedDate,
        absentStudents: absentStudents.map((student) => ({
          studentId: student.studentId,
          reason: student.reason,
          isJustified: student.isJustified,
          teacherNotes: student.teacherNotes,
        })),
      };

      await api.post(`/api/student-attendance/bulk/${teacherId}`, request);

      toast({
        title: 'Succès',
        description: `${absentStudents.length} absence(s) enregistrée(s)`,
      });

      // Réinitialiser le formulaire
      setAbsentStudents([]);
      setSelectedClass('');
      setStudents([]);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer les absences',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isStudentAbsent = (studentId: string) => absentStudents.some((s) => s.studentId === studentId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marquer les Absences</h1>
              <p className="text-gray-600">Enregistrez les absences de vos étudiants</p>
            </div>
          </div>
        </div>

        {/* Sélection Classe et Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Sélection
            </CardTitle>
            <CardDescription>Choisissez une classe et une date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="date-select">Date</Label>
                <Input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des Étudiants */}
        {selectedClass && students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Liste des Étudiants ({absentStudents.length} absent{absentStudents.length > 1 ? 's' : ''})
              </CardTitle>
              <CardDescription>Cochez les étudiants absents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {students.map((student) => {
                  const isAbsent = isStudentAbsent(student.id);
                  const absentData = absentStudents.find((s) => s.studentId === student.id);

                  return (
                    <div
                      key={student.id}
                      className={`p-4 border rounded-lg transition-all ${
                        isAbsent ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isAbsent}
                            onCheckedChange={() => toggleStudentAbsence(student)}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        {isAbsent ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      {isAbsent && absentData && (
                        <div className="mt-4 space-y-3 pl-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`reason-${student.id}`}>Raison</Label>
                              <Input
                                id={`reason-${student.id}`}
                                value={absentData.reason}
                                onChange={(e) => updateAbsentStudent(student.id, 'reason', e.target.value)}
                                placeholder="Ex: Maladie, Rendez-vous..."
                              />
                            </div>

                            <div className="flex items-center space-x-2 pt-8">
                              <Checkbox
                                id={`justified-${student.id}`}
                                checked={absentData.isJustified}
                                onCheckedChange={(checked) =>
                                  updateAbsentStudent(student.id, 'isJustified', checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`justified-${student.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Justifiée
                              </label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`notes-${student.id}`}>Notes</Label>
                            <Textarea
                              id={`notes-${student.id}`}
                              value={absentData.teacherNotes}
                              onChange={(e) => updateAbsentStudent(student.id, 'teacherNotes', e.target.value)}
                              placeholder="Remarques supplémentaires..."
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {absentStudents.length > 0 && (
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSubmit} disabled={submitting} size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    {submitting ? 'Enregistrement...' : `Enregistrer ${absentStudents.length} absence(s)`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedClass && students.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500">Aucun étudiant trouvé dans cette classe</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
