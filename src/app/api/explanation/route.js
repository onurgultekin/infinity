import { NextResponse } from 'next/server';

import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Enhanced random words with rich etymological backgrounds
const randomWords = [
  'infinite word wiki'
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

  const basePrompt = `Provide a concise, single-paragraph encyclopedia-style definition for the term: "${word}". Be informative and neutral. Do not use markdown, titles, or any special formatting. Respond with only the text of the definition itself. Use at least 100 words`;

  return basePrompt;
}

function getContextualPromptAddition(category) {
  const contextualHints = {
    scientific: `🔬 SCIENTIFIC CONTEXT: Include precise scientific explanations but make them accessible. Connect to related scientific concepts, breakthrough discoveries, or practical applications in technology and research. Emphasize any Greek or Latin scientific terminology origins.`,
    
    philosophical: `🤔 PHILOSOPHICAL CONTEXT: Explore the deeper meanings and implications. Reference key philosophers, schools of thought, or existential questions. Connect to human experience and universal themes. Highlight how ancient philosophical terms evolved into modern usage.`,
    
    artistic: `🎨 ARTISTIC CONTEXT: Highlight aesthetic qualities, creative expressions, and cultural impact. Reference art movements, famous works, or the role in human creative expression. Show how artistic terminology traveled between cultures and languages.`,
    
    emotional: `💭 EMOTIONAL CONTEXT: Explore the psychological and human aspects. Connect to feelings, relationships, personal growth, and the human condition. Reveal how emotional vocabulary developed across different cultures and time periods.`,
    
    abstract: `🌀 ABSTRACT CONTEXT: Unpack complex conceptual meanings. Use concrete examples to illustrate abstract ideas. Connect to various fields where this concept appears. Show the linguistic journey of abstract concepts from ancient to modern times.`
  };
  
  return contextualHints[category] || '';
}

async function callReplicateStream(prompt) {
  try {
    // Using Meta's Llama 2 7B Chat model on Replicate (faster and optimized)
    const stream = await replicate.stream("meta/meta-llama-3-8b-instruct", {
      input: {
        prompt: prompt,
        max_new_tokens: 1024,
        temperature: 0.7
      }
    });

    return stream;
  } catch (error) {
    console.error('Replicate API error:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    
    const prompt = createEnhancedPrompt(randomWord, true);
    
    const replicateStream = await callReplicateStream(prompt);
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial word info
          const initData = JSON.stringify({ word: randomWord, type: 'init' }) + '\n';
          controller.enqueue(new TextEncoder().encode(initData));

          // Process Replicate stream - GET method
          for await (const chunk of replicateStream) {
            // Replicate chunk'lar string olarak geliyor, direkt kullan
            const content = typeof chunk === 'string' ? chunk : chunk.toString();
            const streamData = JSON.stringify({ 
              content: content, 
              type: 'content',
              done: false 
            }) + '\n';
            controller.enqueue(new TextEncoder().encode(streamData));
          }

          // Send completion signal
          const doneData = JSON.stringify({ 
            content: '', 
            type: 'content',
            done: true 
          }) + '\n';
          controller.enqueue(new TextEncoder().encode(doneData));
          controller.close();

        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
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
    
    const replicateStream = await callReplicateStream(prompt);
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial word info
          const initData = JSON.stringify({ word: word, type: 'init' }) + '\n';
          controller.enqueue(new TextEncoder().encode(initData));

          // Process Replicate stream - POST method
          for await (const chunk of replicateStream) {
            // Replicate chunk'lar string olarak geliyor, direkt kullan
            const content = typeof chunk === 'string' ? chunk : chunk.toString();
            const streamData = JSON.stringify({ 
              content: content, 
              type: 'content',
              done: false 
            }) + '\n';
            controller.enqueue(new TextEncoder().encode(streamData));
          }

          // Send completion signal
          const doneData = JSON.stringify({ 
            content: '', 
            type: 'content',
            done: true 
          }) + '\n';
          controller.enqueue(new TextEncoder().encode(doneData));
          controller.close();

        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
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