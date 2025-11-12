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
        
        // ✅ FIXED: Clean up malformed URLs and convert to relative paths for nginx proxy
        if (data.layout_data?.elements) {
          data.layout_data.elements = data.layout_data.elements.map((el: any) => {
            if (el.content && typeof el.content === 'string') {
              let url = el.content;
              
              // If it's a full URL (http:// or https://), extract just the path
              if (url.startsWith('http://') || url.startsWith('https://')) {
                try {
                  const urlObj = new URL(url);
                  // Extract path (e.g., /api/activity-files/download/xxx)
                  url = urlObj.pathname;
                } catch (e) {
                  console.warn('[ACTIVITY_VIEW] Failed to parse URL:', url);
                }
              }
              
              // Ensure the path is relative and will go through nginx proxy
              // If it doesn't start with /, add it
              if (!url.startsWith('/')) {
                url = '/' + url;
              }
              
              el.content = url;
            }
            return el;
          });
        }
        
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
