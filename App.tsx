import "./global.css";
import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  Pressable,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  LayoutDashboard,
  Refrigerator,
  Dumbbell,
  Flame,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import CommandDeckScreen from "./app/(tabs)/index";
import SmartPantryScreen from "./app/(tabs)/fridge";
import HypertrophyForgeScreen from "./app/(tabs)/workout";
import MacroConsoleScreen from "./app/(tabs)/diet";
import { subscribeNavigation, TabScreen } from "./services/navigationService";

function NavigationShell() {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState<TabScreen>("index");

  useEffect(() => {
    // Listen for programmatic tab switches (e.g. from Command Deck buttons)
    const unsubscribe = subscribeNavigation((tab) => {
      setCurrentTab(tab);
    });
    return unsubscribe;
  }, []);

  const renderActiveScreen = () => {
    switch (currentTab) {
      case "fridge":
        return <SmartPantryScreen />;
      case "workout":
        return <HypertrophyForgeScreen />;
      case "diet":
        return <MacroConsoleScreen />;
      case "index":
      default:
        return <CommandDeckScreen />;
    }
  };

  const navItems: {
    id: TabScreen;
    label: string;
    icon: React.ComponentType<{ size: number; color: string }>;
  }[] = [
    { id: "index", label: "Command", icon: LayoutDashboard },
    { id: "fridge", label: "Pantry", icon: Refrigerator },
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "diet", label: "Diet", icon: Flame },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#050507" }}>
      {/* 1. Active Tab Screen Container */}
      <View style={{ flex: 1 }}>
        {renderActiveScreen()}
      </View>

      {/* 2. IronForge 2.0 Bottom Bar: Exact Spec */}
      <View
        style={{
          backgroundColor: "#0E0E12",
          borderTopColor: "rgba(255, 255, 255, 0.06)",
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            height: 64,
            paddingHorizontal: 8,
          }}
        >
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            const activeColor = "#E11D48";
            const inactiveColor = "#475569";

            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  } catch {}
                  setCurrentTab(item.id);
                }}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                    marginHorizontal: 4,
                    borderRadius: 14,
                    backgroundColor: isActive ? "rgba(225, 29, 72, 0.12)" : "transparent",
                    borderWidth: 1,
                    borderColor: isActive ? "rgba(225, 29, 72, 0.35)" : "transparent",
                    opacity: pressed ? 0.75 : 1,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  },
                ]}
              >
                <IconComponent
                  size={20}
                  color={isActive ? activeColor : inactiveColor}
                />
                <Text
                  style={{
                    fontSize: 9.5,
                    fontWeight: isActive ? "800" : "600",
                    color: isActive ? "#F8FAFC" : inactiveColor,
                    marginTop: 3,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationShell />
    </SafeAreaProvider>
  );
}
