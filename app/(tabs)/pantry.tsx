import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  X,
  Sparkles,
  Clock,
  Utensils,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  generateRecipesFromIngredients,
  SmartRecipe,
} from '../../services/fridgeVision';
import { addMealToDailyLog } from '../../services/dietService';

const SUGGESTED_STAPLES = [
  'Chicken Breast',
  'Eggs',
  'Spinach',
  'White Rice',
  'Greek Yogurt',
  'Ground Beef',
  'Tuna',
  'Oats',
  'Bell Peppers',
];

const DEFAULT_PANTRY_RECIPES: SmartRecipe[] = [
  {
    title: 'Anabolic Chicken & Jasmine Rice Skillet',
    prepTime: '10 mins',
    macros: { calories: 540, protein: 52, carbs: 48, fats: 12 },
    usedIngredients: ['250g Chicken Breast (Diced)', '1.5 Cups Jasmine Rice (Cooked)', '1 Cup Bell Peppers', '1 tbsp Olive Oil'],
    instructions: [
      'Heat 1 tbsp olive oil in large non-stick skillet over high heat.',
      'Sear diced chicken breast for 6-8 minutes until golden and cooked through.',
      'Add sliced bell peppers and toss briskly for 3 minutes.',
      'Fold in cooked jasmine rice, season with sea salt and black pepper, and serve hot.',
    ],
  },
  {
    title: 'High-Protein Spinach & Egg Scramble',
    prepTime: '8 mins',
    macros: { calories: 410, protein: 36, carbs: 8, fats: 26 },
    usedIngredients: ['4 Large Eggs', '2 Cups Fresh Spinach', '1 tbsp Olive Oil', 'Salt & Black Pepper'],
    instructions: [
      'Whisk eggs in a bowl with sea salt and freshly ground pepper.',
      'Warm olive oil in skillet and gently wilt fresh spinach for 90 seconds.',
      'Pour in eggs and fold gently over medium heat until soft, fluffy curds form.',
    ],
  },
  {
    title: 'Greek Yogurt Recovery Power Bowl',
    prepTime: '5 mins',
    macros: { calories: 380, protein: 44, carbs: 32, fats: 6 },
    usedIngredients: ['350g Plain Non-Fat Greek Yogurt', '40g Rolled Oats', '1 tbsp Honey'],
    instructions: [
      'Transfer cold Greek yogurt to a wide bowl.',
      'Layer rolled oats over the yogurt for complex carbohydrate density.',
      'Drizzle with raw honey and enjoy immediately.',
    ],
  },
];

export default function TextPantryScreen() {
  const [ingredients, setIngredients] = useState<string[]>([
    'Chicken Breast',
    'White Rice',
    'Eggs',
    'Spinach',
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [recipes, setRecipes] = useState<SmartRecipe[]>(DEFAULT_PANTRY_RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState<SmartRecipe | null>(null);
  const [loggedMap, setLoggedMap] = useState<Record<string, boolean>>({});

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const handleAddIngredient = (itemToAdd?: string) => {
    const text = (itemToAdd || inputText).trim();
    if (!text) return;

    if (ingredients.length >= 15) {
      Alert.alert('Pantry Capacity', 'Maximum of 15 ingredients reached. Remove some items first.');
      return;
    }

    triggerHaptic();

    // Support comma separated
    const parts = text.split(',').map((p) => p.trim().slice(0, 30)).filter(Boolean);
    const updated = [...ingredients];
    parts.forEach((p) => {
      if (updated.length < 15 && !updated.some((item) => item.toLowerCase() === p.toLowerCase())) {
        updated.push(p);
      }
    });

    setIngredients(updated);
    if (!itemToAdd) setInputText('');
  };

  const handleRemoveIngredient = (index: number) => {
    triggerHaptic();
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);

    try {
      const res = await generateRecipesFromIngredients(ingredients);
      if (res.recipes && res.recipes.length > 0) {
        setRecipes(res.recipes.slice(0, 3));
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (err) {
      console.warn('[handleGenerateRecipes] API call notice:', err);
    } finally {
      setGenerating(false);
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
      console.warn('[handleLogToDiet] Error logging recipe:', err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-6 py-5 border-b border-white/[0.08] flex-row items-center justify-between">
        <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
          PANTRY RECIPES
        </Text>
        <Text className="text-[#71717A] text-xs font-mono">
          {ingredients.length} INGREDIENTS
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Ingredient Input Box & Tags Container */}
        <View className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] mb-6 gap-4">
          <View>
            <Text className="text-white text-base font-bold tracking-tight mb-1">
              Available Ingredients
            </Text>
            <Text className="text-[#71717A] text-xs">
              Type or tap ingredients to synthesize target macros.
            </Text>
          </View>

          {/* Text Input Row */}
          <View className="flex-row items-center gap-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleAddIngredient()}
              placeholder="e.g. Chicken, rice, eggs..."
              placeholderTextColor="#71717A"
              returnKeyType="done"
              className="flex-1 px-4 py-3 rounded-2xl bg-[#18181D] border border-white/[0.08] text-white text-xs font-medium"
            />
            <Pressable
              onPress={() => handleAddIngredient()}
              className="w-11 h-11 rounded-2xl bg-white items-center justify-center active:opacity-85"
            >
              <Plus size={16} color="#09090B" />
            </Pressable>
          </View>

          {/* Active Ingredient Pills */}
          {ingredients.length > 0 && (
            <View className="flex-row flex-wrap gap-2 pt-1">
              {ingredients.map((item, idx) => (
                <View
                  key={idx}
                  className="pl-3 pr-2 py-1.5 rounded-full bg-[#18181D] border border-white/[0.1] flex-row items-center gap-1.5"
                >
                  <Text className="text-white text-xs font-medium">
                    {item}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveIngredient(idx)}
                    className="w-4 h-4 rounded-full items-center justify-center"
                  >
                    <X size={10} color="#71717A" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Suggested Quick Add Chips */}
          <View className="pt-2 border-t border-white/[0.06]">
            <Text className="text-[#71717A] text-[11px] uppercase tracking-wider mb-2 font-medium">
              Quick Add Staples
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {SUGGESTED_STAPLES.map((staple) => {
                const isAlreadyAdded = ingredients.some(
                  (i) => i.toLowerCase() === staple.toLowerCase()
                );
                return (
                  <Pressable
                    key={staple}
                    disabled={isAlreadyAdded}
                    onPress={() => handleAddIngredient(staple)}
                    className={`px-3 py-1.5 rounded-full border ${
                      isAlreadyAdded
                        ? 'bg-[#18181D] border-transparent opacity-40'
                        : 'bg-[#18181D] border-white/[0.08]'
                    }`}
                  >
                    <Text className="text-white text-xs font-medium">
                      + {staple}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Generate Button */}
          <Pressable
            onPress={handleGenerateRecipes}
            disabled={generating || ingredients.length === 0}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            className="w-full py-3.5 rounded-full bg-white items-center justify-center flex-row gap-2 mt-1"
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color="#09090B" />
                <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
                  Synthesizing Recipes...
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={14} color="#09090B" />
                <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
                  Generate High-Protein Recipes
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* 2. Structured Recipe Results */}
        <View className="gap-4">
          <Text className="text-white text-sm font-bold tracking-tight">
            Targeted Recipes (3)
          </Text>

          {recipes.map((recipe, idx) => (
            <View
              key={idx}
              className="p-5 rounded-3xl bg-[#121216] border border-white/[0.08] gap-3"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-white font-bold text-base tracking-tight mb-1">
                    {recipe.title}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Clock size={11} color="#71717A" />
                    <Text className="text-[#71717A] text-xs">
                      {recipe.prepTime}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setSelectedRecipe(recipe);
                  }}
                  className="py-2 px-4 rounded-full bg-[#18181D] border border-white/[0.08] items-center justify-center"
                >
                  <Text className="text-white font-semibold text-xs">
                    View Recipe
                  </Text>
                </Pressable>
              </View>

              {/* Macro Pills */}
              <View className="flex-row items-center gap-2 pt-2 border-t border-white/[0.06]">
                <View className="px-2.5 py-1 rounded-xl bg-[#18181D] border border-white/[0.06]">
                  <Text className="text-white font-mono text-xs font-bold">
                    {recipe.macros.protein}g P
                  </Text>
                </View>
                <View className="px-2.5 py-1 rounded-xl bg-[#18181D] border border-white/[0.06]">
                  <Text className="text-white font-mono text-xs">
                    {recipe.macros.calories} kcal
                  </Text>
                </View>
                <View className="px-2.5 py-1 rounded-xl bg-[#18181D] border border-white/[0.06]">
                  <Text className="text-[#71717A] font-mono text-xs">
                    {recipe.macros.carbs}g C
                  </Text>
                </View>
                <View className="px-2.5 py-1 rounded-xl bg-[#18181D] border border-white/[0.06]">
                  <Text className="text-[#71717A] font-mono text-xs">
                    {recipe.macros.fats}g F
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 3. Clean Recipe Detail Bottom Sheet Modal */}
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
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-xl tracking-tight">
                  {selectedRecipe?.title}
                </Text>
                <Text className="text-[#71717A] text-xs mt-1">
                  {selectedRecipe?.macros.calories} kcal • {selectedRecipe?.macros.protein}g Protein • {selectedRecipe?.macros.carbs}g Carbs • {selectedRecipe?.macros.fats}g Fats
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
              {/* Exact Measurements */}
              <View className="mb-4">
                <Text className="text-white text-xs font-bold uppercase tracking-wider mb-2">
                  Ingredients & Measurements
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
                  Step-by-Step Instructions
                </Text>
                {selectedRecipe?.instructions.map((step, i) => (
                  <Text key={i} className="text-[#71717A] text-xs leading-5 mb-1.5">
                    {i + 1}. {step}
                  </Text>
                ))}
              </View>
            </ScrollView>

            {/* Log to Daily Diet Button */}
            {selectedRecipe && (
              <Pressable
                onPress={() => handleLogToDiet(selectedRecipe)}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                className={`w-full py-4 rounded-full items-center justify-center ${
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
                  {loggedMap[selectedRecipe.title] ? 'Logged to Daily Diet' : 'Log to Daily Diet'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
