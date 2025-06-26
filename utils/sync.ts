import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useSnapStore } from '@/store/snapStore';
import { useStoryStore } from '@/store/storyStore';

const TASK_NAME = 'background-sync-snaps-stories';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const userId = (useSnapStore.getState() as any).userId || null;
    if (!userId) return BackgroundFetch.Result.NoData;

    await useSnapStore.getState().fetchSnaps(userId);
    await useStoryStore.getState().fetchStories(userId);
    return BackgroundFetch.Result.NewData;
  } catch {
    return BackgroundFetch.Result.Failed;
  }
});

export async function registerBackgroundSync() {
  await BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
} 