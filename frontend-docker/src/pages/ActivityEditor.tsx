import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ActivityBuilder } from '@/components/activity/ActivityBuilder';
import LoadingState from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ActivityEditor = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string>('');
  const [activityData, setActivityData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activityId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        navigate('/');
        return;
      }

      setSchoolId(profile.school_id);

      if (activityId) {
        const { data: activity } = await supabase
          .from('activities')
          .select('*')
          .eq('id', activityId)
          .single();

        if (activity) {
          const layoutData = activity.layout_data as any;
          setActivityData({
            title: activity.title,
            description: activity.description || '',
            type: activity.type,
            level: activity.level,
            elements: layoutData?.elements || [],
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">
            {activityId ? 'Modifier l\'activité' : 'Nouvelle activité'}
          </h1>
        </div>

        <ActivityBuilder
          activityId={activityId}
          initialData={activityData}
          schoolId={schoolId}
          onSave={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

export default ActivityEditor;
