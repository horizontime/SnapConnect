import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import OverlayItem, { OverlayData } from '@/components/snap-editor/OverlayItem';
import TextEditor from '@/components/snap-editor/TextEditor';
import EmojiPicker from '@/components/snap-editor/EmojiPicker';
import { nanoid } from 'nanoid/non-secure';
import { Type, Smile } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as NavigationBar from 'expo-navigation-bar';
import { colors } from '@/constants/colors';

export default function SnapEditorScreen() {
  const { mediaUri, mediaType } = useLocalSearchParams<{
    mediaUri: string;
    mediaType: 'image' | 'video';
  }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  const { width, height } = useWindowDimensions();

  const [overlays, setOverlays] = React.useState<OverlayData[]>([]);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<OverlayData | null>(null);
  const viewShotRef = React.useRef<ViewShot>(null);

  // Safe area for bottom navigation / gesture bar
  const insets = useSafeAreaInsets();

  // Debug logging
  React.useEffect(() => {
    console.log('Editor received mediaUri:', mediaUri);
    console.log('Editor received mediaType:', mediaType);
  }, [mediaUri, mediaType]);
  
  // Configure navigation bar for dark background
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync('light').catch(console.error);
      NavigationBar.setBackgroundColorAsync('#000000').catch(console.error);
    }
    
    return () => {
      if (Platform.OS === 'android') {
        NavigationBar.setButtonStyleAsync('dark').catch(console.error);
        NavigationBar.setBackgroundColorAsync('#FFFFFF').catch(console.error);
      }
    };
  }, []);

  if (!mediaUri) {
    console.log('No mediaUri provided to editor');
    return null;
  }

  const addCaption = () => {
    setEditingOverlay(null);
    setShowTextEditor(true);
  };

  const handleTextSave = (text: string, color: string, fontSize: number, fontFamily: string) => {
    if (editingOverlay) {
      // Update existing caption
      setOverlays(prev => prev.map(o => 
        o.id === editingOverlay.id 
          ? { ...o, text, color, fontSize, fontFamily }
          : o
      ));
    } else {
      // Create new caption
      const newOverlay: OverlayData = {
        id: nanoid(),
        type: 'caption',
        text,
        color,
        fontSize,
        fontFamily,
        x: width / 2 - 100, // Center horizontally (approximate)
        y: height / 2 - 50, // Center vertically (approximate)
        scale: 1,
      };
      setOverlays(prev => [...prev, newOverlay]);
    }
  };

  const addSticker = () => {
    const newOverlay: OverlayData = {
      id: nanoid(),
      type: 'sticker',
      source: require('@/assets/images/icon.png'),
      x: width / 2 - 50, // Center horizontally (sticker is 100px wide)
      y: height / 2 - 50, // Center vertically (sticker is 100px tall)
      scale: 1,
    };
    setOverlays(prev => [...prev, newOverlay]);
  };

  const showEmojis = () => {
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    const newOverlay: OverlayData = {
      id: nanoid(),
      type: 'emoji',
      text: emoji,
      x: width / 2 - 32, // Center horizontally (emoji is ~64px at default scale)
      y: height / 2 - 32, // Center vertically
      scale: 1,
    };
    setOverlays(prev => [...prev, newOverlay]);
  };

  const updateOverlay = (updated: OverlayData) => {
    setOverlays(prev => prev.map(o => (o.id === updated.id ? updated : o)));
  };

  const deleteOverlay = (id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
  };

  const editTextOverlay = (overlay: OverlayData) => {
    if (overlay.type === 'caption') {
      setEditingOverlay(overlay);
      setShowTextEditor(true);
    }
  };

  const handleContinue = async () => {
    console.log('handleContinue called. mediaType:', mediaType);
    if (mediaType === 'image') {
      try {
        // Capture the view
        const tempUri = await viewShotRef.current?.capture?.();
        
        if (tempUri) {
          console.log('Captured temp image URI:', tempUri);
          
          // Small delay to ensure file is fully written
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Copy to a persistent location
          const fileName = `snap_${Date.now()}.png`;
          const persistentUri = `${FileSystem.documentDirectory}${fileName}`;
          
          console.log('Copying to persistent location:', persistentUri);
          await FileSystem.copyAsync({
            from: tempUri,
            to: persistentUri
          });
          
          // Verify the file exists at the new location
          const fileInfo = await FileSystem.getInfoAsync(persistentUri);
          
          if (!fileInfo.exists) {
            console.error('Failed to copy file to persistent location');
            return;
          }
          
          console.log('File copied successfully, size:', fileInfo.size);
          
          // Construct URL with query parameters using the persistent URI
          const encodedUri = encodeURIComponent(persistentUri);
          const url = `/modal?mode=selectFriends&mediaUri=${encodedUri}&mediaType=image` as const;
          console.log('Navigating to:', url);
          router.push(url as any);
        }
      } catch (e) {
        console.error('ViewShot error:', e);
      }
    } else {
      // video – send overlay metadata
      const overlayMeta = JSON.stringify(overlays);
      const encodedUri = encodeURIComponent(mediaUri as string);
      const encodedOverlay = encodeURIComponent(overlayMeta);
      const url = `/modal?mode=selectFriends&mediaUri=${encodedUri}&mediaType=video&overlayMeta=${encodedOverlay}` as const;
      console.log('Navigating to video modal:', url);
      router.push(url as any);
    }
  };

  const handlePostStory = async () => {
    if (!userId) return;

    try {
      let finalUri = mediaUri as string;
      
      // For images, we need to capture the view with overlays
      if (mediaType === 'image' && overlays.length > 0) {
        const tempUri = await viewShotRef.current?.capture?.();
        
        if (tempUri) {
          // Copy to persistent location
          const fileName = `story_preview_${Date.now()}.png`;
          finalUri = `${FileSystem.documentDirectory}${fileName}`;
          
          await FileSystem.copyAsync({
            from: tempUri,
            to: finalUri
          });
        }
      }

      // Navigate to story creation page
      const overlayMeta = overlays.length > 0 ? JSON.stringify(overlays) : undefined;
      const encodedUri = encodeURIComponent(finalUri);
      const params: any = {
        mediaUri: encodedUri,
        mediaType,
      };
      
      if (overlayMeta) {
        params.overlayMeta = encodeURIComponent(overlayMeta);
      }
      
      router.push({
        pathname: '/story/create' as any,
        params,
      });
    } catch (e) {
      console.error('Failed to prepare story:', e);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ViewShot 
        ref={viewShotRef} 
        style={{ flex: 1 }} 
        options={{ 
          format: 'png', 
          quality: 0.9,
          result: 'tmpfile'
        }}
      >
        {mediaType === 'image' ? (
          <Image 
            source={{ uri: mediaUri }} 
            style={styles.media} 
            resizeMode="contain"
            onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
            onLoad={() => console.log('Image loaded successfully')}
          />
        ) : (
          <VideoPlayer uri={mediaUri} />
        )}

        {overlays.map((ov) => (
          <OverlayItem 
            key={ov.id} 
            data={ov} 
            onUpdate={updateOverlay}
            onDelete={deleteOverlay}
            onEdit={editTextOverlay}
          />
        ))}
      </ViewShot>

      {/* Toolbar */}
      <View style={[
        styles.toolbar,
        {
          paddingBottom: 12 + insets.bottom, // ensure content sits above system nav bar
          bottom: insets.bottom, // lift the toolbar when a bottom inset is present
        },
      ]}>
        <TouchableOpacity style={styles.toolButton} onPress={addCaption}>
          <Type color="#fff" size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={showEmojis}>
          <Smile color="#fff" size={24} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolButton, styles.storyButton]} onPress={handlePostStory}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>For Stories</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolButton, styles.continueButton]} onPress={handleContinue}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Send To</Text>
        </TouchableOpacity>
      </View>

      {showTextEditor && (
        <TextEditor
          visible={showTextEditor}
          initialText={editingOverlay?.text}
          initialColor={editingOverlay?.color}
          initialFontSize={editingOverlay?.fontSize}
          initialFontFamily={editingOverlay?.fontFamily}
          onClose={() => {
            setShowTextEditor(false);
            setEditingOverlay(null);
          }}
          onSave={handleTextSave}
        />
      )}

      {showEmojiPicker && (
        <EmojiPicker
          visible={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelectEmoji={handleEmojiSelect}
        />
      )}
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
    width: '100%',
    height: '100%',
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