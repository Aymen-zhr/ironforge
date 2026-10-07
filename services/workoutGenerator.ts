import {
  CatalogExercise,
  ExerciseMechanic,
  filterCatalogForWorkout,
  getExerciseById,
} from '../data/exerciseCatalog';
import { resolveExerciseMedia } from './exerciseMediaService';

export type SplitType = 'PPL' | 'Upper/Lower' | 'Arnold Split' | 'Full Body';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type EquipmentType =
  | 'Full Commercial Gym'
  | 'Dumbbells & Bench'
  | 'Bodyweight / Calisthenics';

export interface WorkoutExercise {
  id: string;
  name: string;
  targetMuscle: string;
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  equipment?: string;
  mechanic: ExerciseMechanic;
  isWeakPointFocus: boolean;
  sets: number;
  reps: string;
  rpe: number;
  restSeconds: number;
  executionCue: string;
  instructions: string[];
  gifUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
}

export interface GeneratedWorkoutRoutine {
  routineTitle: string;
  split: string;
  estimatedDuration: string;
  primaryFocus: string[];
  coachNotes: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutGenerationParams {
  splitType: SplitType;
  experienceLevel: ExperienceLevel;
  equipment: EquipmentType;
  weakPoints: string[];
  sessionDurationMinutes: number;
}

/**
 * Deterministic fallback routine constructed directly from the local Free Exercise DB catalog.
 */
function getFallbackRoutine(
  params: WorkoutGenerationParams,
  candidatePool: CatalogExercise[]
): GeneratedWorkoutRoutine {
  const isUpper = params.splitType === 'Upper/Lower' || params.splitType === 'PPL';
  const pool = candidatePool.length >= 4 ? candidatePool : filterCatalogForWorkout({
    equipment: params.equipment,
    weakPoints: params.weakPoints,
    splitType: params.splitType,
    limit: 10,
  });

  const selectedExercises: WorkoutExercise[] = pool.slice(0, 5).map((ex, idx) => {
    const isWeak = idx < 2 && params.weakPoints.length > 0;
    const media = resolveExerciseMedia(ex.id, ex.name, ex.primaryMuscle);
    return {
      id: ex.id,
      name: ex.name,
      targetMuscle: ex.primaryMuscle,
      primaryMuscle: ex.primaryMuscle,
      secondaryMuscles: ex.secondaryMuscles,
      equipment: ex.equipment,
      mechanic: ex.mechanic,
      isWeakPointFocus: isWeak,
      sets: isWeak ? 4 : 3,
      reps: ex.mechanic === 'compound' ? '8-10 reps' : '12-15 reps',
      rpe: isWeak ? 8.5 : 8.0,
      restSeconds: ex.mechanic === 'compound' ? 120 : 75,
      executionCue: isWeak
        ? `Dedicated +25% volume overload. Maximize eccentric stretch and lock out with peak tension on ${ex.primaryMuscle}.`
        : `Drive explosive concentric acceleration and maintain strict structural control.`,
      instructions: ex.instructions,
      gifUrl: media.gifUrl,
      videoUrl: media.videoUrl,
      posterUrl: media.posterUrl,
    };
  });

  return {
    routineTitle: isUpper
      ? 'Anabolic Upper Hypertrophy // Weak-Point Overload'
      : 'Full Body Mechanical Tension Protocol',
    split: params.splitType,
    estimatedDuration: `${params.sessionDurationMinutes} mins`,
    primaryFocus: params.weakPoints.length > 0 ? params.weakPoints : ['Chest', 'Lateral Delts'],
    coachNotes:
      'Engineered with dedicated 25% surplus volume targeting priority focus muscle groups. Drive eccentric control to full anatomical stretch.',
    exercises: selectedExercises,
  };
}

/**
 * Generates an intense, customized hypertrophy workout grounded strictly in the Free Exercise DB catalog.
 */
export async function generateTargetedWorkout(
  params: WorkoutGenerationParams
): Promise<GeneratedWorkoutRoutine> {
  // 1. Locally filter Free Exercise DB catalog based on equipment and weak points
  const candidatePool = filterCatalogForWorkout({
    equipment: params.equipment,
    weakPoints: params.weakPoints,
    splitType: params.splitType,
    limit: 30,
  });

  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.warn('[workoutGenerator] API key missing, using grounded catalog fallback');
    return getFallbackRoutine(params, candidatePool);
  }

  const weakPointsList =
    params.weakPoints && params.weakPoints.length > 0
      ? params.weakPoints.join(', ')
      : 'General Hypertrophy';

  // Build condensed serialized pool to pass to Gemini
  const serializedPool = candidatePool.map((c) => ({
    id: c.id,
    name: c.name,
    primaryMuscle: c.primaryMuscle,
    secondaryMuscles: c.secondaryMuscles,
    equipment: c.equipment,
    mechanic: c.mechanic,
    instructionSummary: c.instructions.slice(0, 2).join(' '),
  }));

  const systemPrompt = `You are an elite hypertrophy strength coach and biomechanics specialist.
Construct an intense, high-yield training session tailored to prioritize the user's lagging muscle groups: ${weakPointsList}.

AVAILABLE EXERCISE POOL (Select EXCLUSIVELY from this provided dataset):
${JSON.stringify(serializedPool, null, 2)}

CORE DIRECTIVE & MANDATORY RULES:
1. Select exercises EXCLUSIVELY from this provided pool to construct the user's session.
   DO NOT invent, rephrase, or hallucinate exercises outside of this pool.
   The returned "id", "name", and "mechanic" MUST match an entry from the pool exactly.
2. Apply aggressive progressive overload cues and extra isolation volume for prioritized focus muscles: ${weakPointsList}.
3. For prioritized focus muscles (${weakPointsList}), add 20-30% extra isolation volume (e.g., 4 sets instead of 3) and set "isWeakPointFocus": true.
4. Construct a 4 to 6 exercise protocol respecting:
   - Split: ${params.splitType}
   - Experience Level: ${params.experienceLevel}
   - Target Session Duration: ${params.sessionDurationMinutes} minutes
   - Equipment Constraint: ${params.equipment}
5. For each exercise provide:
   - "id": Exact id matching an item in the pool
   - "name": Exact name from the pool
   - "targetMuscle": Specific anatomical target (e.g., "Clavicular Pectoralis Major", "Lateral Deltoid")
   - "mechanic": "compound" | "isolation" matching the pool
   - "isWeakPointFocus": boolean
   - "sets": number (3 to 5)
   - "reps": string (e.g., "8-10 reps" for compounds, "12-15 reps" for isolations)
   - "rpe": number (7.5 to 9.5)
   - "restSeconds": number (60 to 180)
   - "executionCue": intense biomechanical execution and progressive overload directive

Return strictly valid JSON matching this schema:
{
  "routineTitle": "string",
  "split": "${params.splitType}",
  "estimatedDuration": "${params.sessionDurationMinutes} mins",
  "primaryFocus": ["string"],
  "coachNotes": "string",
  "exercises": [
    {
      "id": "string",
      "name": "string",
      "targetMuscle": "string",
      "mechanic": "compound",
      "isWeakPointFocus": true,
      "sets": 4,
      "reps": "8-10 reps",
      "rpe": 8.5,
      "restSeconds": 90,
      "executionCue": "string"
    }
  ]
}
Strictly output raw JSON only, no markdown wrapping.`;

  const payload = {
    contents: [
      {
        parts: [{ text: systemPrompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  };

  // Prioritize Gemini 3.8 Flash, with resilient fallbacks for cloud spikes
  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
  ];

  let data: any = null;
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        data = await response.json();
        break;
      }

      if (response.status === 503 || response.status === 429) {
        lastError = new Error(`Gemini model ${model} unavailable (HTTP ${response.status})`);
        console.log(`[workoutGenerator] Model ${model} unavailable (${response.status}), failing over...`);
        continue;
      }

      const errBody = await response.text();
      throw new Error(`Gemini error (HTTP ${response.status}): ${errBody}`);
    } catch (reqErr) {
      lastError = reqErr;
    }
  }

  if (!data) {
    console.error('[workoutGenerator Error Details - Fallback Invoked]:', lastError);
    return getFallbackRoutine(params, candidatePool);
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!rawText) return getFallbackRoutine(params, candidatePool);

  try {
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: any = JSON.parse(cleanedText);

    if (Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
      // Cross-reference parsed exercises with the Free Exercise DB catalog
      const groundedExercises: WorkoutExercise[] = parsed.exercises.map(
        (e: any, idx: number) => {
          const matchedCatalog =
            getExerciseById(e.id) ||
            candidatePool.find((c) => c.name.toLowerCase() === String(e.name).toLowerCase()) ||
            candidatePool[idx % candidatePool.length];

          const isWeak =
            Boolean(e.isWeakPointFocus) ||
            params.weakPoints.some((wp) =>
              matchedCatalog.primaryMuscle.toLowerCase().includes(wp.toLowerCase())
            );

          const media = resolveExerciseMedia(
            matchedCatalog.id,
            matchedCatalog.name,
            matchedCatalog.primaryMuscle
          );

          return {
            id: matchedCatalog.id,
            name: matchedCatalog.name,
            targetMuscle: String(e.targetMuscle || matchedCatalog.primaryMuscle),
            primaryMuscle: matchedCatalog.primaryMuscle,
            secondaryMuscles: matchedCatalog.secondaryMuscles,
            equipment: matchedCatalog.equipment,
            mechanic: (e.mechanic === 'compound' || e.mechanic === 'isolation'
              ? e.mechanic
              : matchedCatalog.mechanic) as ExerciseMechanic,
            isWeakPointFocus: isWeak,
            sets: Number(e.sets || (isWeak ? 4 : 3)),
            reps: String(e.reps || (matchedCatalog.mechanic === 'compound' ? '8-10 reps' : '12-15 reps')),
            rpe: Number(e.rpe || (isWeak ? 8.5 : 8.0)),
            restSeconds: Number(e.restSeconds || (matchedCatalog.mechanic === 'compound' ? 120 : 75)),
            executionCue: String(
              e.executionCue ||
                `Strict tempo on ${matchedCatalog.primaryMuscle}. Pause at maximum stretch and accelerate through contraction.`
            ),
            instructions: matchedCatalog.instructions,
            gifUrl: media.gifUrl,
            videoUrl: media.videoUrl,
            posterUrl: media.posterUrl,
          };
        }
      );

      return {
        routineTitle: String(parsed.routineTitle || `${params.splitType} Hypertrophy Protocol`),
        split: String(parsed.split || params.splitType),
        estimatedDuration: String(parsed.estimatedDuration || `${params.sessionDurationMinutes} mins`),
        primaryFocus: Array.isArray(parsed.primaryFocus)
          ? parsed.primaryFocus
          : params.weakPoints,
        coachNotes: String(parsed.coachNotes || 'Prioritize progressive overload and full range of motion.'),
        exercises: groundedExercises,
      };
    }
  } catch (parseErr) {
    console.warn('[workoutGenerator] Parse error, utilizing grounded fallback:', parseErr);
  }

  return getFallbackRoutine(params, candidatePool);
}

/**
 * Open Exercise Database enrichment lookup.
 * Searches the public Wger API (wger.de) for validated anatomical descriptions.
 */
export async function fetchExerciseTechnique(exerciseName: string): Promise<string | null> {
  try {
    const cleanQuery = exerciseName.replace(/\(.*?\)/g, '').trim();
    const url = `https://wger.de/api/v2/exerciseinfo/?language=2&limit=1&term=${encodeURIComponent(
      cleanQuery
    )}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;
    const data = await response.json();
    const ex = data.results?.[0];
    if (ex && ex.description) {
      // Strip HTML tags from Wger API description
      return ex.description.replace(/<[^>]*>?/gm, '').trim();
    }
  } catch (err) {
    console.warn('[Wger API] Technique lookup warning for', exerciseName, err);
  }
  return null;
}

export default generateTargetedWorkout;
