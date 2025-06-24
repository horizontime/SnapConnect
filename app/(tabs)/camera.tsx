import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraControls } from '@/components/camera/CameraControls';
import { FilterSelector } from '@/components/camera/FilterSelector';
import { colors } from '@/constants/colors';
import { mockFilters } from '@/constants/mockData';
import { X } from 'lucide-react-native';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.container} />;
  }
  
  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const handleCapture = async () => {
    // In a real app, this would capture a photo or video
    // For now, we'll just simulate it
    console.log('Capturing...');
    
    // Navigate to preview screen (would be implemented in a real app)
    // router.push('/preview');
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
        style={StyleSheet.absoluteFill}
        facing={facing}
      />

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
          onFlip={handleFlip}
          onFilterToggle={handleFilterToggle}
          isRecording={isRecording}
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
});