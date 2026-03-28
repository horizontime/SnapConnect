import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Camera, MessageSquare, Users, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom tab bar button with smaller touch feedback
const CustomTabBarButton = ({ children, onPress, accessibilityState }: any) => {
  const isSelected = accessibilityState?.selected;
  
  return (
    <View style={styles.tabButton}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.tabButtonInner,
          Platform.OS === 'ios' && pressed && styles.iosPressed
        ]}
        android_ripple={{
          color: 'rgba(0, 0, 0, 0.1)',
          borderless: false, // Keep ripple within bounds
          radius: 30, // 1.5 times bigger (was 20)
          foreground: true, // Ripple on top of content
        }}
      >
        {children}
      </Pressable>
    </View>
  );
};

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();

  // Redirect to welcome page if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/auth/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarShowLabel: false,
        tabBarStyle: {
          ...styles.tabBar,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, size }) => (
            <Camera size={size} color={color} />
          ),
          headerShown: false,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: 'Stories',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    height: 60,
  },
  header: {
    backgroundColor: colors.card,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonInner: {
    width: 60,  // 1.5x bigger (was 40)
    height: 60, // 1.5x bigger (was 40)
    borderRadius: 30, // 1.5x bigger (was 20)
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure circular clipping
  },
  iosPressed: {
    opacity: 0.6, // Just reduce opacity instead of adding background
  },
});