import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { supabase } from '@/utils/supabase';

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
    
    (async () => {
      if (!displayName || !username || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Treat username as email for now
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: username.trim(),
        password: password.trim(),
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Insert profile row
      await supabase.from('profiles').insert({
        id: data.user?.id,
        username: username.trim(),
        display_name: displayName.trim(),
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
        about: '',
        favorite_woods: [],
        favorite_tools: [],
        favorite_projects: [],
      });

      login(data.user!.id, username.trim(), displayName.trim(), 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80');
      router.replace('/(tabs)');
      setIsLoading(false);
    })();
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
            placeholder="Email"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
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