import OpenAI from 'openai';

// Remove top-level consts
// const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
// const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

/**
 * Unified Chat Completion function
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_FILE = path.join(process.cwd(), '.ai-cache.json');

// Interface for Cache Entry
interface CacheEntry {
  timestamp: number;
  latencyMs: number;
  content: string;
}

// Simple file-based cache manager
const getCache = (): Record<string, CacheEntry> => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to read AI cache", e);
  }
  return {};
};

const setCache = (key: string, content: string, latencyMs: number) => {
  try {
    const cache = getCache();
    cache[key] = {
      timestamp: Date.now(),
      latencyMs,
      content
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error("Failed to write AI cache", e);
  }
};

/**
 * Unified Chat Completion function with Caching & Latency Measurement
 */
async function getChatCompletion(messages: Message[]) {
  const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.AI_MODEL || (AI_PROVIDER === 'openai' ? 'gpt-4o-mini' : 'llama3');
  
  // Generate Cache Key
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify({ 
    provider: AI_PROVIDER, 
    model, 
    messages 
  })).digest('hex');

  // 1. Check Cache
  const cache = getCache();
  if (cache[cacheKey]) {
    console.log(`[AI Cache Hit] Latency saved: ${cache[cacheKey].latencyMs}ms`);
    return cache[cacheKey].content;
  }

  const startTime = performance.now();
  let content = "";

  if (AI_PROVIDER === 'ollama') {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: false
        })
      });
      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
      const data = await response.json();
      content = data.message.content;
    } catch (e) {
      console.error("Ollama implementation failed, ensure Ollama is running and model is pulled.", e);
      throw e;
    }
  } else {
    // Default to OpenAI
    const openai = getOpenAI();
    if (!openai) throw new Error("OpenAI API Key is missing.");
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
    });
    content = completion.choices[0].message.content || "";
  }

  const endTime = performance.now();
  const latency = Math.round(endTime - startTime);

  console.log(`[AI Latency] ${latency}ms`);

  // 2. Save to Cache
  if (content) {
    setCache(cacheKey, content, latency);
  }

  return content;
}

/**
 * Generates a summary (Daily Note) from Git logs and walkthrough context.
 */
export async function generateDailySummary(context: string): Promise<{ en: string; ja: string }> {
  try {
    const content = await getChatCompletion([
      {
        role: "system",
        content: "You are a helpful development assistant. Summarize the provided Git logs and project walkthrough into a concise daily report. Focus on what was accomplished and any significant technical changes. Use a professional, minimalist tone similar to Notion notes. \n\nYou must return the result as a JSON object with two keys:\n- 'en': The summary in English\n- 'ja': The summary in Japanese\n\nEnsure strict JSON format."
      },
      {
        role: "user",
        content: context
      }
    ]);

    if (!content) throw new Error("No content received from AI");

    // Attempt to parse JSON
    try {
      const parsed = JSON.parse(content);
      return {
        en: parsed.en || "Summary generation failed (EN)",
        ja: parsed.ja || "Summary generation failed (JA)"
      };
    } catch (e) {
      console.warn("AI did not return valid JSON, falling back to text", e);
      // Fallback: treat the whole content as English (or based on detection)
      // For now, duplicate it or try to split if possible. 
      // Given the prompt, it usually complies.
      return { en: content, ja: content };
    }
  } catch (error) {
    console.error("Error generating AI summary:", error);
    const msg = `AI Summary unavailable. (${(error as Error).message})`;
    return { en: msg, ja: msg };
  }
}

/**
 * Suggests actionable TODO items based on the project context.
 */
export async function suggestTasks(context: string, language: string = 'en'): Promise<string[]> {
  try {
    const langInstruction = language === 'ja' ? "Respond in Japanese." : "Respond in English.";
    const content = await getChatCompletion([
      {
        role: "system",
        content: `Analyze the project context (Git logs and walkthrough) and suggest 3-5 actionable next steps (TODOs). Each task should be descriptive but concise. Return the tasks as a simple list, one per line, without numbers or bullets. ${langInstruction}`
      },
      {
        role: "user",
        content: context
      }
    ]);

    if (!content) return [];
    return content.split('\n').map((t: string) => t.trim()).filter(Boolean);
  } catch (error) {
    console.error("Error suggesting tasks:", error);
    return [];
  }
}
