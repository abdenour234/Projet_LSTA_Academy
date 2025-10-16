import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AutoActivityViewer } from '@/components/activity/AutoActivityViewer';
import LoadingState from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Activity } from '@/types/activity';

const ActivityView = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<Activity | null>(null);

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .eq('is_published', true)
        .single();

      if (data) {
        setActivity(data as any);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  if (!activity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Activité non trouvée</h2>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux activités
        </Button>

        <AutoActivityViewer
          title={activity.title}
          description={activity.description || ''}
          elements={activity.layout_data?.elements || []}
        />
      </div>
    </div>
  );
};

export default ActivityView;
