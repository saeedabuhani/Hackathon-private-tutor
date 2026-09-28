import OpenAI from 'openai';

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const TEMPERATURE = 0.3;

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
