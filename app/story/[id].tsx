import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/utils/supabase';
import { colors } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { formatStoryTimestamp } from '@/utils/timeUtils';
import { X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width, height } = Dimensions.get('window');

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  type: 'image' | 'video';
  caption?: string;
  title?: string;
  description?: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const storyDuration = 5000; // 5 seconds per story
  
  useEffect(() => {
    fetchStory();
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [id]);
  
  const fetchStory = async () => {
    if (!id) return;
    
    try {
      console.log('[StoryViewer] Fetching story:', id);
      
      // Fetch story with user info
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          user:profiles!user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('[StoryViewer] Error fetching story:', error);
        setLoading(false);
        return;
      }
      
      console.log('[StoryViewer] Story data:', data);
      setStory(data);
      setLoading(false);
      
      // Mark as viewed if not the current user's story
      if (userId && data.user_id !== userId) {
        await markAsViewed(id, userId);
      }
      
      // Start progress timer for images (videos handle their own duration)
      if (data.type === 'image') {
        startProgress();
      }
    } catch (err) {
      console.error('[StoryViewer] Error:', err);
      setLoading(false);
    }
  };
  
  const markAsViewed = async (storyId: string, viewerId: string) => {
    try {
      await supabase
        .from('story_views')
        .insert({ story_id: storyId, viewer_id: viewerId });
    } catch (err) {
      console.error('[StoryViewer] Error marking as viewed:', err);
    }
  };
  
  const startProgress = () => {
    setProgress(0);
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    const interval = 10; // Update every 10ms for smooth progress
    const increment = (interval / storyDuration) * 100;
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        
        if (newProgress >= 100) {
          clearInterval(progressInterval.current!);
          handleClose();
          return 100;
        }
        
        return newProgress;
      });
    }, interval);
  };
  
  const handleClose = () => {
    router.back();
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (!story) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Story not found</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar source={story.user?.avatar_url || ''} size={36} />
          <View style={styles.userTextContainer}>
            <Text style={styles.username}>
              {story.user?.display_name || story.user?.username || 'User'}
            </Text>
            <Text style={styles.timestamp}>
              {formatStoryTimestamp(story.created_at)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color={colors.card} />
        </TouchableOpacity>
      </View>
      
      {/* Media content */}
      {imageLoading && story.type === 'image' && (
        <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      
      {story.type === 'image' ? (
        <Image
          source={{ uri: story.media_url }}
          style={styles.media}
          resizeMode="contain"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={(e) => {
            console.error('[StoryViewer] Image load error:', e.nativeEvent.error);
            setImageLoading(false);
          }}
        />
      ) : (
        <VideoPlayer uri={story.media_url} onEnd={handleClose} />
      )}
      
      {/* Caption/Title/Description overlay */}
      {(story.title || story.description || story.caption) && (
        <View style={styles.textOverlay}>
          {story.title && <Text style={styles.title}>{story.title}</Text>}
          {story.description && <Text style={styles.description}>{story.description}</Text>}
          {story.caption && <Text style={styles.caption}>{story.caption}</Text>}
        </View>
      )}
      
      {/* Tap area to close */}
      <TouchableOpacity 
        style={styles.tapArea} 
        onPress={handleClose}
        activeOpacity={1}
      />
    </View>
  );
}

function VideoPlayer({ uri, onEnd }: { uri: string; onEnd: () => void }) {
  const player = useVideoPlayer(uri, player => {
    player.play();
    // Videos will automatically stop when they end
  });
  
  // For story videos, we can use a timer based on typical video duration
  // or let the user tap to close
  useEffect(() => {
    // Auto-close after 15 seconds (max story duration)
    const timer = setTimeout(onEnd, 15000);
    return () => clearTimeout(timer);
  }, [onEnd]);
  
  return (
    <VideoView
      style={styles.media}
      player={player}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextContainer: {
    marginLeft: 12,
  },
  username: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    padding: 4,
  },
  media: {
    width,
    height,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    color: colors.card,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: colors.card,
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.9,
  },
  caption: {
    color: colors.card,
    fontSize: 16,
  },
  tapArea: {
    position: 'absolute',
    top: 100,
    bottom: 100,
    left: 0,
    right: 0,
  },
  errorText: {
    color: colors.textLight,
    fontSize: 16,
  },
});