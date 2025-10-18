import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, activityApi } from '@/lib/api';
import { ActivityBuilder } from '@/components/activity/ActivityBuilder';
import LoadingState from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, School } from 'lucide-react';
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

const SuperAdminActivityEditor = () => {
  const { schoolId: urlSchoolId, activityId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [activityData, setActivityData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activityId, urlSchoolId]);

  const loadData = async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user || user.role !== 'superadmin') {
        navigate('/');
        return;
      }

      // Load schools list
      const response = await fetch('http://localhost:8080/api/superadmin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
        
        // Set school ID from URL or first school
        if (urlSchoolId) {
          setSelectedSchoolId(urlSchoolId);
        } else if (data.schools && data.schools.length > 0) {
          setSelectedSchoolId(data.schools[0].id.toString());
        }
      }

      // Load activity data if editing
      if (activityId) {
        const activity = await activityApi.getById(activityId);
        if (activity) {
          const layoutData = activity.layoutData as any;
          setActivityData({
            title: activity.title,
            description: activity.description || '',
            type: activity.type,
            level: activity.level,
            elements: layoutData?.elements || [],
          });
          // Set school ID from activity
          if (activity.schoolId) {
            setSelectedSchoolId(activity.schoolId);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
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

        {/* Activity Builder */}
        {selectedSchoolId && (
          <ActivityBuilder
            activityId={activityId}
            initialData={activityData}
            schoolId={selectedSchoolId}
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
