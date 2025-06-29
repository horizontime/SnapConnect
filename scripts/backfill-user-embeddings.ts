import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.log('\nTo backfill embeddings, you need the service role key:');
  console.log('1. Go to your Supabase project settings');
  console.log('2. Navigate to API section');
  console.log('3. Copy the "service_role" key (secret)');
  console.log('4. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey);

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
  console.log('Starting user preference embedding backfill with service role...');
  console.log('This bypasses RLS and can update all user profiles.\n');
  
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
    let skippedCount = 0;
    let failureCount = 0;

    // Process each user
    for (const user of users) {
      console.log(`\nProcessing user ${user.username || user.id}...`);
      console.log(`  Woods: ${user.favorite_woods?.length || 0} favorites`);
      console.log(`  Tools: ${user.favorite_tools?.length || 0} favorites`);
      console.log(`  Projects: ${user.favorite_projects?.length || 0} favorites`);
      
      const hasPreferences = 
        (user.favorite_woods && user.favorite_woods.length > 0) ||
        (user.favorite_tools && user.favorite_tools.length > 0) ||
        (user.favorite_projects && user.favorite_projects.length > 0);

      // Skip if user has no preferences
      if (!hasPreferences) {
        console.log(`  ⚠️  Skipping - no preferences set`);
        skippedCount++;
        continue;
      }

      // Generate embedding
      const embedding = await generateUserPreferenceEmbedding(
        user.favorite_woods || [],
        user.favorite_tools || [],
        user.favorite_projects || []
      );
      
      if (!embedding) {
        console.error(`  ❌ Failed to generate embedding`);
        failureCount++;
        continue;
      }

      console.log(`  ✓ Generated embedding (${embedding.length} dimensions)`);

      // Update the user profile with the embedding
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ preference_embedding: embedding })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error(`  ❌ Failed to update:`, updateError.message);
        failureCount++;
      } else {
        console.log(`  ✅ Successfully updated user preferences`);
        successCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(50));
    console.log('User preference embedding backfill complete!');
    console.log(`✅ Success: ${successCount} users`);
    console.log(`⚠️  Skipped: ${skippedCount} users (no preferences)`);
    console.log(`❌ Failed: ${failureCount} users`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
processUsers(); 