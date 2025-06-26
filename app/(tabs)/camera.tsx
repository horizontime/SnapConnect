import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraControls } from '@/components/camera/CameraControls';
import { FilterSelector } from '@/components/camera/FilterSelector';
import { colors } from '@/constants/colors';
import { mockFilters } from '@/constants/mockData';
import { X } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const recordingRef = useRef<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track when a recording actually started so we can enforce a small minimum
  // duration before calling stopRecording. Stopping too early causes the native
  // layer to throw "Recording was stopped before any data could be produced".
  const recordingStartTime = useRef<number>(0);
  
  // Track focus state to control camera rendering
  const isFocused = useIsFocused();

  // Clear camera ref when screen loses focus to avoid using stale reference
  useEffect(() => {
    if (!isFocused) {
      // Stop any ongoing recording
      if (isRecording) {
        // Directly stop recording without the delay logic since we're leaving the screen
        try {
          cameraRef.current?.stopRecording();
        } catch (err) {
          // Ignore errors when cleaning up
        }
        // Cancel any pending recording promise
        recordingRef.current = null;
        setIsRecording(false);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
        setRecordingProgress(0);
      }
      // Clear ref after cleanup
      cameraRef.current = null;
    }
  }, [isFocused]);
  
  if (!cameraPermission || !microphonePermission) {
    // Permissions are still loading
    return <View style={styles.container} />;
  }
  
  if (!cameraPermission.granted || !microphonePermission.granted) {
    // Permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera and microphone for photos and videos
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={async () => {
            const camResult = await requestCameraPermission();
            const micResult = await requestMicrophonePermission();
            
            if (!camResult.granted || !micResult.granted) {
              Alert.alert(
                'Permissions Required',
                'Please enable camera and microphone permissions in your device settings to use this feature.'
              );
            }
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    
    try {
      console.log('Starting photo capture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: false,
      });
      
      console.log('Photo captured:', photo);
      
      if (photo) {
        // Small delay to ensure camera is released
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Copy to a permanent location to avoid file being deleted
        const fileName = `snap_${Date.now()}.jpg`;
        const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
        
        try {
          await FileSystem.copyAsync({
            from: photo.uri,
            to: permanentUri
          });
          console.log('Photo copied to:', permanentUri);
          
          // Navigate to Snap Editor with the permanent photo URI
          router.push({
            pathname: '/camera/editor' as any,
            params: {
              mediaUri: permanentUri,
              mediaType: 'image',
            },
          });
          console.log('Navigating to editor with URI:', permanentUri);
        } catch (copyError) {
          console.error('Failed to copy photo:', copyError);
          // Fallback to original URI
          router.push({
            pathname: '/camera/editor' as any,
            params: {
              mediaUri: photo.uri,
              mediaType: 'image',
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };
  
  const handleStartRecording = async () => {
    if (!cameraRef.current || isRecording || recordingRef.current) return;
    
    try {
      console.log('[Camera] Starting recording...');
      setIsRecording(true);
      setRecordingProgress(0);
      recordingStartTime.current = Date.now();
      progressInterval.current = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime.current;
        setRecordingProgress(Math.min(elapsed / 15000, 1));
      }, 100);
      
      // Start recording without awaiting - the promise resolves when recording stops
      recordingRef.current = cameraRef.current.recordAsync({
        maxDuration: 15, // 15 seconds max per spec
      });
      
      // Handle the result when recording stops
      recordingRef.current.then((video: any) => {
        console.log('[Camera] Recording completed:', video);
        if (video && video.uri) {
          // Navigate to Snap Editor with the video
          router.push({
            pathname: '/camera/editor' as any,
            params: {
              mediaUri: video.uri,
              mediaType: 'video',
            },
          });
        }
      }).catch((error: any) => {
        // Only log if it's not a user cancellation
        if (error.message && !error.message.includes('stopped before any data')) {
          console.error('Recording error:', error);
        }
      }).finally(() => {
        // Clean up state after recording completes or errors
        setIsRecording(false);
        recordingRef.current = null;
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
        setRecordingProgress(0);
      });
    } catch (error) {
      console.error('Failed to record video:', error);
      Alert.alert('Error', 'Failed to record video');
      setIsRecording(false);
      recordingRef.current = null;
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setRecordingProgress(0);
    }
  };
  
  const handleStopRecording = () => {
    if (!cameraRef.current || !isRecording || !recordingRef.current) return;
    
    console.log('[Camera] Stopping recording...');

    // Ensure we record long enough to produce at least one key-frame.
    const elapsed = Date.now() - recordingStartTime.current;
    // Empirically Android needs ~1s before it can flush a key-frame; give it
    // a little buffer so recordings never fail with "no data produced".
    const MIN_DURATION = 1200; // ms

    const stop = () => {
      try {
        cameraRef.current?.stopRecording();
      } catch (err) {
        console.warn('[Camera] Failed to stop recording:', err);
      }
      // State cleanup is now handled in the promise's finally block
    };

    if (elapsed < MIN_DURATION) {
      // Delay stop so we meet the minimum duration.
      setTimeout(stop, MIN_DURATION - elapsed);
    } else {
      stop();
    }
  };
  
  const handleFlip = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };
  
  const handleFilterToggle = () => {
    setShowFilters(prev => !prev);
  };
  
  const handleSelectFilter = (filterId: string | null) => {
    setSelectedFilter(filterId);
  };
  
  const handleClose = () => {
    router.back();
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
        />
      )}

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <X size={24} color={colors.card} />
      </TouchableOpacity>

      {showFilters ? (
        <View style={styles.filtersContainer}>
          <FilterSelector
            filters={mockFilters}
            selectedFilter={selectedFilter}
            onSelectFilter={handleSelectFilter}
          />
        </View>
      ) : (
        <CameraControls
          onCapture={handleCapture}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onFlip={handleFlip}
          onFilterToggle={handleFilterToggle}
          isRecording={isRecording}
          recordingProgress={recordingProgress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  permissionText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  filtersContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  recordingIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
  },
  recordingText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});