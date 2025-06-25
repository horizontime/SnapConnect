import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Returns the LAN IP of the Metro bundler during dev so that the
 * Socket.IO client running in Expo Go can reach your computer.
 * Falls back to localhost for web/IOS simulator, or 10.0.2.2 for Android emulator.
 */
function resolveHost() {
  // Highest-priority: explicit env var (set in app.config.* or .env)
  const explicit = process.env.EXPO_PUBLIC_SOCKET_IO_HOST;
  if (explicit) return explicit;

  // Constants.manifest?.debuggerHost is available in classic RN
  // In Expo SDK 53 we can access Constants.expoConfig?.hostUri as well.
  const hostUri = (Constants.manifest2 as any)?.developer?.hostUri || Constants.manifest?.debuggerHost || Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (Platform.OS === 'android' && host === 'localhost') {
      return '10.0.2.2'; // Android emulator alias to host machine
    }
    return host;
  }

  // Fallbacks
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
}

export const SOCKET_IO_ENDPOINT = `http://${resolveHost()}:3333`; 