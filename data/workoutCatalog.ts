/**
 * Pre-Compiled Hypertrophy Training Directory
 * Provides battle-tested training programs with zero network delay.
 */

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  equipment: string;
  mechanic: 'Compound' | 'Isolation';
  sets: number;
  reps: string;
  rpe: string;
  restSeconds: number;
  videoUrl: string; // Direct looping MP4 / GIF url
  executionNotes: string;
}

export interface TrainingProgram {
  id: string;
  splitName: string; // "Push Day", "Pull Day", "Leg Day", "Upper Body", "Lower Body"
  subtitle: string;
  category: 'PPL' | 'Upper/Lower' | 'Arnold' | 'Bro Split';
  durationMinutes: number;
  exercises: Exercise[];
}

export const WORKOUT_PROGRAMS: TrainingProgram[] = [
  {
    id: 'push-day',
    splitName: 'Push Day',
    subtitle: 'Anterior Chain Hypertrophy • Chest, Delts & Triceps Overload',
    category: 'PPL',
    durationMinutes: 60,
    exercises: [
      {
        id: 'barbell-bench-press',
        name: 'Barbell Bench Press',
        targetMuscle: 'Sternal Pectoralis Major',
        equipment: 'Barbell & Bench',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 120,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
        executionNotes: 'Plant feet firmly into the platform, retract scapulae, lower bar to mid-sternum with 2s eccentric control, and drive through the ceiling.',
      },
      {
        id: 'incline-dumbbell-press',
        name: 'Incline Dumbbell Press',
        targetMuscle: 'Clavicular Pectoralis Major',
        equipment: 'Dumbbells & Incline Bench',
        mechanic: 'Compound',
        sets: 3,
        reps: '10-12 reps',
        rpe: '8.5',
        restSeconds: 90,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
        executionNotes: 'Angle bench to 30 degrees. Flare elbows 45 degrees relative to torso, pause 1s at bottom stretch, and press converging slightly at peak.',
      },
      {
        id: 'dumbbell-lateral-raise',
        name: 'Dumbbell Lateral Raise',
        targetMuscle: 'Lateral Deltoid',
        equipment: 'Dumbbells',
        mechanic: 'Isolation',
        sets: 4,
        reps: '12-15 reps',
        rpe: '9.0',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
        executionNotes: 'Lead upward with the elbows in the scapular plane (15 degrees forward). Hold 1s at parallel, strictly avoid torso swinging.',
      },
      {
        id: 'cable-chest-crossover',
        name: 'Cable Upper Chest Crossover',
        targetMuscle: 'Pectoralis Major (Sternal & Costal)',
        equipment: 'Dual Cable Pulley',
        mechanic: 'Isolation',
        sets: 3,
        reps: '12-15 reps',
        rpe: '8.5',
        restSeconds: 75,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-upper-chest-crossovers.gif',
        executionNotes: 'Maintain a soft elbow bend throughout. Cross hands slightly past midline at peak contraction for maximum shortened-range tension.',
      },
      {
        id: 'cable-triceps-pushdown',
        name: 'Cable Triceps Pushdown',
        targetMuscle: 'Triceps Lateral & Medial Head',
        equipment: 'Cable & V-Bar / Rope',
        mechanic: 'Isolation',
        sets: 4,
        reps: '10-12 reps',
        rpe: '9.0',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif',
        executionNotes: 'Lock elbows tightly to sides. Push downward through full extension, flaring wrists outward at bottom lockout without leaning torso.',
      },
    ],
  },
  {
    id: 'pull-day',
    splitName: 'Pull Day',
    subtitle: 'Posterior Chain Recruitment • Lat Width & Upper Back Density',
    category: 'PPL',
    durationMinutes: 60,
    exercises: [
      {
        id: 'barbell-deadlift',
        name: 'Barbell Conventional Deadlift',
        targetMuscle: 'Erector Spinae & Posterior Chain',
        equipment: 'Olympic Barbell',
        mechanic: 'Compound',
        sets: 4,
        reps: '6-8 reps',
        rpe: '8.5',
        restSeconds: 150,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
        executionNotes: 'Pack lats down into back pockets, pull tension out of the bar, wedge hips into bar, and drive floor away through heels.',
      },
      {
        id: 'lat-pulldown',
        name: 'Cable Lat Pulldown',
        targetMuscle: 'Latissimus Dorsi (Iliac & Thoracic)',
        equipment: 'Cable Lat Pulldown Station',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.0',
        restSeconds: 90,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-bar-lateral-pulldown.gif',
        executionNotes: 'Initiate by depressing scapulae down before bending arms. Drive elbows down and in toward ribs, stopping at clavicle level.',
      },
      {
        id: 'seated-cable-row',
        name: 'Seated Cable Row',
        targetMuscle: 'Rhomboids & Mid-Trapezius',
        equipment: 'Low Cable Row Station',
        mechanic: 'Compound',
        sets: 3,
        reps: '10-12 reps',
        rpe: '8.5',
        restSeconds: 90,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-low-seated-row.gif',
        executionNotes: 'Allow full protraction and lat stretch at the start. Pull handle to belly button, driving elbows back and pinching shoulder blades.',
      },
      {
        id: 'rear-delt-raise',
        name: 'Dumbbell Rear Lateral Raise',
        targetMuscle: 'Posterior Deltoid',
        equipment: 'Dumbbells',
        mechanic: 'Isolation',
        sets: 4,
        reps: '12-15 reps',
        rpe: '9.0',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-rear-lateral-raise.gif',
        executionNotes: 'Hinge hips backward 45 degrees with flat spine. Sweep dumbbells out wide in an arcing motion without using lower back momentum.',
      },
      {
        id: 'barbell-bicep-curl',
        name: 'Barbell Biceps Curl',
        targetMuscle: 'Biceps Brachii & Brachialis',
        equipment: 'Barbell / EZ-Bar',
        mechanic: 'Isolation',
        sets: 3,
        reps: '10-12 reps',
        rpe: '8.5',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif',
        executionNotes: 'Anchor elbows stationary against ribs. Curl bar with pure elbow flexion, squeeze biceps at apex, and resist a strict 2s descent.',
      },
    ],
  },
  {
    id: 'leg-day',
    splitName: 'Leg Day',
    subtitle: 'Quad Sweep, Hamstring Tie-In & Calves Mechanical Tension',
    category: 'PPL',
    durationMinutes: 65,
    exercises: [
      {
        id: 'barbell-bench-squat',
        name: 'Barbell Back Squat',
        targetMuscle: 'Quadriceps, Gluteus Maximus & Adductors',
        equipment: 'Barbell & Squat Rack',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 150,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/barbell-bench-squat.gif',
        executionNotes: 'Rest bar across upper traps. Break at hips and knees simultaneously, descend under control below parallel, and push through midfoot.',
      },
      {
        id: 'romanian-deadlift',
        name: 'Barbell Romanian Deadlift (RDL)',
        targetMuscle: 'Hamstrings & Glute-Ham Tie-In',
        equipment: 'Barbell',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 120,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-romanian-deadlift.gif',
        executionNotes: 'Keep knees softly bent. Hinge hips straight back as if closing a door with your glutes, feeling maximal stretch in hamstrings before snapping forward.',
      },
      {
        id: 'lever-leg-extension',
        name: 'Lever Leg Extension',
        targetMuscle: 'Quadriceps (Rectus Femoris)',
        equipment: 'Leg Extension Machine',
        mechanic: 'Isolation',
        sets: 3,
        reps: '12-15 reps',
        rpe: '9.0',
        restSeconds: 75,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif',
        executionNotes: 'Align knee joints with machine pivot axis. Extend legs fully, hold peak contraction for 1 full second, and control the eccentric descent.',
      },
      {
        id: 'lever-lying-leg-curl',
        name: 'Lying Hamstring Leg Curl',
        targetMuscle: 'Hamstrings (Biceps Femoris)',
        equipment: 'Lying Leg Curl Machine',
        mechanic: 'Isolation',
        sets: 3,
        reps: '12-15 reps',
        rpe: '9.0',
        restSeconds: 75,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-lying-leg-curl.gif',
        executionNotes: 'Pin hips flat into bench pad. Curl heels rapidly toward glutes, squeeze at top, and slowly return through full knee extension.',
      },
      {
        id: 'standing-calf-raise',
        name: 'Standing Calf Raise',
        targetMuscle: 'Gastrocnemius & Soleus',
        equipment: 'Calf Raise Machine / Smith',
        mechanic: 'Isolation',
        sets: 4,
        reps: '15-20 reps',
        rpe: '9.5',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/barbell-standing-calf-raise.gif',
        executionNotes: 'Descend into a deep 2-second passive calf stretch at bottom. Explode onto balls of feet and hold peak contraction for 1 second.',
      },
    ],
  },
  {
    id: 'upper-body',
    splitName: 'Upper Body',
    subtitle: 'Horizontal & Vertical Push/Pull Balance • Antagonist Overload',
    category: 'Upper/Lower',
    durationMinutes: 55,
    exercises: [
      {
        id: 'barbell-incline-bench-press',
        name: 'Incline Barbell Bench Press',
        targetMuscle: 'Clavicular Pectoralis & Anterior Delts',
        equipment: 'Incline Bench & Barbell',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 120,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-incline-bench-press.gif',
        executionNotes: 'Grip slightly wider than shoulders. Lower bar smoothly to upper chest bone, pause briefly, then press aggressively along J-curve.',
      },
      {
        id: 'barbell-bent-over-row',
        name: 'Barbell Bent-Over Row',
        targetMuscle: 'Latissimus Dorsi & Middle Trapezius',
        equipment: 'Barbell',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 120,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif',
        executionNotes: 'Hinge torso to 45 degrees with neutral spine. Pull barbell straight toward lower abdominal line, leading directly with elbows.',
      },
      {
        id: 'seated-overhead-press',
        name: 'Seated Overhead Barbell Press',
        targetMuscle: 'Anterior & Lateral Deltoids',
        equipment: 'Overhead Press Station / Barbell',
        mechanic: 'Compound',
        sets: 3,
        reps: '8-10 reps',
        rpe: '8.0',
        restSeconds: 90,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-seated-overhead-press.gif',
        executionNotes: 'Press bar straight upward clearing chin. Lock out overhead with head pushed slightly through the window for peak shoulder stability.',
      },
      {
        id: 'cable-hammer-curl',
        name: 'Cable Rope Hammer Curl',
        targetMuscle: 'Brachialis & Forearm Brachioradialis',
        equipment: 'Cable Pulley & Rope Attachment',
        mechanic: 'Isolation',
        sets: 3,
        reps: '12-15 reps',
        rpe: '8.5',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-hammer-curl-with-rope.gif',
        executionNotes: 'Maintain neutral thumbs-up grip. Curl upward while keeping upper arms pinned firmly against ribs, flexing hard at apex.',
      },
      {
        id: 'close-grip-bench-press',
        name: 'Incline Close Grip Bench Press',
        targetMuscle: 'Triceps Brachii (All Heads)',
        equipment: 'Incline Bench & Barbell',
        mechanic: 'Compound',
        sets: 3,
        reps: '10 reps',
        rpe: '8.5',
        restSeconds: 90,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-incline-close-grip-bench-press.gif',
        executionNotes: 'Place hands shoulder-width apart. Keep elbows tucked closely along lats, tucking triceps into stretch and pressing upward forcefully.',
      },
    ],
  },
  {
    id: 'lower-body',
    splitName: 'Lower Body',
    subtitle: 'High Mechanical Load Knee & Hip Dominant Hypertrophy Protocol',
    category: 'Upper/Lower',
    durationMinutes: 60,
    exercises: [
      {
        id: 'barbell-bench-squat-lower',
        name: 'High-Bar Olympic Squat',
        targetMuscle: 'Quadriceps Vastus Lateralis & Gluteus',
        equipment: 'Squat Rack & Barbell',
        mechanic: 'Compound',
        sets: 4,
        reps: '6-8 reps',
        rpe: '8.5',
        restSeconds: 150,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/barbell-bench-squat.gif',
        executionNotes: 'Maintain upright spine angle with high-bar placement. Drive knees forward and down into deep knee flexion, exploding out of hole.',
      },
      {
        id: 'barbell-deadlift-lower',
        name: 'Conventional Barbell Deadlift',
        targetMuscle: 'Hamstrings, Glutes & Erector Spinae',
        equipment: 'Olympic Barbell & Bumper Plates',
        mechanic: 'Compound',
        sets: 3,
        reps: '6-8 reps',
        rpe: '8.5',
        restSeconds: 150,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
        executionNotes: 'Lock lats in place to protect thoracic spine. Push floor away violently with legs before driving hips forward into lockout.',
      },
      {
        id: 'lever-leg-extension-lower',
        name: 'Seated Leg Extension',
        targetMuscle: 'Quadriceps (Rectus Femoris Isolation)',
        equipment: 'Leg Extension Machine',
        mechanic: 'Isolation',
        sets: 3,
        reps: '12-15 reps',
        rpe: '9.0',
        restSeconds: 75,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif',
        executionNotes: 'Extend knees smoothly without bucking torso. Squeeze quads fiercely for 1s at top, controlling weight down with a 2s negative.',
      },
      {
        id: 'lever-lying-leg-curl-lower',
        name: 'Prone Lying Hamstring Curl',
        targetMuscle: 'Hamstring Semitendinosus & Biceps Femoris',
        equipment: 'Lying Hamstring Machine',
        mechanic: 'Isolation',
        sets: 3,
        reps: '12-15 reps',
        rpe: '9.0',
        restSeconds: 75,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-lying-leg-curl.gif',
        executionNotes: 'Keep hips pressed firmly against pad to isolate knee flexion. Curl heels all the way to glutes, resisting descent.',
      },
      {
        id: 'standing-calf-raise-lower',
        name: 'Standing Machine Calf Raise',
        targetMuscle: 'Gastrocnemius & Soleus',
        equipment: 'Calf Raise Machine',
        mechanic: 'Isolation',
        sets: 4,
        reps: '15 reps',
        rpe: '9.0',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/barbell-standing-calf-raise.gif',
        executionNotes: 'Full anatomical range of motion. Deep stretch at bottom (pause 2s), explode upward onto balls of feet, hold 1s peak tension.',
      },
    ],
  },
  {
    id: 'chest-back-arnold',
    splitName: 'Chest & Back',
    subtitle: 'Golden Era Antagonist Super-Pump • Pectoral & Lat Expansion',
    category: 'Arnold',
    durationMinutes: 65,
    exercises: [
      {
        id: 'arnold-flat-bench',
        name: 'Flat Barbell Bench Press',
        targetMuscle: 'Mid & Lower Pectoralis Major',
        equipment: 'Barbell & Flat Bench',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 120,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
        executionNotes: 'Retract and lock shoulder blades flat on bench. Lower bar under control with elbows at 45 degrees, driving upward into full contraction.',
      },
      {
        id: 'arnold-bent-over-row',
        name: 'Barbell Bent-Over Row',
        targetMuscle: 'Latissimus Dorsi & Rhomboids',
        equipment: 'Barbell',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 120,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif',
        executionNotes: 'Antagonist counterpart to bench press. Pull bar forcefully into lower ribs, squeezing shoulder blades together at apex.',
      },
      {
        id: 'arnold-incline-press',
        name: 'Incline Dumbbell Bench Press',
        targetMuscle: 'Clavicular Head (Upper Chest)',
        equipment: 'Dumbbells & Incline Bench',
        mechanic: 'Compound',
        sets: 3,
        reps: '10-12 reps',
        rpe: '8.5',
        restSeconds: 90,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
        executionNotes: 'Deep eccentric stretch at bottom position. Press dumbbells up and slightly inward over eyes.',
      },
      {
        id: 'arnold-lat-pulldown',
        name: 'Wide-Grip Lat Pulldown',
        targetMuscle: 'Latissimus Dorsi (Outer Sweep)',
        equipment: 'Lat Pulldown Station',
        mechanic: 'Compound',
        sets: 3,
        reps: '10-12 reps',
        rpe: '8.5',
        restSeconds: 90,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-bar-lateral-pulldown.gif',
        executionNotes: 'Pull bar smoothly to upper clavicle. Drive elbows downwards and backwards to maximize lat flare.',
      },
      {
        id: 'arnold-cable-crossover',
        name: 'Standing Cable Crossover',
        targetMuscle: 'Inner & Sternal Chest Squeeze',
        equipment: 'Cable Crossover Station',
        mechanic: 'Isolation',
        sets: 3,
        reps: '15 reps',
        rpe: '9.0',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-upper-chest-crossovers.gif',
        executionNotes: 'Bring hands together with a slight forward lean. Cross knuckles slightly at peak contraction for extreme blood volume pump.',
      },
    ],
  },
  {
    id: 'shoulders-arms-arnold',
    splitName: 'Shoulders & Arms',
    subtitle: '3D Deltoid Caps & Arm Hypertrophy Gauntlet',
    category: 'Arnold',
    durationMinutes: 60,
    exercises: [
      {
        id: 'arnold-seated-ohp',
        name: 'Seated Barbell Overhead Press',
        targetMuscle: 'Anterior & Medial Deltoid',
        equipment: 'Barbell & Seat',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 120,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-seated-overhead-press.gif',
        executionNotes: 'Press barbell directly overhead from clavicles. Keep core locked tight against seat back pad.',
      },
      {
        id: 'arnold-lateral-raise',
        name: 'Dumbbell Lateral Raise',
        targetMuscle: 'Medial Deltoid (Shoulder Cap)',
        equipment: 'Dumbbells',
        mechanic: 'Isolation',
        sets: 4,
        reps: '15 reps',
        rpe: '9.0',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
        executionNotes: 'Raise dumbbells slightly forward of body line. Pause at shoulder level, avoiding body momentum.',
      },
      {
        id: 'arnold-barbell-curl',
        name: 'Standing Barbell Biceps Curl',
        targetMuscle: 'Biceps Brachii Peak',
        equipment: 'Barbell',
        mechanic: 'Isolation',
        sets: 4,
        reps: '10-12 reps',
        rpe: '8.5',
        restSeconds: 75,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif',
        executionNotes: 'Keep elbows tucked. Squeeze biceps violently at apex and resist bar downward for 2 full seconds.',
      },
      {
        id: 'arnold-triceps-pushdown',
        name: 'Triceps Cable Pushdown',
        targetMuscle: 'Triceps Lateral & Long Head',
        equipment: 'Cable Station & V-Bar',
        mechanic: 'Isolation',
        sets: 4,
        reps: '10-12 reps',
        rpe: '8.5',
        restSeconds: 75,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif',
        executionNotes: 'Lock elbows into sides. Fully extend and contract triceps at bottom lockout.',
      },
      {
        id: 'arnold-rear-delt',
        name: 'Dumbbell Bent-Over Rear Delt Raise',
        targetMuscle: 'Posterior Deltoid & Infraspinatus',
        equipment: 'Dumbbells',
        mechanic: 'Isolation',
        sets: 3,
        reps: '15 reps',
        rpe: '9.0',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-rear-lateral-raise.gif',
        executionNotes: 'Hinge hips to 45 degrees. Sweep arms wide in horizontal abduction to isolate rear shoulder fibers.',
      },
    ],
  },
  {
    id: 'chest-day',
    splitName: 'Chest Day',
    subtitle: 'Pectoral Hypertrophy • Sternal & Clavicular Overload',
    category: 'Bro Split',
    durationMinutes: 55,
    exercises: [
      {
        id: 'barbell-bench-press',
        name: 'Barbell Bench Press',
        targetMuscle: 'Sternal Pectoralis Major',
        equipment: 'Barbell & Bench',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 120,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
        executionNotes: 'Plant feet firmly into platform, retract scapulae, lower bar to mid-sternum with 2s eccentric control.',
      },
      {
        id: 'incline-dumbbell-press',
        name: 'Incline Dumbbell Press',
        targetMuscle: 'Clavicular Pectoralis Major',
        equipment: 'Dumbbells & Incline Bench',
        mechanic: 'Compound',
        sets: 4,
        reps: '10-12 reps',
        rpe: '8.5',
        restSeconds: 90,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
        executionNotes: 'Angle bench to 30 degrees. Flare elbows 45 degrees relative to torso, pause 1s at bottom stretch.',
      },
      {
        id: 'cable-chest-crossover',
        name: 'Cable Upper Chest Crossover',
        targetMuscle: 'Pectoralis Major (Sternal & Costal)',
        equipment: 'Dual Cable Pulley',
        mechanic: 'Isolation',
        sets: 3,
        reps: '12-15 reps',
        rpe: '8.5',
        restSeconds: 75,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-upper-chest-crossovers.gif',
        executionNotes: 'Maintain soft elbow bend throughout. Cross hands slightly past midline at peak contraction.',
      },
      {
        id: 'dumbbell-lateral-raise-chest-day',
        name: 'Dumbbell Lateral Raise',
        targetMuscle: 'Lateral Deltoid',
        equipment: 'Dumbbells',
        mechanic: 'Isolation',
        sets: 3,
        reps: '15 reps',
        rpe: '9.0',
        restSeconds: 60,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
        executionNotes: 'Lead upward with elbows in scapular plane. Hold 1s at parallel.',
      },
    ],
  },
  {
    id: 'back-day',
    splitName: 'Back Day',
    subtitle: 'Lat Width & Spinal Density • Posterior Pull',
    category: 'Bro Split',
    durationMinutes: 60,
    exercises: [
      {
        id: 'barbell-deadlift',
        name: 'Barbell Conventional Deadlift',
        targetMuscle: 'Erector Spinae & Posterior Chain',
        equipment: 'Olympic Barbell',
        mechanic: 'Compound',
        sets: 4,
        reps: '6-8 reps',
        rpe: '8.5',
        restSeconds: 150,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
        executionNotes: 'Pack lats down into back pockets, pull slack out of bar, wedge hips and drive floor away.',
      },
      {
        id: 'lat-pulldown',
        name: 'Cable Lat Pulldown',
        targetMuscle: 'Latissimus Dorsi (Iliac & Thoracic)',
        equipment: 'Cable Lat Pulldown Station',
        mechanic: 'Compound',
        sets: 4,
        reps: '10-12 reps',
        rpe: '8.5',
        restSeconds: 90,
        videoUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg',
        executionNotes: 'Slight torso lean, pull elbows vertically into waistline, pause 1s at clavicle.',
      },
      {
        id: 'arnold-bent-over-row',
        name: 'Barbell Bent-Over Row',
        targetMuscle: 'Latissimus Dorsi & Rhomboids',
        equipment: 'Barbell',
        mechanic: 'Compound',
        sets: 4,
        reps: '8-10 reps',
        rpe: '8.5',
        restSeconds: 120,
        videoUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif',
        executionNotes: 'Hinge at 45 degrees, pull bar explosively into lower ribcage, squeezing shoulder blades together.',
      },
      {
        id: 'seated-cable-row',
        name: 'Seated Cable Row',
        targetMuscle: 'Rhomboids & Middle Trapezius',
        equipment: 'Cable Low Row & V-Grip',
        mechanic: 'Compound',
        sets: 3,
        reps: '12 reps',
        rpe: '8.5',
        restSeconds: 75,
        videoUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg',
        executionNotes: 'Sit upright with neutral spine. Pull attachment to abdomen, driving elbows back.',
      },
    ],
  },
];

export type SplitKey = 'PUSH' | 'PULL' | 'LEGS' | 'UPPER' | 'LOWER';
export type MuscleFilter = 'All' | 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs';

export const SPLIT_PROGRAM_MAP: Record<SplitKey, string> = {
  PUSH: 'push-day',
  PULL: 'pull-day',
  LEGS: 'leg-day',
  UPPER: 'upper-body',
  LOWER: 'lower-body',
};

/**
 * Retrieve program by unique ID.
 */
export function getProgramById(id: string): TrainingProgram | undefined {
  return WORKOUT_PROGRAMS.find((p) => p.id === id);
}

/**
 * Retrieve program by SplitKey ('PUSH' | 'PULL' | 'LEGS' | 'UPPER' | 'LOWER').
 */
export function getProgramBySplitKey(key: SplitKey): TrainingProgram {
  const programId = SPLIT_PROGRAM_MAP[key] || 'push-day';
  return getProgramById(programId) || WORKOUT_PROGRAMS[0];
}

/**
 * Filter exercises by targeted muscle group.
 */
export function filterExercisesByMuscle(exercises: Exercise[], muscle: MuscleFilter): Exercise[] {
  if (muscle === 'All') return exercises;
  const m = muscle.toLowerCase();
  return exercises.filter((ex) => {
    const target = ex.targetMuscle.toLowerCase();
    const name = ex.name.toLowerCase();
    if (m === 'chest') {
      return target.includes('pectoral') || target.includes('chest') || name.includes('bench') || name.includes('crossover');
    }
    if (m === 'back') {
      return target.includes('lat') || target.includes('back') || target.includes('rhomboid') || target.includes('trapezius') || target.includes('deadlift') || name.includes('row') || name.includes('pulldown');
    }
    if (m === 'shoulders') {
      return target.includes('delt') || target.includes('shoulder') || name.includes('overhead') || name.includes('lateral raise') || name.includes('ohp');
    }
    if (m === 'arms') {
      return target.includes('bicep') || target.includes('tricep') || target.includes('brach') || target.includes('forearm') || name.includes('curl') || name.includes('pushdown');
    }
    if (m === 'legs') {
      return target.includes('quad') || target.includes('hamstring') || target.includes('calf') || target.includes('calves') || target.includes('glute') || name.includes('squat') || name.includes('leg') || name.includes('rdl');
    }
    return false;
  });
}

/**
 * Retrieve standalone exercises from across all programs matching a muscle filter.
 */
export function getAllExercisesByMuscle(muscle: MuscleFilter): Exercise[] {
  const allExercises = WORKOUT_PROGRAMS.flatMap((p) => p.exercises);
  const uniqueMap = new Map<string, Exercise>();
  allExercises.forEach((ex) => {
    if (!uniqueMap.has(ex.id)) {
      uniqueMap.set(ex.id, ex);
    }
  });
  return filterExercisesByMuscle(Array.from(uniqueMap.values()), muscle);
}

/**
 * Retrieve programs by category (PPL, Upper/Lower, Arnold).
 */
export function getProgramsByCategory(category: 'PPL' | 'Upper/Lower' | 'Arnold'): TrainingProgram[] {
  return WORKOUT_PROGRAMS.filter((p) => p.category === category);
}

export function getProgramsByPreference(preference: string): TrainingProgram[] {
  if (preference === 'Upper / Lower') {
    return [getProgramById('upper-body')!, getProgramById('lower-body')!].filter(Boolean);
  }
  if (preference === 'Bro Split') {
    return [
      getProgramById('chest-day')!,
      getProgramById('back-day')!,
      getProgramById('leg-day')!,
      getProgramById('shoulders-arms-arnold')!,
    ].filter(Boolean);
  }
  // Default to Push / Pull / Legs
  return [
    getProgramById('push-day')!,
    getProgramById('pull-day')!,
    getProgramById('leg-day')!,
  ].filter(Boolean);
}

/**
 * Determine the scheduled workout for a specific day of the week.
 * Returns null if the day is a designated Rest Day.
 */
export function getScheduledWorkoutForDay(
  splitPreference: string,
  trainingDays: string[],
  dayOfWeek: string
): TrainingProgram | null {
  // If today is not in user's active training days, it is a Rest Day
  const normalizedTrainingDays = trainingDays.map((d) => d.toLowerCase());
  const normalizedDay = dayOfWeek.toLowerCase();

  const dayIndexInTrainingDays = normalizedTrainingDays.indexOf(normalizedDay);
  if (dayIndexInTrainingDays === -1) {
    return null; // Rest Day!
  }

  const routineSequence = getProgramsByPreference(splitPreference);
  if (routineSequence.length === 0) return null;

  return routineSequence[dayIndexInTrainingDays % routineSequence.length];
}

export default WORKOUT_PROGRAMS;

