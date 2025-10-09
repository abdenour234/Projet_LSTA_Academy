import CreateDiagnosticSession from '@/components/diagnostic/CreateDiagnosticSession';

const DiagnosticNewSession = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8">
      <div className="container mx-auto px-4">
        <CreateDiagnosticSession />
      </div>
    </div>
  );
};

export default DiagnosticNewSession;
