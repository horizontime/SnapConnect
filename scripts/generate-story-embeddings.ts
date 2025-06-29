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
  console.log('Starting story embedding generation...');
  
  try {
    // Fetch all stories that don't have embeddings yet
    const { data: stories, error } = await supabase
      .from('stories')
      .select('id, title, description')
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
      console.log(`Processing story ${story.id}...`);
      
      // Skip if neither title nor description exists
      if (!story.title && !story.description) {
        console.log(`Skipping story ${story.id} - no title or description`);
        failureCount++;
        continue;
      }

      // Generate embedding
      const embedding = await generateStoryEmbedding(story.title, story.description);
      
      if (!embedding) {
        console.error(`Failed to generate embedding for story ${story.id}`);
        failureCount++;
        continue;
      }

      // Update the story with the embedding
      const { error: updateError } = await supabase
        .from('stories')
        .update({ embedding })
        .eq('id', story.id);

      if (updateError) {
        console.error(`Failed to update story ${story.id}:`, updateError);
        failureCount++;
      } else {
        console.log(`Successfully updated story ${story.id}`);
        successCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\nEmbedding generation complete!');
    console.log(`Success: ${successCount} stories`);
    console.log(`Failed: ${failureCount} stories`);
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
processStories(); 