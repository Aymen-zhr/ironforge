import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import '../global.css';
import { seedDatabaseIfEmpty } from '../db';

// Ensure dark mode class and interop flag are set for web and in-app webviews
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
  document.documentElement.style.setProperty('--css-interop-darkMode', 'class dark');
}

export default function RootLayout() {
  useEffect(() => {
    // Check and seed local SQLite database on first boot
    seedDatabaseIfEmpty().catch((err) => {
      console.warn('[RootLayout] Local SQLite boot check error:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#080808' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="nutrition" options={{ presentation: 'modal' }} />
        <Stack.Screen name="recovery" options={{ presentation: 'modal' }} />
        <Stack.Screen name="progress" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
