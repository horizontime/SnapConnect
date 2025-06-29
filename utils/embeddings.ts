import OpenAI from 'openai';
import Constants from 'expo-constants';

// Get API key from Expo constants
const getOpenAIKey = () => {
  // Try to get from Expo constants first
  const extra = Constants.expoConfig?.extra;
  if (extra?.openaiApiKey) {
    return extra.openaiApiKey;
  }
  
  // Fallback to environment variable (for scripts)
  if (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  
  console.warn('[Embeddings] OpenAI API key not found');
  return undefined;
};

// Initialize OpenAI client with lazy initialization
let openai: OpenAI | null = null;

const getOpenAIClient = () => {
  if (!openai) {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

/**
 * Generate embedding for a given text using OpenAI's text-embedding-3-small model
 * @param text The text to embed
 * @returns The embedding vector or null if generation fails
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    if (!text || text.trim().length === 0) {
      console.warn('[Embeddings] Empty text provided');
      return null;
    }

    // Check if API key is available before attempting to create client
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      console.warn('[Embeddings] OpenAI API key not available, skipping embedding generation');
      return null;
    }

    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[Embeddings] Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Generate embedding for a story based on its title and description
 * @param title Story title
 * @param description Story description
 * @returns The embedding vector or null if generation fails
 */
export async function generateStoryEmbedding(
  title: string | null,
  description: string | null
): Promise<number[] | null> {
  // Combine title and description for richer context
  const parts = [];
  if (title) parts.push(`Title: ${title}`);
  if (description) parts.push(`Description: ${description}`);
  
  if (parts.length === 0) {
    console.warn('[Embeddings] No title or description provided for story');
    return null;
  }

  const text = parts.join('\n');
  return generateEmbedding(text);
}

/**
 * Generate embedding for user preferences
 * @param favoriteWoods Array of favorite wood species
 * @param favoriteTools Array of favorite tools
 * @param favoriteProjects Array of favorite project types
 * @returns The embedding vector or null if generation fails
 */
export async function generateUserPreferenceEmbedding(
  favoriteWoods: string[],
  favoriteTools: string[],
  favoriteProjects: string[]
): Promise<number[] | null> {
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
    console.warn('[Embeddings] No preferences provided for user');
    return null;
  }

  const text = parts.join('\n');
  return generateEmbedding(text);
}

/**
 * Calculate cosine similarity between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
} 