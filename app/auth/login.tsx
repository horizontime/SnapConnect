import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Stack } from 'expo-router';
import { useChatStore } from '@/store/chatStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = () => {
    setIsLoading(true);
    setError('');
    
    (async () => {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: username.trim(), // Treat username field as email for now
        password: password.trim(),
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        setError('No active session');
        setIsLoading(false);
        return;
      }

      // Fetch profile data for this user
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        login(profile.id, profile.username, profile.display_name, profile.avatar_url);
        // Initialize socket listeners after successful login
        await useChatStore.getState().initializeSocketListeners();
        router.replace('/(tabs)');
      } else {
        // If profile row missing, create a minimal one
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: username.trim(),
          display_name: username.trim(),
          avatar_url: '',
          about: '',
          favorite_woods: [],
          favorite_tools: [],
          favorite_projects: [],
        });
        login(data.user.id, username.trim(), username.trim(), '');
        // Initialize socket listeners after successful login
        await useChatStore.getState().initializeSocketListeners();
        router.replace('/(tabs)');
      }

      setIsLoading(false);
    })();
  };
  
  const handleSignUp = () => {
    router.push('/auth/signup');
  };
  
  return (
    <>
      <Stack.Screen options={{ title: 'Log In' }} />
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }}
            style={styles.logo}
            resizeMode="cover"
          />
          <Text style={styles.title}>SnapConnect</Text>
          <Text style={styles.subtitle}>For Woodworkers</Text>
        </View>
        
        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
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
              title="Log In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={!username || !password}
              style={styles.button}
              fullWidth
            />
            
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 4,
  },
  formContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 320,
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
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
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
  signUpText: {
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
});