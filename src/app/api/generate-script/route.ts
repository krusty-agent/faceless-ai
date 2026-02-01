import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const MOCK_MODE = process.env.MOCK_MODE === 'true' || !process.env.ANTHROPIC_API_KEY;

const MOCK_SCENES = [
  { text: "Did you know the ancient Mayans predicted solar eclipses with incredible accuracy?", imagePrompt: "Ancient Mayan observatory with starry night sky", duration: 6 },
  { text: "But one day, their entire civilization just... vanished.", imagePrompt: "Abandoned Mayan temple overtaken by jungle", duration: 5 },
  { text: "Theories range from drought to warfare to disease.", imagePrompt: "Dried cracked earth with Mayan ruins in background", duration: 5 },
  { text: "But the truth might be even stranger.", imagePrompt: "Mysterious glowing symbols on Mayan stone wall", duration: 4 },
  { text: "What really happened to the Maya?", imagePrompt: "Mayan calendar stone with dramatic lighting", duration: 4 },
  { text: "Follow for more mysteries.", imagePrompt: "Silhouette of explorer in front of Mayan pyramid at sunset", duration: 3 },
];

export async function POST(request: NextRequest) {
  try {
    const { topic, style, numScenes = 6 } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (MOCK_MODE) {
      // Return mock data after a short delay
      await new Promise(r => setTimeout(r, 1500));
      return NextResponse.json({ scenes: MOCK_SCENES.slice(0, numScenes) });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const totalDuration = numScenes * 8;

    const systemPrompt = `You are a viral video scriptwriter. Create engaging, hook-driven scripts for short-form video content.
        
Style: ${style}

Output ONLY a JSON array of EXACTLY ${numScenes} scenes. Each scene should be 6-10 seconds of narration.
Format:
[
  {
    "text": "The narration text for this scene",
    "imagePrompt": "Detailed image generation prompt for this scene",
    "duration": 7
  }
]

Rules:
- Start with a strong hook that grabs attention in the first 2 seconds
- Keep sentences short and punchy
- Each scene should be visually distinct
- Image prompts should be detailed and cinematic
- Total video should be ~${totalDuration} seconds
- Output ONLY valid JSON, no other text`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Create a viral short video script about: ${topic}`
        }
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('No script generated');
    }

    // Extract JSON from response
    let jsonStr = content.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    const scenes = JSON.parse(jsonStr);
    return NextResponse.json({ scenes: Array.isArray(scenes) ? scenes : scenes.scenes || [] });

  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate script' },
      { status: 500 }
    );
  }
}
