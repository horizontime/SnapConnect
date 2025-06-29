import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, TextInput, Modal } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { Settings, QrCode, UserPlus, UserMinus, LogOut, Camera, Plus, Pencil, X, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/utils/supabase';
import { useChatStore } from '@/store/chatStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, username, displayName, avatar, logout, updateAvatar, userId } = useAuthStore();
  const [isUploading, setIsUploading] = React.useState(false);
  
  // Editable profile fields
  const [about, setAbout] = React.useState<string>('');
  const [aboutOriginal, setAboutOriginal] = React.useState<string>('');
  const [isEditingAbout, setIsEditingAbout] = React.useState<boolean>(false);

  const [favoriteWoods, setFavoriteWoods] = React.useState<string[]>([]);
  const [favoriteTools, setFavoriteTools] = React.useState<string[]>([]);
  const [favoriteProjects, setFavoriteProjects] = React.useState<string[]>([]);

  // Indicates we have fetched profile from Supabase and can now persist changes safely
  const [profileLoaded, setProfileLoaded] = React.useState<boolean>(false);

  const woodOptions = React.useMemo(() => {
    const woods = [
      'Alder',
      'Ash',
      'Balsa',
      'Beech',
      'Birch',
      'Bubinga',
      'Butternut',
      'Cedar',
      'Cherry',
      'Cocobolo',
      'Elm',
      'Hickory',
      'Ipe',
      'Mahogany',
      'Maple',
      'Oak',
      'Padauk',
      'Pine',
      'Poplar',
      'Purpleheart',
      'Rosewood',
      'Sapele',
      'Sycamore',
      'Teak',
      'Walnut',
      'Zebrawood',
    ];
    return woods.sort((a, b) => a.localeCompare(b));
  }, []);

  const toolOptions = React.useMemo(() => {
    const tools = [
      'Band Saw',
      'Block Plane',
      'Cabinet Scraper',
      'Chisels',
      'Clamps',
      'Combination Square',
      'Dovetail Saw',
      'Drill Press',
      'Hammer',
      'Hand Planes',
      'Jack Plane',
      'Japanese Saws',
      'Lathe',
      'Mallet',
      'Marking Gauge',
      'Measuring Tape',
      'Router',
      'Sanders',
      'Screwdrivers',
      'Spokeshave',
      'Square',
      'Table Saw',
    ];
    return tools.sort((a, b) => a.localeCompare(b));
  }, []);

  const projectOptions = React.useMemo(() => {
    const projects = [
      'Arbors',
      'Beds',
      'Benches',
      'Birdhouses',
      'Blanket Chests',
      'Bookcases',
      'Boxes',
      'Cabinets',
      'Chairs',
      'Coasters',
      'Coffee Tables',
      'Cutting Boards',
      'Desks',
      'Dog Houses',
      'Dressers',
      'End Tables',
      'Entryway Tables',
      'Floating Shelves',
      'Jewelry Boxes',
      'Kitchen Islands',
      'Knife Blocks',
      'Mantels',
      'Nightstands',
      'Outdoor Furniture',
      'Pergolas',
      'Picnic Tables',
      'Planters',
      'Picture Frames',
      'Rocking Chairs',
      'Serving Trays',
      'Shelves',
      'Shoe Racks',
      'Step Stools',
      'Stools',
      'Subwoofer Enclosures',
      'Tables',
      'Tool Chests',
      'Toy Chests',
      'Toys',
      'Wall Art',
      'Wardrobes',
      'Wine Cabinets',
      'Wine Racks',
      'Workbenches',
    ];
    return projects.sort((a, b) => a.localeCompare(b));
  }, []);

  const [isWoodPickerVisible, setIsWoodPickerVisible] = React.useState<boolean>(false);
  const [isToolPickerVisible, setIsToolPickerVisible] = React.useState<boolean>(false);
  const [isProjectPickerVisible, setIsProjectPickerVisible] = React.useState<boolean>(false);
  
  const handleLogout = async () => {
    try {
      // Try to clean up socket listeners, but don't let failures block logout
      await useChatStore.getState().cleanup();
    } catch (error) {
      console.warn('[Profile] Socket cleanup failed during logout:', error);
      // Continue with logout even if cleanup fails
    }
    
    // Sign out from Supabase - this should clear any invalid tokens
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Profile] Supabase signOut failed:', error);
    }
    
    // Clear local auth state
    logout();
  };
  
  const handleShowQR = () => {
    router.push('/profile/shoptag' as any);
  };
  
  const handleAddFriends = () => {
    router.push('/friends/add' as any);
  };
  
  const handleRemoveFriends = () => {
    router.push('/friends/remove' as any);
  };
  
  const handleSettings = () => {
    // In a real app, this would navigate to settings screen
    console.log('Settings');
  };
  
  const handleImagePicker = async () => {
    console.log('handleImagePicker called'); // Debug log
    try {
      // On web, go directly to gallery picker
      if (Platform.OS === 'web') {
        await pickImage('library');
        return;
      }
      
      // On mobile, show action sheet to choose between camera and gallery
      Alert.alert(
        'Update Profile Picture',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: () => pickImage('camera') },
          { text: 'Choose from Gallery', onPress: () => pickImage('library') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error showing picker options:', error);
      if (Platform.OS === 'web') {
        // For web, use console.error instead of Alert
        console.error('Failed to show options. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to show options. Please try again.');
      }
    }
  };
  
  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Skip permission requests on web - they're handled by the browser
      if (Platform.OS !== 'web') {
        // Request permissions based on source
        if (source === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your camera to take a profile picture.');
            return;
          }
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
            return;
          }
        }
      }
      
      // Launch appropriate picker
      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
      
      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS === 'web') {
        console.error('Failed to pick image. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  };
  
  const uploadImage = async (uri: string) => {
    if (!userId) {
      if (Platform.OS === 'web') {
        console.error('User ID not found. Please log in again.');
      } else {
        Alert.alert('Error', 'User ID not found. Please log in again.');
      }
      return;
    }
    
    setIsUploading(true);
    try {
      // Check if Supabase is properly configured
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      let arrayBuffer: ArrayBuffer;
      
      if (Platform.OS === 'web') {
        // On web, the URI is actually a blob URL
        const response = await fetch(uri);
        const blob = await response.blob();
        arrayBuffer = await blob.arrayBuffer();
      } else {
        // On mobile, use FileSystem to read as base64
        const base64 = await FileSystem.readAsStringAsync(uri, { 
          encoding: FileSystem.EncodingType.Base64 
        });
        // Convert base64 to ArrayBuffer
        arrayBuffer = decode(base64);
      }
      
      // Generate unique filename
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-content')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);
      
      console.log('Avatar uploaded successfully:', publicUrl);
      
      // Update avatar in store
      updateAvatar(publicUrl);
      
      // Update the user profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      
      if (updateError) {
        console.warn('Failed to update profile in database:', updateError);
        // Don't throw here as the image was uploaded successfully
      }
      
      if (Platform.OS === 'web') {
        // On web, show success in console
        console.log('Profile picture updated successfully!');
        // Optionally, you could show a toast notification here
      } else {
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (Platform.OS === 'web') {
        console.error(`Failed to upload image: ${errorMessage}`);
        // Optionally, you could show a toast notification here
      } else {
        Alert.alert('Upload Failed', `Failed to upload image: ${errorMessage}`);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const confirmRemove = (
    item: string,
    removeCb: () => void,
    type: 'wood' | 'tool' | 'project'
  ) => {
    Alert.alert(
      `Remove ${item}?`,
      `Are you sure you want to remove this ${type} from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: removeCb },
      ]
    );
  };

  const handleRemoveWood = (wood: string) => {
    confirmRemove(wood, () =>
      setFavoriteWoods((prev) => prev.filter((w) => w !== wood)), 'wood');
  };

  const handleRemoveTool = (tool: string) => {
    confirmRemove(tool, () =>
      setFavoriteTools((prev) => prev.filter((t) => t !== tool)), 'tool');
  };

  const handleRemoveProject = (proj: string) => {
    confirmRemove(proj, () =>
      setFavoriteProjects((prev) => prev.filter((p) => p !== proj)), 'project');
  };
  
  // --- Supabase Profile Helpers ---
  const updateProfileField = React.useCallback(async (fields: Partial<{ about: string; favorite_woods: string[]; favorite_tools: string[]; favorite_projects: string[] }>) => {
    if (!userId) return;
    const { error } = await supabase.from('profiles').update(fields).eq('id', userId);
    if (error) {
      console.error('[Profile] Failed to update profile field(s):', error);
    }
  }, [userId]);

  // Fetch profile preferences on mount / when user changes
  React.useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('about, favorite_woods, favorite_tools, favorite_projects')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Profile] Failed to fetch profile:', error);
        return;
      }

      if (data) {
        setAbout(data.about ?? '');
        setAboutOriginal(data.about ?? '');
        setFavoriteWoods(data.favorite_woods ?? []);
        setFavoriteTools(data.favorite_tools ?? []);
        setFavoriteProjects(data.favorite_projects ?? []);
      }

      setProfileLoaded(true);
    })();
  }, [userId]);

  // Persist favorites when they change
  React.useEffect(() => {
    if (!userId || !profileLoaded) return;
    updateProfileField({ favorite_woods: favoriteWoods });
  }, [favoriteWoods, updateProfileField, userId, profileLoaded]);

  React.useEffect(() => {
    if (!userId || !profileLoaded) return;
    updateProfileField({ favorite_tools: favoriteTools });
  }, [favoriteTools, updateProfileField, userId, profileLoaded]);

  React.useEffect(() => {
    if (!userId || !profileLoaded) return;
    updateProfileField({ favorite_projects: favoriteProjects });
  }, [favoriteProjects, updateProfileField, userId, profileLoaded]);

  const handleStartEditAbout = () => {
    // Backup current about value so we can restore on cancel
    setAboutOriginal(about);
    setIsEditingAbout(true);
  };

  const handleSaveAbout = async () => {
    await updateProfileField({ about });
    setIsEditingAbout(false);
  };

  const handleCancelEditAbout = () => {
    // Revert to original value without saving
    setAbout(aboutOriginal);
    setIsEditingAbout(false);
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleImagePicker} 
          disabled={isUploading}
          style={styles.avatarTouchable}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <Avatar 
              source={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'} 
              size={80} 
            />
            {isUploading ? (
              <View style={styles.uploadingOverlay} pointerEvents="none">
                <ActivityIndicator color={colors.background} />
              </View>
            ) : (
              <View style={styles.cameraIcon} pointerEvents="none">
                <Camera size={20} color={colors.background} />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.displayName}>{displayName || 'User'}</Text>
        <Text style={styles.username}>
          {username
            ? username.includes('@')
              ? username // If it looks like an email, don't prepend another @
              : `@${username}`
            : '@username'}
        </Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddFriends}>
          <View style={styles.actionIcon}>
            <UserPlus size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>Add Friends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleRemoveFriends}>
          <View style={styles.actionIcon}>
            <UserMinus size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>Remove Friends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
          <View style={styles.actionIcon}>
            <Settings size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
      </View>
      
      {/* About Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>About</Text>
          {isEditingAbout ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={handleSaveAbout} style={{ marginRight: 8 }}>
                <Save size={16} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelEditAbout}>
                <X size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleStartEditAbout}>
              <Pencil size={16} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        {isEditingAbout ? (
          <TextInput
            style={styles.aboutInput}
            multiline
            value={about}
            onChangeText={setAbout}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.textLight}
            textAlignVertical="top"
            textAlign="left"
          />
        ) : (
          <Text style={styles.sectionText}>{about}</Text>
        )}
      </View>
      
      {/* Favorite Woods Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Favorite Woods</Text>
        </View>
        <View style={styles.tagsContainer}>
          {favoriteWoods.map((wood) => (
            <TouchableOpacity
              key={wood}
              style={styles.tag}
              onPress={() => handleRemoveWood(wood)}
            >
              <Text style={styles.tagText}>{wood}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setIsWoodPickerVisible(true)}
            style={styles.addTagCircle}
          >
            <Plus size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Wood Picker Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isWoodPickerVisible}
        onRequestClose={() => setIsWoodPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Wood Species</Text>
              <TouchableOpacity onPress={() => setIsWoodPickerVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {woodOptions.map((wood) => (
                <TouchableOpacity
                  key={wood}
                  style={styles.modalOption}
                  onPress={() => {
                    setFavoriteWoods((prev) => (prev.includes(wood) ? prev : [...prev, wood]));
                    setIsWoodPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{wood}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Favorite Tools Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Favorite Tools</Text>
        </View>
        <View style={styles.tagsContainer}>
          {favoriteTools.map((tool) => (
            <TouchableOpacity
              key={tool}
              style={styles.tag}
              onPress={() => handleRemoveTool(tool)}
            >
              <Text style={styles.tagText}>{tool}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setIsToolPickerVisible(true)}
            style={styles.addTagCircle}
          >
            <Plus size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tool Picker Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isToolPickerVisible}
        onRequestClose={() => setIsToolPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tool</Text>
              <TouchableOpacity onPress={() => setIsToolPickerVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {toolOptions.map((tool) => (
                <TouchableOpacity
                  key={tool}
                  style={styles.modalOption}
                  onPress={() => {
                    setFavoriteTools((prev) => (prev.includes(tool) ? prev : [...prev, tool]));
                    setIsToolPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{tool}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Favorite Projects Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Favorite Project Types</Text>
        </View>
        <View style={styles.tagsContainer}>
          {favoriteProjects.map((proj) => (
            <TouchableOpacity
              key={proj}
              style={styles.tag}
              onPress={() => handleRemoveProject(proj)}
            >
              <Text style={styles.tagText}>{proj}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setIsProjectPickerVisible(true)}
            style={styles.addTagCircle}
          >
            <Plus size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Project Picker Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isProjectPickerVisible}
        onRequestClose={() => setIsProjectPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Project Type</Text>
              <TouchableOpacity onPress={() => setIsProjectPickerVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {projectOptions.map((proj) => (
                <TouchableOpacity
                  key={proj}
                  style={styles.modalOption}
                  onPress={() => {
                    setFavoriteProjects((prev) => (prev.includes(proj) ? prev : [...prev, proj]));
                    setIsProjectPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{proj}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
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
  avatarTouchable: {
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
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
  addTagCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    color: colors.text,
    textAlignVertical: 'top',
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalOption: {
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 40,
    marginBottom: 40,
    alignSelf: 'center',
    width: '70%',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    color: colors.danger,
    marginLeft: 8,
  },
});