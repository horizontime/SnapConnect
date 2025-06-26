import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import OverlayItem, { OverlayData } from '@/components/snap-editor/OverlayItem';
import { nanoid } from 'nanoid/non-secure';
import { TouchableOpacity, Text } from 'react-native';
import { Type, Smile, Upload } from 'lucide-react-native';
import { uploadMedia, createStory } from '@/utils/supabase';
import { generateThumbnail } from '@/utils/upload';
import { useAuthStore } from '@/store/authStore';

export default function SnapEditorScreen() {
  const { mediaUri, mediaType } = useLocalSearchParams<{
    mediaUri: string;
    mediaType: 'image' | 'video';
  }>();
  const router = useRouter();
  const { userId } = useAuthStore();

  const [overlays, setOverlays] = React.useState<OverlayData[]>([]);
  const viewShotRef = React.useRef<ViewShot>(null);

  if (!mediaUri) {
    return null;
  }

  const addCaption = () => {
    const newOverlay: OverlayData = {
      id: nanoid(),
      type: 'caption',
      text: 'Caption',
      x: 0,
      y: 0,
      scale: 1,
    };
    setOverlays(prev => [...prev, newOverlay]);
  };

  const addSticker = () => {
    const newOverlay: OverlayData = {
      id: nanoid(),
      type: 'sticker',
      source: require('@/assets/images/icon.png'),
      x: 0,
      y: 0,
      scale: 1,
    };
    setOverlays(prev => [...prev, newOverlay]);
  };

  const updateOverlay = (updated: OverlayData) => {
    setOverlays(prev => prev.map(o => (o.id === updated.id ? updated : o)));
  };

  const handleContinue = async () => {
    if (mediaType === 'image') {
      try {
        const uri = await viewShotRef.current?.capture?.();
        if (uri) {
          router.push({
            pathname: '/modal',
            params: {
              screen: 'selectFriends',
              mediaUri: uri,
              mediaType: 'image',
            },
          });
        }
      } catch (e) {
        console.warn('ViewShot error', e);
      }
    } else {
      // video – send overlay metadata
      const overlayMeta = JSON.stringify(overlays);
      router.push({
        pathname: '/modal',
        params: {
          screen: 'selectFriends',
          mediaUri: mediaUri as string,
          mediaType: 'video',
          overlayMeta,
        },
      });
    }
  };

  const handlePostStory = async () => {
    if (!userId) return;
    let finalUri: string | undefined;
    let overlayMeta: any = overlays;

    try {
      if (mediaType === 'image') {
        finalUri = await viewShotRef.current?.capture?.();
      } else {
        finalUri = mediaUri as string;
      }

      if (!finalUri) throw new Error('No media URI');

      // Upload media to stories bucket
      const { publicUrl } = await uploadMedia('stories', finalUri);

      let thumbnailUrl: string | undefined;
      if (mediaType === 'video') {
        const thumb = await generateThumbnail(finalUri);
        if (thumb) {
          const thumbUpload = await uploadMedia('stories', thumb);
          thumbnailUrl = thumbUpload.publicUrl;
        }
      }

      await createStory({
        userId,
        mediaUrl: publicUrl,
        thumbnailUrl,
        type: mediaType as 'image' | 'video',
        metadata: mediaType === 'video' ? overlayMeta : null,
        caption: overlays.find(o => o.type === 'caption')?.text,
      });

      router.back();
    } catch (e) {
      console.warn('Story upload failed', e);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ViewShot ref={viewShotRef} style={{ flex: 1 }} options={{ result: 'tmpfile' }}>
        {mediaType === 'image' ? (
          <Image source={{ uri: mediaUri }} style={styles.media} resizeMode="contain" />
        ) : (
          <VideoPlayer uri={mediaUri} />
        )}

        {overlays.map((ov) => (
          <OverlayItem key={ov.id} data={ov} onUpdate={updateOverlay} />
        ))}
      </ViewShot>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={addCaption}>
          <Type color="#fff" size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={addSticker}>
          <Smile color="#fff" size={24} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolButton, styles.storyButton]} onPress={handlePostStory}>
          <Text style={{ color: '#fff' }}>Story</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolButton, styles.continueButton]} onPress={handleContinue}>
          <Upload size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  media: {
    flex: 1,
  },
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  toolButton: {
    padding: 12,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  storyButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
});

// video preview component
function VideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, pl => {
    pl.loop = true;
    pl.play();
  });

  return (
    <VideoView
      style={styles.media}
      player={player}
      contentFit="contain"
    />
  );
} 