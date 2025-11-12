import DiagnosticGrid from '@/components/diagnostic/DiagnosticGrid';

const DiagnosticSession = () => {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-6">
        <DiagnosticGrid />
      </div>
    </div>
  );
};

export default DiagnosticSession;
