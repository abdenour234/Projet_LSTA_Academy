import DiagnosticResults from '@/components/diagnostic/DiagnosticResults';

const DiagnosticSessionResults = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8">
      <div className="container mx-auto px-4">
        <DiagnosticResults />
      </div>
    </div>
  );
};

export default DiagnosticSessionResults;
