import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Trash2,
  X,
  Search,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  getDailyLog,
  addMealToDailyLog,
  deleteMealFromDailyLog,
  searchOpenFoodFacts,
  DietLogData,
  OpenFoodProduct,
  NewMealPayload,
} from '../../services/dietService';

export default function MacroConsoleScreen() {
  const [dailyLog, setDailyLog] = useState<DietLogData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Add Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<OpenFoodProduct[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [manualName, setManualName] = useState<string>('');
  const [manualKcal, setManualKcal] = useState<string>('');
  const [manualProtein, setManualProtein] = useState<string>('');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  };

  const loadData = async () => {
    try {
      const log = await getDailyLog();
      setDailyLog(log);
    } catch (err) {
      console.warn('[MacroConsole] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchFoods = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      setSearching(true);
      const results = await searchOpenFoodFacts(text);
      setSearchResults(results);
      setSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleLogProduct = async (product: OpenFoodProduct) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const payload: NewMealPayload = {
      name: `${product.name} (${product.servingSize || '100g'})`,
      calories: product.calories,
      protein_grams: product.protein,
      carbs_grams: product.carbs,
      fats_grams: product.fats,
      source: 'OpenFoodFacts',
    };
    const updated = await addMealToDailyLog(payload);
    setDailyLog(updated);
    setShowAddModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLogManualFood = async () => {
    if (!manualName.trim() || !manualKcal.trim()) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const payload: NewMealPayload = {
      name: manualName.trim(),
      calories: parseInt(manualKcal, 10) || 0,
      protein_grams: parseInt(manualProtein, 10) || 0,
      carbs_grams: 0,
      fats_grams: 0,
      source: 'Manual',
    };
    const updated = await addMealToDailyLog(payload);
    setDailyLog(updated);
    setShowAddModal(false);
    setManualName('');
    setManualKcal('');
    setManualProtein('');
  };

  const handleDeleteMeal = async (mealId: string) => {
    triggerHaptic();
    const updated = await deleteMealFromDailyLog(mealId);
    setDailyLog(updated);
  };

  if (loading || !dailyLog) {
    return (
      <SafeAreaView className="flex-1 bg-[#09090B] items-center justify-center">
        <ActivityIndicator size="small" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  const consumedKcal = dailyLog.consumedCalories;
  const targetKcal = dailyLog.targetCalories;
  const remainingKcal = Math.max(0, targetKcal - consumedKcal);

  const consumedP = dailyLog.consumedProtein;
  const targetP = dailyLog.targetProtein;
  const pPercent = Math.min(100, Math.round((consumedP / targetP) * 100));

  const consumedC = dailyLog.consumedCarbs;
  const targetC = dailyLog.targetCarbs;
  const cPercent = Math.min(100, Math.round((consumedC / targetC) * 100));

  const consumedF = dailyLog.consumedFats;
  const targetF = dailyLog.targetFats;
  const fPercent = Math.min(100, Math.round((consumedF / targetF) * 100));

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'left', 'right']}>
      {/* Header: Minimal title & Quick Add action */}
      <View className="flex-row items-center justify-between px-6 py-5 border-b border-white/[0.08]">
        <Text className="text-white text-xs font-bold tracking-[3px] uppercase">
          DIET
        </Text>
        <Pressable
          onPress={() => {
            triggerHaptic();
            setShowAddModal(true);
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          className="py-1.5 px-4 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
            + Log
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Top: Big Stark Numbers */}
        <View className="py-8 items-center">
          <Text className="text-white text-6xl font-black tracking-tight font-mono">
            {remainingKcal.toLocaleString()}
          </Text>
          <Text className="text-[#71717A] text-xs font-medium tracking-widest uppercase mt-2">
            Calories Remaining
          </Text>
        </View>

        {/* 2. 3 Clean Progress Lines: Protein, Carbs, Fats */}
        <View className="rounded-3xl p-5 bg-[#121216] border border-white/[0.08] mb-6 gap-4">
          {/* Protein Line */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#71717A] text-xs font-medium">Protein</Text>
              <Text className="text-white font-mono text-xs font-semibold">
                {consumedP} / {targetP}g
              </Text>
            </View>
            <View className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{ width: `${pPercent}%` }}
              />
            </View>
          </View>

          {/* Carbs Line */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#71717A] text-xs font-medium">Carbohydrates</Text>
              <Text className="text-white font-mono text-xs font-semibold">
                {consumedC} / {targetC}g
              </Text>
            </View>
            <View className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{ width: `${cPercent}%` }}
              />
            </View>
          </View>

          {/* Fats Line */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#71717A] text-xs font-medium">Fats</Text>
              <Text className="text-white font-mono text-xs font-semibold">
                {consumedF} / {targetF}g
              </Text>
            </View>
            <View className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{ width: `${fPercent}%` }}
              />
            </View>
          </View>
        </View>

        {/* 3. Clean Chronological List of Logged Meals with Simple Delete */}
        <View className="gap-3">
          <Text className="text-white text-sm font-bold tracking-tight mb-1">
            Logged Meals
          </Text>

          {dailyLog.meals.length === 0 ? (
            <View className="rounded-3xl p-6 bg-[#121216] border border-white/[0.08] items-center justify-center">
              <Text className="text-[#71717A] text-xs">
                No meals logged today yet.
              </Text>
            </View>
          ) : (
            dailyLog.meals.map((meal) => (
              <View
                key={meal.id}
                className="rounded-3xl p-5 bg-[#121216] border border-white/[0.08] flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-white font-bold text-sm tracking-tight mb-0.5">
                    {meal.name}
                  </Text>
                  <Text className="text-[#71717A] text-xs">
                    {meal.calories} kcal  •  {meal.protein_grams}g Protein
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleDeleteMeal(meal.id)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                  className="w-8 h-8 rounded-full bg-[#18181D] items-center justify-center"
                >
                  <Trash2 size={13} color="#71717A" />
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Clean Quick Add Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#121216] border-t border-white/[0.08] rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <Text className="text-white font-bold text-lg tracking-tight">
                Log Intake
              </Text>
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#18181D] items-center justify-center"
              >
                <X size={16} color="#71717A" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
              {/* Search Bar */}
              <View className="flex-row items-center px-3.5 py-2.5 rounded-2xl bg-[#18181D] border border-white/[0.08] mb-4">
                <Search size={15} color="#71717A" />
                <TextInput
                  value={searchQuery}
                  onChangeText={handleSearchFoods}
                  placeholder="Search food database..."
                  placeholderTextColor="#71717A"
                  className="flex-1 text-white text-xs ml-2 py-0"
                />
              </View>

              {searching && (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View className="gap-2 mb-4">
                  {searchResults.slice(0, 4).map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleLogProduct(item)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                      className="p-3 rounded-2xl bg-[#18181D] border border-white/[0.06] flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-2">
                        <Text className="text-white text-xs font-semibold" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-[#71717A] text-[11px]">
                          {item.calories} kcal  •  {item.protein}g P
                        </Text>
                      </View>
                      <Plus size={14} color="#FFFFFF" />
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Manual Entry */}
              <Text className="text-white text-xs font-bold uppercase tracking-wider mb-2.5">
                Quick Manual Add
              </Text>

              <TextInput
                value={manualName}
                onChangeText={setManualName}
                placeholder="Meal Name (e.g. Greek Yogurt)"
                placeholderTextColor="#71717A"
                className="w-full px-4 py-3 rounded-2xl bg-[#18181D] border border-white/[0.08] text-white text-xs mb-2.5"
              />

              <View className="flex-row gap-2.5 mb-4">
                <TextInput
                  value={manualKcal}
                  onChangeText={setManualKcal}
                  placeholder="Calories (kcal)"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#18181D] border border-white/[0.08] text-white text-xs"
                />
                <TextInput
                  value={manualProtein}
                  onChangeText={setManualProtein}
                  placeholder="Protein (g)"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#18181D] border border-white/[0.08] text-white text-xs"
                />
              </View>

              <Pressable
                onPress={handleLogManualFood}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                className="w-full py-3.5 rounded-full bg-white items-center justify-center"
              >
                <Text className="text-[#09090B] font-bold text-xs uppercase tracking-wider">
                  Save Meal
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
