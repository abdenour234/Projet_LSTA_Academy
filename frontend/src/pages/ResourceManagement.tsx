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
    <div className="container mx-auto p-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestion des Ressources Pédagogiques</h1>
        <p className="text-muted-foreground mt-2">
          Ajoutez et gérez vos PDF, vidéos et images
        </p>
      </div>

      <ResourceUploader
        schoolId={schoolId!}
        onSuccess={() => navigate(`/school/${schoolId}/admin/dashboard`)}
      />
    </div>
  );
}
