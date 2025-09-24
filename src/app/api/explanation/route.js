import { NextResponse } from 'next/server';

// Enhanced random words with more diverse vocabulary
const randomWords = [
  'serendipity', 'ephemeral', 'mellifluous', 'wanderlust', 'petrichor',
  'solitude', 'resilience', 'nostalgia', 'euphoria', 'tranquil',
  'innovation', 'curiosity', 'harmony', 'adventure', 'wisdom',
  'creativity', 'mindfulness', 'perspective', 'gratitude', 'compassion',
  'luminescence', 'quintessential', 'renaissance', 'symbiosis', 'paradox',
  'metamorphosis', 'catalyst', 'zeitgeist', 'ubiquitous', 'synchronicity',
  'transcendence', 'equilibrium', 'enigmatic', 'phenomenal', 'eloquent'
];

function createEnhancedPrompt(word, isRandomWord = false) {
  // Detect word category for smarter prompting
  const categories = {
    scientific: ['quantum', 'molecule', 'photosynthesis', 'neural', 'enzyme', 'gravitational'],
    philosophical: ['existential', 'metaphysical', 'consciousness', 'ethics', 'wisdom', 'transcendence'],
    artistic: ['renaissance', 'aesthetic', 'harmony', 'creativity', 'mellifluous', 'eloquent'],
    emotional: ['serendipity', 'nostalgia', 'euphoria', 'empathy', 'compassion', 'solitude'],
    abstract: ['paradox', 'zeitgeist', 'synchronicity', 'quintessential', 'enigmatic']
  };

  let categoryHint = '';
  for (const [category, words] of Object.entries(categories)) {
    if (words.some(w => word.toLowerCase().includes(w) || w.includes(word.toLowerCase()))) {
      categoryHint = getContextualPromptAddition(category);
      break;
    }
  }

  const basePrompt = `You are an expert educator writing for "Infinite Wiki" - a platform where every word leads to deeper knowledge discovery.

Write an engaging, comprehensive explanation about "${word}" that will captivate curious minds. Your response should:

📚 STRUCTURE:
- Start with a compelling definition that hooks the reader
- Include fascinating etymology or word origins when relevant  
- Provide real-world examples and applications
- Add interesting historical context or cultural significance
- Mention surprising connections to other fields or concepts

✨ STYLE REQUIREMENTS:
- Write in an conversational yet informative tone
- Use vivid, descriptive language that makes concepts memorable
- Include specific examples, stories, or analogies
- Make every sentence engaging - this content should inspire clicks on other words
- Aim for 180-250 words for optimal depth without overwhelming
- NO markdown formatting, bullet points, or headers - pure flowing text

🎯 ENGAGEMENT FOCUS:
- Use words that naturally invite further exploration
- Include terminology from different domains (science, art, philosophy, etc.)
- Create natural curiosity bridges to related concepts
- Write as if talking to an intelligent, curious friend

${categoryHint}

${isRandomWord ? 
  `🌟 SPECIAL NOTE: This is the user's entry point to their knowledge journey - make it extraordinary and set the tone for infinite discovery!` :
  `🔗 CONTEXT: The user clicked on "${word}" from another explanation - build on their curiosity and guide them deeper.`
}

Remember: Every word you write could be clicked for further exploration. Make them count! Write a single, flowing paragraph that reads beautifully.`;

  return basePrompt;
}

function getContextualPromptAddition(category) {
  const contextualHints = {
    scientific: `🔬 SCIENTIFIC CONTEXT: Include precise scientific explanations but make them accessible. Connect to related scientific concepts, breakthrough discoveries, or practical applications in technology and research.`,
    
    philosophical: `🤔 PHILOSOPHICAL CONTEXT: Explore the deeper meanings and implications. Reference key philosophers, schools of thought, or existential questions. Connect to human experience and universal themes.`,
    
    artistic: `🎨 ARTISTIC CONTEXT: Highlight aesthetic qualities, creative expressions, and cultural impact. Reference art movements, famous works, or the role in human creative expression.`,
    
    emotional: `💭 EMOTIONAL CONTEXT: Explore the psychological and human aspects. Connect to feelings, relationships, personal growth, and the human condition.`,
    
    abstract: `🌀 ABSTRACT CONTEXT: Unpack complex conceptual meanings. Use concrete examples to illustrate abstract ideas. Connect to various fields where this concept appears.`
  };
  
  return contextualHints[category] || '';
}

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
    
    const prompt = createEnhancedPrompt(randomWord, true);
    
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

    const prompt = createEnhancedPrompt(word, false);
    
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