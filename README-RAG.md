# RAG-based Story Recommendation System

This document describes the RAG (Retrieval-Augmented Generation) system implemented for recommending Snap stories based on user preferences.

## Overview

The recommendation system uses OpenAI's text-embedding-3-small model to generate vector embeddings for:
- **Stories**: Based on their title and description
- **User preferences**: Based on favorite wood species, tools, and project types

Stories are then ranked by cosine similarity to each user's preference embedding.

## Setup

### 1. Enable pgvector Extension

Run the migration to enable pgvector and create the necessary database schema:

```bash
# Using Supabase CLI
supabase db push
```

### 2. Set Environment Variables

Ensure your `.env` file contains:
```
OPENAI_API_KEY=your_openai_api_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Generate Embeddings for Existing Data

For existing stories without embeddings:
```bash
bun run scripts/generate-story-embeddings.ts
```

For existing users with preferences but no embeddings:
```bash
bun run scripts/generate-user-embeddings.ts
```

## How It Works

### Story Creation
1. When a story is created with a title and/or description, an embedding is automatically generated
2. The embedding is stored in the `embedding` column of the `stories` table
3. If embedding generation fails, the story is still created (without blocking the user)

### User Preferences
1. Users can set their favorite woods, tools, and project types in their profile
2. When preferences change, a debounced update (2 seconds) generates a new preference embedding
3. The embedding is stored in the `preference_embedding` column of the `profiles` table

### Recommendation Algorithm
1. When loading the stories page, the system fetches stories sorted by similarity to the user's preferences
2. Uses pgvector's cosine similarity operator (`<=>`) for efficient similarity search
3. Equal weighting (33.3% each) is applied to woods, tools, and projects preferences
4. Stories without embeddings are excluded from similarity search

### Fallback Behavior
- **No user preferences**: Shows all stories sorted by recency
- **No preference embedding**: Falls back to chronological sorting
- **Embedding generation failure**: Logs error but doesn't block operations

## API Functions

### Embedding Generation
```typescript
// Generate embedding for a story
generateStoryEmbedding(title: string | null, description: string | null): Promise<number[] | null>

// Generate embedding for user preferences
generateUserPreferenceEmbedding(
  favoriteWoods: string[],
  favoriteTools: string[],
  favoriteProjects: string[]
): Promise<number[] | null>
```

### Preference Updates
```typescript
// Update user preference embedding
updateUserPreferenceEmbedding(
  userId: string,
  favoriteWoods: string[],
  favoriteTools: string[],
  favoriteProjects: string[]
): Promise<boolean>
```

### Story Fetching
```typescript
// Fetch stories sorted by similarity to user preferences
fetchStoriesBySimilarity(
  userId: string,
  limit: number = 20
): Promise<any[]>
```

## Database Schema

### Stories Table
```sql
ALTER TABLE public.stories 
ADD COLUMN embedding vector(1536);
```

### Profiles Table
```sql
ALTER TABLE public.profiles 
ADD COLUMN preference_embedding vector(1536);
```

### Similarity Search Function
```sql
CREATE OR REPLACE FUNCTION search_similar_stories(
  query_embedding vector(1536),
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  media_url text,
  thumbnail_url text,
  created_at timestamptz,
  expires_at timestamptz,
  similarity float
)
```

## Performance Considerations

1. **Embedding Generation**: ~100ms per request to OpenAI
2. **pgvector Index**: IVFFlat index with 100 lists for fast similarity search
3. **Debouncing**: 2-second delay on preference updates to avoid excessive API calls
4. **Batch Processing**: Scripts include 100ms delays to avoid rate limiting

## Future Enhancements

1. **Weighted Preferences**: Allow users to prioritize certain preference types
2. **Content-based Filtering**: Include story captions and media analysis
3. **Collaborative Filtering**: Incorporate user interaction data
4. **Hybrid Approach**: Combine content-based and collaborative filtering
5. **Real-time Updates**: Use WebSockets to update recommendations live 