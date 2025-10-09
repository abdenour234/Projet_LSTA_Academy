import { ActivityElement } from '@/types/activity';
import { PDFViewer } from './PDFViewer';

interface ActivityViewerProps {
  title: string;
  description?: string;
  elements: ActivityElement[];
}

export const ActivityViewer = ({ title, description, elements }: ActivityViewerProps) => {
  return (
    <div className="space-y-6">
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
                src={element.content} 
                alt="" 
                className="w-full h-full object-cover rounded" 
              />
            )}
            
            {element.type === 'pdf' && element.content && (
              <PDFViewer 
                fileUrl={element.content} 
                width={`${element.size.width}px`}
                height={`${element.size.height}px`}
              />
            )}
            
            {element.type === 'video' && element.content && (
              <video 
                src={element.content} 
                controls 
                controlsList="nodownload"
                className="w-full h-full rounded"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
