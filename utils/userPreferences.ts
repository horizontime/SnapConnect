import { supabase } from './supabase';
import { generateUserPreferenceEmbedding } from './embeddings';

/**
 * Update user preference embedding in the database
 * @param userId The user ID
 * @param favoriteWoods Array of favorite wood species
 * @param favoriteTools Array of favorite tools
 * @param favoriteProjects Array of favorite project types
 * @returns Success status
 */
export async function updateUserPreferenceEmbedding(
  userId: string,
  favoriteWoods: string[],
  favoriteTools: string[],
  favoriteProjects: string[]
): Promise<boolean> {
  try {
    console.log('[UserPreferences] Generating preference embedding...');
    
    // Generate embedding for user preferences
    const embedding = await generateUserPreferenceEmbedding(
      favoriteWoods,
      favoriteTools,
      favoriteProjects
    );

    if (!embedding) {
      console.warn('[UserPreferences] No embedding generated (possibly no preferences set)');
      // Still update the database to clear any existing embedding
    }

    // Update the user's profile with the new embedding
    const { error } = await supabase
      .from('profiles')
      .update({ preference_embedding: embedding })
      .eq('id', userId);

    if (error) {
      console.error('[UserPreferences] Failed to update preference embedding:', error);
      return false;
    }

    console.log('[UserPreferences] Preference embedding updated successfully');
    return true;
  } catch (error) {
    console.error('[UserPreferences] Error updating preference embedding:', error);
    return false;
  }
}

/**
 * Check if user preferences have changed and update embedding if needed
 * @param userId The user ID
 * @param currentPreferences Current preference state
 * @param previousPreferences Previous preference state (can be null for first check)
 * @returns Whether the embedding was updated
 */
export async function checkAndUpdatePreferenceEmbedding(
  userId: string,
  currentPreferences: {
    favoriteWoods: string[];
    favoriteTools: string[];
    favoriteProjects: string[];
  },
  previousPreferences?: {
    favoriteWoods: string[];
    favoriteTools: string[];
    favoriteProjects: string[];
  }
): Promise<boolean> {
  // If no previous preferences, always update
  if (!previousPreferences) {
    return updateUserPreferenceEmbedding(
      userId,
      currentPreferences.favoriteWoods,
      currentPreferences.favoriteTools,
      currentPreferences.favoriteProjects
    );
  }

  // Check if preferences have changed
  const woodsChanged = !arraysEqual(
    currentPreferences.favoriteWoods,
    previousPreferences.favoriteWoods
  );
  const toolsChanged = !arraysEqual(
    currentPreferences.favoriteTools,
    previousPreferences.favoriteTools
  );
  const projectsChanged = !arraysEqual(
    currentPreferences.favoriteProjects,
    previousPreferences.favoriteProjects
  );

  if (woodsChanged || toolsChanged || projectsChanged) {
    console.log('[UserPreferences] Preferences changed, updating embedding');
    return updateUserPreferenceEmbedding(
      userId,
      currentPreferences.favoriteWoods,
      currentPreferences.favoriteTools,
      currentPreferences.favoriteProjects
    );
  }

  console.log('[UserPreferences] Preferences unchanged, skipping embedding update');
  return false;
}

/**
 * Fetch stories sorted by similarity to user preferences
 * @param userId The user ID
 * @param limit Maximum number of stories to return
 * @returns Array of stories sorted by similarity
 */
export async function fetchStoriesBySimilarity(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    // First, get the user's preference embedding
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preference_embedding')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.preference_embedding) {
      console.log('[UserPreferences] No preference embedding found for user');
      return [];
    }

    // Call the database function to search similar stories
    const { data: stories, error: searchError } = await supabase
      .rpc('search_similar_stories', {
        query_embedding: profile.preference_embedding,
        match_count: limit
      });

    if (searchError) {
      console.error('[UserPreferences] Failed to search similar stories:', searchError);
      return [];
    }

    // Fetch full story data with user information
    const storyIds = stories.map((s: any) => s.id);
    
    const { data: fullStories, error: fetchError } = await supabase
      .from('stories')
      .select('*, user:profiles(*)')
      .in('id', storyIds)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[UserPreferences] Failed to fetch full story data:', fetchError);
      return stories; // Return partial data if full fetch fails
    }

    // Sort by similarity score
    const similarityMap = new Map<string, number>(
      stories.map((s: any) => [s.id, s.similarity])
    );
    const sortedStories = fullStories.sort((a: any, b: any) => {
      const simA = similarityMap.get(a.id) || 0;
      const simB = similarityMap.get(b.id) || 0;
      return simB - simA; // Sort descending by similarity
    });

    // Add similarity scores to the stories
    return sortedStories.map(story => ({
      ...story,
      similarity: similarityMap.get(story.id) || 0
    }));
  } catch (error) {
    console.error('[UserPreferences] Error fetching stories by similarity:', error);
    return [];
  }
}

// Helper function to compare arrays
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
} 