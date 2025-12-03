import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Users, BookOpen, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sessionApi, teacherApi, classApi, activityApi } from '@/lib/api';

interface SessionDetails {
  id: string;
  sessionDate: string;
  notes: string;
  percentageAcquired: number;
  teacherId: string;
  classId: string;
  activityId: string;
}

export default function AdminSessionDetails() {
  const { id: schoolId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [classe, setClasse] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!sessionId) return;
      
      setLoading(true);
      setError(null);
      try {
        // 1. Récupérer les détails de la séance
        const sessionData = await sessionApi.getById(sessionId);
        setSession(sessionData);

        // 2. Récupérer les détails associés, mais de manière plus sûre
        // On crée un tableau de promesses, en ajoutant des appels API seulement si l'ID existe
        const fetchPromises = [
          sessionData.teacherId ? teacherApi.getById(sessionData.teacherId) : Promise.resolve(null),
          sessionData.classId ? classApi.getById(sessionData.classId) : Promise.resolve(null),
          sessionData.activityId ? activityApi.getById(sessionData.activityId) : Promise.resolve(null),
        ];

        // On utilise Promise.allSettled pour que l'échec d'un appel ne fasse pas échouer les autres
        const results = await Promise.allSettled(fetchPromises);

        // On extrait les données de chaque promesse, en gérant les cas d'échec
        const teacherData = results[0].status === 'fulfilled' ? results[0].value : null;
        const classData = results[1].status === 'fulfilled' ? results[1].value : null;
        const activityData = results[2].status === 'fulfilled' ? results[2].value : null;
        
        setTeacher(teacherData);
        setClasse(classData);
        setActivity(activityData);

      } catch (err: any) {
        console.error("Erreur lors du chargement des détails de la séance:", err);
        setError("Impossible de charger les détails de la séance. Elle a peut-être été supprimée.");
        toast.error("Impossible de charger les détails de la séance.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error || "Séance non trouvée."}</p>
            <Button onClick={() => navigate(`/school/${schoolId}/admin/dashboard`)} className="mt-4">
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teacherName = teacher 
    ? teacher.fullName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()
    : 'Enseignant inconnu';
  
  const className = classe ? classe.name : 'Classe inconnue';
  
  const activityTitle = activity ? activity.title : 'Activité non spécifiée ou supprimée';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/school/${schoolId}/admin/dashboard`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-blue-800">Détails de la Séance</h1>
        </div>

        {/* Carte principale */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {activityTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informations Générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Enseignant</p>
                  <p className="font-medium text-blue-700">{teacherName}</p>
                  {teacher?.email && <p className="text-xs text-gray-400">{teacher.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Classe</p>
                  <p className="font-medium text-blue-700">{className}</p>
                  {classe?.level && <p className="text-xs text-gray-400">Niveau: {classe.level}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Date de la séance</p>
                  <p className="font-medium text-blue-700">
                    {new Date(session.sessionDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500">Progression estimée</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-emerald-500 h-2.5 rounded-full"
                        style={{ width: `${session.percentageAcquired || 0}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-emerald-700">{session.percentageAcquired}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Détails de l'activité */}
            {activity && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Détails de l'activité
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Type:</span> 
                  <Badge variant="secondary" className="ml-2">{activity.type}</Badge>
                </p>
                {activity.description && (
                   <p className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span> {activity.description}
                  </p>
                )}
              </div>
            )}

            {/* Section Remarques (Notes) */}
            {session.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Remarques de l'enseignant
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap border-l-4 border-blue-300">
                  {session.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}