import { storageApi, ApiError, API_CONFIG } from './api';

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

/**
 * Upload a file for an activity to Spring Boot storage
 */
export const uploadActivityFile = async (
  file: File,
  activityId: string
): Promise<UploadResult> => {
  try {
    const response = await storageApi.upload(file, 'activity_file', activityId);

    return {
      success: true,
      path: response.fileName,
      url: response.url
    };
  } catch (err) {
    console.error('Error uploading file:', err);
    const error = err as ApiError;
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
};

/**
 * Upload a school logo to Spring Boot storage
 */
export const uploadSchoolLogo = async (
  file: File,
  schoolId: string
): Promise<UploadResult> => {
  try {
    const response = await storageApi.upload(file, 'school_logo', schoolId);

    return {
      success: true,
      path: response.fileName,
      url: response.url
    };
  } catch (err) {
    console.error('Error uploading school logo:', err);
    const error = err as ApiError;
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
};

/**
 * Delete a file from Spring Boot storage
 */
export const deleteActivityFile = async (fileName: string): Promise<boolean> => {
  try {
    // Remove any path prefixes
    const cleanFileName = fileName.replace(/^(activity-files?\/|school-logos?\/)/, '');
    
    await storageApi.delete(cleanFileName);
    return true;
  } catch (err) {
    console.error('Error deleting file:', err);
    return false;
  }
};

/**
 * Get a signed/public URL for a file
 * For Spring Boot, this will get a signed URL from the backend
 */
export const getPublicUrl = async (fileName: string): Promise<string> => {
  try {
    // Remove any path prefixes
    const cleanFileName = fileName.replace(/^(activity-files?\/|school-logos?\/)/, '');
    
    const response = await storageApi.getSignedUrl(cleanFileName);
    return response.url;
  } catch (err) {
    console.error('Error getting public URL:', err);
    // Return a fallback URL or empty string
    return '';
  }
};

/**
 * Synchronous version for backward compatibility
 * Note: This returns the API endpoint - actual URL fetching should be async
 */
export const getPublicUrlSync = (fileName: string): string => {
  const cleanFileName = fileName.replace(/^(activity-files?\/|school-logos?\/)/, '');
  // Return the storage API endpoint - this may need authentication
  return API_CONFIG.getUrl(`/storage/file/${encodeURIComponent(cleanFileName)}`);
};
