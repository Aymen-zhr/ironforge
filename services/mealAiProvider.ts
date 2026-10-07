/**
 * AEGIS CULINARY ENGINE // Next-Gen Autonomous Meal & Recipe Provider
 * Combines free external neural LLM synthesis (Pollinations.ai / OpenAI backend)
 * with an instant zero-latency offline Athletic Chef synthesizer fallback.
 * Guarantees 100% success rate with zero API key dependencies and zero crashes.
 */

export interface SynthesizedRecipe {
  id: string;
  title: string;
  prepTime: string;
  category: 'High Protein' | 'Rapid Prep' | 'Post Workout' | 'Clean Fuel';
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  usedIngredients: string[];
  instructions: string[];
  chefNote?: string;
}

export interface IngredientInput {
  name: string;
  grams?: number;
  category?: string;
}

export interface MealSynthesisResponse {
  success: boolean;
  provider: 'neural-llm' | 'algorithmic-chef';
  recipes: SynthesizedRecipe[];
  detectedIngredients: { name: string; quantity: string; category: string }[];
}

/**
 * High-precision culinary synthesizer:
 * Categorizes ingredients into culinary domains (Sweet / Breakfast vs Savory Meats vs Plant Proteins)
 * and generates authentic athletic gym meals with real step-by-step culinary instructions.
 */
function generateAlgorithmicChefRecipes(
  ingredients: IngredientInput[],
  goal: string = 'Hypertrophy'
): SynthesizedRecipe[] {
  const ingNames = ingredients.map((i) => i.name.toLowerCase());

  // Detection flags
  const hasEggs = ingNames.some((n) => n.includes('egg'));
  const hasChicken = ingNames.some((n) => n.includes('chicken') || n.includes('poultry') || n.includes('turkey'));
  const hasBeef = ingNames.some((n) => n.includes('beef') || n.includes('steak') || n.includes('mince'));
  const hasFish = ingNames.some((n) => n.includes('tuna') || n.includes('salmon') || n.includes('fish') || n.includes('shrimp'));
  const hasWhey = ingNames.some((n) => n.includes('whey') || n.includes('protein powder') || n.includes('isolate'));
  const hasRice = ingNames.some((n) => n.includes('rice') || n.includes('grain') || n.includes('quinoa'));
  const hasOats = ingNames.some((n) => n.includes('oat'));
  const hasGreekYogurt = ingNames.some((n) => n.includes('yogurt') || n.includes('curd') || n.includes('skyr'));
  const hasPeanutButter = ingNames.some((n) => n.includes('peanut butter') || n.includes('almond butter') || n.includes('nut butter'));
  const hasFruit = ingNames.some((n) => n.includes('berr') || n.includes('banana') || n.includes('apple'));

  const isSweetBreakfast =
    !hasEggs &&
    ingNames.some((n) =>
      n.includes('oat') ||
      n.includes('whey') ||
      n.includes('yogurt') ||
      n.includes('curd') ||
      n.includes('berr') ||
      n.includes('banana') ||
      n.includes('peanut butter') ||
      n.includes('honey') ||
      n.includes('milk') ||
      n.includes('cinnamon') ||
      n.includes('chia')
    ) &&
    !hasChicken &&
    !hasBeef &&
    !hasFish;

  // Calculate dynamic macros
  let baseProtein = 32;
  let baseCarbs = 38;
  let baseFats = 10;

  if (hasChicken || hasFish) baseProtein += 24;
  if (hasBeef) { baseProtein += 22; baseFats += 9; }
  if (hasEggs) { baseProtein += 14; baseFats += 11; }
  if (hasWhey) baseProtein += 26;
  if (hasGreekYogurt) baseProtein += 18;
  if (hasRice) baseCarbs += 40;
  if (hasOats) { baseCarbs += 34; baseFats += 4; }
  if (hasPeanutButter) { baseFats += 14; baseProtein += 6; }
  if (hasFruit) baseCarbs += 22;

  // Goal tuning
  const isCut = goal.toLowerCase().includes('cut');
  const isBulk = goal.toLowerCase().includes('bulk');

  if (isCut) {
    baseCarbs = Math.max(15, Math.round(baseCarbs * 0.75));
    baseFats = Math.max(6, Math.round(baseFats * 0.7));
    baseProtein = Math.round(baseProtein * 1.05);
  } else if (isBulk) {
    baseCarbs = Math.round(baseCarbs * 1.3);
    baseFats = Math.round(baseFats * 1.25);
    baseProtein = Math.round(baseProtein * 1.1);
  }

  const totalCals = Math.round(baseProtein * 4 + baseCarbs * 4 + baseFats * 9);
  const mainNames = ingredients.map((i) => i.name).slice(0, 4);
  const primaryName = mainNames[0] || 'Power';

  // 1. BREAKFAST / SWEET INGREDIENTS PATHWAY (Oats, Whey, Yogurt, Berries)
  if (isSweetBreakfast) {
    return [
      {
        id: `algo-breakfast-1-${Date.now()}`,
        title: `Anabolic ${primaryName} Overnight Proats`,
        prepTime: '5 MINS',
        category: 'High Protein',
        macros: {
          calories: totalCals,
          protein: baseProtein,
          carbs: baseCarbs,
          fats: baseFats,
        },
        usedIngredients: mainNames,
        instructions: [
          `In a deep meal bowl or mason jar, combine ${hasOats ? 'rolled oats' : primaryName} with 150ml unsweetened almond milk or cold water.`,
          `Whisk in ${hasWhey ? 'whey protein' : 'protein base'} and a pinch of cinnamon until completely smooth with no clumps.`,
          `Fold in ${mainNames.slice(1).join(' and ') || 'Greek yogurt or toppings'} for creamy thickness and macro density.`,
          `Enjoy immediately or refrigerate overnight for maximum beta-glucan starch hydration.`,
        ],
        chefNote: 'High beta-glucan complex carbs paired with bioavailable amino acids for sustained 4-hour leucine elevation.',
      },
      {
        id: `algo-breakfast-2-${Date.now()}`,
        title: `Layered ${mainNames[1] || primaryName} Protein Parfait Bowl`,
        prepTime: '4 MINS',
        category: 'Rapid Prep',
        macros: {
          calories: Math.round(totalCals * 0.88),
          protein: Math.round(baseProtein * 0.95),
          carbs: Math.round(baseCarbs * 0.85),
          fats: Math.max(6, Math.round(baseFats * 0.8)),
        },
        usedIngredients: mainNames,
        instructions: [
          `Scoop ${hasGreekYogurt ? 'Greek yogurt' : 'chilled yogurt base'} into a chilled bowl as a high-casein foundational bed.`,
          `Stir in ${hasWhey ? 'half a scoop of whey' : 'protein'} with 20ml water to form a decadent protein pudding swirl.`,
          `Layer with crunchy ${hasOats ? 'oats' : mainNames[0]} and fresh sliced toppings across the surface.`,
          `Drizzle lightly with zero-calorie syrup or honey for clean immediate glycogen priming.`,
        ],
        chefNote: 'Dual micellar casein and whey matrix ensures both rapid and sustained 6-hour muscle protein synthesis.',
      },
      {
        id: `algo-breakfast-3-${Date.now()}`,
        title: `Whipped ${primaryName} Fluff & Anabolic Sludge`,
        prepTime: '6 MINS',
        category: 'Clean Fuel',
        macros: {
          calories: Math.round(totalCals * 0.78),
          protein: Math.round(baseProtein * 1.05),
          carbs: Math.max(12, Math.round(baseCarbs * 0.6)),
          fats: Math.max(5, Math.round(baseFats * 0.7)),
        },
        usedIngredients: mainNames,
        instructions: [
          `Add ${primaryName} and ${mainNames.slice(1, 3).join(' and ') || 'staples'} to a wide mixing bowl with 40ml of ice-cold water.`,
          `Vigorously whisk or hand-blend for 2 minutes until aerated, voluminous, and glossy mousse-like texture forms.`,
          `Transfer to the freezer for 5 minutes to set into a thick high-protein soft-serve consistency.`,
          `Spoon out immediately as a zero-guilt, high-satiety physique treat.`,
        ],
        chefNote: 'Unbeatable protein-to-calorie density; maximizes gastric fullness and leptin response during deficit phases.',
      },
    ];
  }

  // 2. EGGS + OATS / BREAKFAST SCRAMBLE PATHWAY
  if (hasEggs && hasOats) {
    return [
      {
        id: `algo-pancake-1-${Date.now()}`,
        title: `Golden Anabolic ${primaryName} Oat Pancakes`,
        prepTime: '10 MINS',
        category: 'High Protein',
        macros: {
          calories: totalCals,
          protein: baseProtein,
          carbs: baseCarbs,
          fats: baseFats,
        },
        usedIngredients: mainNames,
        instructions: [
          `Blend oats, eggs, a pinch of sea salt, and cinnamon in a bullet blender for 30 seconds into a smooth batter.`,
          `Heat a non-stick skillet over medium heat with light cooking spray.`,
          `Pour batter into 3 equal circles; flip when surface bubbles appear (approx. 2 minutes per side).`,
          `Stack high and garnish with your remaining ingredients or sugar-free syrup.`,
        ],
        chefNote: 'Whole food biological value of 100 with bioavailable micronutrients (choline, zinc, lutein).',
      },
      {
        id: `algo-scramble-2-${Date.now()}`,
        title: `Athlete Power Scramble & Warm Oat Bowl`,
        prepTime: '8 MINS',
        category: 'Post Workout',
        macros: {
          calories: Math.round(totalCals * 0.95),
          protein: Math.round(baseProtein * 0.95),
          carbs: Math.round(baseCarbs * 0.9),
          fats: baseFats,
        },
        usedIngredients: mainNames,
        instructions: [
          `Whisk whole eggs and whites with black pepper and a splash of water for extra fluffiness.`,
          `Soft-scramble in a pan over medium-low heat with silicone spatula until tender curds form (3 mins).`,
          `Microwave oats with 150ml water for 90 seconds in a separate bowl.`,
          `Plate side-by-side for the classic champion bodybuilding breakfast.`,
        ],
        chefNote: 'Clean split-digestion meal: immediate egg albumin uptake backed by slow-burning oat carbs.',
      },
      {
        id: `algo-bake-3-${Date.now()}`,
        title: `Crispy Skillet Oat Frittata`,
        prepTime: '12 MINS',
        category: 'Clean Fuel',
        macros: {
          calories: Math.round(totalCals * 0.85),
          protein: baseProtein,
          carbs: Math.round(baseCarbs * 0.75),
          fats: Math.max(8, Math.round(baseFats * 0.8)),
        },
        usedIngredients: mainNames,
        instructions: [
          `Toast dry oats in a hot skillet for 1 minute until fragrant and nutty.`,
          `Pour seasoned whisked eggs directly over the oats and reduce heat to low.`,
          `Cover with lid for 5 minutes until top is set and bottom has a golden crisp crust.`,
          `Slide onto a cutting board, slice into wedges, and serve hot.`,
        ],
        chefNote: 'High dietary fiber and thermogenic egg protein for prolonged metabolic elevation.',
      },
    ];
  }

  // 3. SAVORY LUNCH / DINNER GYM MEALS PATHWAY
  return [
    {
      id: `algo-savory-1-${Date.now()}`,
      title: `${primaryName} & ${mainNames[1] || 'Macro'} Searing Skillet`,
      prepTime: '12 MINS',
      category: 'High Protein',
      macros: {
        calories: totalCals,
        protein: baseProtein,
        carbs: baseCarbs,
        fats: baseFats,
      },
      usedIngredients: mainNames,
      instructions: [
        `Preheat a heavy non-stick skillet or cast-iron pan over medium-high heat with light spray.`,
        `Season ${primaryName} with garlic powder, smoked paprika, cracked pepper, and pink Himalayan salt.`,
        `Sear protein for 5-7 minutes until caramelized and thoroughly cooked through.`,
        `Toss in ${mainNames.slice(1).join(' and ') || 'vegetables & carbs'}, sauté for 3 minutes to marry pan fond, and plate.`,
      ],
      chefNote: 'Rapid post-workout leucine surge triggering immediate mTOR phosphorylation and protein synthesis.',
    },
    {
      id: `algo-savory-2-${Date.now()}`,
      title: `Anabolic ${mainNames[1] || primaryName} Precision Macro Bowl`,
      prepTime: '8 MINS',
      category: 'Rapid Prep',
      macros: {
        calories: Math.round(totalCals * 0.92),
        protein: Math.round(baseProtein * 0.95),
        carbs: Math.round(baseCarbs * 0.9),
        fats: Math.max(8, Math.round(baseFats * 0.8)),
      },
      usedIngredients: mainNames,
      instructions: [
        `Warm and fluff ${hasRice ? 'steamed rice' : mainNames[1] || 'carbohydrate base'} as a clean foundation.`,
        `Slice ${primaryName} against the grain into bite-sized medallions and arrange over the base.`,
        `Dress with ${mainNames.slice(2).join(', ') || 'seasonings'}, crushed red pepper, and a drizzle of low-sodium soy sauce.`,
        `Serve hot for clean, easily digestible pre- or post-training fueling.`,
      ],
      chefNote: 'Clean glycogen replenishment with minimal saturated lipids for lean muscle preservation.',
    },
    {
      id: `algo-savory-3-${Date.now()}`,
      title: `Crisp High-Satiety ${primaryName} Shred Stir-Fry`,
      prepTime: '14 MINS',
      category: 'Clean Fuel',
      macros: {
        calories: Math.round(totalCals * 0.8),
        protein: Math.round(baseProtein * 1.05),
        carbs: Math.max(15, Math.round(baseCarbs * 0.6)),
        fats: Math.max(6, Math.round(baseFats * 0.75)),
      },
      usedIngredients: mainNames,
      instructions: [
        `Heat a deep pan or wok until smoking hot with a light brush of cold-pressed oil.`,
        `Flash-sear aromatics and ${primaryName} for 4 minutes over intense heat.`,
        `Toss in crisp greens and remaining ${mainNames.slice(1).join(', ') || 'ingredients'} with 2 tablespoons of water or broth to deglaze.`,
        `Finish with a squeeze of fresh lemon juice or hot sauce for an immediate thermogenic kick.`,
      ],
      chefNote: 'Maximal protein-to-calorie ratio; engineered to keep hunger suppressed during strict cutting protocols.',
    },
  ];
}

/**
 * Synthesizes 3 targeted sports nutrition recipes from given ingredients.
 * Uses Pollinations.ai neural LLM (OpenAI model) with instant Algorithmic Chef fallback.
 */
export async function synthesizeMeals(
  rawIngredients: (string | IngredientInput)[],
  goal: string = 'Hypertrophy'
): Promise<MealSynthesisResponse> {
  const normalized: IngredientInput[] = rawIngredients.map((item) =>
    typeof item === 'string' ? { name: item.trim(), grams: 150 } : item
  ).filter((i) => i.name.length > 0);

  if (normalized.length === 0) {
    normalized.push({ name: 'Chicken Breast', grams: 200, category: 'Protein' });
    normalized.push({ name: 'Jasmine Rice', grams: 150, category: 'Carb' });
  }

  const detectedIngredients = normalized.map((ing) => ({
    name: ing.name,
    quantity: ing.grams ? `${ing.grams}g` : 'User portion',
    category: ing.category || 'Protein',
  }));

  const ingredientListStr = normalized
    .map((i) => (i.grams ? `${i.name} (${i.grams}g)` : i.name))
    .join(', ');

  // 1. Attempt Pollinations.ai Neural LLM with strict 6s timeout
  try {
    const prompt = `You are an elite sports nutritionist and Michelin-trained gym chef.
User available ingredients: ${ingredientListStr}.
Athlete Goal: ${goal}.

Generate exactly 3 athletic recipes using these ingredients.
Return strictly a JSON object with this exact shape:
{
  "recipes": [
    {
      "title": "Recipe Title",
      "prepTime": "12 MINS",
      "category": "High Protein",
      "macros": { "calories": 450, "protein": 42, "carbs": 38, "fats": 12 },
      "usedIngredients": ["Ingredient 1", "Ingredient 2"],
      "instructions": ["Step 1", "Step 2", "Step 3"],
      "chefNote": "Athletic benefit note"
    }
  ]
}
Return ONLY valid JSON. No markdown code blocks.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an elite sports nutritionist. You output ONLY raw JSON matching the requested schema without any markdown ticks or commentary.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'openai',
        jsonMode: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && Array.isArray(parsed.recipes) && parsed.recipes.length > 0) {
        const recipes: SynthesizedRecipe[] = parsed.recipes.map((r: any, idx: number) => ({
          id: `neural-recipe-${idx + 1}-${Date.now()}`,
          title: String(r.title || `Recipe #${idx + 1}`).trim(),
          prepTime: String(r.prepTime || '15 MINS').toUpperCase(),
          category: (['High Protein', 'Rapid Prep', 'Post Workout', 'Clean Fuel'].includes(r.category)
            ? r.category
            : 'High Protein') as any,
          macros: {
            calories: Math.max(100, Math.min(2500, Number(r.macros?.calories || 400))),
            protein: Math.max(10, Math.min(200, Number(r.macros?.protein || 35))),
            carbs: Math.max(0, Math.min(300, Number(r.macros?.carbs || 30))),
            fats: Math.max(0, Math.min(150, Number(r.macros?.fats || 12))),
          },
          usedIngredients: Array.isArray(r.usedIngredients) ? r.usedIngredients.map(String) : normalized.map((i) => i.name),
          instructions: Array.isArray(r.instructions) && r.instructions.length > 0
            ? r.instructions.map(String)
            : ['Combine ingredients and cook over medium heat until tender.', 'Season to taste and serve.'],
          chefNote: r.chefNote ? String(r.chefNote) : 'Engineered for optimal protein synthesis.',
        }));

        return {
          success: true,
          provider: 'neural-llm',
          recipes,
          detectedIngredients,
        };
      }
    }
  } catch (err) {
    // If Pollinations network fails or times out, immediately fall back to Algorithmic Chef
    console.log('[mealAiProvider] Neural endpoint unavailable or timed out, activating Algorithmic Chef:', err);
  }

  // 2. Fallback to Instant Algorithmic Chef Engine
  const algoRecipes = generateAlgorithmicChefRecipes(normalized, goal);
  return {
    success: true,
    provider: 'algorithmic-chef',
    recipes: algoRecipes,
    detectedIngredients,
  };
}
