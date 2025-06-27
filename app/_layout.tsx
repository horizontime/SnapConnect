import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { colors } from "@/constants/colors";
import { ensureMediaBuckets, testSupabaseConnection } from "@/utils/supabase";

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
    // Ensure media buckets exist
    ensureMediaBuckets().catch(console.error);
    
    // Run network diagnostics in development
    if (__DEV__) {
      console.log('[App] Running network diagnostics...');
      testSupabaseConnection().then(result => {
        console.log('[App] Network diagnostic completed:', result ? 'SUCCESS' : 'FAILED');
      }).catch(console.error);
    }
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
      <Stack.Screen name="friends/scan" options={{ title: 'Scan QR Code', presentation: 'modal' }} />
      <Stack.Screen name="profile/shoptag" options={{ title: 'My ShopTag' }} />
      <Stack.Screen name="camera/editor" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}