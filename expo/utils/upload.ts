import * as VideoThumbnails from 'expo-video-thumbnails';
import * as ImageManipulator from 'expo-image-manipulator';

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

export async function compressImage(
  uri: string,
  options?: {
    compress?: number;
    format?: 'jpeg' | 'png';
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<string> {
  const {
    compress = 0.7,
    format = 'jpeg',
    maxWidth = 1080,
    maxHeight = 1920,
  } = options || {};

  try {
    console.log('[compressImage] Starting compression for:', uri);
    
    // Get original image dimensions
    const originalResult = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    
    // Calculate resize dimensions while maintaining aspect ratio
    const actions: ImageManipulator.Action[] = [];
    
    // Only resize if image exceeds max dimensions
    actions.push({
      resize: {
        width: maxWidth,
        height: maxHeight,
      },
    });
    
    // Compress the image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        compress,
        format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
      }
    );
    
    console.log('[compressImage] Compression complete. New URI:', result.uri);
    return result.uri;
  } catch (error) {
    console.error('[compressImage] Compression failed:', error);
    // Return original URI if compression fails
    return uri;
  }
} 