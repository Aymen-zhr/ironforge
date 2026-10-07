import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { getUserProfile } from '../services/userMetrics';

export default function RootGateway() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    async function checkState() {
      try {
        const profile = await getUserProfile();
        if (!profile || !profile.weightKg) {
          setTarget('/onboarding');
        } else {
          setTarget('/(tabs)');
        }
      } catch {
        setTarget('/(tabs)');
      }
    }
    checkState();
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090B', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
