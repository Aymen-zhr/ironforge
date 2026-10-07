import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import '../global.css';

// Ensure dark mode class and interop flag are set for web and in-app webviews
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
  document.documentElement.style.setProperty('--css-interop-darkMode', 'class dark');
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
