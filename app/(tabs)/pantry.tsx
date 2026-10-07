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
import { synthesizeMeals, SynthesizedRecipe } from '../../services/mealAiProvider';
import { searchOpenFoodFacts, lookupBarcode, PublicFoodItem } from '../../services/publicApis';
import { useAegisStore, aegisState } from '../../services/useAegisStore';
import PhotoCard from '../../components/ui/PhotoCard';
import ConcentricMacroRings from '../../components/ui/ConcentricMacroRings';

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

export default function PantryScreen() {
  const aegis = useAegisStore();
  const [kitchenMode, setKitchenMode] = useState<'pantry' | 'fuel-log'>('pantry');

  // Pantry & Staging State
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientPortions, setIngredientPortions] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');

  // Public OpenFoodFacts Search State
  const [publicResults, setPublicResults] = useState<PublicFoodItem[]>([]);
  const [isSearchingPublic, setIsSearchingPublic] = useState<boolean>(false);

  // Barcode Lookup Modal State
  const [showBarcodeModal, setShowBarcodeModal] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState<boolean>(false);

  // Recipe synthesis state
  const [generating, setGenerating] = useState<boolean>(false);
  const [recipes, setRecipes] = useState<SynthesizedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<SynthesizedRecipe | null>(null);
  const [loggedMap, setLoggedMap] = useState<Record<string, boolean>>({});

  // Quick Manual Fuel Modal
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false);
  const [quickName, setQuickName] = useState<string>('');
  const [quickCals, setQuickCals] = useState<string>('');
  const [quickProt, setQuickProt] = useState<string>('');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

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

  const handleAdjustPortion = (name: string, delta: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setIngredientPortions((prev) => {
      const current = prev[name] ?? 100;
      const nextVal = Math.max(25, Math.min(1000, current + delta));
      return { ...prev, [name]: nextVal };
    });
  };

  const handleAddCustom = () => {
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

  const handleClearAll = () => {
    if (selectedIngredients.length === 0) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIngredients([]);
    setRecipes([]);
    setPublicResults([]);
  };

  // Live Public API Search (Open Food Facts)
  const handleSearchPublicApi = async () => {
    const q = searchQuery.trim();
    if (!q) {
      Alert.alert('Search Term Required', 'Type a food or brand name into the search bar first.');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsSearchingPublic(true);
    try {
      const items = await searchOpenFoodFacts(q, 8);
      setPublicResults(items);
      if (items.length === 0) {
        Alert.alert('No Items Found', `No public database entries found for "${q}". Try another brand or item.`);
      }
    } catch {
      Alert.alert('Search Error', 'Could not fetch public food data. Please check connection.');
    } finally {
      setIsSearchingPublic(false);
    }
  };

  // Barcode Lookup Handler
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
        Alert.alert('Item Found & Added', `${found.name} (${found.brand}) added to your stage list.`);
      } else {
        Alert.alert('Not Found', 'No product found with this barcode in Open Food Facts.');
      }
    } catch {
      Alert.alert('Lookup Error', 'Unable to query barcode right now.');
    } finally {
      setIsLookingUpBarcode(false);
    }
  };

  // Recipe Synthesis
  const handleGenerateRecipes = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Please select at least one ingredient first.');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setGenerating(true);
    try {
      const inputItems = selectedIngredients.map((name) => ({
        name,
        grams: ingredientPortions[name] ?? 100,
      }));
      const res = await synthesizeMeals(inputItems, 'Hypertrophy');
      if (res.recipes && res.recipes.length > 0) {
        setRecipes(res.recipes);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    } catch (err) {
      console.warn('[handleGenerateRecipes] Error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogToDiet = (recipe: SynthesizedRecipe) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    aegisState.logMeal({
      name: recipe.title,
      calories: recipe.macros.calories,
      protein: recipe.macros.protein,
      carbs: recipe.macros.carbs,
      fats: recipe.macros.fats,
      source: 'ai-recipe',
    });
    setLoggedMap((prev) => ({ ...prev, [recipe.title]: true }));
    setSelectedRecipe(null);
    Alert.alert('Logged to Daily Fuel', `${recipe.title} has been logged to today's macros.`);
  };

  const handleLogPublicItemDirectly = (item: PublicFoodItem) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    aegisState.logMeal({
      name: `${item.name} (${item.brand})`,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fats: item.fats,
      source: 'pantry-manual',
    });
    Alert.alert('Logged to Daily Fuel', `${item.name} logged to today's macros.`);
  };

  const handleManualQuickLog = () => {
    const cals = parseInt(quickCals, 10);
    const prot = parseInt(quickProt, 10);
    if (!cals || isNaN(cals) || cals < 10) {
      Alert.alert('Invalid Calories', 'Please enter valid calories.');
      return;
    }
    const safeProtein = Math.max(0, isNaN(prot) ? 0 : prot);
    aegisState.logMeal({
      name: quickName.trim() || 'Manual Meal',
      calories: cals,
      protein: safeProtein,
      carbs: Math.max(0, Math.round((cals - safeProtein * 4) / 8)),
      fats: Math.max(0, Math.round((cals - safeProtein * 4) / 18)),
      source: 'quick-log',
    });
    setShowQuickModal(false);
    setQuickName('');
    setQuickCals('');
    setQuickProt('');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  // Filter items by category and search query
  const filteredItems = useMemo(() => {
    return ALL_STAPLE_ITEMS.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Scaled protein and calorie estimates based on tuned portions
  const { totalProtein, totalCalories } = useMemo(() => {
    let p = 0;
    let c = 0;
    selectedIngredients.forEach((ingName) => {
      const found = ALL_STAPLE_ITEMS.find(
        (i) => i.name.toLowerCase() === ingName.toLowerCase()
      );
      const publicFound = publicResults.find(
        (i) => i.name.toLowerCase() === ingName.toLowerCase()
      );
      const portion = ingredientPortions[ingName] ?? 100;
      const factor = portion / 100;

      if (found) {
        p += found.proteinG * factor;
        c += found.caloriesKcal * factor;
      } else if (publicFound) {
        p += publicFound.protein * factor;
        c += publicFound.calories * factor;
      } else {
        p += 10 * factor;
        c += 100 * factor;
      }
    });
    return {
      totalProtein: Math.round(p),
      totalCalories: Math.round(c),
    };
  }, [selectedIngredients, ingredientPortions, publicResults]);

  return (
    <SafeAreaView className="flex-1 bg-[#08090C]" edges={['top', 'left', 'right']}>
      {/* 1. Sleek Obsidian Header with Mode Switcher */}
      <View className="px-6 py-4 border-b border-white/[0.05] bg-[#0B0C10]">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-white text-xl font-black tracking-widest uppercase">
              KITCHEN & FUEL
            </Text>
            <Text className="text-[#71717A] text-[11px] font-mono tracking-wider uppercase mt-0.5">
              {kitchenMode === 'pantry'
                ? selectedIngredients.length === 0
                  ? 'SELECT STAPLES OR PUBLIC ITEMS'
                  : `${selectedIngredients.length} SELECTED • ~${totalProtein}G PRO • ${totalCalories} KCAL`
                : `${aegis.loggedMeals.length} MEALS LOGGED TODAY`}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowBarcodeModal(true)}
              className="w-10 h-10 rounded-2xl bg-[#14151C] border border-white/[0.06] items-center justify-center active:opacity-75"
            >
              <Ionicons name="barcode-outline" size={18} color="#F8FAFC" />
            </Pressable>

            {kitchenMode === 'pantry' && selectedIngredients.length > 0 && (
              <Pressable
                onPress={handleClearAll}
                className="py-2 px-3 rounded-2xl bg-[#14151C] border border-white/[0.06] active:opacity-75"
              >
                <Text className="text-[#71717A] text-xs font-semibold">Clear</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Mode Selector Segmented Pill */}
        <View className="flex-row p-1 rounded-2xl bg-[#14151C] border border-white/[0.05]">
          <Pressable
            onPress={() => {
              triggerHaptic();
              setKitchenMode('pantry');
            }}
            className={`flex-1 py-2 rounded-xl items-center ${
              kitchenMode === 'pantry' ? 'bg-[#FF5A1F]' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold uppercase tracking-wider ${
                kitchenMode === 'pantry' ? 'text-black' : 'text-[#71717A]'
              }`}
            >
              Pantry & Synthesis
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic();
              setKitchenMode('fuel-log');
            }}
            className={`flex-1 py-2 rounded-xl items-center ${
              kitchenMode === 'fuel-log' ? 'bg-[#FF5A1F]' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold uppercase tracking-wider ${
                kitchenMode === 'fuel-log' ? 'text-black' : 'text-[#71717A]'
              }`}
            >
              Daily Fuel Log
            </Text>
          </Pressable>
        </View>
      </View>

      {kitchenMode === 'pantry' ? (
        /* MODE A: PANTRY & AI SYNTHESIS */
        <>
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

            {/* Quick Add Custom Food Form */}
            <View className="flex-row items-center gap-2 mb-4">
              <View className="flex-1 h-11 rounded-2xl bg-[#12131A] border border-white/[0.05] px-3 flex-row items-center gap-2">
                <Ionicons name="add-circle-outline" size={16} color="#71717A" />
                <TextInput
                  value={customInput}
                  onChangeText={setCustomInput}
                  placeholder="Add custom ingredient (e.g. Bison, Skyr)..."
                  placeholderTextColor="#52525B"
                  onSubmitEditing={handleAddCustom}
                  className="flex-1 text-white text-xs"
                />
              </View>
              <Pressable
                onPress={handleAddCustom}
                disabled={!customInput.trim()}
                className={`h-11 px-4 rounded-2xl items-center justify-center ${
                  customInput.trim() ? 'bg-[#FF5A1F]' : 'bg-[#14151C] border border-white/[0.06]'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    customInput.trim() ? 'text-black' : 'text-[#52525B]'
                  }`}
                >
                  Add
                </Text>
              </Pressable>
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              className="flex-row mb-5"
            >
              {(
                [
                  { key: 'all', label: 'All Items' },
                  { key: 'proteins', label: 'Proteins' },
                  { key: 'carbs', label: 'Carbs' },
                  { key: 'produce', label: 'Produce' },
                  { key: 'pantry', label: 'Pantry' },
                ] as { key: CategoryKey; label: string }[]
              ).map((cat) => {
                const isActive = activeCategory === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => {
                      triggerHaptic();
                      setActiveCategory(cat.key);
                    }}
                    className={`py-2 px-4 rounded-full border active:opacity-80 ${
                      isActive
                        ? 'bg-[#FF5A1F] border-[#FF5A1F]'
                        : 'bg-[#14151C] border-white/[0.05]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold tracking-wide ${
                        isActive ? 'text-black' : 'text-[#71717A]'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Culinary Hero Photo Card */}
            <PhotoCard
              imageSource={require('../../assets/generated/nutrition_hero.jpg')}
              tag="NUTRITION & MACROS"
              tagColor="#FF5A1F"
              title="Culinary Performance"
              subtitle="Select staple ingredients to formulate chef-crafted, high-protein meals."
              meta={[
                { icon: 'restaurant-outline', text: `${ALL_STAPLE_ITEMS.length} Staples Available` },
                { icon: 'sparkles-outline', text: 'Smart Macro Recipes' },
              ]}
              className="mb-5"
            />

            {/* Live Public API Search Results Section */}
            {publicResults.length > 0 && (
              <View className="mb-5 p-4 rounded-3xl bg-[#12131A] border border-[#FF5A1F]/30 shadow-xl">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="globe" size={16} color="#FF5A1F" />
                    <Text className="text-white text-xs font-bold uppercase tracking-wider">
                      Public Search Results ({publicResults.length})
                    </Text>
                  </View>
                  <Pressable onPress={() => setPublicResults([])}>
                    <Text className="text-[#71717A] text-xs">Dismiss</Text>
                  </Pressable>
                </View>

                <View className="gap-2">
                  {publicResults.map((item) => (
                    <View
                      key={item.id}
                      className="p-3 rounded-2xl bg-[#181922] border border-white/[0.04] flex-row items-center justify-between"
                    >
                      <View className="flex-1 pr-2">
                        <Text className="text-white text-xs font-bold" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-[#71717A] text-[10px] font-mono mt-0.5">
                          {item.brand} • {item.protein}g P • {item.calories} kcal
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Pressable
                          onPress={() => handleToggleStaple(item.name)}
                          className={`py-1.5 px-3 rounded-xl border ${
                            isSelected(item.name)
                              ? 'bg-[#FF5A1F] border-[#FF5A1F]'
                              : 'bg-white/[0.04] border-white/10'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              isSelected(item.name) ? 'text-black' : 'text-white'
                            }`}
                          >
                            {isSelected(item.name) ? 'Staged' : '+ Stage'}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleLogPublicItemDirectly(item)}
                          className="py-1.5 px-3 rounded-xl bg-[#FF5A1F] active:opacity-85"
                        >
                          <Text className="text-black text-[10px] font-bold">Log</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Staple Items Grid (Single-Layer Athleisure Cards) */}
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {filteredItems.map((item) => {
                const active = isSelected(item.name);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleToggleStaple(item.name)}
                    style={{ width: '48.5%' }}
                    className={`p-3.5 rounded-2xl border justify-between active:scale-[0.98] ${
                      active
                        ? 'bg-[#FF5A1F]/[0.12] border-[#FF5A1F]'
                        : 'bg-[#12131A] border-white/[0.05]'
                    }`}
                  >
                    <View className="flex-row items-start justify-between mb-2.5">
                      <Text
                        className={`text-xs font-bold flex-1 pr-1 ${
                          active ? 'text-[#FF5A1F]' : 'text-white'
                        }`}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <View
                        className={`w-5 h-5 rounded-lg items-center justify-center border ${
                          active
                            ? 'bg-[#FF5A1F] border-[#FF5A1F]'
                            : 'bg-white/[0.04] border-white/10'
                        }`}
                      >
                        {active && <Ionicons name="checkmark-sharp" size={13} color="#000000" />}
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="py-0.5 px-2 rounded-md bg-white/[0.05]">
                        <Text className="text-[#71717A] text-[10px] font-mono">
                          {item.tag}
                        </Text>
                      </View>
                      <Text className="text-[#71717A] text-[10px] font-mono">
                        {item.caloriesKcal} kcal
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Synthesized Recipe Cards Section */}
            {recipes.length > 0 && (
              <View className="mt-8 gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-xs font-bold tracking-wider uppercase">
                    Synthesized Recipes ({recipes.length})
                  </Text>
                  <Text className="text-[#FF5A1F] text-[11px] font-mono font-bold">
                    HIGH PROTEIN
                  </Text>
                </View>

                {recipes.map((recipe, rIdx) => {
                  const isLogged = loggedMap[recipe.title];
                  return (
                    <View
                      key={rIdx}
                      className="bg-[#12131A] border border-white/[0.05] rounded-3xl p-5 gap-3 shadow-xl"
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-2">
                          <Text className="text-white text-base font-bold">
                            {recipe.title}
                          </Text>
                          <Text className="text-[#71717A] text-xs mt-0.5">
                            {recipe.prepTime} • Uses {recipe.usedIngredients.slice(0, 3).join(', ')}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setSelectedRecipe(recipe)}
                          className="py-1 px-3 rounded-xl bg-[#181922] border border-white/[0.06] active:opacity-75"
                        >
                          <Text className="text-white text-[10px] font-bold">
                            Recipe
                          </Text>
                        </Pressable>
                      </View>

                      {/* Macro Breakdown Pills */}
                      <View className="flex-row gap-2">
                        <View className="flex-1 py-2 px-2 rounded-xl bg-[#181922] border border-white/[0.04] items-center">
                          <Text className="text-[#71717A] text-[9px] font-mono uppercase">Calories</Text>
                          <Text className="text-white text-xs font-mono font-bold mt-0.5">
                            {recipe.macros.calories}
                          </Text>
                        </View>
                        <View className="flex-1 py-2 px-2 rounded-xl bg-[#181922] border border-white/[0.04] items-center">
                          <Text className="text-[#71717A] text-[9px] font-mono uppercase">Protein</Text>
                          <Text className="text-[#FF5A1F] text-xs font-mono font-bold mt-0.5">
                            {recipe.macros.protein}g
                          </Text>
                        </View>
                        <View className="flex-1 py-2 px-2 rounded-xl bg-[#181922] border border-white/[0.04] items-center">
                          <Text className="text-[#71717A] text-[9px] font-mono uppercase">Carbs</Text>
                          <Text className="text-white text-xs font-mono font-bold mt-0.5">
                            {recipe.macros.carbs}g
                          </Text>
                        </View>
                        <View className="flex-1 py-2 px-2 rounded-xl bg-[#181922] border border-white/[0.04] items-center">
                          <Text className="text-[#71717A] text-[9px] font-mono uppercase">Fats</Text>
                          <Text className="text-white text-xs font-mono font-bold mt-0.5">
                            {recipe.macros.fats}g
                          </Text>
                        </View>
                      </View>

                      {/* Log To Fuel Button */}
                      <Pressable
                        onPress={() => handleLogToDiet(recipe)}
                        disabled={isLogged}
                        className={`py-3 rounded-2xl items-center justify-center active:opacity-85 ${
                          isLogged ? 'bg-[#FF5A1F]/20 border border-[#FF5A1F]/40' : 'bg-[#FF5A1F]'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isLogged ? 'text-[#FF5A1F]' : 'text-black'
                          }`}
                        >
                          {isLogged ? '✓ Logged to Fuel' : '+ Log to Today’s Calories'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Floating Staging Action Bar */}
          {selectedIngredients.length > 0 && (
            <View className="absolute bottom-5 left-5 right-5 bg-[#12131A] border border-white/[0.08] rounded-3xl p-3.5 shadow-2xl flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-white text-xs font-bold">
                  {selectedIngredients.length} Ingredients Selected
                </Text>
                <Text className="text-[#FF5A1F] text-[11px] font-mono font-medium">
                  ~{totalProtein}g protein • {totalCalories} kcal
                </Text>
              </View>

              <Pressable
                onPress={handleGenerateRecipes}
                disabled={generating}
                className="py-3 px-5 rounded-2xl bg-[#FF5A1F] items-center justify-center flex-row gap-2 active:opacity-85 shadow-md"
              >
                {generating ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <>
                    <Text className="text-black text-xs font-bold tracking-wide">
                      Synthesize
                    </Text>
                    <Ionicons name="sparkles" size={14} color="#000000" />
                  </>
                )}
              </Pressable>
            </View>
          )}
        </>
      ) : (
        /* MODE B: DAILY FUEL LOG WITH SIGNATURE CONCENTRIC RINGS */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 }}
          className="flex-1"
        >
          {/* 1. Whoop-Style Concentric Macro Rings Card */}
          <View className="p-6 rounded-3xl bg-[#12131A] border border-white/[0.05] mb-5 items-center shadow-xl">
            <View className="w-full flex-row items-center justify-between mb-2">
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Daily Macro Balance
              </Text>
              <Pressable
                onPress={() => setShowQuickModal(true)}
                className="py-1.5 px-3 rounded-full bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 flex-row items-center gap-1 active:opacity-75"
              >
                <Ionicons name="add" size={13} color="#FF5A1F" />
                <Text className="text-[#FF5A1F] text-xs font-bold">Log Meal</Text>
              </Pressable>
            </View>

            {/* Glowing Concentric SVG Rings */}
            <View className="my-3 items-center justify-center">
              <ConcentricMacroRings
                size={180}
                consumedCalories={aegis.consumedCalories}
                targetCalories={aegis.targetCalories}
                consumedProtein={aegis.consumedProtein}
                targetProtein={aegis.targetProtein}
                consumedCarbs={aegis.consumedCarbs}
                targetCarbs={aegis.targetCarbs}
              />
            </View>

            {/* 3 Macro Telemetry Cards */}
            <View className="w-full flex-row gap-2.5 mt-2">
              <View className="flex-1 py-3 px-3 rounded-2xl bg-[#181922] border border-white/[0.04] items-center">
                <View className="flex-row items-center gap-1 mb-1">
                  <View className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
                  <Text className="text-[#71717A] text-[10px] font-mono uppercase">Calories</Text>
                </View>
                <Text className="text-white text-sm font-mono font-bold">
                  {aegis.consumedCalories}
                </Text>
                <Text className="text-[#71717A] text-[9px] font-mono mt-0.5">
                  of {aegis.targetCalories}
                </Text>
              </View>

              <View className="flex-1 py-3 px-3 rounded-2xl bg-[#181922] border border-white/[0.04] items-center">
                <View className="flex-row items-center gap-1 mb-1">
                  <View className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <Text className="text-[#71717A] text-[10px] font-mono uppercase">Protein</Text>
                </View>
                <Text className="text-[#10B981] text-sm font-mono font-bold">
                  {aegis.consumedProtein}g
                </Text>
                <Text className="text-[#71717A] text-[9px] font-mono mt-0.5">
                  of {aegis.targetProtein}g
                </Text>
              </View>

              <View className="flex-1 py-3 px-3 rounded-2xl bg-[#181922] border border-white/[0.04] items-center">
                <View className="flex-row items-center gap-1 mb-1">
                  <View className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  <Text className="text-[#71717A] text-[10px] font-mono uppercase">Carbs</Text>
                </View>
                <Text className="text-[#38BDF8] text-sm font-mono font-bold">
                  {aegis.consumedCarbs}g
                </Text>
                <Text className="text-[#71717A] text-[9px] font-mono mt-0.5">
                  of {aegis.targetCarbs}g
                </Text>
              </View>
            </View>
          </View>

          {/* Meals Consumed Timeline */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Today's Meals ({aegis.loggedMeals.length})
              </Text>
              <Pressable
                onPress={() => setShowQuickModal(true)}
                className="py-1 px-3 rounded-xl bg-[#181922] active:opacity-75"
              >
                <Text className="text-[#71717A] text-xs font-medium">+ Quick Add</Text>
              </Pressable>
            </View>

            {aegis.loggedMeals.length === 0 ? (
              <View className="p-8 rounded-3xl bg-[#12131A] border border-white/[0.05] items-center justify-center">
                <Ionicons name="restaurant-outline" size={32} color="#71717A" />
                <Text className="text-white text-sm font-bold mt-2">No Meals Logged Yet</Text>
                <Text className="text-[#71717A] text-xs mt-1 text-center">
                  Stage ingredients in the pantry or tap "+ Log Meal" to log your fuel.
                </Text>
              </View>
            ) : (
              aegis.loggedMeals.map((meal) => (
                <View
                  key={meal.id}
                  className="p-4 rounded-2xl bg-[#12131A] border border-white/[0.05] flex-row items-center justify-between"
                >
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white text-sm font-bold" numberOfLines={1}>
                        {meal.name}
                      </Text>
                      <View className="py-0.5 px-2 rounded-md bg-[#181922]">
                        <Text className="text-[#71717A] text-[9px] font-mono">{meal.timestamp}</Text>
                      </View>
                    </View>
                    <Text className="text-[#FF5A1F] text-xs font-mono font-medium mt-1">
                      {meal.calories} kcal • {meal.protein}g protein
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      aegisState.deleteMeal(meal.id);
                    }}
                    className="w-9 h-9 rounded-2xl bg-[#181922] items-center justify-center active:bg-[#FF3B30]/20"
                  >
                    <Ionicons name="trash-outline" size={15} color="#71717A" />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Recipe Instructions Modal */}
      {selectedRecipe && (
        <Modal
          visible={!!selectedRecipe}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedRecipe(null)}
        >
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-[#12131A] border-t border-white/[0.08] rounded-t-3xl p-6 gap-4 max-h-[80%]">
              <View className="flex-row items-center justify-between pb-3 border-b border-white/[0.06]">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-lg font-bold">
                    {selectedRecipe.title}
                  </Text>
                  <Text className="text-[#71717A] text-xs font-mono mt-0.5">
                    {selectedRecipe.macros.calories} kcal • {selectedRecipe.macros.protein}g Protein
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedRecipe(null)}
                  className="w-8 h-8 rounded-full bg-[#181922] items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="gap-3">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Preparation Instructions
                </Text>
                {selectedRecipe.instructions.map((step, sIdx) => (
                  <View key={sIdx} className="flex-row items-start gap-3 py-1.5">
                    <View className="w-5 h-5 rounded-full bg-[#FF5A1F]/20 items-center justify-center mt-0.5">
                      <Text className="text-[#FF5A1F] text-[10px] font-bold">{sIdx + 1}</Text>
                    </View>
                    <Text className="flex-1 text-[#D4D4D8] text-xs leading-5">
                      {step}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <Pressable
                onPress={() => setSelectedRecipe(null)}
                className="py-3.5 rounded-2xl bg-[#FF5A1F] items-center justify-center"
              >
                <Text className="text-black text-xs font-bold uppercase tracking-wider">
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Manual Quick Meal Modal */}
      <Modal
        visible={showQuickModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-3xl bg-[#12131A] border border-white/[0.08] p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-base font-bold">Log Custom Meal</Text>
              <Pressable
                onPress={() => setShowQuickModal(false)}
                className="w-8 h-8 rounded-full bg-[#181922] items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <View className="gap-3">
              <View className="gap-1">
                <Text className="text-[#71717A] text-xs font-mono uppercase">Meal Name</Text>
                <TextInput
                  value={quickName}
                  onChangeText={setQuickName}
                  placeholder="e.g. Steak & Sweet Potatoes"
                  placeholderTextColor="#52525B"
                  className="h-11 px-3.5 rounded-2xl bg-[#181922] border border-white/[0.06] text-white text-xs"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-[#71717A] text-xs font-mono uppercase">Calories (kcal)</Text>
                  <TextInput
                    value={quickCals}
                    onChangeText={setQuickCals}
                    placeholder="e.g. 620"
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    className="h-11 px-3.5 rounded-2xl bg-[#181922] border border-white/[0.06] text-white font-mono text-xs"
                  />
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-[#71717A] text-xs font-mono uppercase">Protein (g)</Text>
                  <TextInput
                    value={quickProt}
                    onChangeText={setQuickProt}
                    placeholder="e.g. 52"
                    placeholderTextColor="#52525B"
                    keyboardType="numeric"
                    className="h-11 px-3.5 rounded-2xl bg-[#181922] border border-white/[0.06] text-white font-mono text-xs"
                  />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mt-1">
              <Pressable
                onPress={() => setShowQuickModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-[#181922] border border-white/[0.08] items-center justify-center"
              >
                <Text className="text-[#71717A] text-xs font-bold uppercase">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleManualQuickLog}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF5A1F] items-center justify-center"
              >
                <Text className="text-black text-xs font-bold uppercase">Save Meal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Public Barcode Lookup Modal */}
      <Modal
        visible={showBarcodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBarcodeModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-3xl bg-[#12131A] border border-white/[0.08] p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-base font-bold">Public Barcode Scanner</Text>
                <Text className="text-[#FF5A1F] text-[10px] font-mono mt-0.5">Powered by Open Food Facts (Public API)</Text>
              </View>
              <Pressable
                onPress={() => setShowBarcodeModal(false)}
                className="w-8 h-8 rounded-full bg-[#181922] items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <View className="gap-2">
              <Text className="text-[#71717A] text-xs font-mono uppercase">Enter Product Barcode (EAN / UPC)</Text>
              <TextInput
                value={barcodeInput}
                onChangeText={setBarcodeInput}
                placeholder="e.g. 737628064502"
                placeholderTextColor="#52525B"
                keyboardType="numeric"
                className="h-11 px-3.5 rounded-2xl bg-[#181922] border border-white/[0.06] text-white font-mono text-sm"
              />
            </View>

            <Pressable
              onPress={handleLookupBarcode}
              disabled={isLookingUpBarcode || !barcodeInput.trim()}
              className={`w-full py-3.5 rounded-2xl items-center justify-center flex-row gap-2 active:opacity-85 ${
                barcodeInput.trim() ? 'bg-[#FF5A1F]' : 'bg-white/10'
              }`}
            >
              {isLookingUpBarcode ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Ionicons name="search" size={16} color={barcodeInput.trim() ? '#000000' : '#71717A'} />
                  <Text
                    className={`text-xs font-bold uppercase tracking-wider ${
                      barcodeInput.trim() ? 'text-black' : 'text-[#71717A]'
                    }`}
                  >
                    Lookup Public Database
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
