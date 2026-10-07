import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Camera, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  analyzeFridgeImage,
  FridgeAnalysisResult,
  SmartRecipe,
} from '../../services/fridgeVision';
import { addMealToDailyLog } from '../../services/dietService';

const DEFAULT_RECIPES: SmartRecipe[] = [
  {
    title: 'Egg & Spinach Skillet',
    prepTime: '12 mins',
    macros: { calories: 420, protein: 38, carbs: 12, fats: 22 },
    usedIngredients: ['4 Whole Eggs', '2 Cups Fresh Spinach', '1 tbsp Olive Oil'],
    instructions: [
      'Heat olive oil in pan over medium heat.',
      'Sauté spinach until wilted.',
      'Crack eggs directly into pan, cover and cook 4 mins.',
    ],
  },
  {
    title: 'Chicken & Pepper Stir-Fry',
    prepTime: '18 mins',
    macros: { calories: 520, protein: 54, carbs: 36, fats: 14 },
    usedIngredients: ['250g Chicken Breast', '1 Bell Pepper', '1 Cup Cooked Rice'],
    instructions: [
      'Slice chicken into thin strips and sear on high.',
      'Add sliced bell pepper and toss 3 mins.',
      'Serve over warm white rice.',
    ],
  },
  {
    title: 'Greek Yogurt Power Bowl',
    prepTime: '5 mins',
    macros: { calories: 380, protein: 42, carbs: 32, fats: 8 },
    usedIngredients: ['300g Greek Yogurt 0%', '1 Banana or Berries', '1 tbsp Honey'],
    instructions: [
      'Scoop Greek yogurt into a bowl.',
      'Top with fresh fruit and honey drizzle.',
    ],
  },
];

export default function SmartPantryScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [recipes, setRecipes] = useState<SmartRecipe[]>(DEFAULT_RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState<SmartRecipe | null>(null);
  const [loggedMap, setLoggedMap] = useState<Record<string, boolean>>({});

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const handleLaunchCamera = async () => {
    triggerHaptic();
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission', 'Enable camera access to scan ingredients.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        processAndAnalyzeImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[Camera] Launch error:', err);
    }
  };

  const handleLaunchGallery = async () => {
    triggerHaptic();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        processAndAnalyzeImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[Gallery] Launch error:', err);
    }
  };

  const processAndAnalyzeImage = async (rawUri: string) => {
    setAnalyzing(true);
    try {
      const compressed = await manipulateAsync(
        rawUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.75, format: SaveFormat.JPEG }
      );

      setSelectedImage(compressed.uri);
      const res = await analyzeFridgeImage(compressed.uri);

      if (res.recipes && res.recipes.length > 0) {
        setRecipes(res.recipes.slice(0, 3));
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.warn('[processAndAnalyzeImage] Error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogToDiet = async (recipe: SmartRecipe) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await addMealToDailyLog({
        name: recipe.title,
        calories: recipe.macros.calories,
        protein_grams: recipe.macros.protein,
        carbs_grams: recipe.macros.carbs,
        fats_grams: recipe.macros.fats,
        source: 'FridgeScan',
      });

      setLoggedMap((prev) => ({ ...prev, [recipe.title]: true }));
      setSelectedRecipe(null);
    } catch (err) {
      console.warn('[handleLogToDiet] Sync error:', err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right']}>
      {/* 1. Header: Minimal clean title */}
      <View className="px-6 py-5 border-b border-white/[0.08]">
        <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
          SMART PANTRY
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Top: Clean "Take Photo" viewfinder */}
        <View className="rounded-3xl overflow-hidden bg-[#121216] border border-white/[0.08] p-5 gap-4 mb-6">
          <View className="w-full h-48 rounded-2xl overflow-hidden bg-[#09090B] border border-white/[0.06] items-center justify-center relative">
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="items-center justify-center p-4">
                <Camera size={26} color="#71717A" />
                <Text className="text-[#71717A] text-xs mt-2 font-medium">
                  Scan pantry or ingredients
                </Text>
              </View>
            )}

            {analyzing && (
              <View className="absolute inset-0 bg-[#09090B]/90 items-center justify-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white text-xs font-medium mt-2">
                  Analyzing ingredients...
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={handleLaunchCamera}
              disabled={analyzing}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              className="flex-1 py-3.5 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
                Take Photo
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLaunchGallery}
              disabled={analyzing}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              className="py-3.5 px-6 rounded-full bg-[#18181D] border border-white/[0.08] items-center justify-center"
            >
              <Text className="text-[#71717A] font-medium text-xs">
                Gallery
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Result: 3 Clean Meal Cards */}
        <View className="gap-4">
          <Text className="text-white text-sm font-bold tracking-tight">
            Suggested Meals
          </Text>

          {recipes.slice(0, 3).map((recipe, idx) => (
            <View
              key={idx}
              className="rounded-3xl p-5 bg-[#121216] border border-white/[0.08] flex-row items-center justify-between"
            >
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-base tracking-tight mb-1">
                  {recipe.title}
                </Text>
                <Text className="text-[#71717A] text-xs font-normal">
                  {recipe.macros.calories} kcal  •  {recipe.macros.protein}g Protein
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setSelectedRecipe(recipe);
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                className="py-2.5 px-4 rounded-full bg-[#18181D] border border-white/[0.08] items-center justify-center"
              >
                <Text className="text-white font-semibold text-xs">
                  View Recipe
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 4. Clean Bottom Sheet / Modal for Recipe Details */}
      <Modal
        visible={Boolean(selectedRecipe)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRecipe(null)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#121216] border-t border-white/[0.08] rounded-t-3xl p-6 max-h-[85%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-white font-bold text-xl tracking-tight">
                  {selectedRecipe?.title}
                </Text>
                <Text className="text-[#71717A] text-xs mt-1">
                  {selectedRecipe?.macros.calories} kcal  •  {selectedRecipe?.macros.protein}g Protein  •  {selectedRecipe?.macros.carbs}g Carbs
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedRecipe(null)}
                className="w-8 h-8 rounded-full bg-[#18181D] items-center justify-center"
              >
                <X size={16} color="#71717A" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {/* Ingredients */}
              <View className="mb-4">
                <Text className="text-white text-xs font-bold uppercase tracking-wider mb-2">
                  Ingredients
                </Text>
                {selectedRecipe?.usedIngredients.map((item, i) => (
                  <Text key={i} className="text-[#71717A] text-xs leading-5">
                    • {item}
                  </Text>
                ))}
              </View>

              {/* Instructions */}
              <View className="mb-4">
                <Text className="text-white text-xs font-bold uppercase tracking-wider mb-2">
                  Instructions
                </Text>
                {selectedRecipe?.instructions.map((step, i) => (
                  <Text key={i} className="text-[#71717A] text-xs leading-5 mb-1">
                    {i + 1}. {step}
                  </Text>
                ))}
              </View>
            </ScrollView>

            {/* Action: Log to Diet */}
            {selectedRecipe && (
              <Pressable
                onPress={() => handleLogToDiet(selectedRecipe)}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                className={`w-full py-3.5 rounded-full items-center justify-center ${
                  loggedMap[selectedRecipe.title]
                    ? 'bg-[#18181D] border border-white/[0.12]'
                    : 'bg-white'
                }`}
              >
                <Text
                  className={`font-bold text-xs uppercase tracking-wider ${
                    loggedMap[selectedRecipe.title] ? 'text-white' : 'text-[#09090B]'
                  }`}
                >
                  {loggedMap[selectedRecipe.title] ? 'Logged to Diet' : 'Log to Diet'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
