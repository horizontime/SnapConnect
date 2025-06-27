import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '@/constants/colors';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { uploadMedia, createStory } from '@/utils/supabase';
import { generateThumbnail, compressImage } from '@/utils/upload';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

export default function CreateStoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuthStore();
  const { mediaUri, mediaType, overlayMeta } = useLocalSearchParams<{
    mediaUri: string;
    mediaType: 'image' | 'video';
    overlayMeta?: string;
  }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const viewShotRef = useRef<ViewShot>(null);

  const handleBack = () => {
    router.back();
  };

  const handlePost = async () => {
    if (!userId || !mediaUri) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please add a title for your story');
      return;
    }

    setIsLoading(true);

    try {
      let finalUri = mediaUri;
      let parsedOverlays = null;

      // Parse overlay metadata if present
      if (overlayMeta) {
        try {
          parsedOverlays = JSON.parse(decodeURIComponent(overlayMeta));
        } catch (e) {
          console.error('Failed to parse overlay metadata:', e);
        }
      }

      // For images with overlays, we need to capture the view
      if (mediaType === 'image' && viewShotRef.current && parsedOverlays?.length > 0) {
        const tempUri = await viewShotRef.current.capture?.();
        if (tempUri) {
          const fileName = `story_${Date.now()}.png`;
          finalUri = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.copyAsync({
            from: tempUri,
            to: finalUri
          });
        }
      }

      // Compress image before upload (only for images)
      let mediaToUpload = finalUri;
      if (mediaType === 'image') {
        console.log('[StoryCreate] Compressing image before upload...');
        mediaToUpload = await compressImage(finalUri, {
          compress: 0.7,
          maxWidth: 1080,
          maxHeight: 1920,
        });
        console.log('[StoryCreate] Image compressed:', mediaToUpload);
      }

      // Upload media to stories bucket
      const { publicUrl } = await uploadMedia('stories', mediaToUpload);

      let thumbnailUrl: string | undefined;
      if (mediaType === 'video') {
        const thumb = await generateThumbnail(finalUri);
        if (thumb) {
          const thumbUpload = await uploadMedia('stories', thumb);
          thumbnailUrl = thumbUpload.publicUrl;
        }
      }

      // Create story with title and description
      await createStory({
        userId,
        mediaUrl: publicUrl,
        thumbnailUrl,
        type: mediaType as 'image' | 'video',
        metadata: mediaType === 'video' ? parsedOverlays : null,
        title: title.trim(),
        description: description.trim(),
      });

      // Clean up temporary files
      if (mediaType === 'image' && finalUri !== mediaUri && FileSystem.documentDirectory && finalUri.includes(FileSystem.documentDirectory)) {
        await FileSystem.deleteAsync(finalUri, { idempotent: true }).catch(() => {});
      }

      // Navigate to stories tab
      router.replace('/(tabs)/stories');
    } catch (error) {
      console.error('Failed to create story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', errorMessage);
      Alert.alert('Error', `Failed to post story: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: 'Create Story',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Media Preview */}
        <View style={styles.previewContainer}>
          {mediaType === 'image' ? (
            <ViewShot ref={viewShotRef} style={styles.previewWrapper}>
              <Image 
                source={{ uri: decodeURIComponent(mediaUri) }} 
                style={styles.preview}
                resizeMode="cover"
              />
              {/* Render overlays if any */}
              {overlayMeta && (() => {
                try {
                  const overlays = JSON.parse(decodeURIComponent(overlayMeta));
                  return overlays.map((overlay: any) => {
                    if (overlay.type === 'caption') {
                      return (
                        <Text
                          key={overlay.id}
                          style={[
                            styles.overlayCaption,
                            {
                              left: overlay.x,
                              top: overlay.y,
                              transform: [{ scale: overlay.scale }],
                            },
                          ]}
                        >
                          {overlay.text}
                        </Text>
                      );
                    } else if (overlay.type === 'sticker') {
                      return (
                        <Image
                          key={overlay.id}
                          source={overlay.source}
                          style={[
                            styles.overlaySticker,
                            {
                              left: overlay.x,
                              top: overlay.y,
                              transform: [{ scale: overlay.scale }],
                            },
                          ]}
                        />
                      );
                    }
                    return null;
                  });
                } catch (e) {
                  return null;
                }
              })()}
            </ViewShot>
          ) : (
            <VideoPreview uri={decodeURIComponent(mediaUri)} />
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Give your story a title..."
              placeholderTextColor={colors.textLight}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
            <Text style={styles.charCount}>{title.length}/50</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Set the scene, please elaborate."
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={20000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/20000</Text>
          </View>

          <TouchableOpacity 
            style={[styles.postButton, isLoading && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={styles.postButtonText}>Post Story</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Video preview component
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, pl => {
    pl.loop = true;
    pl.play();
  });

  return (
    <VideoView
      style={styles.preview}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  previewContainer: {
    height: 200,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  previewWrapper: {
    width: '100%',
    height: '100%',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  overlayCaption: {
    position: 'absolute',
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  overlaySticker: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 250,
    maxHeight: 370,
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  postButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  postButtonDisabled: {
    opacity: 0.7,
  },
  postButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
}); 