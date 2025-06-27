import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, BackHandler, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import { useSnapStore } from '@/store/snapStore';
import { useVideoPlayer, VideoView } from 'expo-video';
import OverlayItem from '@/components/snap-editor/OverlayItem';
import { colors } from '@/constants/colors';
import * as NavigationBar from 'expo-navigation-bar';

export default function SnapViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  const { markViewed } = useSnapStore();

  const [snap, setSnap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchSnap = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('snaps').select('*').eq('id', id).single();
      if (error) {
        console.error('[SnapViewer] Error fetching snap:', error);
        setLoading(false);
        return;
      }
      setSnap(data);
      setLoading(false);
    };
    fetchSnap();
  }, [id]);

  const handleClose = useCallback(async () => {
    if (id) {
      await markViewed(id as string);
    }
    router.back();
  }, [id, markViewed, router]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [handleClose]);
  
  // Configure navigation bar for dark background
  useEffect(() => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!snap) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Snap not found</Text>
      </View>
    );
  }

  const overlayMeta = snap.overlay_meta ? JSON.parse(snap.overlay_meta) : [];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {imageLoading && snap.type === 'image' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      
      {snap.type === 'image' ? (
        <Image 
          source={{ uri: snap.media_url }} 
          style={styles.media} 
          resizeMode="contain"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            console.error('[SnapViewer] Failed to load image:', snap.media_url);
            setImageLoading(false);
          }}
        />
      ) : (
        <VideoPlayer uri={snap.media_url} />
      )}

      {/* Render overlays for video */}
      {snap.type === 'video' && overlayMeta.map((ov: any) => (
        <OverlayItem key={ov.id} data={ov} onUpdate={() => {}} editable={false} />
      ))}

      <TouchableOpacity style={styles.closeArea} onPress={handleClose} activeOpacity={1} />
    </View>
  );
}

function VideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, pl => { pl.play(); });
  return <VideoView style={StyleSheet.absoluteFill} player={player} contentFit="contain" />;
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  media: { 
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeArea: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0 
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.textLight,
    fontSize: 16,
  },
}); 