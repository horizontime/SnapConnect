import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Pressable } from 'react-native';
import { Image, Images, RefreshCw, Camera, Video } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import RecordingProgressRing from './RecordingProgressRing';

type CameraMode = 'picture' | 'video';

interface CameraControlsProps {
  onCapture: () => void;
  onFlip: () => void;
  onFilterToggle: () => void;
  onGalleryPick: () => void;
  isRecording: boolean;
  recordingProgress?: number;
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onCapture,
  onFlip,
  onFilterToggle,
  onGalleryPick,
  isRecording,
  recordingProgress = 0,
  cameraMode,
  setCameraMode,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onGalleryPick}>
          <Images size={24} color={colors.card} />
          <Text style={styles.controlText}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={onFlip}>
          <RefreshCw size={24} color={colors.card} />
          <Text style={styles.controlText}>Flip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={onFilterToggle}>
          <Image size={24} color={colors.card} />
          <Text style={styles.controlText}>Filters</Text>
        </TouchableOpacity>
      </View>
      
      {/* Camera mode switcher */}
      <View style={styles.modeSwitcher}>
        <TouchableOpacity 
          style={[styles.modeButton, cameraMode === 'picture' && styles.modeButtonActive]}
          onPress={() => setCameraMode('picture')}
        >
          <Camera size={20} color={cameraMode === 'picture' ? colors.primary : colors.card} />
          <Text style={[styles.modeText, cameraMode === 'picture' && styles.modeTextActive]}>
            Photo
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modeButton, cameraMode === 'video' && styles.modeButtonActive]}
          onPress={() => setCameraMode('video')}
        >
          <Video size={20} color={cameraMode === 'video' ? colors.primary : colors.card} />
          <Text style={[styles.modeText, cameraMode === 'video' && styles.modeTextActive]}>
            Video
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.bottomControls}>
        <View style={styles.captureWrapper}>
          {isRecording && (
            <RecordingProgressRing progress={recordingProgress} size={80} />
          )}
          <TouchableOpacity
            style={[
              styles.captureButton, 
              cameraMode === 'video' && styles.captureButtonVideo,
              isRecording && styles.recordingButton
            ]}
            onPress={onCapture}
          >
            {cameraMode === 'video' && isRecording && <View style={styles.recordingIndicator} />}
          </TouchableOpacity>
        </View>
        
        {cameraMode === 'video' && !isRecording && (
          <Text style={styles.helpText}>Tap to record</Text>
        )}
        {cameraMode === 'video' && isRecording && (
          <Text style={styles.helpText}>Tap to stop</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlText: {
    color: colors.card,
    fontSize: 12,
    marginTop: 4,
  },
  modeSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  modeText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '500',
  },
  modeTextActive: {
    color: colors.primary,
  },
  bottomControls: {
    alignItems: 'center',
    gap: 10,
  },
  captureWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.card,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  captureButtonVideo: {
    borderColor: colors.danger,
  },
  recordingButton: {
    borderColor: colors.danger,
  },
  recordingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.danger,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -10,
  },
  helpText: {
    color: colors.card,
    fontSize: 12,
    opacity: 0.8,
  },
});