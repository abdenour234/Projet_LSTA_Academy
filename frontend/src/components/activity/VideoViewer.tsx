import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Maximize2 } from 'lucide-react';
import { storageApi } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface VideoViewerProps {
  fileUrl: string;
  width?: string;
  height?: string;
  onFullscreen?: () => void;
}

export const VideoViewer = ({ fileUrl, width = '100%', height = '400px', onFullscreen }: VideoViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadVideo();
  }, [fileUrl]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[VIDEO_VIEWER] Loading video from URL:', fileUrl);

      // ✅ UPDATED: Backend now returns pre-signed URLs directly
      // If URL is already a full HTTP(S) URL (MinIO pre-signed), use it directly
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        console.log('[VIDEO_VIEWER] Using direct pre-signed URL');
        setSignedUrl(fileUrl);
      } else if (fileUrl.startsWith('activity-files/') || fileUrl.startsWith('/api/activity-files/')) {
        // Legacy: fetch signed URL for old-style URLs
        console.log('[VIDEO_VIEWER] Fetching signed URL for legacy path');
        const fileName = fileUrl.replace(/^(activity-files?\/|\/api\/activity-files\/download\/)/, '');
        const response = await storageApi.getSignedUrl(fileName);
        if (response?.url) {
          setSignedUrl(response.url);
        } else {
          setError('Impossible de charger la vidéo');
        }
      } else {
        console.error('[VIDEO_VIEWER] Invalid URL format:', fileUrl);
        setError('Format d\'URL invalide');
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la vidéo:', err);
      setError('Une erreur est survenue lors du chargement du fichier');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="relative" style={{ width, height }}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {signedUrl && (
        <>
          <video 
            src={signedUrl}
            controls 
            controlsList="nodownload"
            className="w-full h-full rounded"
            onLoadedData={() => setLoading(false)}
          />
          {onFullscreen && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 z-10"
              onClick={onFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
};
