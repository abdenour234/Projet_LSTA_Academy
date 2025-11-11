import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResourceUploader } from "@/components/resources/ResourceUploader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ResourceManagement() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [schoolId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate(`/school/${schoolId}/login`);
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Header - 64px height */}
      <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Gestion des Ressources Pédagogiques</h1>
              <p className="text-sm text-slate-600">Ajoutez et gérez vos PDF, vidéos et images</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <ResourceUploader
          schoolId={schoolId!}
          onSuccess={() => navigate(`/school/${schoolId}/admin/dashboard`)}
        />
      </main>
    </div>
  );
}
