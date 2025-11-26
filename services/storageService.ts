
import { supabase } from './supabaseClient';

/**
 * Uploads a file to Supabase Storage (Bucket: 'expedientes').
 * 
 * FALLBACK: If the upload fails (e.g. network issue), it returns a local Blob URL 
 * so the demo remains functional for the session.
 */
export const uploadFile = async (file: File): Promise<string> => {
  try {
    console.log("Starting Upload Sequence to Supabase Storage...");

    // 1. Sanitize filename to be URL safe and unique
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}_${sanitizedFileName}`;
    
    // 2. Upload to Supabase 'expedientes' bucket
    const { data, error } = await supabase.storage
      .from('expedientes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('expedientes')
      .getPublicUrl(fileName);

    console.log("Supabase Upload Success:", publicUrl);
    return publicUrl;

  } catch (error) {
    console.error("Storage Upload Error:", error);
    console.warn("Falling back to Local Object URL for demo continuity.");
    
    // Fallback: Create a local URL so the app still 'works' for the user in this session
    return URL.createObjectURL(file);
  }
};
