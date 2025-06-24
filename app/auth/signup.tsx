import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSignUp = () => {
    setIsLoading(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      if (displayName && username && password) {
        // In a real app, this would create a user on the server
        const newUserId = Date.now().toString();
        login(
          newUserId, 
          username, 
          displayName, 
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
        );
        router.replace('/(tabs)');
      } else {
        setError('Please fill in all fields');
      }
      
      setIsLoading(false);
    }, 1000);
  };
  
  const handleLogin = () => {
    router.push('/auth/login');
  };
  
  return (
    <>
      <Stack.Screen options={{ title: 'Sign Up', headerBackTitle: 'Back' }} />
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }}
            style={styles.logo}
            resizeMode="cover"
          />
          <Text style={styles.title}>SnapConnect</Text>
          <Text style={styles.subtitle}>Join the woodworking community</Text>
        </View>
        
        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCorrect={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={isLoading}
            disabled={!displayName || !username || !password}
            style={styles.button}
            fullWidth
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.termsText}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: colors.textLight,
    fontSize: 14,
  },
  loginText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  errorText: {
    color: colors.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
  termsText: {
    color: colors.textLight,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },
});