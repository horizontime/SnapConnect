import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { colors } from "@/constants/colors";
import * as NavigationBar from "expo-navigation-bar";
import { Platform } from "react-native";
import { ensureMediaBuckets } from "@/utils/supabase";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
    // Set Android system navigation bar background color to light gray on app launch
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#D3D3D3'); // Light gray
      NavigationBar.setButtonStyleAsync('dark');
    }
    
    // Ensure storage buckets exist
    ensureMediaBuckets().catch(console.error);
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
      <Stack.Screen name="auth/login" options={{ headerShown: true }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: true }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="story/[id]" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="friends/add" options={{ title: 'Add Friends' }} />
      <Stack.Screen name="friends/scan" options={{ title: 'Scan QR Code', presentation: 'modal' }} />
      <Stack.Screen name="profile/shoptag" options={{ title: 'My ShopTag' }} />
      <Stack.Screen name="camera/editor" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}