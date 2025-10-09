import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  width?: string;
  height?: string;
}

export const PDFViewer = ({ fileUrl, width = '100%', height = '600px' }: PDFViewerProps) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative" style={{ width, height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <iframe
        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        width="100%"
        height="100%"
        onLoad={() => setLoading(false)}
        style={{ border: 'none' }}
        title="PDF Viewer"
      />
    </div>
  );
};
