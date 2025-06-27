import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }}
            style={styles.logo}
            resizeMode="cover"
          />
          
          <Text style={styles.title}>Welcome to Snap Connect</Text>
          <Text style={styles.subtitle}>Share your woodworking journey</Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Log In"
              onPress={handleLogin}
              style={styles.button}
              fullWidth
              variant="primary"
            />
            
            <Button
              title="Sign Up"
              onPress={handleSignup}
              style={styles.button}
              fullWidth
              variant="secondary"
            />
          </View>
        </View>
        
        <Text style={styles.footer}>Connect with fellow woodworkers</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },
  button: {
    marginBottom: 16,
  },
  footer: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 14,
    marginBottom: 20,
  },
}); 