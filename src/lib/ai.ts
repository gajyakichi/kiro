import OpenAI from 'openai';

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

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
async function getChatCompletion(messages: Message[]) {
  const model = process.env.AI_MODEL || (AI_PROVIDER === 'openai' ? 'gpt-4o-mini' : 'llama3');

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
      return data.message.content;
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
    return completion.choices[0].message.content;
  }
}

/**
 * Generates a summary (Daily Note) from Git logs and walkthrough context.
 */
export async function generateDailySummary(context: string): Promise<string> {
  try {
    const content = await getChatCompletion([
      {
        role: "system",
        content: "You are a helpful development assistant. Summarize the provided Git logs and project walkthrough into a concise daily report. Focus on what was accomplished and any significant technical changes. Use a professional, minimalist tone similar to Notion notes. Respond in Japanese if the input is primarily Japanese, otherwise English."
      },
      {
        role: "user",
        content: context
      }
    ]);

    return content || "Failed to generate summary.";
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return `AI Summary unavailable. (${(error as Error).message})`;
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
