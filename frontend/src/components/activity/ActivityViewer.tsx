import { useState } from 'react';
import { ActivityElement } from '@/types/activity';
import { PDFViewer } from './PDFViewer';
import { VideoViewer } from './VideoViewer';
import { FullscreenViewer } from './FullscreenViewer';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';
import { API_CONFIG } from '@/lib/api';

interface ActivityViewerProps {
  title: string;
  description?: string;
  elements: ActivityElement[];
}

export const ActivityViewer = ({ title, description, elements }: ActivityViewerProps) => {
  const [fullscreenElement, setFullscreenElement] = useState<{ type: 'pdf' | 'video', url: string } | null>(null);

  // Helper function to convert relative URLs to absolute URLs
  const getAbsoluteUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) {
      return `${API_CONFIG.BASE_URL.replace('/api', '')}${url}`;
    }
    return url;
  };

  return (
    <div className="space-y-6">
      {fullscreenElement && (
        <FullscreenViewer
          type={fullscreenElement.type}
          fileUrl={fullscreenElement.url}
          onClose={() => setFullscreenElement(null)}
        />
      )}
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      <div className="relative bg-background rounded-lg border min-h-[600px]">
        {elements.map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              ...element.style,
            }}
          >
            {element.type === 'text' && (
              <div className="p-2 h-full overflow-auto whitespace-pre-wrap">
                {element.content}
              </div>
            )}
            
            {element.type === 'image' && element.content && (
              <img 
                src={getAbsoluteUrl(element.content)} 
                alt="" 
                className="w-full h-full object-cover rounded" 
              />
            )}
            
            {element.type === 'pdf' && element.content && (
              <div className="relative w-full h-full">
                <PDFViewer 
                  fileUrl={element.content} 
                  width={`${element.size.width}px`}
                  height={`${element.size.height}px`}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => setFullscreenElement({ type: 'pdf', url: element.content })}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {element.type === 'video' && element.content && (
              <VideoViewer 
                fileUrl={element.content}
                width={`${element.size.width}px`}
                height={`${element.size.height}px`}
                onFullscreen={() => setFullscreenElement({ type: 'video', url: element.content })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
