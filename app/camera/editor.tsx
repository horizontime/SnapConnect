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
import { Type, Smile, Download, Send, Plus } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
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

  const handleSaveToDevice = async () => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to save media.',
          [{ text: 'OK' }]
        );
        return;
      }

      let uriToSave: string;

      if (mediaType === 'image') {
        // For images, capture the view with overlays
        const tempUri = await viewShotRef.current?.capture?.();
        
        if (!tempUri) {
          throw new Error('Failed to capture image');
        }

        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(tempUri);
        
        // Create album if it doesn't exist
        const album = await MediaLibrary.getAlbumAsync('Gauntlet');
        if (album === null) {
          await MediaLibrary.createAlbumAsync('Gauntlet', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert('Success', 'Image saved to your gallery!', [{ text: 'OK' }]);
      } else {
        // For videos, save the original video
        // Note: Overlays won't be preserved in the saved video
        const asset = await MediaLibrary.createAssetAsync(mediaUri as string);
        
        // Create album if it doesn't exist
        const album = await MediaLibrary.getAlbumAsync('Gauntlet');
        if (album === null) {
          await MediaLibrary.createAlbumAsync('Gauntlet', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert(
          'Success', 
          'Video saved to your gallery!\n\nNote: Overlays are not included in saved videos.', 
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to save media:', error);
      Alert.alert('Error', 'Failed to save media. Please try again.', [{ text: 'OK' }]);
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
        styles.toolbarContainer,
        {
          paddingBottom: insets.bottom, // ensure content sits above system nav bar
        },
      ]}>
        {/* Top row - editing tools */}
        <View style={styles.editingToolsRow}>
          <TouchableOpacity style={styles.toolButton} onPress={addCaption}>
            <Type color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={showEmojis}>
            <Smile color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={handleSaveToDevice}>
            <Download color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {/* Bottom row - action buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.storyButton} onPress={handlePostStory}>
            <Plus color="#fff" size={20} />
            <Text style={styles.buttonText}>Story</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sendButton} onPress={handleContinue}>
            <Send color="#fff" size={20} />
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
        </View>
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
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 12,
  },
  editingToolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  toolButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  storyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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