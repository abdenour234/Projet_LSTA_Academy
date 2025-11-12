import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Alert, AlertDescription } from '@/components/ui/alert';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configuration de PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  width?: string;
  height?: string;
}

export const PDFViewer = ({ fileUrl, width = '100%', height = '600px' }: PDFViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    loadPDF();
  }, [fileUrl]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[PDF_VIEWER] Loading PDF from URL:', fileUrl);

      // ✅ FIXED: Use the URL directly - backend streams the file
      // URLs are now in format: /api/activity-files/download/{id}
      setSignedUrl(fileUrl);
      
    } catch (err) {
      console.error('Erreur lors du chargement du PDF:', err);
      setError('Une erreur est survenue lors du chargement du fichier');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Erreur lors du chargement du document PDF:', error);
    setError('Impossible de charger le document PDF');
    setLoading(false);
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
    <div className="relative overflow-auto bg-muted/30 rounded-lg" style={{ width, height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {signedUrl && (
        <Document
          file={signedUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
          className="flex flex-col items-center p-4"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="mb-4 shadow-lg"
              width={typeof width === 'string' && width.includes('%') ? undefined : parseInt(width as string) - 32}
            />
          ))}
        </Document>
      )}

      {numPages > 0 && (
        <div className="sticky bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm border rounded-full px-4 py-2 text-sm shadow-lg w-fit">
          {numPages} page{numPages > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
