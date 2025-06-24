import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { Settings, QrCode, UserPlus, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, username, displayName, avatar, logout } = useAuthStore();
  
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
        <Avatar 
          source={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'} 
          size={80} 
        />
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