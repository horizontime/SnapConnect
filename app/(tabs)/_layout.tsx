import React from 'react';
import { Tabs } from 'expo-router';
import { Camera, MessageSquare, Users, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
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
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: 'Stories',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
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
});