import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
  Zap,
  ArrowUpRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import GlassCard from './GlassCard';
import {
  WeatherData,
  GeoLocation,
  DEFAULT_LOCATIONS,
  fetchWeather,
  searchCities,
  saveSelectedLocation,
  getSavedLocation,
  interpretWeatherCode,
} from '../../services/weatherService';

interface WeatherCardProps {
  className?: string;
  onWeatherLoaded?: (data: WeatherData) => void;
}

export default function WeatherCard({ className = '', onWeatherLoaded }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [unitFahrenheit, setUnitFahrenheit] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  const loadWeather = async (loc?: GeoLocation) => {
    try {
      const data = await fetchWeather(loc);
      setWeather(data);
      onWeatherLoaded?.(data);
    } catch (err) {
      console.warn('[WeatherCard] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const handleRefresh = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setRefreshing(true);
    await loadWeather(weather?.location);
  };

  const handleToggleUnit = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setUnitFahrenheit(!unitFahrenheit);
  };

  const handleSelectLocation = async (loc: GeoLocation) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}
    setShowLocationModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);
    await saveSelectedLocation(loc);
    await loadWeather(loc);
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      setSearching(true);
      const results = await searchCities(text);
      setSearchResults(results);
      setSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  // Weather condition icon helper
  const renderWeatherIcon = (condition: WeatherData['weatherCondition'], size = 26, color = '#F4F4F5') => {
    switch (condition) {
      case 'clear':
        return <Sun size={size} color="#F59E0B" />;
      case 'partly_cloudy':
        return <CloudSun size={size} color="#FBBF24" />;
      case 'cloudy':
        return <Cloud size={size} color="#9CA3AF" />;
      case 'rain':
        return <CloudRain size={size} color="#06B6D4" />;
      case 'thunder':
        return <CloudLightning size={size} color="#DC2626" />;
      case 'snow':
        return <CloudSnow size={size} color="#E0F2FE" />;
      case 'fog':
        return <CloudFog size={size} color="#A1A1AA" />;
      default:
        return <Sun size={size} color="#F59E0B" />;
    }
  };

  if (loading && !weather) {
    return (
      <GlassCard className={`p-4 bg-[#0D0D11]/90 border-white/[0.08] ${className}`}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Thermometer size={14} color="#DC2626" />
            <Text className="text-[#71717A] text-[10px] font-mono tracking-widest uppercase ml-1.5">
              TRAINING CLIMATE TELEMETRY
            </Text>
          </View>
          <ActivityIndicator size="small" color="#DC2626" />
        </View>
        <Text className="text-[#71717A] text-xs font-mono">Connecting to Open-Meteo public weather API...</Text>
      </GlassCard>
    );
  }

  const currentTemp = unitFahrenheit ? weather?.temperatureF : weather?.temperature;
  const feelsLike = unitFahrenheit ? weather?.apparentTemperatureF : weather?.apparentTemperature;
  const unitLabel = unitFahrenheit ? '°F' : '°C';

  return (
    <View className={className}>
      <GlassCard variant="default" className="p-4 bg-[#0D0D11]/90 border-white/[0.08] rounded-xl shadow-xl">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between pb-2.5 mb-3 border-b border-white/[0.06]">
          <Pressable
            onPress={() => setShowLocationModal(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
            className="flex-row items-center"
          >
            <MapPin size={13} color="#DC2626" />
            <Text className="text-[#F4F4F5] text-xs font-black uppercase tracking-wider ml-1.5">
              {weather?.location.name}{weather?.location.admin1 ? `, ${weather.location.admin1}` : ''}
            </Text>
            <View className="ml-1.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
              <Text className="text-[#71717A] text-[8.5px] font-mono uppercase">CHANGE</Text>
            </View>
          </Pressable>

          <View className="flex-row items-center gap-1.5">
            {/* Unit Toggle Button */}
            <Pressable
              onPress={handleToggleUnit}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              className="px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.08]"
            >
              <Text className="text-[#F4F4F5] text-[10px] font-mono font-bold">
                {unitFahrenheit ? '°F' : '°C'}
              </Text>
            </Pressable>

            {/* Refresh Button */}
            <Pressable
              onPress={handleRefresh}
              disabled={refreshing}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] items-center justify-center"
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <RefreshCw size={12} color="#71717A" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Main Temperature & Weather Overview */}
        <View className="flex-row items-center justify-between mb-3.5">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] items-center justify-center mr-3">
              {renderWeatherIcon(weather?.weatherCondition || 'clear', 26)}
            </View>
            <View>
              <View className="flex-row items-baseline">
                <Text className="text-[#F4F4F5] font-mono font-black text-3xl tabular-nums tracking-tight">
                  {currentTemp}
                </Text>
                <Text className="text-[#71717A] font-mono font-bold text-base ml-0.5">
                  {unitLabel}
                </Text>
              </View>
              <Text className="text-[#71717A] text-[11px] font-mono font-medium">
                Feels like {feelsLike}{unitLabel} &bull; {weather?.weatherLabel}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <View className="px-2 py-1 rounded-full bg-blood-red/20 border border-blood-red/40 mb-1">
              <Text className="text-blood-red text-[9px] font-black uppercase tracking-wider">
                OPEN-METEO API
              </Text>
            </View>
            <Text className="text-[#71717A] text-[9px] font-mono">
              High {weather?.tempMax}{unitLabel} / Low {weather?.tempMin}{unitLabel}
            </Text>
          </View>
        </View>

        {/* 4 Environmental Telemetry Badges */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 p-2 rounded-xl bg-[#0A0A0C] border border-white/[0.06] items-center">
            <View className="flex-row items-center mb-0.5">
              <Droplets size={11} color="#06B6D4" />
              <Text className="text-[#71717A] text-[8.5px] font-mono uppercase ml-1">Humidity</Text>
            </View>
            <Text className="text-[#F4F4F5] font-mono font-bold text-xs">{weather?.humidity}%</Text>
          </View>

          <View className="flex-1 p-2 rounded-xl bg-[#0A0A0C] border border-white/[0.06] items-center">
            <View className="flex-row items-center mb-0.5">
              <Wind size={11} color="#38BDF8" />
              <Text className="text-[#71717A] text-[8.5px] font-mono uppercase ml-1">Wind</Text>
            </View>
            <Text className="text-[#F4F4F5] font-mono font-bold text-xs">{weather?.windSpeed} km/h</Text>
          </View>

          <View className="flex-1 p-2 rounded-xl bg-[#0A0A0C] border border-white/[0.06] items-center">
            <View className="flex-row items-center mb-0.5">
              <Sun size={11} color="#F59E0B" />
              <Text className="text-[#71717A] text-[8.5px] font-mono uppercase ml-1">UV Index</Text>
            </View>
            <Text className="text-amber-400 font-mono font-bold text-xs">{weather?.uvIndex}</Text>
          </View>

          <View className="flex-1 p-2 rounded-xl bg-[#0A0A0C] border border-white/[0.06] items-center">
            <View className="flex-row items-center mb-0.5">
              <Thermometer size={11} color="#DC2626" />
              <Text className="text-[#71717A] text-[8.5px] font-mono uppercase ml-1">Rain</Text>
            </View>
            <Text className="text-[#F4F4F5] font-mono font-bold text-xs">{weather?.precipitation} mm</Text>
          </View>
        </View>

        {/* Athlete Biomechanics & Training Advisory */}
        <View className="p-3 rounded-xl bg-blood-red/10 border border-blood-red/30 mb-3">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <Zap size={12} color="#DC2626" />
              <Text className="text-blood-red text-[10px] font-black uppercase tracking-widest ml-1.5">
                ATHLETE TRAINING ADVISORY
              </Text>
            </View>
            {weather?.hydrationBonusMl ? (
              <View className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40">
                <Text className="text-cyan-400 text-[8.5px] font-mono font-bold">
                  +{weather.hydrationBonusMl}ML WATER
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-[#F4F4F5] text-xs font-medium leading-relaxed">
            {weather?.trainingAdvice}
          </Text>
          <Text className="text-[#71717A] text-[10px] font-mono mt-1">
            {weather?.hydrationImpactNote}
          </Text>
        </View>

        {/* Next 6-Hour Forecast Strip */}
        {weather?.hourly && weather.hourly.length > 0 && (
          <View className="pt-2 border-t border-white/[0.05]">
            <Text className="text-[#71717A] text-[9px] font-mono uppercase tracking-widest mb-2">
              6-HOUR ATHLETE FORECAST
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {weather.hourly.map((item, idx) => (
                <View
                  key={idx}
                  className="py-2 px-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.06] items-center mr-1.5 min-w-[56px]"
                >
                  <Text className="text-[#71717A] text-[9px] font-mono mb-1">{item.hourLabel}</Text>
                  <View className="my-1">
                    {renderWeatherIcon(interpretWeatherCode(item.weatherCode).condition, 16)}
                  </View>
                  <Text className="text-[#F4F4F5] font-mono font-bold text-xs mt-0.5">
                    {unitFahrenheit ? Math.round((item.temp * 9) / 5 + 32) : item.temp}°
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </GlassCard>

      {/* LOCATION SELECTION & CITY SEARCH MODAL */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-[#0A0A0C]/90 px-4">
          <View className="bg-[#121215] border border-white/[0.1] rounded-3xl p-5 w-full max-w-sm max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <View className="flex-row items-center">
                <MapPin size={18} color="#DC2626" />
                <Text className="text-white font-extrabold text-base uppercase ml-2">
                  Training Base Location
                </Text>
              </View>
              <Pressable
                onPress={() => setShowLocationModal(false)}
                className="w-7 h-7 rounded-full bg-white/[0.05] items-center justify-center active:opacity-75"
              >
                <X size={15} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Public Geocoding Search Bar */}
            <View className="flex-row items-center px-3 py-2 rounded-xl bg-[#0A0A0C] border border-white/[0.08] mb-3">
              <Search size={14} color="#71717A" />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search any global city (Open-Meteo API)..."
                placeholderTextColor="#71717A"
                className="flex-1 ml-2 text-white text-xs font-medium"
              />
              {searching && <ActivityIndicator size="small" color="#DC2626" />}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[350px]">
              {/* Search Results */}
              {searchResults.length > 0 ? (
                <View className="mb-3">
                  <Text className="text-[#71717A] text-[9.5px] font-mono uppercase tracking-widest mb-1.5">
                    SEARCH RESULTS
                  </Text>
                  <View className="gap-1.5">
                    {searchResults.map((loc, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => handleSelectLocation(loc)}
                        className="p-2.5 rounded-xl bg-[#0A0A0C] border border-white/[0.08] flex-row items-center justify-between active:border-red-600/50"
                      >
                        <View>
                          <Text className="text-[#F4F4F5] text-xs font-bold">
                            {loc.name}{loc.admin1 ? `, ${loc.admin1}` : ''}
                          </Text>
                          <Text className="text-[#71717A] text-[10px]">{loc.country}</Text>
                        </View>
                        <ArrowUpRight size={14} color="#71717A" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : searchQuery.length >= 2 && !searching ? (
                <Text className="text-[#71717A] text-xs text-center py-2 font-mono">No matching cities found</Text>
              ) : null}

              {/* Popular Training Hub Presets */}
              <View className="mb-2">
                <Text className="text-[#71717A] text-[9.5px] font-mono uppercase tracking-widest mb-2">
                  GLOBAL FITNESS HUBS
                </Text>
                <View className="gap-1.5">
                  {DEFAULT_LOCATIONS.map((loc) => {
                    const isSelected = weather?.location.name === loc.name;
                    return (
                      <Pressable
                        key={loc.name}
                        onPress={() => handleSelectLocation(loc)}
                        className={`p-2.5 rounded-xl border flex-row items-center justify-between ${
                          isSelected
                            ? 'bg-blood-red/20 border-red-600/50'
                            : 'bg-[#0A0A0C] border-white/[0.08]'
                        }`}
                      >
                        <View>
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? 'text-blood-red' : 'text-[#F4F4F5]'
                            }`}
                          >
                            {loc.name}{loc.admin1 ? `, ${loc.admin1}` : ''}
                          </Text>
                          <Text className="text-[#71717A] text-[10px]">{loc.country}</Text>
                        </View>
                        {isSelected ? (
                          <CheckCircle2 size={16} color="#DC2626" />
                        ) : (
                          <ArrowUpRight size={14} color="#71717A" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
