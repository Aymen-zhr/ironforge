import React, { useState, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  composeDeterministicMeals,
  SynthesizedRecipe,
  calculateCaloriesFromMacros,
  QUICK_MACRO_PRESETS,
  evaluateDailyTargets,
} from '../../features/nutrition';
import { searchOpenFoodFacts, lookupBarcode, PublicFoodItem } from '../../services/publicApis';
import { useIronforgeStore, ironforgeState } from '../../services/useIronforgeStore';
import ConcentricMacroRings from '../../components/ui/ConcentricMacroRings';

type KitchenViewMode = 'quick-dial' | 'staples' | 'log';
type CategoryKey = 'all' | 'proteins' | 'carbs' | 'produce' | 'pantry';

interface StapleItem {
  id: string;
  name: string;
  category: 'proteins' | 'carbs' | 'produce' | 'pantry';
  proteinG: number;
  caloriesKcal: number;
  tag: string;
}

const ALL_STAPLE_ITEMS: StapleItem[] = [
  // Proteins
  { id: 'p1', name: 'Chicken Breast', category: 'proteins', proteinG: 31, caloriesKcal: 165, tag: '31g Protein' },
  { id: 'p2', name: 'Eggs & Whites', category: 'proteins', proteinG: 13, caloriesKcal: 140, tag: '13g Protein' },
  { id: 'p3', name: 'Lean Ground Beef', category: 'proteins', proteinG: 26, caloriesKcal: 215, tag: '26g Protein' },
  { id: 'p4', name: 'Wild Salmon', category: 'proteins', proteinG: 25, caloriesKcal: 208, tag: '25g Protein' },
  { id: 'p5', name: 'Albacore Tuna', category: 'proteins', proteinG: 29, caloriesKcal: 130, tag: '29g Protein' },
  { id: 'p6', name: 'Greek Yogurt 0%', category: 'proteins', proteinG: 17, caloriesKcal: 95, tag: '17g Protein' },
  { id: 'p7', name: 'Whey Isolate', category: 'proteins', proteinG: 25, caloriesKcal: 120, tag: '25g Protein' },
  { id: 'p8', name: 'Cottage Cheese', category: 'proteins', proteinG: 14, caloriesKcal: 98, tag: '14g Protein' },

  // Carbs
  { id: 'c1', name: 'Jasmine Rice', category: 'carbs', proteinG: 4, caloriesKcal: 130, tag: '28g Carbs' },
  { id: 'c2', name: 'Rolled Oats', category: 'carbs', proteinG: 5, caloriesKcal: 150, tag: '27g Carbs' },
  { id: 'c3', name: 'Sweet Potato', category: 'carbs', proteinG: 2, caloriesKcal: 86, tag: '20g Carbs' },
  { id: 'c4', name: 'Sourdough Bread', category: 'carbs', proteinG: 8, caloriesKcal: 160, tag: '32g Carbs' },
  { id: 'c5', name: 'Whole Wheat Pasta', category: 'carbs', proteinG: 12, caloriesKcal: 174, tag: '37g Carbs' },
  { id: 'c6', name: 'Quinoa Grain', category: 'carbs', proteinG: 8, caloriesKcal: 222, tag: '39g Carbs' },

  // Produce
  { id: 'pr1', name: 'Baby Spinach', category: 'produce', proteinG: 3, caloriesKcal: 23, tag: 'Micronutrients' },
  { id: 'pr2', name: 'Broccoli Florets', category: 'produce', proteinG: 3, caloriesKcal: 34, tag: 'Fiber & Iron' },
  { id: 'pr3', name: 'Bell Peppers', category: 'produce', proteinG: 1, caloriesKcal: 31, tag: 'Vitamin C' },
  { id: 'pr4', name: 'White Mushrooms', category: 'produce', proteinG: 3, caloriesKcal: 22, tag: 'Electrolytes' },
  { id: 'pr5', name: 'Hass Avocado', category: 'produce', proteinG: 2, caloriesKcal: 160, tag: 'Healthy Fats' },
  { id: 'pr6', name: 'Bananas', category: 'produce', proteinG: 1, caloriesKcal: 89, tag: 'Potassium' },

  // Pantry
  { id: 'st1', name: 'Extra Virgin Olive Oil', category: 'pantry', proteinG: 0, caloriesKcal: 119, tag: 'Clean Fats' },
  { id: 'st2', name: 'Soy Sauce / Tamari', category: 'pantry', proteinG: 1, caloriesKcal: 10, tag: 'Sodium Balance' },
  { id: 'st3', name: 'Minced Garlic', category: 'pantry', proteinG: 0, caloriesKcal: 5, tag: 'Flavor Base' },
  { id: 'st4', name: 'Sriracha Hot Sauce', category: 'pantry', proteinG: 0, caloriesKcal: 5, tag: 'Zero Calorie' },
  { id: 'st5', name: 'Almond Butter', category: 'pantry', proteinG: 7, caloriesKcal: 196, tag: 'Dense Energy' },
];

export default function NutritionTelemetryScreen() {
  const ironforge = useIronforgeStore();
  const [kitchenMode, setKitchenMode] = useState<KitchenViewMode>('quick-dial');

  // Quick-Macro Dial Form States
  const [mealName, setMealName] = useState<string>('');
  const [inputProtein, setInputProtein] = useState<string>('');
  const [inputCarbs, setInputCarbs] = useState<string>('');
  const [inputFats, setInputFats] = useState<string>('');
  const [inputCalories, setInputCalories] = useState<string>('');
  const [autoComputeCals, setAutoComputeCals] = useState<boolean>(true);

  // Pantry & Deterministic Composer State
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientPortions, setIngredientPortions] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [composedRecipes, setComposedRecipes] = useState<SynthesizedRecipe[]>([]);

  // Public Search & Barcode
  const [publicResults, setPublicResults] = useState<PublicFoodItem[]>([]);
  const [isSearchingPublic, setIsSearchingPublic] = useState<boolean>(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState<boolean>(false);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  // Evaluate Daily Targets telemetry with deterministic comparison
  const targetsTelemetry = useMemo(() => {
    return evaluateDailyTargets({
      consumedCalories: ironforge.consumedCalories || 0,
      targetCalories: ironforge.targetCalories || 2600,
      consumedProtein: ironforge.consumedProtein || 0,
      targetProtein: ironforge.targetProtein || 180,
      consumedCarbs: ironforge.consumedCarbs || 0,
      targetCarbs: ironforge.targetCarbs || 310,
      consumedFats: ironforge.consumedFats || 0,
      targetFats: ironforge.targetFats || 65,
      consumedWaterMl: ironforge.consumedWaterMl || 0,
      targetWaterMl: ironforge.targetWaterMl || 3500,
    });
  }, [
    ironforge.consumedCalories,
    ironforge.targetCalories,
    ironforge.consumedProtein,
    ironforge.targetProtein,
    ironforge.consumedCarbs,
    ironforge.targetCarbs,
    ironforge.consumedFats,
    ironforge.targetFats,
    ironforge.consumedWaterMl,
    ironforge.targetWaterMl,
  ]);

  // Sync auto calories if auto-compute is enabled
  const handleUpdateMacro = (field: 'protein' | 'carbs' | 'fats', val: string) => {
    const p = field === 'protein' ? parseFloat(val) || 0 : parseFloat(inputProtein) || 0;
    const c = field === 'carbs' ? parseFloat(val) || 0 : parseFloat(inputCarbs) || 0;
    const f = field === 'fats' ? parseFloat(val) || 0 : parseFloat(inputFats) || 0;

    if (field === 'protein') setInputProtein(val);
    if (field === 'carbs') setInputCarbs(val);
    if (field === 'fats') setInputFats(val);

    if (autoComputeCals) {
      const computed = calculateCaloriesFromMacros(p, c, f);
      setInputCalories(computed > 0 ? String(computed) : '');
    }
  };

  const handleApplyPreset = (preset: typeof QUICK_MACRO_PRESETS[number]) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setMealName(preset.name);
    setInputProtein(String(preset.proteinG));
    setInputCarbs(String(preset.carbsG));
    setInputFats(String(preset.fatsG));
    setInputCalories(String(preset.caloriesKcal));
  };

  const handleAdjustMacroStep = (field: 'protein' | 'carbs' | 'fats' | 'calories', delta: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (field === 'protein') {
      const cur = parseFloat(inputProtein) || 0;
      const next = Math.max(0, cur + delta);
      handleUpdateMacro('protein', String(next));
    } else if (field === 'carbs') {
      const cur = parseFloat(inputCarbs) || 0;
      const next = Math.max(0, cur + delta);
      handleUpdateMacro('carbs', String(next));
    } else if (field === 'fats') {
      const cur = parseFloat(inputFats) || 0;
      const next = Math.max(0, cur + delta);
      handleUpdateMacro('fats', String(next));
    } else if (field === 'calories') {
      const cur = parseFloat(inputCalories) || 0;
      const next = Math.max(0, cur + delta);
      setInputCalories(String(next));
      setAutoComputeCals(false);
    }
  };

  const handleCommitQuickMacro = () => {
    const p = parseFloat(inputProtein) || 0;
    const c = parseFloat(inputCarbs) || 0;
    const f = parseFloat(inputFats) || 0;
    let cal = parseFloat(inputCalories) || 0;

    if (cal === 0 && (p > 0 || c > 0 || f > 0)) {
      cal = calculateCaloriesFromMacros(p, c, f);
    }

    if (cal <= 0 && p <= 0 && c <= 0 && f <= 0) {
      Alert.alert('Empty Entry', 'Please enter macronutrient values or calories before logging.');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    const title = mealName.trim() || 'Quick Macro Log';

    ironforgeState.logMeal({
      name: title,
      calories: Math.round(cal),
      protein: Math.round(p),
      carbs: Math.round(c),
      fats: Math.round(f),
      source: 'quick-macro',
    });

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setMealName('');
    setInputProtein('');
    setInputCarbs('');
    setInputFats('');
    setInputCalories('');
    Alert.alert('Logged Successfully', `${title} (${Math.round(cal)} kcal • ${p}P / ${c}C / ${f}F) added to today's fuel.`);
  };

  // Staple Selector Logic
  const isSelected = (name: string) => {
    return selectedIngredients.some((i) => i.toLowerCase() === name.toLowerCase());
  };

  const handleToggleStaple = (name: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (isSelected(name)) {
      setSelectedIngredients((prev) =>
        prev.filter((item) => item.toLowerCase() !== name.toLowerCase())
      );
    } else {
      setSelectedIngredients((prev) => [...prev, name]);
      if (!ingredientPortions[name]) {
        setIngredientPortions((prev) => ({ ...prev, [name]: 100 }));
      }
    }
  };

  const handleAddCustomStaple = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (isSelected(trimmed)) {
      setCustomInput('');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIngredients((prev) => [...prev, trimmed]);
    setIngredientPortions((prev) => ({ ...prev, [trimmed]: 100 }));
    setCustomInput('');
  };

  const handleComposeMeals = () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('No Staples Selected', 'Tap one or more ingredients to compose athletic meals.');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    const inputItems = selectedIngredients.map((name) => ({
      name,
      grams: ingredientPortions[name] ?? 100,
    }));

    const result = composeDeterministicMeals(inputItems, 'Hypertrophy');
    setComposedRecipes(result.recipes);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleLogRecipe = (recipe: SynthesizedRecipe) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    ironforgeState.logMeal({
      name: recipe.title,
      calories: recipe.macros.calories,
      protein: recipe.macros.protein,
      carbs: recipe.macros.carbs,
      fats: recipe.macros.fats,
      source: 'recipe-builder',
    });
    Alert.alert('Logged to Daily Fuel', `${recipe.title} has been committed to today's macros.`);
  };

  // Public DB Search
  const handleSearchPublicApi = async () => {
    const q = searchQuery.trim();
    if (!q) {
      Alert.alert('Search Required', 'Enter a brand or food name to query.');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsSearchingPublic(true);
    try {
      const items = await searchOpenFoodFacts(q, 8);
      setPublicResults(items);
      if (items.length === 0) {
        Alert.alert('No Items Found', `No public database results for "${q}".`);
      }
    } catch {
      Alert.alert('Search Error', 'Unable to reach public food database right now.');
    } finally {
      setIsSearchingPublic(false);
    }
  };

  // Barcode Lookup
  const handleLookupBarcode = async () => {
    const code = barcodeInput.trim();
    if (!code) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsLookingUpBarcode(true);
    try {
      const found = await lookupBarcode(code);
      if (found) {
        if (!isSelected(found.name)) {
          setSelectedIngredients((prev) => [...prev, found.name]);
          setIngredientPortions((prev) => ({ ...prev, [found.name]: 100 }));
        }
        setShowBarcodeModal(false);
        setBarcodeInput('');
        Alert.alert('Item Found', `${found.name} (${found.brand}) added to stage list.`);
      } else {
        Alert.alert('Not Found', 'No product found with this barcode.');
      }
    } catch {
      Alert.alert('Lookup Error', 'Unable to query barcode right now.');
    } finally {
      setIsLookingUpBarcode(false);
    }
  };

  const filteredStaples = useMemo(() => {
    let items = ALL_STAPLE_ITEMS;
    if (activeCategory !== 'all') {
      items = items.filter((i) => i.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [activeCategory, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-[#08090C]" edges={['top', 'left', 'right']}>
      {/* 1. Header */}
      <View className="px-6 py-4 border-b border-white/[0.05] flex-row items-center justify-between bg-[#0B0C10]">
        <View>
          <Text className="text-white text-xl font-black tracking-widest uppercase">
            NUTRITION TELEMETRY
          </Text>
          <Text className="text-[#71717A] text-[11px] font-mono tracking-wider uppercase mt-0.5">
            DETERMINISTIC MACRO LOGGING & TARGETS
          </Text>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic();
            setShowBarcodeModal(true);
          }}
          className="w-10 h-10 rounded-2xl bg-[#14151C] border border-white/[0.06] items-center justify-center active:opacity-75"
        >
          <Ionicons name="barcode-outline" size={17} color="#F8FAFC" />
        </Pressable>
      </View>

      {/* 2. Mode Selector Pill Bar */}
      <View className="px-5 py-2.5 border-b border-white/[0.05] bg-[#0B0C10]">
        <View className="flex-row rounded-2xl bg-[#14151C] p-1 border border-white/[0.06]">
          {[
            { id: 'quick-dial', label: 'Quick-Macro Dial' },
            { id: 'staples', label: 'Pantry Composer' },
            { id: 'log', label: 'Daily Fuel Log' },
          ].map((mode) => {
            const isActive = kitchenMode === mode.id;
            return (
              <Pressable
                key={mode.id}
                onPress={() => {
                  triggerHaptic();
                  setKitchenMode(mode.id as KitchenViewMode);
                }}
                className={`flex-1 py-2 rounded-xl items-center ${
                  isActive ? 'bg-[#FF5A1F]' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isActive ? 'text-black' : 'text-[#71717A]'
                  }`}
                >
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 3. Main Body */}
      {kitchenMode === 'quick-dial' && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Daily Macro Targets Progress Overview Card */}
          <View className="mb-5 p-5 rounded-3xl bg-[#12131A] border border-white/[0.06] shadow-xl">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-sm font-bold uppercase tracking-wider">
                  Daily Macro Targets
                </Text>
                <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                  Adherence: {targetsTelemetry.overallAdherencePct}%
                </Text>
              </View>
              <View className="py-1 px-3 rounded-full bg-[#10E760]/10 border border-[#10E760]/20">
                <Text className="text-[#10E760] text-[10px] font-mono font-bold">
                  LOCAL TELEMETRY
                </Text>
              </View>
            </View>

            {/* Progress Bars for all 4 macros */}
            <View className="gap-3.5">
              {[
                targetsTelemetry.calories,
                targetsTelemetry.protein,
                targetsTelemetry.carbs,
                targetsTelemetry.fats,
              ].map((m) => (
                <View key={m.name} className="gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white text-xs font-mono font-bold">
                      {m.name}
                    </Text>
                    <Text className="text-[#A1A1AA] text-xs font-mono">
                      <Text className="text-white font-bold">{m.consumed}</Text> / {m.target} {m.unit} ({m.percentage}%) • <Text style={{ color: m.barColor }}>{m.statusText}</Text>
                    </Text>
                  </View>
                  {/* Progress track */}
                  <View className="h-2.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                    <View
                      style={{
                        width: `${Math.min(100, m.percentage)}%`,
                        backgroundColor: m.barColor,
                      }}
                      className="h-full rounded-full"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quick-Macro Rapid Input Form */}
          <View className="mb-5 p-5 rounded-3xl bg-[#12131A] border border-white/[0.06] shadow-xl">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-bold tracking-tight">
                  Rapid Numerical Entry
                </Text>
                <Text className="text-[#71717A] text-xs font-mono mt-0.5">
                  Zero-latency instant nutrient calculation
                </Text>
              </View>
              <Ionicons name="flash-outline" size={20} color="#FF5A1F" />
            </View>

            {/* Optional Meal Title */}
            <View className="mb-4">
              <Text className="text-[#71717A] text-[10px] font-mono uppercase tracking-wider mb-1">
                Meal Label (Optional)
              </Text>
              <TextInput
                value={mealName}
                onChangeText={setMealName}
                placeholder="e.g. Post-Workout Shake, Lunch Bowl"
                placeholderTextColor="#52525B"
                className="h-11 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs"
              />
            </View>

            {/* Numerical Macro Inputs Grid */}
            <View className="flex-row gap-2.5 mb-4">
              {/* Protein Input */}
              <View className="flex-1 p-3 rounded-2xl bg-black/40 border border-[#10E760]/30 items-center">
                <Text className="text-[#10E760] text-[10px] font-mono font-bold uppercase mb-1">
                  Protein (g)
                </Text>
                <TextInput
                  value={inputProtein}
                  onChangeText={(val) => handleUpdateMacro('protein', val)}
                  placeholder="0"
                  placeholderTextColor="#3F3F46"
                  keyboardType="numeric"
                  className="w-full text-center text-white font-mono text-xl font-black p-0"
                />
                <View className="flex-row gap-1 mt-2">
                  <Pressable
                    onPress={() => handleAdjustMacroStep('protein', 5)}
                    className="py-0.5 px-1.5 rounded bg-white/10"
                  >
                    <Text className="text-white text-[9px] font-mono">+5</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleAdjustMacroStep('protein', 25)}
                    className="py-0.5 px-1.5 rounded bg-white/10"
                  >
                    <Text className="text-white text-[9px] font-mono">+25</Text>
                  </Pressable>
                </View>
              </View>

              {/* Carbs Input */}
              <View className="flex-1 p-3 rounded-2xl bg-black/40 border border-[#00D2FF]/30 items-center">
                <Text className="text-[#00D2FF] text-[10px] font-mono font-bold uppercase mb-1">
                  Carbs (g)
                </Text>
                <TextInput
                  value={inputCarbs}
                  onChangeText={(val) => handleUpdateMacro('carbs', val)}
                  placeholder="0"
                  placeholderTextColor="#3F3F46"
                  keyboardType="numeric"
                  className="w-full text-center text-white font-mono text-xl font-black p-0"
                />
                <View className="flex-row gap-1 mt-2">
                  <Pressable
                    onPress={() => handleAdjustMacroStep('carbs', 10)}
                    className="py-0.5 px-1.5 rounded bg-white/10"
                  >
                    <Text className="text-white text-[9px] font-mono">+10</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleAdjustMacroStep('carbs', 50)}
                    className="py-0.5 px-1.5 rounded bg-white/10"
                  >
                    <Text className="text-white text-[9px] font-mono">+50</Text>
                  </Pressable>
                </View>
              </View>

              {/* Fats Input */}
              <View className="flex-1 p-3 rounded-2xl bg-black/40 border border-[#FF9F0A]/30 items-center">
                <Text className="text-[#FF9F0A] text-[10px] font-mono font-bold uppercase mb-1">
                  Fats (g)
                </Text>
                <TextInput
                  value={inputFats}
                  onChangeText={(val) => handleUpdateMacro('fats', val)}
                  placeholder="0"
                  placeholderTextColor="#3F3F46"
                  keyboardType="numeric"
                  className="w-full text-center text-white font-mono text-xl font-black p-0"
                />
                <View className="flex-row gap-1 mt-2">
                  <Pressable
                    onPress={() => handleAdjustMacroStep('fats', 2)}
                    className="py-0.5 px-1.5 rounded bg-white/10"
                  >
                    <Text className="text-white text-[9px] font-mono">+2</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleAdjustMacroStep('fats', 10)}
                    className="py-0.5 px-1.5 rounded bg-white/10"
                  >
                    <Text className="text-white text-[9px] font-mono">+10</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Total Calories Row */}
            <View className="p-3.5 rounded-2xl bg-black/60 border border-white/[0.08] flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-[#71717A] text-[10px] font-mono uppercase tracking-wider">
                  Calculated Energy ({autoComputeCals ? 'Auto 4/4/9' : 'Manual'})
                </Text>
                <View className="flex-row items-center gap-2 mt-0.5">
                  <TextInput
                    value={inputCalories}
                    onChangeText={(val) => {
                      setInputCalories(val);
                      setAutoComputeCals(false);
                    }}
                    placeholder="0"
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    className="text-white font-mono text-2xl font-black p-0 m-0"
                  />
                  <Text className="text-[#FF5A1F] text-sm font-mono font-bold">KCAL</Text>
                </View>
              </View>

              <View className="flex-row gap-1.5">
                <Pressable
                  onPress={() => handleAdjustMacroStep('calories', 100)}
                  className="py-1 px-2.5 rounded-lg bg-white/10"
                >
                  <Text className="text-white text-xs font-mono font-bold">+100</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAdjustMacroStep('calories', 250)}
                  className="py-1 px-2.5 rounded-lg bg-white/10"
                >
                  <Text className="text-white text-xs font-mono font-bold">+250</Text>
                </Pressable>
              </View>
            </View>

            {/* Commit Log Button */}
            <Pressable
              onPress={handleCommitQuickMacro}
              className="w-full py-4 rounded-2xl bg-[#FF5A1F] items-center justify-center active:opacity-85 shadow-lg shadow-[#FF5A1F]/30"
            >
              <Text className="text-black text-xs font-bold uppercase tracking-wider">
                Commit Quick-Macro Log
              </Text>
            </Pressable>
          </View>

          {/* Quick-Macro Presets Grid */}
          <View className="mb-5">
            <Text className="text-white text-xs font-bold uppercase tracking-wider mb-2.5">
              Athlete Quick Presets
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {QUICK_MACRO_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  onPress={() => handleApplyPreset(preset)}
                  className="py-2.5 px-3.5 rounded-2xl bg-[#12131A] border border-white/[0.06] active:opacity-75 flex-row items-center gap-2"
                >
                  <View className="w-2 h-2 rounded-full bg-[#10E760]" />
                  <View>
                    <Text className="text-white text-xs font-bold">{preset.name}</Text>
                    <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                      {preset.caloriesKcal} kcal • {preset.proteinG}P {preset.carbsG}C {preset.fatsG}F
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {kitchenMode === 'staples' && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar + Public DB Button */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="flex-1 h-12 rounded-2xl bg-[#12131A] border border-white/[0.05] px-3.5 flex-row items-center gap-2.5">
              <Ionicons name="search-outline" size={17} color="#71717A" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search staples or public database..."
                placeholderTextColor="#71717A"
                className="flex-1 text-white text-xs"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={15} color="#71717A" />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={handleSearchPublicApi}
              disabled={isSearchingPublic}
              className="h-12 px-4 rounded-2xl bg-[#14151C] border border-white/[0.06] items-center justify-center flex-row gap-1.5 active:opacity-75"
            >
              {isSearchingPublic ? (
                <ActivityIndicator size="small" color="#FF5A1F" />
              ) : (
                <>
                  <Ionicons name="globe-outline" size={15} color="#FF5A1F" />
                  <Text className="text-[#FF5A1F] text-xs font-bold font-mono">Public DB</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Public Food Search Results */}
          {publicResults.length > 0 && (
            <View className="mb-4 p-3.5 rounded-2xl bg-[#12131A] border border-[#00D2FF]/30">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#00D2FF] text-xs font-bold uppercase font-mono">
                  Public Results ({publicResults.length})
                </Text>
                <Pressable onPress={() => setPublicResults([])}>
                  <Text className="text-[#71717A] text-[10px] font-mono">Dismiss</Text>
                </Pressable>
              </View>
              <View className="gap-1.5">
                {publicResults.map((item, idx) => (
                  <Pressable
                    key={item.id || `${item.name}-${idx}`}
                    onPress={() => {
                      if (!isSelected(item.name)) {
                        setSelectedIngredients((prev) => [...prev, item.name]);
                        setIngredientPortions((prev) => ({ ...prev, [item.name]: 100 }));
                      }
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex-row items-center justify-between active:opacity-75"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-white text-xs font-semibold" numberOfLines={1}>{item.name}</Text>
                      <Text className="text-[#71717A] text-[10px] font-mono">
                        {item.brand ? `${item.brand} • ` : ''}{item.calories} kcal • {item.protein}g P / {item.carbs}g C / {item.fats}g F
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected(item.name) ? 'checkmark-circle' : 'add-circle-outline'}
                      size={18}
                      color={isSelected(item.name) ? '#10E760' : '#FF5A1F'}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Quick Add Custom Food Form */}
          <View className="flex-row items-center gap-2 mb-4">
            <View className="flex-1 h-11 rounded-2xl bg-[#12131A] border border-white/[0.05] px-3 flex-row items-center gap-2">
              <Ionicons name="add-circle-outline" size={16} color="#71717A" />
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                placeholder="Add custom ingredient (e.g. Grass-Fed Butter)"
                placeholderTextColor="#71717A"
                className="flex-1 text-white text-xs"
                onSubmitEditing={handleAddCustomStaple}
                returnKeyType="done"
              />
            </View>
            <Pressable
              onPress={handleAddCustomStaple}
              className="h-11 px-4 rounded-2xl bg-white/[0.07] border border-white/10 items-center justify-center active:opacity-75"
            >
              <Text className="text-white text-xs font-bold uppercase">Add</Text>
            </Pressable>
          </View>

          {/* Selected Stage Bar */}
          {selectedIngredients.length > 0 && (
            <View className="mb-4 p-4 rounded-3xl bg-[#12131A] border border-[#FF5A1F]/30 shadow-xl">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Selected Staples ({selectedIngredients.length})
                </Text>
                <Pressable
                  onPress={() => setSelectedIngredients([])}
                  className="py-1 px-2.5 rounded-lg bg-white/[0.05]"
                >
                  <Text className="text-[#71717A] text-[10px] font-mono">Clear</Text>
                </Pressable>
              </View>

              <View className="flex-row flex-wrap gap-2 mb-3">
                {selectedIngredients.map((item) => (
                  <View
                    key={item}
                    className="py-1 px-3 rounded-xl bg-[#FF5A1F]/20 border border-[#FF5A1F]/40 flex-row items-center gap-1.5"
                  >
                    <Text className="text-white text-xs font-bold">{item}</Text>
                    <Pressable onPress={() => handleToggleStaple(item)}>
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={handleComposeMeals}
                className="w-full py-3.5 rounded-2xl bg-[#FF5A1F] items-center justify-center flex-row gap-2 active:opacity-85 shadow-md shadow-[#FF5A1F]/20"
              >
                <Ionicons name="restaurant-outline" size={16} color="#000000" />
                <Text className="text-black text-xs font-bold uppercase tracking-wider">
                  Compose Athletic Meals
                </Text>
              </Pressable>
            </View>
          )}

          {/* Composed Recipes Display */}
          {composedRecipes.length > 0 && (
            <View className="mb-5 gap-3">
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Deterministic Recipes ({composedRecipes.length})
              </Text>

              {composedRecipes.map((recipe) => (
                <View
                  key={recipe.id}
                  className="p-4 rounded-3xl bg-[#12131A] border border-white/[0.06] shadow-md"
                >
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="py-1 px-2.5 rounded-full bg-[#10E760]/10 border border-[#10E760]/20">
                      <Text className="text-[#10E760] text-[10px] font-mono font-bold">
                        {recipe.category}
                      </Text>
                    </View>
                    <Text className="text-[#71717A] text-[10px] font-mono">{recipe.prepTime}</Text>
                  </View>

                  <Text className="text-white text-base font-bold mb-2">{recipe.title}</Text>

                  {/* Macros Strip */}
                  <View className="flex-row items-center gap-2 mb-3 p-2.5 rounded-xl bg-black/40 border border-white/[0.04]">
                    <Text className="text-[#FF5A1F] text-xs font-mono font-bold">
                      {recipe.macros.calories} kcal
                    </Text>
                    <Text className="text-[#71717A] text-xs font-mono">•</Text>
                    <Text className="text-[#10E760] text-xs font-mono font-bold">
                      {recipe.macros.protein}g P
                    </Text>
                    <Text className="text-[#71717A] text-xs font-mono">•</Text>
                    <Text className="text-[#00D2FF] text-xs font-mono font-bold">
                      {recipe.macros.carbs}g C
                    </Text>
                    <Text className="text-[#71717A] text-xs font-mono">•</Text>
                    <Text className="text-[#FF9F0A] text-xs font-mono font-bold">
                      {recipe.macros.fats}g F
                    </Text>
                  </View>

                  <Text className="text-[#A1A1AA] text-xs mb-3 italic leading-4">
                    &ldquo;{recipe.chefNote}&rdquo;
                  </Text>

                  <Pressable
                    onPress={() => handleLogRecipe(recipe)}
                    className="w-full py-2.5 rounded-xl bg-white/[0.08] border border-white/10 items-center justify-center active:opacity-75"
                  >
                    <Text className="text-white text-xs font-bold uppercase tracking-wider">
                      Log to Daily Fuel
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3.5">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'proteins', label: 'Proteins' },
              { id: 'carbs', label: 'Carbs' },
              { id: 'produce', label: 'Produce' },
              { id: 'pantry', label: 'Pantry' },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    triggerHaptic();
                    setActiveCategory(cat.id as CategoryKey);
                  }}
                  className={`py-1.5 px-3.5 rounded-full mr-2 border active:opacity-80 ${
                    isActive ? 'bg-white border-white' : 'bg-[#12131A] border-white/[0.06]'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isActive ? 'text-black' : 'text-[#71717A]'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Staples List */}
          <View className="gap-2">
            {filteredStaples.map((staple) => {
              const checked = isSelected(staple.name);
              return (
                <Pressable
                  key={staple.id}
                  onPress={() => handleToggleStaple(staple.name)}
                  className={`p-3.5 rounded-2xl border flex-row items-center justify-between active:opacity-80 ${
                    checked
                      ? 'bg-[#FF5A1F]/15 border-[#FF5A1F]/40'
                      : 'bg-[#12131A] border-white/[0.04]'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-7 h-7 rounded-lg items-center justify-center border ${
                        checked ? 'bg-[#FF5A1F] border-[#FF5A1F]' : 'bg-black/40 border-white/10'
                      }`}
                    >
                      {checked && <Ionicons name="checkmark" size={16} color="#000000" />}
                    </View>
                    <View>
                      <Text className="text-white text-xs font-bold">{staple.name}</Text>
                      <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                        {staple.caloriesKcal} kcal • {staple.tag}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {kitchenMode === 'log' && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Signature Concentric Macro Rings */}
          <View className="mb-5 items-center justify-center">
            <ConcentricMacroRings
              targetCalories={ironforge.targetCalories || 2600}
              consumedCalories={ironforge.consumedCalories || 0}
              targetProtein={ironforge.targetProtein || 180}
              consumedProtein={ironforge.consumedProtein || 0}
              targetCarbs={ironforge.targetCarbs || 310}
              consumedCarbs={ironforge.consumedCarbs || 0}
            />
          </View>

          {/* Today's Logged Meals */}
          <View className="gap-3">
            <Text className="text-white text-xs font-bold uppercase tracking-wider">
              Logged Meals Today ({ironforge.loggedMeals.length})
            </Text>

            {ironforge.loggedMeals.length === 0 ? (
              <View className="p-8 rounded-3xl bg-[#12131A] border border-white/[0.05] items-center justify-center">
                <Ionicons name="restaurant-outline" size={28} color="#71717A" />
                <Text className="text-white text-sm font-bold mt-2">No Meals Logged Today</Text>
                <Text className="text-[#71717A] text-xs font-mono text-center mt-1">
                  Use the Quick-Macro Dial to log your first intake.
                </Text>
              </View>
            ) : (
              ironforge.loggedMeals.map((meal) => (
                <View
                  key={meal.id}
                  className="p-4 rounded-2xl bg-[#12131A] border border-white/[0.05] flex-row items-center justify-between"
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-white text-sm font-bold">{meal.name}</Text>
                    <Text className="text-[#71717A] text-xs font-mono mt-0.5">
                      {meal.timestamp} • {meal.calories} kcal ({meal.protein}P / {meal.carbs}C / {meal.fats}F)
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      ironforgeState.deleteMeal(meal.id);
                    }}
                    className="w-8 h-8 rounded-xl bg-white/[0.05] items-center justify-center active:opacity-75"
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Barcode Scanner / Manual Lookup Modal */}
      <Modal
        visible={showBarcodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBarcodeModal(false)}
      >
        <View className="flex-1 bg-black/85 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-3xl bg-[#12131A] border border-white/10 p-6 gap-4 shadow-2xl">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-base font-bold">Lookup Barcode</Text>
              <Pressable
                onPress={() => setShowBarcodeModal(false)}
                className="w-8 h-8 rounded-full bg-[#181922] items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text className="text-[#71717A] text-xs font-mono">
              Enter any standard EAN-13, UPC-A, or product code to retrieve macros directly.
            </Text>

            <TextInput
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              placeholder="e.g. 737628064502"
              placeholderTextColor="#52525B"
              keyboardType="numeric"
              className="h-12 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm"
            />

            <Pressable
              onPress={handleLookupBarcode}
              disabled={isLookingUpBarcode}
              className="w-full py-3.5 rounded-xl bg-[#FF5A1F] items-center justify-center active:opacity-85"
            >
              {isLookingUpBarcode ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text className="text-black text-xs font-bold uppercase tracking-wider">
                  Query Product Database
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
