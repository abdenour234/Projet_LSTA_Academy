import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, activityApi, classApi, schoolApi } from '@/lib/api';
import { ActivityBuilder } from '@/components/activity/ActivityBuilder';
import LoadingState from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, School, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

interface School {
  id: number;
  name: string;
  city: string;
  region: string;
}

interface Class {
  id: string;
  name: string;
  level?: string;
  academicYear?: string;
}

const SuperAdminActivityEditor = () => {
  const { schoolId: urlSchoolId, activityId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activityData, setActivityData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activityId, urlSchoolId]);

  const loadData = async () => {
    try {
      // Verify superadmin role
      const user = await authApi.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        toast({
          title: 'Accès refusé',
          description: 'Seuls les superadmins peuvent accéder à cette page',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Load schools list
      const schoolResponse = await schoolApi.getAll(); // Use schoolApi.getAll instead of /superadmin/stats
      setSchools(schoolResponse || []);

      // Set school ID from URL or first school
      if (urlSchoolId) {
        setSelectedSchoolId(urlSchoolId);
      } else if (schoolResponse.length > 0) {
        setSelectedSchoolId(schoolResponse[0].id.toString());
      }

      // Load classes for selected school
      if (urlSchoolId || schoolResponse.length > 0) {
        const schoolIdToFetch = urlSchoolId || schoolResponse[0].id.toString();
        const classResponse = await classApi.getBySchoolId(schoolIdToFetch);
        setClasses(classResponse || []);
      }

      // Load activity data if editing
      if (activityId) {
        const activity = await activityApi.getById(activityId);
        if (activity) {
          let layoutData;
          try {
            layoutData = typeof activity.layoutData === 'string' 
              ? JSON.parse(activity.layoutData) 
              : activity.layoutData;
          } catch (e) {
            console.error('Error parsing layoutData:', e);
            layoutData = { elements: [] };
          }
          
          setActivityData({
            title: activity.title,
            description: activity.description || '',
            type: activity.type,
            level: activity.level,
            elements: layoutData?.elements || [],
            classId: activity.classId, // Include classId
          });
          // Set school ID and class ID from activity
          if (activity.schoolId) {
            setSelectedSchoolId(activity.schoolId);
          }
          if (activity.classId) {
            setSelectedClassId(activity.classId);
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolChange = async (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setSelectedClassId(''); // Reset class selection
    try {
      const classResponse = await classApi.getBySchoolId(schoolId);
      setClasses(classResponse || []);
    } catch (error: any) {
      console.error('Error loading classes:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les classes',
        variant: 'destructive',
      });
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleSave = () => {
    toast({
      title: 'Succès',
      description: 'Activité enregistrée avec succès',
    });
    navigate('/superadmin/dashboard');
  };

  if (loading) return <LoadingState />;

  const selectedSchool = schools.find(s => s.id.toString() === selectedSchoolId);
  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/superadmin/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              {activityId ? 'Modifier l\'activité' : 'Nouvelle activité'}
            </h1>
          </div>
        </div>

        {/* School Selection Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <School className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Sélectionner l'école</h3>
              <Select
                value={selectedSchoolId}
                onValueChange={handleSchoolChange}
                disabled={!!activityId} // Disable if editing
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choisir une école" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{school.name}</span>
                        <span className="text-sm text-muted-foreground">
                          • {school.city}, {school.region}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSchool && (
                <p className="text-sm text-muted-foreground mt-2">
                  Cette activité sera créée pour l'école <strong>{selectedSchool.name}</strong>
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Class Selection Card */}
        {selectedSchoolId && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Sélectionner la classe</h3>
                <Select
                  value={selectedClassId}
                  onValueChange={handleClassChange}
                  disabled={!!activityId} // Disable if editing
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Choisir une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{classItem.name}</span>
                          {classItem.level && (
                            <span className="text-sm text-muted-foreground">
                              • {classItem.level}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClass && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Cette activité sera assignée à la classe <strong>{selectedClass.name}</strong>
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Activity Builder */}
        {selectedSchoolId && (
          <ActivityBuilder
            activityId={activityId}
            initialData={activityData}
            schoolId={selectedSchoolId}
            classId={selectedClassId}
            onSave={handleSave}
          />
        )}

        {!selectedSchoolId && (
          <Card className="p-12 text-center">
            <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune école sélectionnée</h3>
            <p className="text-muted-foreground">
              Veuillez sélectionner une école pour créer une activité
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuperAdminActivityEditor;