import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFViewer } from './PDFViewer';
import { VideoViewer } from './VideoViewer';

interface FullscreenViewerProps {
  type: 'pdf' | 'video';
  fileUrl: string;
  onClose: () => void;
}

export const FullscreenViewer = ({ type, fileUrl, onClose }: FullscreenViewerProps) => {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">
          {type === 'pdf' ? 'Visualisation PDF' : 'Lecture vidéo'}
        </h3>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {type === 'pdf' ? (
          <PDFViewer 
            fileUrl={fileUrl} 
            width="100%"
            height="calc(100vh - 120px)"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <VideoViewer 
              fileUrl={fileUrl}
              width="100%"
              height="calc(100vh - 120px)"
            />
          </div>
        )}
      </div>
    </div>
  );
};
