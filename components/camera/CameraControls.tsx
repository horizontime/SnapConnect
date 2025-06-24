import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface CameraControlsProps {
  onCapture: () => void;
  onFlip: () => void;
  onFilterToggle: () => void;
  isRecording: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onCapture,
  onFlip,
  onFilterToggle,
  isRecording,
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
        <TouchableOpacity 
          style={[styles.captureButton, isRecording && styles.recordingButton]} 
          onPress={onCapture}
          activeOpacity={0.8}
        >
          {isRecording && <View style={styles.recordingIndicator} />}
        </TouchableOpacity>
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