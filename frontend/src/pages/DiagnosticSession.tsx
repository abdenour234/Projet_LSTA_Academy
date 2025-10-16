import DiagnosticGrid from '@/components/diagnostic/DiagnosticGrid';

const DiagnosticSession = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8">
      <div className="container mx-auto px-4">
        <DiagnosticGrid />
      </div>
    </div>
  );
};

export default DiagnosticSession;
