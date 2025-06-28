import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const router = useRouter();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const finishOnboarding = useCallback(async () => {
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem('onboardingHidden', 'true');
      } catch (e) {
        console.warn('Failed to save onboarding flag', e);
      }
    }
    router.replace('/(tabs)');
  }, [dontShowAgain, router]);

  const DoneButton = (props: any) => (
    <TouchableOpacity style={styles.doneButton} {...props}>
      <Text style={styles.doneButtonText}>Done</Text>
    </TouchableOpacity>
  );

  const Dots = ({ selected }: { selected: boolean }) => {
    const backgroundColor = selected ? colors.primary : colors.border;
    return <View style={{ width: 6, height: 6, borderRadius: 3, marginHorizontal: 3, backgroundColor }} />;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1 }}>
        <Onboarding
          DotComponent={Dots}
          DoneButtonComponent={DoneButton}
          onSkip={finishOnboarding}
          onDone={finishOnboarding}
          pages={[
            {
              backgroundColor: colors.background,
              image: <Ionicons name="camera" size={120} color={colors.primary} />,
              title: 'Capture & Share',
              subtitle: 'Snap photos and videos of your woodworking projects and share them with friends.',
            },
            {
              backgroundColor: colors.background,
              image: <Ionicons name="hammer" size={120} color={colors.primary} />,
              title: 'Learn & Inspire',
              subtitle: 'Discover techniques, tools, and get inspired by the community stories.',
            },
            {
              backgroundColor: colors.background,
              image: <Ionicons name="people" size={120} color={colors.primary} />,
              title: 'Connect',
              subtitle: 'Chat, collaborate and grow with fellow woodworkers around the world.',
            },
          ]}
          bottomBarHighlight={false}
        />
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setDontShowAgain(!dontShowAgain)}>
          <View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
            {dontShowAgain && <Ionicons name="checkmark" size={14} color={colors.card} />}
          </View>
          <Text style={styles.checkboxLabel}>Got it. Don't show again</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  doneButton: {
    marginHorizontal: 16,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    color: colors.text,
  },
}); 