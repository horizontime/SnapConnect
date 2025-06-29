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
  console.log('\nAlternatively, you can:');
  console.log('- Apply the RLS migration: supabase db push');
  console.log('- Use authenticated requests for your own stories');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generate embedding for a story
 */
async function generateStoryEmbedding(
  title: string | null,
  description: string | null
): Promise<number[] | null> {
  try {
    // Combine title and description for richer context
    const parts = [];
    if (title) parts.push(`Title: ${title}`);
    if (description) parts.push(`Description: ${description}`);
    
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
 * Process all stories without embeddings
 */
async function processStories() {
  console.log('Starting story embedding backfill with service role...');
  console.log('This bypasses RLS and can update all stories.\n');
  
  try {
    // Fetch all stories that don't have embeddings yet
    const { data: stories, error } = await supabase
      .from('stories')
      .select('id, title, description, user_id')
      .is('embedding', null);

    if (error) {
      console.error('Failed to fetch stories:', error);
      return;
    }

    if (!stories || stories.length === 0) {
      console.log('No stories need embedding generation.');
      return;
    }

    console.log(`Found ${stories.length} stories without embeddings.`);

    let successCount = 0;
    let failureCount = 0;

    // Process each story
    for (const story of stories) {
      console.log(`\nProcessing story ${story.id}...`);
      console.log(`  Title: ${story.title || 'None'}`);
      console.log(`  Description: ${story.description ? story.description.substring(0, 50) + '...' : 'None'}`);
      
      // Skip if neither title nor description exists
      if (!story.title && !story.description) {
        console.log(`  ⚠️  Skipping - no title or description`);
        failureCount++;
        continue;
      }

      // Generate embedding
      const embedding = await generateStoryEmbedding(story.title, story.description);
      
      if (!embedding) {
        console.error(`  ❌ Failed to generate embedding`);
        failureCount++;
        continue;
      }

      console.log(`  ✓ Generated embedding (${embedding.length} dimensions)`);

      // Update the story with the embedding
      const { data, error: updateError } = await supabase
        .from('stories')
        .update({ embedding })
        .eq('id', story.id)
        .select();

      if (updateError) {
        console.error(`  ❌ Failed to update:`, updateError.message);
        failureCount++;
      } else {
        console.log(`  ✅ Successfully updated story`);
        successCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(50));
    console.log('Embedding backfill complete!');
    console.log(`✅ Success: ${successCount} stories`);
    console.log(`❌ Failed: ${failureCount} stories`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
processStories(); 