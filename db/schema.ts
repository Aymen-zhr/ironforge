import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * 1. Exercises Table
 * Comprehensive taxonomy of movements, equipment, mechanics, and cues.
 */
export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  primary_muscle: text('primary_muscle').notNull(),
  secondary_muscles: text('secondary_muscles'), // Stored as JSON stringified array of strings
  mechanic: text('mechanic'), // 'compound' | 'isolation'
  equipment: text('equipment'),
  cues: text('cues'), // Stored as JSON stringified array of strings or guidance text
});

/**
 * 2. Routines Table
 * Pre-defined splits or custom user-built training templates.
 */
export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  created_at: text('created_at').notNull(),
  notes: text('notes'),
});

/**
 * 3. Routine Exercises Junction Table
 * Ordered collection of exercises prescribed within a specific routine.
 */
export const routineExercises = sqliteTable('routine_exercises', {
  id: text('id').primaryKey(),
  routine_id: text('routine_id')
    .notNull()
    .references(() => routines.id, { onDelete: 'cascade' }),
  exercise_id: text('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'cascade' }),
  order_index: integer('order_index').notNull(),
  target_sets: integer('target_sets').notNull(),
  target_reps: text('target_reps').notNull(), // e.g. "6-10" or "8"
});

/**
 * 4. Workouts Table
 * Recorded historical training sessions.
 */
export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  start_time: text('start_time').notNull(),
  end_time: text('end_time'),
  volume_load: real('volume_load').default(0),
  notes: text('notes'),
});

/**
 * 5. Workout Sets Table
 * Atomic telemetry for every set performed during a workout session.
 */
export const workoutSets = sqliteTable('workout_sets', {
  id: text('id').primaryKey(),
  workout_id: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exercise_id: text('exercise_id')
    .notNull()
    .references(() => exercises.id),
  set_number: integer('set_number').notNull(),
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
  rpe: real('rpe'),
  completed_at: text('completed_at'),
});

/**
 * 6. Nutrition Logs Table
 * Daily macro consumption tracking.
 */
export const nutritionLogs = sqliteTable('nutrition_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  calories: real('calories').notNull(),
  protein: real('protein').notNull(),
  carbs: real('carbs').notNull(),
  fats: real('fats').notNull(),
});

/**
 * 7. User Profile & Goal Configuration
 */
export const userProfile = sqliteTable('user_profile', {
  id: text('id').primaryKey(),
  gender: text('gender').notNull(), // 'male' | 'female'
  age: integer('age').notNull(),
  heightCm: real('height_cm').notNull(),
  weightKg: real('weight_kg').notNull(),
  selectedSplit: text('selected_split').notNull(), // 'ppl' | 'bro_split' | 'upper_lower' | 'full_body'
  goalPhase: text('goal_phase').notNull(), // 'cut_agg' | 'cut_mod' | 'recomp' | 'lean_bulk' | 'bulk'
  targetCalories: integer('target_calories').notNull(),
  targetProteinG: real('target_protein_g').notNull(),
  targetCarbsG: real('target_carbs_g').notNull(),
  targetFatsG: real('target_fats_g').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * 8. Bodyweight & Composition Tracking
 */
export const checkInHistory = sqliteTable('check_in_history', {
  id: text('id').primaryKey(),
  dateString: text('date_string').notNull(),
  weightKg: real('weight_kg').notNull(),
  bodyFatPct: real('body_fat_pct'),
  loggedAt: text('logged_at').notNull(),
});

// Type inferences for TypeScript consumers
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

export type Routine = typeof routines.$inferSelect;
export type InsertRoutine = typeof routines.$inferInsert;

export type RoutineExercise = typeof routineExercises.$inferSelect;
export type InsertRoutineExercise = typeof routineExercises.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = typeof workouts.$inferInsert;

export type WorkoutSet = typeof workoutSets.$inferSelect;
export type InsertWorkoutSet = typeof workoutSets.$inferInsert;

export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type InsertNutritionLog = typeof nutritionLogs.$inferInsert;

export type UserProfileEntity = typeof userProfile.$inferSelect;
export type InsertUserProfile = typeof userProfile.$inferInsert;

export type CheckInRecord = typeof checkInHistory.$inferSelect;
export type InsertCheckIn = typeof checkInHistory.$inferInsert;
