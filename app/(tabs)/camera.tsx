import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraControls } from '@/components/camera/CameraControls';
import { FilterSelector } from '@/components/camera/FilterSelector';
import { colors } from '@/constants/colors';
import { mockFilters } from '@/constants/mockData';
import { X } from 'lucide-react-native';

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
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: false,
      });
      
      if (photo) {
        // Navigate to Snap Editor with the photo
        router.push({
          pathname: '/camera/editor' as any,
          params: {
            mediaUri: photo.uri,
            mediaType: 'image',
          },
        });
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };
  
  const handleStartRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    
    try {
      setIsRecording(true);
      setRecordingProgress(0);
      const startTime = Date.now();
      progressInterval.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingProgress(Math.min(elapsed / 15000, 1));
      }, 100);
      recordingRef.current = await cameraRef.current.recordAsync({
        maxDuration: 15, // 15 seconds max per spec
      });
      
      const video = await recordingRef.current;
      if (video) {
        // Navigate to Snap Editor with the video
        router.push({
          pathname: '/camera/editor' as any,
          params: {
            mediaUri: video.uri,
            mediaType: 'video',
          },
        });
      }
    } catch (error) {
      console.error('Failed to record video:', error);
      Alert.alert('Error', 'Failed to record video');
    } finally {
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
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
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
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
      />

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