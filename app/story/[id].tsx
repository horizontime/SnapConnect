import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStoryStore } from '@/store/storyStore';
import { useFriendStore } from '@/store/friendStore';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { formatStoryTimestamp } from '@/utils/timeUtils';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getStoriesWithUserData, setCurrentStory, markStoryAsViewed, currentStoryId, currentStoryItemIndex } = useStoryStore();
  const { getFriendById } = useFriendStore();
  
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000; // 5 seconds per story
  
  const storiesWithUserData = getStoriesWithUserData();
  const story = storiesWithUserData.find(s => s.id === id);
  const storyItems = story?.items || [];
  const currentItem = storyItems[currentStoryItemIndex];
  const user = story?.user;
  
  useEffect(() => {
    if (id) {
      setCurrentStory(id, 0);
      markStoryAsViewed(id);
      startProgress();
    }
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      setCurrentStory(null);
    };
  }, [id]);
  
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
          handleNext();
          return 0;
        }
        
        return newProgress;
      });
    }, interval);
  };
  
  const handlePrevious = () => {
    if (currentStoryItemIndex > 0) {
      setCurrentStory(id, currentStoryItemIndex - 1);
      startProgress();
    } else {
      // Go to previous story or close
      router.back();
    }
  };
  
  const handleNext = () => {
    if (currentStoryItemIndex < storyItems.length - 1) {
      setCurrentStory(id, currentStoryItemIndex + 1);
      startProgress();
    } else {
      // Go to next story or close
      router.back();
    }
  };
  
  const handleClose = () => {
    router.back();
  };
  
  if (!story || !currentItem) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.progressContainer}>
        {storyItems.map((_, index) => (
          <View key={index} style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                index === currentStoryItemIndex 
                  ? { width: `${progress}%` } 
                  : index < currentStoryItemIndex 
                    ? { width: '100%' } 
                    : { width: '0%' }
              ]} 
            />
          </View>
        ))}
      </View>
      
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar source={user?.avatar || ''} size={36} />
          <View style={styles.userTextContainer}>
            <Text style={styles.username}>{user?.displayName || 'User'}</Text>
            <Text style={styles.timestamp}>{formatStoryTimestamp(currentItem.timestamp)}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color={colors.card} />
        </TouchableOpacity>
      </View>
      
      <Image
        source={{ uri: currentItem.url }}
        style={styles.image}
        contentFit="cover"
      />
      
      {currentItem.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{currentItem.caption}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.previousArea} 
        onPress={handlePrevious}
        activeOpacity={1}
      >
        <ChevronLeft size={36} color="rgba(255, 255, 255, 0.5)" style={styles.navIcon} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.nextArea} 
        onPress={handleNext}
        activeOpacity={1}
      >
        <ChevronRight size={36} color="rgba(255, 255, 255, 0.5)" style={styles.navIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
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
    paddingVertical: 12,
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
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
  image: {
    position: 'absolute',
    width,
    height,
    zIndex: -1,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  caption: {
    color: colors.card,
    fontSize: 16,
  },
  previousArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '30%',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  nextArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '70%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  navIcon: {
    opacity: 0,
  },
});