// Quick test - run with: bun run scripts/quick-test.ts
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'test'
}).then(() => console.log('✅ API key is working!'))
  .catch(err => console.error('❌ API key error:', err.message)); 