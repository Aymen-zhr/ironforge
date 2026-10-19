/**
 * Exercise Demonstration Media Service
 * Provides looping biomechanical demonstration GIFs, videos, and 16:9 poster preview thumbnails
 * mapped from verified ExerciseDB & Free Exercise DB open CDN assets.
 */

export interface ExerciseMedia {
  gifUrl: string;
  videoUrl: string;
  posterUrl: string;
}

// Muscle group fallback looping demonstrations
const MUSCLE_FALLBACK_GIFS: Record<string, string> = {
  chest: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
  pectorals: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
  shoulders: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
  delts: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
  deltoids: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
  lats: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-bar-lateral-pulldown.gif',
  back: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-low-seated-row.gif',
  'middle back': 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-low-seated-row.gif',
  'lower back': 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
  biceps: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif',
  triceps: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif',
  arms: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif',
  quads: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/barbell-bench-squat.gif',
  quadriceps: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/barbell-bench-squat.gif',
  hamstrings: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-lying-leg-curl.gif',
  glutes: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
  calves: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/barbell-standing-calf-raise.gif',
  abs: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0001-2gPfomN.gif',
  abdominals: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0001-2gPfomN.gif',
  traps: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/barbell-shrug.gif',
};

// Curated high-precision map of popular exercise IDs and keyword keys to verified CDN looping demonstrations
const EXERCISE_KEYWORD_GIFS: { pattern: RegExp; gifUrl: string }[] = [
  // Chest
  {
    pattern: /incline.*bench|incline.*press/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
  },
  {
    pattern: /bench.*press|chest.*press/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
  },
  {
    pattern: /crossover|cable.*fly|pec.*deck/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-upper-chest-crossovers.gif',
  },
  {
    pattern: /push.?up/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0975-ufaxB52.gif',
  },
  {
    pattern: /chest.*dip|dip/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/assisted-chest-dip-kneeling.gif',
  },

  // Delts & Shoulders
  {
    pattern: /lateral.*raise|side.*raise/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
  },
  {
    pattern: /overhead.*press|military.*press|shoulder.*press/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-seated-overhead-press.gif',
  },
  {
    pattern: /rear.*delt|face.*pull|reverse.*fly/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-rear-lateral-raise.gif',
  },
  {
    pattern: /shrug/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/barbell-shrug.gif',
  },

  // Back & Lats
  {
    pattern: /lat.*pull|pulldown/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-bar-lateral-pulldown.gif',
  },
  {
    pattern: /pull.?up|chin.?up/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/biceps-pull-up.gif',
  },
  {
    pattern: /seated.*row|cable.*row/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-low-seated-row.gif',
  },
  {
    pattern: /bent.*over.*row|barbell.*row|t-bar.*row/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif',
  },

  // Biceps
  {
    pattern: /hammer.*curl/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-hammer-curl-with-rope.gif',
  },
  {
    pattern: /dumbbell.*curl|incline.*curl/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-biceps-curl.gif',
  },
  {
    pattern: /curl|preacher/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif',
  },

  // Triceps
  {
    pattern: /pushdown|rope.*pushdown/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif',
  },
  {
    pattern: /close.*grip.*bench/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-incline-close-grip-bench-press.gif',
  },
  {
    pattern: /skull.*crush|overhead.*tricep|triceps.*extension/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-seated-overhead-triceps-extension.gif',
  },

  // Quads & Legs
  {
    pattern: /leg.*press/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0739-iIq9jU4.gif',
  },
  {
    pattern: /leg.*extension/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif',
  },
  {
    pattern: /squat/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/barbell-bench-squat.gif',
  },

  // Hamstrings & Glutes
  {
    pattern: /leg.*curl|hamstring.*curl/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-lying-leg-curl.gif',
  },
  {
    pattern: /romanian|rdl/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-romanian-deadlift.gif',
  },
  {
    pattern: /deadlift/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
  },

  // Calves
  {
    pattern: /calf/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/barbell-standing-calf-raise.gif',
  },

  // Abs & Core
  {
    pattern: /sit.?up|crunch|plank|leg.*raise|abdom/i,
    gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0001-2gPfomN.gif',
  },
];

/**
 * Resolves verified looping GIF, video, and poster thumbnail URLs for any exercise.
 */
export function resolveExerciseMedia(
  exerciseId: string,
  exerciseName: string,
  primaryMuscle?: string
): ExerciseMedia {
  // 1. Poster URL from Free Exercise DB raw CDN (16:9 starting frame)
  const safeId = exerciseId || exerciseName.replace(/\s+/g, '_');
  const posterUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${safeId}/0.jpg`;

  // 2. Search keyword pattern matches
  const searchSubject = `${exerciseName} ${safeId}`.toLowerCase();
  for (const item of EXERCISE_KEYWORD_GIFS) {
    if (item.pattern.test(searchSubject)) {
      return {
        gifUrl: item.gifUrl,
        videoUrl: item.gifUrl,
        posterUrl,
      };
    }
  }

  // 3. Fallback by targeted primary muscle group
  const muscleKey = (primaryMuscle || '').toLowerCase().trim();
  const muscleFallback =
    MUSCLE_FALLBACK_GIFS[muscleKey] ||
    MUSCLE_FALLBACK_GIFS['chest']; // default fallback

  return {
    gifUrl: muscleFallback,
    videoUrl: muscleFallback,
    posterUrl,
  };
}

export default resolveExerciseMedia;
