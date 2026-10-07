import * as FileSystem from 'expo-file-system/legacy';

/**
 * Exercise Video & GIF Offline Cache Service
 * Handles downloading, checking, and retrieving local cached media URIs using expo-file-system.
 */

// In-memory memory map for synchronous/fast URI lookup across re-renders
const memoryCacheMap = new Map<string, string>();
const cachedStatusMap = new Map<string, boolean>();

/**
 * Get base directory path for offline exercise media
 */
export function getCacheDirectory(): string {
  const base = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  return base ? `${base}ironforge_media_cache/` : '';
}

/**
 * Ensures the offline media cache directory exists.
 */
async function ensureCacheDirExists(): Promise<string> {
  const dir = getCacheDirectory();
  if (!dir) return '';

  try {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  } catch (err) {
    console.warn('[videoCacheService] Error ensuring directory:', err);
    return '';
  }
}

/**
 * Generate a deterministic local filename for an exercise media item.
 */
function getLocalMediaUri(dir: string, exerciseId: string, remoteUrl: string): string {
  const safeId = exerciseId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const ext = remoteUrl.toLowerCase().endsWith('.mp4') ? '.mp4' : '.gif';
  return `${dir}${safeId}${ext}`;
}

/**
 * Checks whether an exercise's media is already cached locally.
 */
export async function isExerciseCached(exerciseId: string, remoteUrl: string): Promise<boolean> {
  if (cachedStatusMap.has(exerciseId)) {
    return cachedStatusMap.get(exerciseId)!;
  }

  const dir = getCacheDirectory();
  if (!dir) return false;

  const localUri = getLocalMediaUri(dir, exerciseId, remoteUrl);
  try {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    const exists = Boolean(fileInfo.exists && (fileInfo as any).size > 0);
    cachedStatusMap.set(exerciseId, exists);
    if (exists) {
      memoryCacheMap.set(exerciseId, localUri);
    }
    return exists;
  } catch {
    return false;
  }
}

/**
 * Resolves the cached local file URI for an exercise.
 * If cached, returns the local file:// URI immediately.
 * If not yet cached, attempts to download it in background and returns the local URI once ready,
 * or falls back to remoteUrl if offline.
 */
export async function getCachedVideoUri(
  exerciseId: string,
  remoteUrl: string
): Promise<{ uri: string; isOfflineReady: boolean }> {
  // 1. Fast memory cache check
  if (memoryCacheMap.has(exerciseId)) {
    return {
      uri: memoryCacheMap.get(exerciseId)!,
      isOfflineReady: true,
    };
  }

  const dir = await ensureCacheDirExists();
  if (!dir || !remoteUrl) {
    return { uri: remoteUrl, isOfflineReady: false };
  }

  const localUri = getLocalMediaUri(dir, exerciseId, remoteUrl);

  try {
    // 2. Check file system on device
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists && (fileInfo as any).size > 0) {
      memoryCacheMap.set(exerciseId, localUri);
      cachedStatusMap.set(exerciseId, true);
      return { uri: localUri, isOfflineReady: true };
    }

    // 3. Download from network
    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
    if (downloadResult && downloadResult.status >= 200 && downloadResult.status < 300) {
      memoryCacheMap.set(exerciseId, localUri);
      cachedStatusMap.set(exerciseId, true);
      return { uri: localUri, isOfflineReady: true };
    }
  } catch (err) {
    console.warn(`[videoCacheService] Download error for ${exerciseId}:`, err);
  }

  // Fallback to remote URL
  return { uri: remoteUrl, isOfflineReady: false };
}

/**
 * Download and cache an entire training split's exercises for offline gym use.
 */
export async function downloadEntireSplit(
  exercises: { id: string; videoUrl: string }[],
  onProgress?: (cachedCount: number, totalCount: number) => void
): Promise<Record<string, string>> {
  const dir = await ensureCacheDirExists();
  const results: Record<string, string> = {};
  let completed = 0;

  for (const ex of exercises) {
    if (!dir || !ex.videoUrl) {
      results[ex.id] = ex.videoUrl;
      completed++;
      onProgress?.(completed, exercises.length);
      continue;
    }

    const localUri = getLocalMediaUri(dir, ex.id, ex.videoUrl);

    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists && (fileInfo as any).size > 0) {
        memoryCacheMap.set(ex.id, localUri);
        cachedStatusMap.set(ex.id, true);
        results[ex.id] = localUri;
      } else {
        const downloadResult = await FileSystem.downloadAsync(ex.videoUrl, localUri);
        if (downloadResult && downloadResult.status >= 200 && downloadResult.status < 300) {
          memoryCacheMap.set(ex.id, localUri);
          cachedStatusMap.set(ex.id, true);
          results[ex.id] = localUri;
        } else {
          results[ex.id] = ex.videoUrl;
        }
      }
    } catch (err) {
      console.warn(`[downloadEntireSplit] Failed for ${ex.id}:`, err);
      results[ex.id] = ex.videoUrl;
    }

    completed++;
    onProgress?.(completed, exercises.length);
  }

  return results;
}
