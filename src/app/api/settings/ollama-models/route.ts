import { NextResponse } from 'next/server';

export async function GET() {
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with ${response.status}`);
    }

    const data = await response.json();
    // Ollama returns { models: [ { name: "llama3:latest", ... }, ... ] }
    const modelNames = data.models?.map((m: { name: string }) => m.name) || [];
    
    return NextResponse.json({ models: modelNames });
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return NextResponse.json({ error: 'Could not connect to Ollama server. Make sure it is running.' }, { status: 500 });
  }
}
