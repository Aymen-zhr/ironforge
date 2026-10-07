export interface ExerciseDef {
  id: string;
  freeDbId: string;
  name: string;
  targetMuscle: string;
  mechanic: 'Compound' | 'Isolation';
  prescription: string;
  mediaUrl: string;
}

export interface RoutineTab {
  id: string;
  label: string;
  subtitle: string;
  exercises: ExerciseDef[];
}

export const MUSCLE_ROUTINES: RoutineTab[] = [
  {
    "id": "chest",
    "label": "Chest",
    "subtitle": "Pectoral Hypertrophy & Sternal Density",
    "exercises": [
      {
        "id": "bb-bench-press",
        "freeDbId": "Barbell_Bench_Press_-_Medium_Grip",
        "name": "Barbell Bench Press",
        "targetMuscle": "Sternal Pectoralis Major",
        "mechanic": "Compound",
        "prescription": "3 Sets × 6–10 Reps • RPE 8.5 • 90s Rest",
        "mediaUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif"
      },
      {
        "id": "incline-db-press",
        "freeDbId": "Incline_Dumbbell_Press",
        "name": "Incline Dumbbell Press",
        "targetMuscle": "Clavicular Pectoralis Major",
        "mechanic": "Compound",
        "prescription": "3 Sets × 8–12 Reps • RPE 8 • 90s Rest",
        "mediaUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif"
      },
      {
        "id": "decline-db-press",
        "freeDbId": "Decline_Dumbbell_Flyes",
        "name": "Decline Dumbbell Press",
        "targetMuscle": "Costal Lower Pectoralis",
        "mechanic": "Compound",
        "prescription": "3 Sets × 10–12 Reps • RPE 8 • 75s Rest",
        "mediaUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-decline-bench-press.gif"
      },
      {
        "id": "cable-chest-crossover",
        "freeDbId": "Cable_Crossover",
        "name": "Cable Upper Chest Crossover",
        "targetMuscle": "Upper Sternal Pectoralis",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-upper-chest-crossovers.gif"
      },
      {
        "id": "pec-deck-machine",
        "freeDbId": "Butterfly",
        "name": "Pec Deck Machine Flyes",
        "targetMuscle": "Mid-Sternal Pectoralis",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butterfly/0.jpg"
      },
      {
        "id": "chest-dips",
        "freeDbId": "Dips_-_Chest_Version",
        "name": "Weighted Chest Dips",
        "targetMuscle": "Lower Pectoralis & Anterior Deltoid",
        "mechanic": "Compound",
        "prescription": "3 Sets × 8–12 Reps • RPE 8.5 • 90s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Chest_Version/0.jpg"
      },
      {
        "id": "deficit-pushups",
        "freeDbId": "Pushups",
        "name": "Deficit Deep Push-Ups",
        "targetMuscle": "Pectoralis Major & Serratus Anterior",
        "mechanic": "Compound",
        "prescription": "3 Sets × 15–20 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg"
      }
    ]
  },
  {
    "id": "back",
    "label": "Back",
    "subtitle": "Thoracic V-Taper & Posterior Kinetic Chain",
    "exercises": [
      {
        "id": "barbell-deadlift",
        "freeDbId": "Barbell_Deadlift",
        "name": "Barbell Deadlift",
        "targetMuscle": "Erector Spinae, Glutes & Lats",
        "mechanic": "Compound",
        "prescription": "3 Sets × 5–8 Reps • RPE 8.5 • 120s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg"
      },
      {
        "id": "lat-pulldown",
        "freeDbId": "Wide-Grip_Lat_Pulldown",
        "name": "Wide-Grip Lat Pulldown",
        "targetMuscle": "Latissimus Dorsi (Outer Sweep)",
        "mechanic": "Compound",
        "prescription": "3 Sets × 8–12 Reps • RPE 8 • 90s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg"
      },
      {
        "id": "bb-bent-over-row",
        "freeDbId": "Bent_Over_Barbell_Row",
        "name": "Bent-Over Barbell Row",
        "targetMuscle": "Rhomboids & Mid-Trapezius",
        "mechanic": "Compound",
        "prescription": "3 Sets × 8–10 Reps • RPE 8.5 • 90s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg"
      },
      {
        "id": "seated-cable-row",
        "freeDbId": "Seated_Cable_Rows",
        "name": "Seated Cable Row",
        "targetMuscle": "Middle Trapezius & Lats",
        "mechanic": "Compound",
        "prescription": "3 Sets × 10–12 Reps • RPE 8 • 75s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg"
      },
      {
        "id": "one-arm-db-row",
        "freeDbId": "One-Arm_Dumbbell_Row",
        "name": "Single-Arm Dumbbell Row",
        "targetMuscle": "Lower Latissimus Dorsi",
        "mechanic": "Compound",
        "prescription": "3 Sets × 10–12 Reps • RPE 8.5 • 75s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/0.jpg"
      },
      {
        "id": "t-bar-row",
        "freeDbId": "T-Bar_Row_with_Handle",
        "name": "T-Bar Row",
        "targetMuscle": "Upper Back Density & Rhomboids",
        "mechanic": "Compound",
        "prescription": "3 Sets × 8–12 Reps • RPE 8.5 • 90s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/T-Bar_Row_with_Handle/0.jpg"
      },
      {
        "id": "pull-ups",
        "freeDbId": "Pullups",
        "name": "Neutral-Grip Pull-Ups",
        "targetMuscle": "Latissimus Dorsi & Teres Major",
        "mechanic": "Compound",
        "prescription": "3 Sets × Max Reps • RPE 9 • 90s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg"
      },
      {
        "id": "straight-arm-pulldown",
        "freeDbId": "Straight-Arm_Pulldown",
        "name": "Straight-Arm Cable Pulldown",
        "targetMuscle": "Latissimus Dorsi Isolation",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Straight-Arm_Pulldown/0.jpg"
      }
    ]
  },
  {
    "id": "shoulders",
    "label": "Shoulders",
    "subtitle": "3D Deltoid Cap Development",
    "exercises": [
      {
        "id": "bb-overhead-press",
        "freeDbId": "Standing_Military_Press",
        "name": "Standing Barbell Overhead Press (OHP)",
        "targetMuscle": "Anterior Deltoids & Serratus",
        "mechanic": "Compound",
        "prescription": "3 Sets × 6–8 Reps • RPE 8.5 • 90s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/0.jpg"
      },
      {
        "id": "seated-db-press",
        "freeDbId": "Seated_Dumbbell_Press",
        "name": "Seated Dumbbell Shoulder Press",
        "targetMuscle": "Anterior & Lateral Deltoids",
        "mechanic": "Compound",
        "prescription": "3 Sets × 8–10 Reps • RPE 8 • 90s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Dumbbell_Press/0.jpg"
      },
      {
        "id": "db-lateral-raises",
        "freeDbId": "Side_Lateral_Raise",
        "name": "Dumbbell Lateral Raises",
        "targetMuscle": "Lateral Deltoids (Cap Width)",
        "mechanic": "Isolation",
        "prescription": "4 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif"
      },
      {
        "id": "cable-lateral-raise",
        "freeDbId": "Cable_Seated_Lateral_Raise",
        "name": "Cable Scapular Lateral Raises",
        "targetMuscle": "Lateral Deltoids (Continuous Tension)",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Seated_Lateral_Raise/0.jpg"
      },
      {
        "id": "rope-face-pulls",
        "freeDbId": "Face_Pull",
        "name": "Rope Face Pulls",
        "targetMuscle": "Posterior Deltoids & Infraspinatus",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 15–20 Reps • RPE 8.5 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg"
      },
      {
        "id": "reverse-pec-deck",
        "freeDbId": "Cable_Rear_Delt_Fly",
        "name": "Reverse Pec Deck Flyes",
        "targetMuscle": "Rear Deltoids Isolation",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rear_Delt_Fly/0.jpg"
      },
      {
        "id": "barbell-shrugs",
        "freeDbId": "Barbell_Shrug",
        "name": "Barbell Shrugs",
        "targetMuscle": "Upper Trapezius",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 8.5 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shrug/0.jpg"
      }
    ]
  },
  {
    "id": "legs",
    "label": "Legs",
    "subtitle": "Quadriceps Sweep, Hamstrings & Calves",
    "exercises": [
      {
        "id": "bb-back-squat",
        "freeDbId": "Barbell_Full_Squat",
        "name": "Barbell Back Squat",
        "targetMuscle": "Quadriceps, Gluteus & Core",
        "mechanic": "Compound",
        "prescription": "3 Sets × 6–10 Reps • RPE 8.5 • 120s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Full_Squat/0.jpg"
      },
      {
        "id": "romanian-deadlift",
        "freeDbId": "Romanian_Deadlift",
        "name": "Romanian Deadlifts (RDL)",
        "targetMuscle": "Hamstrings & Gluteal Tie-in",
        "mechanic": "Compound",
        "prescription": "3 Sets × 8–10 Reps • RPE 8 • 90s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg"
      },
      {
        "id": "leg-press",
        "freeDbId": "Leg_Press",
        "name": "45° Sled Leg Press",
        "targetMuscle": "Vastus Lateralis & Adductors",
        "mechanic": "Compound",
        "prescription": "3 Sets × 10–12 Reps • RPE 8.5 • 90s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg"
      },
      {
        "id": "leg-extensions",
        "freeDbId": "Leg_Extensions",
        "name": "Lever Leg Extensions",
        "targetMuscle": "Rectus Femoris Isolation",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg"
      },
      {
        "id": "lying-leg-curls",
        "freeDbId": "Lying_Leg_Curls",
        "name": "Lying Hamstring Leg Curls",
        "targetMuscle": "Biceps Femoris Isolation",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg"
      },
      {
        "id": "bulgarian-split-squat",
        "freeDbId": "Split_Squats",
        "name": "Bulgarian Split Squats",
        "targetMuscle": "Unilateral Quadriceps & Glutes",
        "mechanic": "Compound",
        "prescription": "3 Sets × 8–10 Reps/Leg • RPE 9 • 75s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squats/0.jpg"
      },
      {
        "id": "standing-calf-raises",
        "freeDbId": "Standing_Calf_Raises",
        "name": "Standing Calf Raises",
        "targetMuscle": "Gastrocnemius",
        "mechanic": "Isolation",
        "prescription": "4 Sets × 15 Reps • RPE 9.5 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg"
      },
      {
        "id": "seated-calf-raises",
        "freeDbId": "Seated_Calf_Raise",
        "name": "Seated Calf Raises",
        "targetMuscle": "Soleus",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 15–20 Reps • RPE 9.5 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Calf_Raise/0.jpg"
      }
    ]
  },
  {
    "id": "arms",
    "label": "Arms",
    "subtitle": "Biceps Peak & Triceps Horseshoe Isolation",
    "exercises": [
      {
        "id": "incline-db-curls",
        "freeDbId": "Incline_Dumbbell_Curl",
        "name": "Incline Dumbbell Biceps Curl",
        "targetMuscle": "Biceps Brachii (Long Head Stretch)",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 10–12 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Curl/0.jpg"
      },
      {
        "id": "bb-biceps-curl",
        "freeDbId": "Barbell_Curl",
        "name": "Barbell Biceps Curl",
        "targetMuscle": "Biceps Brachii & Brachialis",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 8–10 Reps • RPE 8.5 • 75s Rest",
        "mediaUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif"
      },
      {
        "id": "cable-rope-hammer-curl",
        "freeDbId": "Cable_Hammer_Curls_-_Rope_Attachment",
        "name": "Cable Rope Hammer Curl",
        "targetMuscle": "Brachioradialis & Forearms",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Hammer_Curls_-_Rope_Attachment/0.jpg"
      },
      {
        "id": "preacher-curl",
        "freeDbId": "Preacher_Curl",
        "name": "Preacher Dumbbell Curls",
        "targetMuscle": "Biceps Brachii (Short Head)",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 10–12 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/0.jpg"
      },
      {
        "id": "cable-pushdowns",
        "freeDbId": "Triceps_Pushdown",
        "name": "Cable Triceps Pushdowns",
        "targetMuscle": "Triceps Lateral & Medial Head",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 10–12 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif"
      },
      {
        "id": "skull-crushers",
        "freeDbId": "Lying_Triceps_Press",
        "name": "EZ-Bar Skull Crushers",
        "targetMuscle": "Triceps Long & Medial Head",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 8–12 Reps • RPE 8.5 • 75s Rest",
        "mediaUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-lying-triceps-extension.gif"
      },
      {
        "id": "overhead-tricep-ext",
        "freeDbId": "Cable_Rope_Overhead_Triceps_Extension",
        "name": "Overhead Cable Triceps Extension",
        "targetMuscle": "Triceps Long Head (Full Stretch)",
        "mechanic": "Isolation",
        "prescription": "3 Sets × 12–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rope_Overhead_Triceps_Extension/0.jpg"
      },
      {
        "id": "bench-dips",
        "freeDbId": "Bench_Dips",
        "name": "Triceps Bench / Bar Dips",
        "targetMuscle": "Triceps Brachii Lockout",
        "mechanic": "Compound",
        "prescription": "3 Sets × 10–15 Reps • RPE 9 • 60s Rest",
        "mediaUrl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/0.jpg"
      }
    ]
  }
];
