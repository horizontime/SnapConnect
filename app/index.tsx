import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Give the auth store time to rehydrate from AsyncStorage
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>SnapConnect</Text>
      </View>
    );
  }
  
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/auth/welcome" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
});