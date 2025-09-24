import { NextResponse } from 'next/server';

// Random words to start with
const randomWords = [
  'serendipity', 'ephemeral', 'mellifluous', 'wanderlust', 'petrichor',
  'solitude', 'resilience', 'nostalgia', 'euphoria', 'tranquil',
  'innovation', 'curiosity', 'harmony', 'adventure', 'wisdom',
  'creativity', 'mindfulness', 'perspective', 'gratitude', 'compassion'
];

async function callOllamaStream(prompt) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3.1:8b', // You can change this to your preferred model
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  return response;
}

export async function GET() {
  try {
    const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];

    const prompt = `Provide a concise, single-paragraph encyclopedia-style definition for the term: "${randomWord}". Be informative and neutral. Do not use markdown, titles, or any special formatting. Respond with only the text of the definition itself.`;

    const ollamaResponse = await callOllamaStream(prompt);
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        try {
          // Send initial word info
          const initData = JSON.stringify({ word: randomWord, type: 'init' }) + '\n';
          controller.enqueue(new TextEncoder().encode(initData));

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  const streamData = JSON.stringify({ 
                    content: data.message.content, 
                    type: 'content',
                    done: data.done || false 
                  }) + '\n';
                  controller.enqueue(new TextEncoder().encode(streamData));
                }
                
                if (data.done) {
                  controller.close();
                  return;
                }
              } catch (e) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { word } = await request.json();
    
    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    const prompt = `Provide a concise, single-paragraph encyclopedia-style definition for the term: "${word}". Be informative and neutral. Do not use markdown, titles, or any special formatting. Respond with only the text of the definition itself.`;
    
    const ollamaResponse = await callOllamaStream(prompt);
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        try {
          // Send initial word info
          const initData = JSON.stringify({ word: word, type: 'init' }) + '\n';
          controller.enqueue(new TextEncoder().encode(initData));

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  const streamData = JSON.stringify({ 
                    content: data.message.content, 
                    type: 'content',
                    done: data.done || false 
                  }) + '\n';
                  controller.enqueue(new TextEncoder().encode(streamData));
                }
                
                if (data.done) {
                  controller.close();
                  return;
                }
              } catch (e) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}