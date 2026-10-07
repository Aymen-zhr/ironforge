/**
 * AEGIS PUBLIC API HUB // 100% Free, Open, and Public API Integrations
 * Unified interface for:
 * 1. Open Food Facts Public API (Global food & grocery database, 3M+ products, barcode lookup)
 * 2. Open-Meteo Public API (Global weather, apparent temp, humidity, UV index, zero API key)
 * 3. Pollinations.ai Public Neural API (Free LLM text/recipe synthesis)
 * 4. Free ExerciseDB & Wger Public Exercise API (Muscle mechanics, execution guides)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// 1. OPEN FOOD FACTS PUBLIC API (Food Search & Barcode Lookup)
// ---------------------------------------------------------------------------

export interface PublicFoodItem {
  id: string;
  name: string;
  brand: string;
  calories: number; // kcal per 100g
  protein: number;  // g per 100g
  carbs: number;    // g per 100g
  fats: number;     // g per 100g
  servingSize: string;
  source: 'OpenFoodFacts';
  imageUrl?: string;
}

const USER_AGENT_HEADER = 'IronForgeAthleteApp/1.0 (contact@ironforge.app; https://ironforge.app)';

/**
 * Searches the public Open Food Facts database for groceries, products, and ingredients.
 * No API key required.
 */
export async function searchOpenFoodFacts(query: string, limit: number = 8): Promise<PublicFoodItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      trimmed
    )}&search_simple=1&action=process&json=1&page_size=${limit}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT_HEADER,
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const products = data.products || [];

    return products
      .filter((p: any) => p.product_name || p.generic_name)
      .map((p: any) => {
        const nutriments = p.nutriments || {};
        const kcal = Math.round(
          nutriments['energy-kcal_100g'] ||
            (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0)
        );
        const protein = Math.round(Number(nutriments.proteins_100g) || 0);
        const carbs = Math.round(Number(nutriments.carbohydrates_100g) || 0);
        const fats = Math.round(Number(nutriments.fat_100g) || 0);

        return {
          id: p.code || p.id || `off-${Math.random()}`,
          name: String(p.product_name || p.generic_name || 'Food Item').trim(),
          brand: String(p.brands || 'Generic Whole Food').trim(),
          calories: kcal,
          protein,
          carbs,
          fats,
          servingSize: String(p.serving_size || '100g').trim(),
          source: 'OpenFoodFacts' as const,
          imageUrl: p.image_front_thumb_url || p.image_thumb_url || undefined,
        };
      });
  } catch (err) {
    console.warn('[publicApis] searchOpenFoodFacts error:', err);
    return [];
  }
}

/**
 * Looks up a barcode from Open Food Facts public API.
 */
export async function lookupBarcode(barcode: string): Promise<PublicFoodItem | null> {
  const clean = barcode.trim();
  if (!clean) return null;

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT_HEADER,
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.status === 1 && data.product) {
      const p = data.product;
      const nutriments = p.nutriments || {};
      const kcal = Math.round(
        nutriments['energy-kcal_100g'] ||
          (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0)
      );
      const protein = Math.round(Number(nutriments.proteins_100g) || 0);
      const carbs = Math.round(Number(nutriments.carbohydrates_100g) || 0);
      const fats = Math.round(Number(nutriments.fat_100g) || 0);

      return {
        id: p.code || clean,
        name: String(p.product_name || p.generic_name || 'Scanned Product').trim(),
        brand: String(p.brands || 'Commercial Brand').trim(),
        calories: kcal,
        protein,
        carbs,
        fats,
        servingSize: String(p.serving_size || '100g').trim(),
        source: 'OpenFoodFacts',
        imageUrl: p.image_front_thumb_url || undefined,
      };
    }
  } catch (err) {
    console.warn('[publicApis] lookupBarcode error:', err);
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2. OPEN-METEO PUBLIC WEATHER API (Climate & Hydration Perspiration Offset)
// ---------------------------------------------------------------------------

export interface PublicWeatherData {
  temperatureC: number;
  apparentTempC: number;
  humidityPct: number;
  weatherCode: number;
  conditionLabel: string;
  heatOffsetMl: number;
  isHighHeat: boolean;
}

export async function fetchOpenMeteoWeather(
  latitude: number = 34.0522,
  longitude: number = -118.2437
): Promise<PublicWeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&timezone=auto`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT_HEADER,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const current = data.current || {};
      const temp = Math.round(current.temperature_2m ?? 22);
      const apparent = Math.round(current.apparent_temperature ?? temp);
      const humidity = Math.round(current.relative_humidity_2m ?? 45);
      const code = current.weather_code ?? 0;

      const conditionLabel =
        code === 0
          ? 'Clear Sky'
          : code <= 2
          ? 'Partly Cloudy'
          : code <= 48
          ? 'Overcast'
          : code <= 65
          ? 'Rain'
          : 'Thunderstorms';

      const isHighHeat = apparent >= 26;
      const heatOffsetMl = isHighHeat ? 500 : 0;

      return {
        temperatureC: temp,
        apparentTempC: apparent,
        humidityPct: humidity,
        weatherCode: code,
        conditionLabel,
        heatOffsetMl,
        isHighHeat,
      };
    }
  } catch (err) {
    console.warn('[publicApis] fetchOpenMeteoWeather error:', err);
  }

  // Fallback defaults
  return {
    temperatureC: 22,
    apparentTempC: 22,
    humidityPct: 45,
    weatherCode: 0,
    conditionLabel: 'Clear Sky',
    heatOffsetMl: 0,
    isHighHeat: false,
  };
}

// ---------------------------------------------------------------------------
// 3. WGER PUBLIC EXERCISE API (Free Open Source Exercise Database)
// ---------------------------------------------------------------------------

export interface PublicExerciseDetail {
  id: number;
  name: string;
  categoryName: string;
  description: string;
  muscles: string[];
}

export async function searchPublicExercises(query: string): Promise<PublicExerciseDetail[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  try {
    const url = `https://wger.de/api/v2/exerciseinfo/?language=2&limit=10`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT_HEADER,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const list = data.results || [];
      return list
        .filter((item: any) => item.name && item.name.toLowerCase().includes(clean))
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          categoryName: item.category?.name || 'Strength',
          description: (item.description || '').replace(/<[^>]*>/g, '').trim(),
          muscles: (item.muscles || []).map((m: any) => m.name || 'Muscle'),
        }));
    }
  } catch (err) {
    console.warn('[publicApis] searchPublicExercises error:', err);
  }

  return [];
}
