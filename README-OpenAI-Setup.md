# OpenAI API Key Setup for React Native

## The Issue

When running the React Native app, you may see this error:
```
The OPENAI_API_KEY environment variable is missing or empty
```

This happens because React Native/Expo handles environment variables differently than Node.js.

## Solution

### 1. Ensure your `.env` file exists in the project root:
```
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. The app is now configured to read the API key from:
- `app.config.js` loads environment variables using `dotenv/config`
- The API key is passed to the app via `expo.extra.openaiApiKey`
- The embeddings utility safely handles missing API keys

### 3. Restart your Expo development server:
```bash
# Stop the current server (Ctrl+C)
# Clear the cache and restart
npx expo start -c
```

### 4. If you're using Expo Go, you may need to:
- Clear the Expo Go app cache
- Or reinstall the Expo Go app

## How It Works

1. **app.config.js**: Loads `.env` file and passes API key to app
2. **utils/embeddings.ts**: Reads API key from Expo constants
3. **Graceful fallback**: If no API key, embeddings are skipped (no crash)

## Testing

After restarting, the app should:
- No longer show the OpenAI API key error
- Generate embeddings when creating stories (if API key is valid)
- Update user preference embeddings when preferences change
- Show personalized recommendations in the Stories tab

## Important Notes

- Never commit your `.env` file to version control
- The API key is only used for embedding generation
- If embeddings fail, the app continues to work (without recommendations)
- Script files (like batch processing) still use `process.env.OPENAI_API_KEY` directly 