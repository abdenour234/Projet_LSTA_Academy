import { useState, useEffect } from 'react';
import { ActivityElement } from '@/types/activity';
import { PDFViewer } from './PDFViewer';
import { VideoViewer } from './VideoViewer';
import { FullscreenViewer } from './FullscreenViewer';
import { Button } from '@/components/ui/button';
import { Maximize2, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { API_CONFIG } from '@/lib/api';

interface AutoActivityViewerProps {
  title: string;
  description?: string;
  elements: ActivityElement[];
}

export const AutoActivityViewer = ({ title, description, elements }: AutoActivityViewerProps) => {
  const [fullscreenElement, setFullscreenElement] = useState<{ type: 'pdf' | 'video', url: string } | null>(null);
  const [layout, setLayout] = useState<'auto' | 'manual'>('auto');

  // Helper function to convert relative URLs to absolute URLs
  const getAbsoluteUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) {
      return `${API_CONFIG.BASE_URL.replace('/api', '')}${url}`;
    }
    return url;
  };

  // Detect content types
  const contentTypes = elements.reduce((acc, el) => {
    acc[el.type] = (acc[el.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Auto-layout detection
  const hasOnlyPDF = contentTypes.pdf && Object.keys(contentTypes).length === 1;
  const hasOnlyVideo = contentTypes.video && Object.keys(contentTypes).length === 1;
  const hasOnlyImages = contentTypes.image && Object.keys(contentTypes).length === 1;
  const hasMixed = Object.keys(contentTypes).length > 1;

  useEffect(() => {
    // Automatically choose layout based on content
    if (hasOnlyPDF || hasOnlyVideo || hasOnlyImages) {
      setLayout('auto');
    } else if (hasMixed) {
      setLayout('auto'); // Use auto grid for mixed content
    }
  }, [elements]);

  const renderAutoLayout = () => {
    if (hasOnlyPDF) {
      const pdfElement = elements.find(el => el.type === 'pdf');
      if (!pdfElement) return null;

      return (
        <div className="w-full h-full min-h-[800px] bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
            <FileText className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Document PDF</h3>
          </div>
          <div className="relative w-full h-[calc(100%-60px)]">
            <PDFViewer 
              fileUrl={pdfElement.content} 
              width="100%"
              height="100%"
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 z-10"
              onClick={() => setFullscreenElement({ type: 'pdf', url: pdfElement.content })}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    if (hasOnlyVideo) {
      const videoElement = elements.find(el => el.type === 'video');
      if (!videoElement) return null;

      return (
        <div className="w-full bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
            <Video className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Vidéo pédagogique</h3>
          </div>
          <div className="max-w-4xl mx-auto">
            <VideoViewer 
              fileUrl={videoElement.content}
              width="100%"
              height="600px"
              onFullscreen={() => setFullscreenElement({ type: 'video', url: videoElement.content })}
            />
          </div>
        </div>
      );
    }

    if (hasOnlyImages) {
      return (
        <div className="w-full bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
            <ImageIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Images pédagogiques</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {elements.filter(el => el.type === 'image').map((element) => {
              const imageUrl = getAbsoluteUrl(element.content);
              return (
                <div key={element.id} className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Mixed content - auto grid layout
    return (
      <div className="w-full space-y-6">
        {elements.map((element) => (
          <div key={element.id} className="bg-white rounded-lg border border-slate-200 p-6">
            {element.type === 'text' && (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-slate-900">{element.content}</pre>
              </div>
            )}
            
            {element.type === 'image' && element.content && (
              <div className="max-w-3xl mx-auto">
                <img 
                  src={getAbsoluteUrl(element.content)} 
                  alt="" 
                  className="w-full rounded-lg shadow-md" 
                />
              </div>
            )}
            
            {element.type === 'pdf' && element.content && (
              <div className="relative w-full min-h-[600px]">
                <PDFViewer 
                  fileUrl={element.content} 
                  width="100%"
                  height="600px"
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
              <div className="max-w-4xl mx-auto">
                <VideoViewer 
                  fileUrl={element.content}
                  width="100%"
                  height="500px"
                  onFullscreen={() => setFullscreenElement({ type: 'video', url: element.content })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {fullscreenElement && (
        <FullscreenViewer
          type={fullscreenElement.type}
          fileUrl={fullscreenElement.url}
          onClose={() => setFullscreenElement(null)}
        />
      )}
      
      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">{title}</h1>
        {description && (
          <p className="text-slate-600 text-lg">{description}</p>
        )}
      </div>

      {renderAutoLayout()}
    </div>
  );
};
