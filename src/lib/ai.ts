import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a summary (Daily Note) from Git logs and walkthrough context.
 */
export async function generateDailySummary(context: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "AI Summary is unavailable (API Key missing). Please check your environment variables.";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful development assistant. Summarize the provided Git logs and project walkthrough into a concise daily report. Focus on what was accomplished and any significant technical changes. Use a professional, minimalist tone similar to Notion notes. Respond in Japanese if the input is primarily Japanese, otherwise English."
        },
        {
          role: "user",
          content: context
        }
      ],
    });

    return response.choices[0].message.content || "Failed to generate summary.";
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return "Error occurred while generating AI summary.";
  }
}

/**
 * Suggests actionable TODO items based on the project context.
 */
export async function suggestTasks(context: string): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Analyze the project context (Git logs and walkthrough) and suggest 3-5 actionable next steps (TODOs). Each task should be descriptive but concise. Return the tasks as a simple list, one per line, without numbers or bullets."
        },
        {
          role: "user",
          content: context
        }
      ],
    });

    const content = response.choices[0].message.content || "";
    return content.split('\n').map(t => t.trim()).filter(Boolean);
  } catch (error) {
    console.error("Error suggesting tasks:", error);
    return [];
  }
}
