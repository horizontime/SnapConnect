import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { Settings, QrCode, UserPlus, LogOut, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/utils/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, username, displayName, avatar, logout, updateAvatar, userId } = useAuthStore();
  const [isUploading, setIsUploading] = React.useState(false);
  
  const handleLogin = () => {
    router.push('/auth/login');
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const handleShowQR = () => {
    router.push('/profile/shoptag' as any);
  };
  
  const handleAddFriends = () => {
    router.push('/friends/add' as any);
  };
  
  const handleSettings = () => {
    // In a real app, this would navigate to settings screen
    console.log('Settings');
  };
  
  const handleImagePicker = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const uploadImage = async (uri: string) => {
    if (!userId) return;
    
    setIsUploading(true);
    try {
      // Read the image file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
      // Generate unique filename
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-content')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });
      
      if (error) {
        // If bucket doesn't exist, try creating it
        if (error.message.includes('not found')) {
          const { error: createError } = await supabase.storage.createBucket('user-content', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
          });
          
          if (!createError || createError.message === 'Bucket already exists') {
            // Retry upload
            const { data: retryData, error: retryError } = await supabase.storage
              .from('user-content')
              .upload(filePath, arrayBuffer, {
                contentType: `image/${fileExt}`,
                upsert: true,
              });
            
            if (retryError) throw retryError;
          } else {
            throw createError;
          }
        } else {
          throw error;
        }
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);
      
      // Update avatar in store
      updateAvatar(publicUrl);
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Welcome to SnapConnect</Text>
        <Text style={styles.authSubtitle}>Connect with fellow woodworkers</Text>
        <Button 
          title="Log In" 
          onPress={handleLogin} 
          style={styles.authButton}
        />
        <Button 
          title="Sign Up" 
          onPress={handleLogin} 
          variant="outline" 
          style={styles.authButton}
        />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePicker} disabled={isUploading}>
          <View style={styles.avatarContainer}>
            <Avatar 
              source={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'} 
              size={80} 
            />
            {isUploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color={colors.background} />
              </View>
            ) : (
              <View style={styles.cameraIcon}>
                <Camera size={20} color={colors.background} />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.displayName}>{displayName || 'User'}</Text>
        <Text style={styles.username}>@{username || 'username'}</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShowQR}>
          <View style={styles.actionIcon}>
            <QrCode size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>My ShopTag</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleAddFriends}>
          <View style={styles.actionIcon}>
            <UserPlus size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>Add Friends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
          <View style={styles.actionIcon}>
            <Settings size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionText}>
          Woodworking enthusiast specializing in hand-cut joinery and traditional techniques.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Woods</Text>
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Walnut</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Cherry</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Maple</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Tools</Text>
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Chisels</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Hand Planes</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Japanese Saws</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.card,
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  username: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: colors.card,
    marginTop: 1,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: colors.text,
  },
  section: {
    backgroundColor: colors.card,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 16,
    color: colors.danger,
    marginLeft: 8,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 32,
    textAlign: 'center',
  },
  authButton: {
    width: '80%',
    marginBottom: 16,
  },
});