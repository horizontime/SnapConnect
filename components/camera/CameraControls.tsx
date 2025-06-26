import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Pressable } from 'react-native';
import { Image } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import RecordingProgressRing from './RecordingProgressRing';

interface CameraControlsProps {
  onCapture: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFlip: () => void;
  onFilterToggle: () => void;
  isRecording: boolean;
  recordingProgress?: number;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onCapture,
  onStartRecording,
  onStopRecording,
  onFlip,
  onFilterToggle,
  isRecording,
  recordingProgress = 0,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onFlip}>
          <Text style={styles.controlText}>Flip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={onFilterToggle}>
          <Image size={24} color={colors.card} />
          <Text style={styles.controlText}>Filters</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.bottomControls}>
        <View style={styles.captureWrapper}>
          {isRecording && (
            <RecordingProgressRing progress={recordingProgress} size={80} />
          )}
          <Pressable
            style={[styles.captureButton, isRecording && styles.recordingButton]}
            onPress={!isRecording ? onCapture : undefined}
            onLongPress={!isRecording ? onStartRecording : undefined}
            onPressOut={isRecording ? onStopRecording : undefined}
            delayLongPress={200}
          >
            {isRecording && <View style={styles.recordingIndicator} />}
          </Pressable>
        </View>
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
    marginBottom: 30,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlText: {
    color: colors.card,
    fontSize: 12,
    marginTop: 4,
  },
  bottomControls: {
    alignItems: 'center',
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
});