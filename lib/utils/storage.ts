import { createClient } from '@/lib/supabase/client';
import { compressImageToWebP } from './image-compression';

export async function uploadWorkspaceAsset(
  workspaceId: string,
  pageId: string,
  file: File
): Promise<string> {
  const supabase = createClient();

  // Compress image to WebP
  const optimizedFile = await compressImageToWebP(file);

  const fileExt = optimizedFile.name.split('.').pop();
  const filePath = `${workspaceId}/${pageId}/${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('workspace-assets')
    .upload(filePath, optimizedFile, {
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from('workspace-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
