import api from './api';

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  fileName?: string;
  error?: string;
}

export const uploadActivityFile = async (
  file: File,
  activityId?: string
): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{
      fileName: string;
      downloadUrl: string;
      originalName: string;
      contentType: string;
      size: string;
    }>('/files/upload', formData);

    return {
      success: true,
      path: response.fileName,
      url: response.downloadUrl,
      fileName: response.fileName
    };
  } catch (err) {
    console.error('Error uploading file:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};

export const deleteActivityFile = async (fileName: string): Promise<boolean> => {
  try {
    await api.delete(`/files/${fileName}`);
    return true;
  } catch (err) {
    console.error('Error deleting file:', err);
    return false;
  }
};

export const getPublicUrl = async (fileName: string, expiryMinutes: number = 60): Promise<string> => {
  try {
    const response = await api.get<{ downloadUrl: string; fileName: string }>(
      `/files/download-url/${fileName}?expiryMinutes=${expiryMinutes}`
    );
    return response.downloadUrl;
  } catch (err) {
    console.error('Error getting public URL:', err);
    return '';
  }
};

// Legacy compatibility - keep the old signature
export const uploadToStorage = async (file: File): Promise<string> => {
  const result = await uploadActivityFile(file);
  return result.url || '';
};
