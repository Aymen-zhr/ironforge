import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'ironforge.db';

/**
 * 1. Initialize SQLite Database Connection
 * Uses modern synchronous API with WAL mode and foreign key enforcement.
 */
export const expoDb = SQLite.openDatabaseSync(DATABASE_NAME);

try {
  expoDb.execSync('PRAGMA journal_mode = WAL;');
  expoDb.execSync('PRAGMA foreign_keys = ON;');
} catch (err) {
  console.warn('[IronForge DB] PRAGMA config warning:', err);
}

/**
 * Drizzle ORM instance wrapping Expo SQLite
 */
export const db = drizzle(expoDb, { schema });

/**
 * Ensures all required SQLite tables are created synchronously before queries execute.
 */
export function initDatabaseTables(): void {
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      primary_muscle TEXT NOT NULL,
      secondary_muscles TEXT,
      mechanic TEXT,
      equipment TEXT,
      cues TEXT
    );

    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id TEXT PRIMARY KEY,
      routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL,
      target_sets INTEGER NOT NULL,
      target_reps TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      volume_load REAL DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id),
      set_number INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      rpe REAL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fats REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      gender TEXT NOT NULL,
      age INTEGER NOT NULL,
      height_cm REAL NOT NULL,
      weight_kg REAL NOT NULL,
      selected_split TEXT NOT NULL,
      goal_phase TEXT NOT NULL,
      target_calories INTEGER NOT NULL,
      target_protein_g REAL NOT NULL,
      target_carbs_g REAL NOT NULL,
      target_fats_g REAL NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS check_in_history (
      id TEXT PRIMARY KEY,
      date_string TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      body_fat_pct REAL,
      logged_at TEXT NOT NULL
    );
  `);
}
