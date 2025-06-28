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
import * as NavigationBar from 'expo-navigation-bar';
import * as ImagePicker from 'expo-image-picker';

type CameraMode = 'picture' | 'video';

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
  const [cameraMode, setCameraMode] = useState<CameraMode>('picture');
  // Track when a recording actually started so we can enforce a small minimum
  // duration before calling stopRecording. Stopping too early causes the native
  // layer to throw "Recording was stopped before any data could be produced".
  const recordingStartTime = useRef<number>(0);
  
  // Track focus state to control camera rendering
  const isFocused = useIsFocused();

  // Stop recording if camera mode changes
  useEffect(() => {
    if (isRecording && cameraMode === 'picture') {
      console.log('[Camera] Stopping recording due to mode change');
      handleCapture();
    }
  }, [cameraMode]);

  useEffect(() => {
    if (isFocused && Platform.OS === 'android') {
      // Set dark buttons for camera background
      NavigationBar.setButtonStyleAsync('dark').catch(console.error);
      NavigationBar.setBackgroundColorAsync('#000000').catch(console.error);
    }
    
    // Revert to default dark buttons when leaving
    return () => {
      if (Platform.OS === 'android') {
        NavigationBar.setButtonStyleAsync('dark').catch(console.error);
        NavigationBar.setBackgroundColorAsync('#FFFFFF').catch(console.error);
      }
    };
  }, [isFocused]);

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
    
    if (cameraMode === 'picture') {
      // Take photo
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
    } else {
      // Video mode - toggle recording
      if (!isRecording) {
        // Start recording
        console.log('[Camera] Starting video recording...');
        setIsRecording(true);
        setRecordingProgress(0);
        recordingStartTime.current = Date.now();
        
        // Start progress interval
        progressInterval.current = setInterval(() => {
          const elapsed = Date.now() - recordingStartTime.current;
          const progress = Math.min(elapsed / 15000, 1); // 15 seconds max
          setRecordingProgress(progress);
          
          // Auto-stop at max duration
          if (progress >= 1) {
            handleCapture(); // Call this function again to stop
          }
        }, 100);
        
        // Start recording in background (don't await)
        cameraRef.current.recordAsync({
          maxDuration: 15,
        }).then(async (video: any) => {
          console.log('[Camera] Video recording completed:', video);
          
          // Clean up state first
          setIsRecording(false);
          recordingRef.current = null;
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
          }
          setRecordingProgress(0);
          
          if (video && video.uri) {
            // Small delay to ensure clean state
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Copy to permanent location
            const fileName = `snap_${Date.now()}.mp4`;
            const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
            
            try {
              await FileSystem.copyAsync({
                from: video.uri,
                to: permanentUri
              });
              
              console.log('[Camera] Navigating to editor with video:', permanentUri);
              
              // Navigate to editor
              router.push({
                pathname: '/camera/editor' as any,
                params: {
                  mediaUri: permanentUri,
                  mediaType: 'video',
                },
              });
            } catch (copyError) {
              console.error('Failed to copy video:', copyError);
              // Fallback
              router.push({
                pathname: '/camera/editor' as any,
                params: {
                  mediaUri: video.uri,
                  mediaType: 'video',
                },
              });
            }
          }
        }).catch((error: any) => {
          console.error('[Camera] Recording error:', error);
          
          // Clean up state
          setIsRecording(false);
          recordingRef.current = null;
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
          }
          setRecordingProgress(0);
          
          if (!error.message?.includes('stopped before any data')) {
            Alert.alert('Error', 'Failed to record video');
          }
        });
        
        // Store the promise reference so we can check it later
        recordingRef.current = true; // Just use as a flag
      } else {
        // Stop recording
        console.log('[Camera] Stopping video recording...');
        const elapsed = Date.now() - recordingStartTime.current;
        
        if (elapsed < 1000) {
          // Too short, wait a bit
          setTimeout(() => {
            cameraRef.current?.stopRecording();
          }, 1000 - elapsed);
        } else {
          cameraRef.current?.stopRecording();
        }
      }
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
  
  const handleGalleryPick = async () => {
    try {
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.9,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Copy to a permanent location to avoid file being deleted
        const fileName = asset.type === 'video' 
          ? `snap_${Date.now()}.mp4` 
          : `snap_${Date.now()}.jpg`;
        const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
        
        try {
          await FileSystem.copyAsync({
            from: asset.uri,
            to: permanentUri
          });
          
          // Navigate to Snap Editor with the media
          router.push({
            pathname: '/camera/editor' as any,
            params: {
              mediaUri: permanentUri,
              mediaType: asset.type === 'video' ? 'video' : 'image',
            },
          });
        } catch (copyError) {
          console.error('Failed to copy media:', copyError);
          // Fallback to original URI
          router.push({
            pathname: '/camera/editor' as any,
            params: {
              mediaUri: asset.uri,
              mediaType: asset.type === 'video' ? 'video' : 'image',
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to pick image from gallery:', error);
      Alert.alert('Error', 'Failed to pick media from gallery');
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode={cameraMode === 'video' ? 'video' : 'picture'}
          videoQuality="1080p"
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

      {showFilters && (
        <TouchableOpacity 
          style={styles.closeFiltersButton} 
          onPress={() => setShowFilters(false)}
        >
          <X size={24} color={colors.card} />
        </TouchableOpacity>
      )}

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
          onFlip={handleFlip}
          onFilterToggle={handleFilterToggle}
          onGalleryPick={handleGalleryPick}
          isRecording={isRecording}
          recordingProgress={recordingProgress}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
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
  closeFiltersButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 11,
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