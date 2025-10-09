-- Forcer la régénération des types TypeScript
-- Cette migration ajoute un commentaire à la table activities pour déclencher la mise à jour des types

COMMENT ON TABLE public.activities IS 'Stocke les activités pédagogiques créées par les administrateurs';
COMMENT ON TABLE public.profiles IS 'Profils utilisateurs liés aux comptes d''authentification';
COMMENT ON TABLE public.schools IS 'Liste des établissements scolaires';
COMMENT ON TABLE public.diagnostic_sessions IS 'Sessions de diagnostic pédagogique';
COMMENT ON TABLE public.diagnostic_results IS 'Résultats des diagnostics par élève';
COMMENT ON TABLE public.diagnostic_students IS 'Élèves participant aux sessions de diagnostic';