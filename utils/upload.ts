import * as VideoThumbnails from 'expo-video-thumbnails';

export async function generateThumbnail(uri: string): Promise<string | null> {
  try {
    const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(uri, {
      time: 500,
    });
    return thumbUri;
  } catch (e) {
    console.warn('Thumbnail generation failed', e);
    return null;
  }
} 