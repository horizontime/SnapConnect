import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import { useFriendStore } from '@/store/friendStore';
import { User } from '@/types';

export default function ScanFriendScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const { userId } = useAuthStore();
  const addFriendLocal = useFriendStore(state => state.addFriend);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      let friendId = data;
      const prefix = 'snapconnect://user/';
      if (data.startsWith(prefix)) {
        friendId = data.replace(prefix, '');
      }

      if (friendId === userId) {
        Alert.alert('Oops', "You can't add yourself.");
        router.back();
        return;
      }

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', friendId)
        .single();

      if (error || !profile) {
        throw new Error('User not found');
      }

      // Create bidirectional friendship - insert both directions
      const { error: error1 } = await supabase
        .from('friends')
        .insert({ user_id: userId, friend_id: friendId });

      if (error1) {
        // Check if it's a duplicate key error
        if (error1.code === '23505') {
          Alert.alert('Info', `You're already friends with @${profile.username}!`);
          router.back();
          return;
        }
        throw error1;
      }

      // Insert the reverse direction
      const { error: error2 } = await supabase
        .from('friends')
        .insert({ user_id: friendId, friend_id: userId });

      if (error2 && error2.code !== '23505') {
        // If second insert fails (and it's not a duplicate), try to clean up the first
        console.error('[ScanFriend] Failed to create reverse friendship:', error2);
        await supabase
          .from('friends')
          .delete()
          .eq('user_id', userId)
          .eq('friend_id', friendId);
        throw error2;
      }

      const newFriend: User = {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name || profile.username,
        avatar: profile.avatar_url,
        isOnline: false,
      };

      addFriendLocal(newFriend);
      Alert.alert('Success', `Added @${profile.username} as a friend!`);
      router.back();
    } catch (err: any) {
      console.error('[ScanFriend]', err.message);
      Alert.alert('Error', err.message || 'Unable to add friend.');
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={handleBarCodeScanned}
      />

      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <X size={24} color={colors.card} />
      </TouchableOpacity>

      <View style={styles.overlayContainer} pointerEvents="none">
        <View style={styles.overlay} />
        <View style={styles.frame} />
        <View style={styles.overlay} />
      </View>

      <Text style={styles.instruction}>Align QR code within the frame</Text>
    </View>
  );
}

const FRAME_SIZE = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
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
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: '100%',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  instruction: {
    position: 'absolute',
    bottom: 80,
    color: colors.card,
    fontSize: 16,
  },
}); 