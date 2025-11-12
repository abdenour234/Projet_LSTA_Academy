import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, activityApi } from '@/lib/api';
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
      const user = await authApi.getCurrentUser();
      if (!user) {
        navigate('/');
        return;
      }

      setSchoolId(user.schoolId);

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
          
          // ✅ FIXED: Clean up malformed URLs and convert to relative paths for nginx proxy
          if (layoutData?.elements) {
            layoutData.elements = layoutData.elements.map((el: any) => {
              if (el.content && typeof el.content === 'string') {
                let url = el.content;
                
                // If it's a full URL (http:// or https://), extract just the path
                if (url.startsWith('http://') || url.startsWith('https://')) {
                  try {
                    const urlObj = new URL(url);
                    // Extract path (e.g., /api/activity-files/download/xxx)
                    url = urlObj.pathname;
                  } catch (e) {
                    console.warn('[ACTIVITY_EDITOR] Failed to parse URL:', url);
                  }
                }
                
                // Ensure the path is relative and will go through nginx proxy
                if (!url.startsWith('/')) {
                  url = '/' + url;
                }
                
                el.content = url;
              }
              return el;
            });
          }
          
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
