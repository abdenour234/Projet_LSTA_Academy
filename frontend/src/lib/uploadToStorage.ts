import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export const uploadActivityFile = async (
  file: File,
  activityId: string
): Promise<UploadResult> => {
  try {
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${activityId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload le fichier
    const { data, error } = await supabase.storage
      .from('activity-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erreur lors de l\'upload:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Retourner le chemin du fichier
    return {
      success: true,
      path: data.path,
      url: `activity-files/${data.path}`
    };
  } catch (err) {
    console.error('Erreur lors de l\'upload du fichier:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue'
    };
  }
};

export const deleteActivityFile = async (filePath: string): Promise<boolean> => {
  try {
    // Nettoyer le chemin si nécessaire
    const cleanPath = filePath.replace('activity-files/', '');
    
    const { error } = await supabase.storage
      .from('activity-files')
      .remove([cleanPath]);

    if (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Erreur lors de la suppression du fichier:', err);
    return false;
  }
};

export const getPublicUrl = (filePath: string): string => {
  const cleanPath = filePath.replace('activity-files/', '');
  const { data } = supabase.storage
    .from('activity-files')
    .getPublicUrl(cleanPath);
  
  return data.publicUrl;
};
