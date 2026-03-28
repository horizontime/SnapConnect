import React, { useEffect, useState } from 'react';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "@/constants/colors";
import { ensureMediaBuckets, testSupabaseConnection, supabase } from "@/utils/supabase";
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { useAuthStore } from "@/store/authStore";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, login } = useAuthStore();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Configure Android navigation bar
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync('dark').catch(console.error);
      // Optionally set the background color to ensure visibility
      NavigationBar.setBackgroundColorAsync('#FFFFFF').catch(console.error);
    }
    
    // Ensure media buckets exist
    ensureMediaBuckets().catch(console.error);
    
    // Run network diagnostics in development
    if (__DEV__) {
      console.log('[App] Running network diagnostics...');
      testSupabaseConnection().then(result => {
        console.log('[App] Network diagnostic completed:', result ? 'SUCCESS' : 'FAILED');
      }).catch(console.error);
    }

    // Check for existing session on app launch
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[App] Session error:', error);
        // If we get an invalid refresh token error, clear the session
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          console.log('[App] Clearing invalid session');
          // Clear any stored auth state
          useAuthStore.getState().logout();
        }
        setIsReady(true);
        return;
      }
      
      if (session?.user) {
        console.log('[App] Valid session found for user:', session.user.id);
        // Session is valid, user stays logged in
      }
      
      setIsReady(true);
    });
    
    // Listen for auth state changes (including refresh token errors)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth state change:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('[App] Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        // Clear local auth state
        useAuthStore.getState().logout();
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Update local auth state if needed
        const profile = session.user.user_metadata;
        if (profile?.username) {
          useAuthStore.getState().login(
            session.user.id,
            profile.username,
            profile.display_name || profile.username,
            profile.avatar_url || ''
          );
        }
      }
    });
    
    // Also set up error handler for auth errors
    supabase.auth.onAuthStateChange((event, session) => {
      // This will catch any auth errors including refresh token issues
      if (!session && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
        console.error('[App] Auth refresh failed - clearing session');
        useAuthStore.getState().logout();
      }
    });
    
    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: true }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: true }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="story/[id]" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="friends/add" options={{ title: 'Add Friends' }} />
      <Stack.Screen name="friends/remove" options={{ title: 'Remove Friends' }} />
      <Stack.Screen name="friends/scan" options={{ title: 'Scan QR Code', presentation: 'modal' }} />
      <Stack.Screen name="profile/shoptag" options={{ title: 'My ShopTag' }} />
      <Stack.Screen name="camera/editor" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}