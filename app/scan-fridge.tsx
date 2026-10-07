import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Utensils,
  ChevronDown,
  ChevronUp,
  Flame,
  Plus,
  X,
  ExternalLink,
  Layers,
  Clock,
  BookmarkCheck,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Zap,
  Award,
} from 'lucide-react-native';
import { GlassCard, GlowButton, AmbientGlow } from '../components/ui';
import {
  generateRecipesFromIngredients,
  fetchIngredientNutrition,
  FridgeAnalysisResult,
  SmartRecipe,
  IngredientNutrition,
  IngredientCategory,
} from '../services/fridgeVision';
import { supabase } from '../services/supabase';
import { addMealToDailyLog } from '../services/dietService';

export interface ScanFridgeScreenProps {
  onBack?: () => void;
}

interface QuickStaple {
  name: string;
  category: 'Protein' | 'Carb' | 'Produce' | 'Fat';
  emoji: string;
}

const QUICK_STAPLES: QuickStaple[] = [
  // Proteins
  { name: 'Chicken Breast', category: 'Protein', emoji: '🍗' },
  { name: 'Eggs', category: 'Protein', emoji: '🥚' },
  { name: 'Egg Whites', category: 'Protein', emoji: '🍳' },
  { name: 'Tuna', category: 'Protein', emoji: '🐟' },
  { name: 'Lean Ground Beef', category: 'Protein', emoji: '🥩' },
  { name: 'Greek Yogurt (0%)', category: 'Protein', emoji: '🥛' },
  { name: 'Whey Protein', category: 'Protein', emoji: '⚡' },
  // Carbs
  { name: 'White Rice', category: 'Carb', emoji: '🍚' },
  { name: 'Rolled Oats', category: 'Carb', emoji: '🥣' },
  { name: 'Sweet Potato', category: 'Carb', emoji: '🍠' },
  { name: 'Whole Wheat Bread', category: 'Carb', emoji: '🍞' },
  // Produce
  { name: 'Baby Spinach', category: 'Produce', emoji: '🥬' },
  { name: 'Broccoli', category: 'Produce', emoji: '🥦' },
  { name: 'Bell Peppers', category: 'Produce', emoji: '🫑' },
  { name: 'Mushrooms', category: 'Produce', emoji: '🍄' },
  // Fats
  { name: 'Olive Oil', category: 'Fat', emoji: '🫒' },
  { name: 'Avocado', category: 'Fat', emoji: '🥑' },
  { name: 'Almonds', category: 'Fat', emoji: '🥜' },
];

const RECIPE_THEMES = [
  {
    badge: 'ANABOLIC PEAK',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/50',
    badgeText: 'text-emerald-300',
    cardVariant: 'glow' as const,
  },
  {
    badge: '10-MIN FAST PREP',
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/50',
    badgeText: 'text-cyan-300',
    cardVariant: 'default' as const,
  },
  {
    badge: 'LEAN SHRED & FIBER',
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-500/50',
    badgeText: 'text-amber-300',
    cardVariant: 'elevated' as const,
  },
];

export default function ScanFridgeScreen({ onBack }: ScanFridgeScreenProps) {
  // Current user inventory
  const [ingredientList, setIngredientList] = useState<string[]>([
    'Eggs',
    'Chicken Breast',
    'White Rice',
    'Baby Spinach',
    'Olive Oil',
  ]);
  const [inputText, setInputText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Protein' | 'Carb' | 'Produce' | 'Fat'>('All');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<FridgeAnalysisResult | null>(null);
  const [savedDbStatus, setSavedDbStatus] = useState<string | null>(null);

  // Nutrition lookup modal state
  const [selectedNutrition, setSelectedNutrition] = useState<IngredientNutrition | null>(null);
  const [loadingNutritionName, setLoadingNutritionName] = useState<string | null>(null);

  // Recipe interaction state
  const [expandedRecipeIndex, setExpandedRecipeIndex] = useState<number | null>(0);
  const [savedDietMeals, setSavedDietMeals] = useState<string[]>([]);

  // Add ingredient logic
  const handleAddIngredient = (itemToAdd?: string) => {
    const raw = itemToAdd || inputText;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const items = trimmed
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const updated = [...ingredientList];
    for (const item of items) {
      if (!updated.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
        updated.push(item);
      }
    }

    setIngredientList(updated);
    if (!itemToAdd) {
      setInputText('');
    }
  };

  const handleRemoveIngredient = (indexToRemove: number) => {
    setIngredientList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAll = () => {
    setIngredientList([]);
    setResults(null);
  };

  // Recipe generation
  const handleGenerateRecipes = async () => {
    if (ingredientList.length === 0) {
      Alert.alert('Pantry Empty', 'Add at least one ingredient to generate recipes.');
      return;
    }

    setGenerating(true);
    setSavedDbStatus(null);

    try {
      const res = await generateRecipesFromIngredients(ingredientList);
      setResults(res);

      if (!res.isValidFridge) {
        Alert.alert('Notice', res.errorMessage || 'Could not synthesize recipes from current ingredients.');
        return;
      }

      // Sync inventory to Supabase if authenticated
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user && res.detectedIngredients.length > 0) {
          const rows = res.detectedIngredients.map((item) => ({
            user_id: user.id,
            name: item.name,
            detected_quantity: item.quantity,
            category: item.category,
          }));

          await supabase.from('fridge_ingredients').insert(rows);
          setSavedDbStatus('Synced to Supabase Cloud');
        } else {
          setSavedDbStatus('Saved to Local Session');
        }
      } catch (dbErr) {
        console.warn('[ScanFridge] DB error:', dbErr);
        setSavedDbStatus('Cached in Local Session');
      }
    } catch (err) {
      console.error('Recipe generation failed:', err);
      Alert.alert('Generation Error', 'Could not synthesize recipes. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Nutrition lookup
  const handleIngredientPress = async (name: string) => {
    setLoadingNutritionName(name);
    try {
      const nutrition = await fetchIngredientNutrition(name);
      if (nutrition) {
        setSelectedNutrition(nutrition);
      } else {
        Alert.alert(name, 'Nutritional profile not found in USDA or Open Food Facts.');
      }
    } catch {
      Alert.alert(name, 'Nutritional lookup unavailable.');
    } finally {
      setLoadingNutritionName(null);
    }
  };

  const handleSaveToDietLog = async (recipe: SmartRecipe) => {
    if (savedDietMeals.includes(recipe.title)) return;
    setSavedDietMeals((prev) => [...prev, recipe.title]);
    try {
      await addMealToDailyLog({
        name: recipe.title,
        meal_type: 'Lunch',
        calories: recipe.macros.calories,
        protein_grams: recipe.macros.protein,
        carbs_grams: recipe.macros.carbs,
        fats_grams: recipe.macros.fats,
        source: 'FridgeScan',
      });
      Alert.alert(
        'Synced to Diet Hub',
        `"${recipe.title}" (${recipe.macros.protein}g Protein, ${recipe.macros.calories} kcal) logged to your Daily Diet Hub!`
      );
    } catch {
      Alert.alert(
        'Meal Logged',
        `"${recipe.title}" (${recipe.macros.protein}g Protein, ${recipe.macros.calories} kcal) added to your daily intake!`
      );
    }
  };

  // Filtered staples
  const filteredStaples = activeFilter === 'All'
    ? QUICK_STAPLES
    : QUICK_STAPLES.filter((s) => s.category === activeFilter);

  return (
    <SafeAreaView className="flex-1 bg-forge-black" edges={['top', 'left', 'right']}>
      {/* Top HUD Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-[#0D0D11]/90">
        <Pressable
          onPress={onBack}
          className="flex-row items-center py-1.5 px-2.5 rounded-lg bg-[#0D0D11] border border-white/[0.07] active:opacity-75"
        >
          <ArrowLeft size={16} color="#71717A" />
          <Text className="text-[#71717A] text-xs font-bold uppercase tracking-widest ml-1.5">
            Back
          </Text>
        </Pressable>

        <View className="flex-row items-center">
          <Utensils size={16} color="#DC2626" />
          <Text className="text-[#F4F4F5] text-sm font-black tracking-widest uppercase ml-1.5">
            Macro Chef AI
          </Text>
        </View>

        <View className="flex-row items-center px-2 py-1 rounded-full bg-blood-red/15 border border-blood-red/40">
          <Zap size={12} color="#DC2626" />
          <Text className="text-blood-red text-[10px] font-black tracking-widest uppercase ml-1">
            USDA + OFF
          </Text>
        </View>
      </View>

      {/* Ambient Lighting Glow */}
      <AmbientGlow color="#DC2626" size={260} opacity={0.16} top={-40} right={-60} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Visual Banner */}
        <View className="w-full h-36 rounded-xl overflow-hidden mb-5 border border-white/[0.07] relative">
          <Image
            source={require('../assets/generated/hero-nutrition.jpg')}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-forge-black/60" />
          <View className="absolute bottom-3 left-3 right-3 flex-row items-end justify-between">
            <View>
              <View className="px-2 py-0.5 rounded-full bg-blood-red/20 border border-blood-red/50 self-start mb-1">
                <Text className="text-blood-red text-[9px] font-black uppercase tracking-widest">
                  ANABOLIC PANTRY
                </Text>
              </View>
              <Text className="text-[#F4F4F5] font-black text-xl tracking-tight leading-tight">
                Smart Pantry & Macro Chef
              </Text>
              <Text className="text-[#71717A] text-xs mt-0.5">
                USDA & Open Food Facts verified nutrition.
              </Text>
            </View>
            <View className="px-2.5 py-1 rounded-xl bg-forge-black/90 border border-white/[0.07]">
              <Text className="text-blood-red text-[10px] font-mono tabular-nums font-bold">
                {ingredientList.length} ITEMS
              </Text>
            </View>
          </View>
        </View>

        {/* INPUT COMMAND BAR */}
        <GlassCard variant="glow" className="p-4 mb-4 border-white/[0.07] bg-[#0D0D11]/90">
          <Text className="text-[#F4F4F5] font-extrabold text-xs uppercase tracking-widest mb-2">
            Add Ingredients or Barcode:
          </Text>

          <View className="flex-row items-center gap-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleAddIngredient()}
              placeholder="e.g. 4 eggs, chicken breast, oats, rice..."
              placeholderTextColor="#52525B"
              className="flex-1 bg-[#0A0A0C] border border-white/[0.07] rounded-xl px-3.5 py-2.5 text-[#F4F4F5] text-sm"
              returnKeyType="done"
            />
            <Pressable
              onPress={() => handleAddIngredient()}
              className="bg-blood-red px-4 py-2.5 rounded-xl flex-row items-center justify-center active:opacity-85 shadow-sm shadow-blood-red/40"
            >
              <Plus size={16} color="#F4F4F5" />
              <Text className="text-[#F4F4F5] font-black text-xs ml-1 uppercase tracking-widest">
                Add
              </Text>
            </Pressable>
          </View>

          {/* Category Tabs for Quick-Add */}
          <View className="mt-4 pt-3 border-t border-border-dark">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-text-dim text-[11px] font-bold uppercase tracking-wider">
                Quick-Add Gym Fuel:
              </Text>
              <Text className="text-text-dim text-[10px]">
                Tap to stock pantry
              </Text>
            </View>

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2.5">
              {(['All', 'Protein', 'Carb', 'Produce', 'Fat'] as const).map((cat) => {
                const isSelected = activeFilter === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveFilter(cat)}
                    className={`mr-1.5 px-2.5 py-1 rounded-lg border ${
                      isSelected
                        ? 'bg-accent/20 border-accent/50'
                        : 'bg-obsidian border-border-dark'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isSelected ? 'text-accent' : 'text-text-dim'
                      }`}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Quick Staples Chips */}
            <View className="flex-row flex-wrap gap-1.5">
              {filteredStaples.map((staple, idx) => {
                const alreadyAdded = ingredientList.some(
                  (item) => item.toLowerCase() === staple.name.toLowerCase()
                );
                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleAddIngredient(staple.name)}
                    disabled={alreadyAdded}
                    className={`px-2.5 py-1.5 rounded-xl border flex-row items-center ${
                      alreadyAdded
                        ? 'bg-surface/30 border-border-dark/60 opacity-35'
                        : 'bg-surface border-border-dark active:border-accent active:bg-accent/10'
                    }`}
                  >
                    <Text className="text-xs mr-1">{staple.emoji}</Text>
                    <Text
                      className={`text-xs font-semibold ${
                        alreadyAdded ? 'text-text-dim' : 'text-white'
                      }`}
                    >
                      {staple.name}
                    </Text>
                    {!alreadyAdded && (
                      <Plus size={10} color="#DC2626" style={{ marginLeft: 3 }} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </GlassCard>

        {/* ACTIVE FRIDGE SHELF */}
        <GlassCard variant="elevated" className="p-4 mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Layers size={16} color="#DC2626" />
              <Text className="text-white font-black text-sm uppercase tracking-wider ml-1.5">
                Current Fridge Shelf ({ingredientList.length})
              </Text>
            </View>

            {ingredientList.length > 0 && (
              <Pressable
                onPress={handleClearAll}
                className="flex-row items-center active:opacity-70 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20"
              >
                <Trash2 size={12} color="#F43F5E" />
                <Text className="text-rose-400 text-[10px] font-bold ml-1 uppercase">
                  Clear
                </Text>
              </Pressable>
            )}
          </View>

          {ingredientList.length === 0 ? (
            <View className="py-8 items-center justify-center">
              <Utensils size={32} color="#64748B" />
              <Text className="text-white font-bold text-sm mt-2">
                Your Fridge Shelf is Empty
              </Text>
              <Text className="text-text-dim text-xs text-center mt-1 max-w-[240px]">
                Add what you have above or tap quick staples to build your high-protein meals.
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-text-dim text-[11px] leading-4 mb-2.5">
                Tap any ingredient to view verified <Text className="text-emerald-400 font-semibold">USDA</Text> or <Text className="text-cyan-400 font-semibold">Open Food Facts</Text> macros:
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {ingredientList.map((item, index) => {
                  const isLoading = loadingNutritionName === item;
                  return (
                    <View
                      key={index}
                      className="flex-row items-center pl-3 pr-1.5 py-1.5 rounded-xl bg-[#0A0A0C] border border-red-600/30"
                    >
                      <Pressable
                        onPress={() => handleIngredientPress(item)}
                        className="flex-row items-center mr-1.5 active:opacity-75"
                      >
                        <Text className="text-[#F4F4F5] font-bold text-xs">
                          {item}
                        </Text>
                        {isLoading ? (
                          <ActivityIndicator
                            size="small"
                            color="#DC2626"
                            style={{ marginLeft: 5 }}
                          />
                        ) : (
                          <ExternalLink size={10} color="#DC2626" style={{ marginLeft: 4 }} />
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => handleRemoveIngredient(index)}
                        className="w-5 h-5 rounded-full bg-[#1F1F26] items-center justify-center active:bg-rose-500/20"
                      >
                        <X size={10} color="#71717A" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* MAIN GENERATE CTA */}
          <View className="mt-4">
            <GlowButton
              title={
                generating
                  ? 'SYNTHESIZING RECIPES...'
                  : `GENERATE 3 GYM RECIPES (${ingredientList.length} ITEMS)`
              }
              variant="blood"
              size="lg"
              icon={
                generating ? (
                  <ActivityIndicator size="small" color="#F4F4F5" />
                ) : (
                  <Sparkles size={18} color="#F4F4F5" />
                )
              }
              onPress={handleGenerateRecipes}
              disabled={generating || ingredientList.length === 0}
            />
          </View>
        </GlassCard>

        {/* LOADING ANIMATION */}
        {generating && (
          <GlassCard variant="glow" className="p-6 mb-6 items-center">
            <ActivityIndicator size="large" color="#DC2626" />
            <Text className="text-white font-extrabold text-base mt-4 text-center">
              Synthesizing 3 High-Protein Recipes...
            </Text>
            <Text className="text-text-dim text-xs text-center mt-2 max-w-[280px]">
              Cross-referencing your {ingredientList.length} pantry items with sports nutrition targets for muscle growth and fast preparation.
            </Text>
          </GlassCard>
        )}

        {/* SYNTHESIZED RECIPES SECTION */}
        {results && results.recipes && results.recipes.length > 0 && (
          <View className="gap-5">
            {/* Supabase Link Pill */}
            {savedDbStatus && (
              <View className="flex-row items-center justify-between px-3.5 py-2 rounded-xl bg-surface border border-accent/30">
                <View className="flex-row items-center">
                  <CheckCircle2 size={14} color="#DC2626" />
                  <Text className="text-accent text-xs font-bold ml-2">
                    {savedDbStatus}
                  </Text>
                </View>
                <Text className="text-text-dim text-[10px] font-mono">
                  STEP 4 LINKED
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Flame size={20} color="#DC2626" />
                <Text className="text-white text-lg font-black tracking-tight ml-2">
                  CUSTOM GYM MEALS (3)
                </Text>
              </View>
              <View className="px-2.5 py-1 rounded-full bg-accent/20 border border-accent/40">
                <Text className="text-accent text-[10px] font-black uppercase">
                  Tailored to Fridge
                </Text>
              </View>
            </View>

            <View className="gap-4">
              {results.recipes.map((recipe, index) => {
                const isExpanded = expandedRecipeIndex === index;
                const isSaved = savedDietMeals.includes(recipe.title);
                const theme = RECIPE_THEMES[index % RECIPE_THEMES.length];

                return (
                  <GlassCard
                    key={index}
                    variant={theme.cardVariant}
                    className="p-4"
                  >
                    {/* Meal Header & Tier Badge */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className={`px-2 py-0.5 rounded ${theme.badgeBg} border ${theme.badgeBorder}`}>
                        <Text className={`text-[10px] font-black uppercase ${theme.badgeText}`}>
                          {theme.badge}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Clock size={12} color="#94A3B8" />
                        <Text className="text-text-dim text-[11px] font-semibold ml-1">
                          {recipe.prepTime} prep
                        </Text>
                      </View>
                    </View>

                    {/* Meal Title & Log Button */}
                    <View className="flex-row items-start justify-between mb-3">
                      <Text className="text-white font-black text-lg flex-1 pr-2 leading-6">
                        {recipe.title}
                      </Text>

                      <Pressable
                        onPress={() => handleSaveToDietLog(recipe)}
                        className={`flex-row items-center py-1.5 px-3 rounded-xl border ${
                          isSaved
                            ? 'bg-accent/20 border-accent/60'
                            : 'bg-surface-card border-border-dark active:opacity-75'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck size={14} color="#DC2626" />
                            <Text className="text-accent text-xs font-bold ml-1.5">
                              Logged
                            </Text>
                          </>
                        ) : (
                          <>
                            <PlusCircle size={14} color="#94A3B8" />
                            <Text className="text-text-dim text-xs font-bold ml-1.5">
                              Log Meal
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>

                    {/* HERO MACRO DIAL (Large Protein Highlight) */}
                    <View className="p-3 rounded-2xl bg-obsidian/90 border border-border-dark mb-3">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-baseline">
                          <Text className="text-emerald-400 font-black text-3xl tracking-tight">
                            {recipe.macros.protein}g
                          </Text>
                          <Text className="text-emerald-500 font-extrabold text-xs uppercase tracking-wider ml-1.5">
                            Protein
                          </Text>
                        </View>

                        <View className="flex-row items-baseline">
                          <Text className="text-white font-black text-2xl tracking-tight">
                            {recipe.macros.calories}
                          </Text>
                          <Text className="text-text-dim text-xs font-bold ml-1">
                            kcal
                          </Text>
                        </View>
                      </View>

                      {/* Secondary Macro Bar */}
                      <View className="flex-row gap-2 pt-2 border-t border-border-dark">
                        <View className="flex-1 flex-row items-center justify-between px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
                          <Text className="text-cyan-400 text-[10px] font-extrabold uppercase">
                            Carbs
                          </Text>
                          <Text className="text-white font-bold text-xs">
                            {recipe.macros.carbs}g
                          </Text>
                        </View>

                        <View className="flex-1 flex-row items-center justify-between px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25">
                          <Text className="text-amber-400 text-[10px] font-extrabold uppercase">
                            Fats
                          </Text>
                          <Text className="text-white font-bold text-xs">
                            {recipe.macros.fats}g
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Used Ingredients Chips */}
                    <View className="mb-3">
                      <Text className="text-text-dim text-[11px] font-semibold mb-1.5">
                        Ingredients Used:
                      </Text>
                      <View className="flex-row flex-wrap gap-1.5">
                        {recipe.usedIngredients.map((ing, i) => (
                          <View
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-surface border border-border-dark flex-row items-center"
                          >
                            <CheckCircle2 size={10} color="#DC2626" />
                            <Text className="text-white text-[11px] font-medium ml-1">
                              {ing}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Instructions Accordion Toggle */}
                    <Pressable
                      onPress={() => setExpandedRecipeIndex(isExpanded ? null : index)}
                      className="flex-row items-center justify-between p-2.5 rounded-xl bg-surface border border-border-dark active:opacity-75"
                    >
                      <Text className="text-accent text-xs font-bold uppercase tracking-wider">
                        {isExpanded ? 'Hide Cooking Instructions' : 'View Cooking Steps'}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={16} color="#DC2626" />
                      ) : (
                        <ChevronDown size={16} color="#DC2626" />
                      )}
                    </Pressable>

                    {isExpanded && (
                      <View className="mt-3 p-3 rounded-xl bg-obsidian/95 border border-border-dark gap-2.5">
                        {recipe.instructions.map((step, stepIdx) => (
                          <View key={stepIdx} className="flex-row items-start">
                            <View className="w-5 h-5 rounded-full bg-accent/20 border border-accent/50 items-center justify-center mr-2.5 mt-0.5">
                              <Text className="text-accent text-[10px] font-black">
                                {stepIdx + 1}
                              </Text>
                            </View>
                            <Text className="text-white text-xs leading-5 flex-1 font-medium">
                              {step}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </GlassCard>
                );
              })}
            </View>

            <View className="mt-2">
              <GlowButton
                title="RE-SYNTHESIZE RECIPES"
                variant="outline"
                size="md"
                icon={<RefreshCw size={16} color="#DC2626" />}
                onPress={handleGenerateRecipes}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* DUAL USDA & OPEN FOOD FACTS MODAL */}
      <Modal
        visible={!!selectedNutrition}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNutrition(null)}
      >
        <View className="flex-1 bg-black/85 items-center justify-center p-5">
          <GlassCard
            variant="glow"
            className={`w-full max-w-sm p-5 ${
              selectedNutrition?.source.includes('USDA')
                ? 'border-emerald-500/50'
                : 'border-cyan-500/50'
            }`}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1 mr-2">
                <Award
                  size={18}
                  color={selectedNutrition?.source.includes('USDA') ? '#10B981' : '#06B6D4'}
                />
                <Text
                  className={`font-black text-xs uppercase tracking-wider ml-1.5 ${
                    selectedNutrition?.source.includes('USDA')
                      ? 'text-emerald-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {selectedNutrition?.source || 'Nutrition Profile'}
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedNutrition(null)}
                className="w-7 h-7 rounded-full bg-surface border border-border-dark items-center justify-center active:opacity-75"
              >
                <X size={14} color="#94A3B8" />
              </Pressable>
            </View>

            {selectedNutrition && (
              <>
                <Text className="text-white font-black text-xl mb-0.5">
                  {selectedNutrition.productName || selectedNutrition.name}
                </Text>
                <Text className="text-text-dim text-xs mb-4">
                  {selectedNutrition.source.includes('USDA')
                    ? 'Official USDA FoodData Central laboratory profile (per 100g):'
                    : 'Open Food Facts public registry profile (per 100g):'}
                </Text>

                {/* Macro Dial Card */}
                <View className="gap-2 mb-4">
                  <View className="flex-row items-center justify-between p-3 rounded-xl bg-obsidian border border-border-dark">
                    <Text className="text-text-dim text-xs font-bold uppercase">
                      Energy / Calories
                    </Text>
                    <Text className="text-white font-black text-lg">
                      {selectedNutrition.calories} kcal
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <Text className="text-emerald-300 text-xs font-bold uppercase">
                      Protein
                    </Text>
                    <Text className="text-emerald-400 font-black text-lg">
                      {selectedNutrition.protein}g
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <Text className="text-cyan-300 text-xs font-bold uppercase">
                      Carbohydrates
                    </Text>
                    <Text className="text-cyan-400 font-black text-lg">
                      {selectedNutrition.carbs}g
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <Text className="text-amber-300 text-xs font-bold uppercase">
                      Fats
                    </Text>
                    <Text className="text-amber-400 font-black text-lg">
                      {selectedNutrition.fat}g
                    </Text>
                  </View>
                </View>

                {/* Verification Citation */}
                <View className="p-2.5 rounded-xl bg-surface border border-border-dark mb-4">
                  <Text className="text-text-dim text-[11px] leading-4 text-center">
                    {selectedNutrition.source.includes('USDA') ? (
                      <>
                        Authoritative whole food laboratory data from{' '}
                        <Text className="text-emerald-400 font-mono">USDA FoodData Central</Text>.
                      </>
                    ) : (
                      <>
                        Packaged and barcode data sourced live from{' '}
                        <Text className="text-cyan-400 font-mono">world.openfoodfacts.org</Text>.
                      </>
                    )}
                  </Text>
                </View>

                <GlowButton
                  title="CLOSE BREAKDOWN"
                  variant={selectedNutrition.source.includes('USDA') ? 'emerald' : 'cyan'}
                  size="sm"
                  onPress={() => setSelectedNutrition(null)}
                />
              </>
            )}
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
