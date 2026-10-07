import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF5A1F',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#090A0D',
          borderTopColor: 'rgba(255, 255, 255, 0.07)',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          marginTop: -2,
        },
      }}
    >
      {/* 1. Command Deck */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Deck',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Workout Forge */}
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Train',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'barbell' : 'barbell-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* 3. Kitchen & Pantry */}
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Kitchen',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* 4. Recovery & Wellness */}
      <Tabs.Screen
        name="recovery"
        options={{
          title: 'Recovery',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'pulse' : 'pulse-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* 5. Progress & 1RM Vault */}
      <Tabs.Screen
        name="trajectory"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'trending-up' : 'trending-up-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
