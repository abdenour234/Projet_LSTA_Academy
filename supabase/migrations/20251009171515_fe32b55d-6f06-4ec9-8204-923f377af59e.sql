-- Supprimer la contrainte activities_type_check qui bloque l'ajout d'activités
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- Ajouter une colonne pour le logo des écoles
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Créer un bucket pour les logos d'école
INSERT INTO storage.buckets (id, name, public) 
VALUES ('school-logos', 'school-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour les logos d'école
CREATE POLICY "Les logos d'école sont accessibles publiquement" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'school-logos');

CREATE POLICY "Les admins peuvent uploader des logos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'school-logos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Les admins peuvent mettre à jour des logos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'school-logos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Les admins peuvent supprimer des logos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'school-logos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);