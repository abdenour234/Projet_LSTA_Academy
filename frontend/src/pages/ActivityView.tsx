import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { activityApi } from '@/lib/api';
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
      console.log('[ACTIVITY_VIEW] Loading activity:', activityId);
      const data = await activityApi.getById(activityId!);
      console.log('[ACTIVITY_VIEW] Activity data received:', data);
      
      if (data) {
        // Parse layoutData if it's a JSON string
        if (data.layoutData && typeof data.layoutData === 'string') {
          try {
            data.layout_data = JSON.parse(data.layoutData);
          } catch (e) {
            console.error('Error parsing layoutData:', e);
            data.layout_data = { elements: [] };
          }
        } else if (data.layout_data && typeof data.layout_data === 'string') {
          try {
            data.layout_data = JSON.parse(data.layout_data);
          } catch (e) {
            console.error('Error parsing layout_data:', e);
            data.layout_data = { elements: [] };
          }
        }
        
        // Backend now returns clean relative paths, no URL cleanup needed
        
        console.log('[ACTIVITY_VIEW] Activity processed:', data);
        console.log('[ACTIVITY_VIEW] isPublished:', data.isPublished);
        setActivity(data as any);
      } else {
        console.warn('[ACTIVITY_VIEW] No activity data received');
      }
    } catch (error) {
      console.error('[ACTIVITY_VIEW] Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  if (!activity) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Activité non trouvée</h2>
          <Button 
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-9"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux activités
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AutoActivityViewer
          title={activity.title}
          description={activity.description || ''}
          elements={activity.layout_data?.elements || []}
        />
      </main>
    </div>
  );
};

export default ActivityView;
