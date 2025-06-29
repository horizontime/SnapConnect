import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generate embedding for user preferences
 */
async function generateUserPreferenceEmbedding(
  favoriteWoods: string[],
  favoriteTools: string[],
  favoriteProjects: string[]
): Promise<number[] | null> {
  try {
    // Combine all preferences into a structured text
    const parts = [];
    
    if (favoriteWoods.length > 0) {
      parts.push(`Favorite wood species: ${favoriteWoods.join(', ')}`);
    }
    
    if (favoriteTools.length > 0) {
      parts.push(`Favorite tools: ${favoriteTools.join(', ')}`);
    }
    
    if (favoriteProjects.length > 0) {
      parts.push(`Favorite project types: ${favoriteProjects.join(', ')}`);
    }
    
    if (parts.length === 0) {
      return null;
    }

    const text = parts.join('\n');
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Process all users with preferences but no embeddings
 */
async function processUsers() {
  console.log('Starting user preference embedding generation...');
  
  try {
    // Fetch all users with preferences but without embeddings
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, favorite_woods, favorite_tools, favorite_projects')
      .is('preference_embedding', null);

    if (error) {
      console.error('Failed to fetch users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users need embedding generation.');
      return;
    }

    console.log(`Found ${users.length} users without preference embeddings.`);

    let successCount = 0;
    let failureCount = 0;

    // Process each user
    for (const user of users) {
      console.log(`Processing user ${user.username || user.id}...`);
      
      const hasPreferences = 
        (user.favorite_woods && user.favorite_woods.length > 0) ||
        (user.favorite_tools && user.favorite_tools.length > 0) ||
        (user.favorite_projects && user.favorite_projects.length > 0);

      // Skip if user has no preferences
      if (!hasPreferences) {
        console.log(`Skipping user ${user.username || user.id} - no preferences set`);
        continue;
      }

      // Generate embedding
      const embedding = await generateUserPreferenceEmbedding(
        user.favorite_woods || [],
        user.favorite_tools || [],
        user.favorite_projects || []
      );
      
      if (!embedding) {
        console.error(`Failed to generate embedding for user ${user.username || user.id}`);
        failureCount++;
        continue;
      }

      // Update the user profile with the embedding
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ preference_embedding: embedding })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Failed to update user ${user.username || user.id}:`, updateError);
        failureCount++;
      } else {
        console.log(`Successfully updated user ${user.username || user.id}`);
        successCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\nUser preference embedding generation complete!');
    console.log(`Success: ${successCount} users`);
    console.log(`Failed: ${failureCount} users`);
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
processUsers(); 