import { NextRequest, NextResponse } from 'next/server';
import { getChatCompletion } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();

    if (!text || !targetLang) {
      return NextResponse.json({ error: 'Text and targetLang are required' }, { status: 400 });
    }

    const prompt = targetLang === 'ja' 
      ? "以下の開発進捗レポートを、オリジナルのニュアンスを保ったまま日本語に翻訳してください。Notionライクな簡潔なトーンでお願いします。"
      : "Translate the following development progress report into English. Maintain a concise, professional tone.";

    const translated = await getChatCompletion([
      {
        role: "system",
        content: prompt
      },
      {
        role: "user",
        content: text
      }
    ]);

    return NextResponse.json({ translated });
  } catch (error) {
    console.error('Translation Error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
