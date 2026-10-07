import React from 'react';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Droplets,
  TrendingUp,
} from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#71717A',
        tabBarStyle: {
          backgroundColor: '#09090B',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 9.5,
          fontWeight: '600',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
      }}
    >
      {/* 1. Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Command',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={20} color={color} />
          ),
        }}
      />

      {/* 2. Training & Rest Timer */}
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color }) => (
            <Dumbbell size={20} color={color} />
          ),
        }}
      />

      {/* 3. Text Pantry & Recipes */}
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ color }) => (
            <Utensils size={20} color={color} />
          ),
        }}
      />

      {/* 4. Hydration & Weather */}
      <Tabs.Screen
        name="recovery"
        options={{
          title: 'Recovery',
          tabBarIcon: ({ color }) => (
            <Droplets size={20} color={color} />
          ),
        }}
      />

      {/* 5. Weight & Monthly Target */}
      <Tabs.Screen
        name="trajectory"
        options={{
          title: 'Trajectory',
          tabBarIcon: ({ color }) => (
            <TrendingUp size={20} color={color} />
          ),
        }}
      />

      {/* Deprecated/Redirected routes hidden from tab bar */}
      <Tabs.Screen
        name="fridge"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
