import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { v4 as uuidv4 } from 'uuid';
import { assembleVideo } from './video-assembler';
import { getMusicTrack } from './music';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;
let elevenlabs: ElevenLabsClient | null = null;

const MOCK_MODE = process.env.MOCK_MODE === 'true' || (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY && !process.env.ELEVENLABS_API_KEY);

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

function getElevenLabs(): ElevenLabsClient {
  if (!elevenlabs) {
    elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  }
  return elevenlabs;
}

// ElevenLabs voice IDs - these are the default voices
const ELEVENLABS_VOICES: Record<string, string> = {
  'rachel': '21m00Tcm4TlvDq8ikWAM',    // Rachel - calm, female
  'drew': '29vD33N1CtxCmqQRPOHJ',       // Drew - confident, male
  'clyde': '2EiwWnXFnvU5JabPnv8n',      // Clyde - war veteran, male
  'paul': '5Q0t7uMcjvnagumLfvZi',       // Paul - ground reporter, male
  'domi': 'AZnzlk1XvdvUeBnXmlld',       // Domi - strong, female
  'dave': 'CYw3kZ02Hs0563khs1Fj',       // Dave - conversational, male
  'fin': 'D38z5RcWu1voky8WS1ja',        // Fin - sailor, male
  'sarah': 'EXAVITQu4vr4xnSDxMaL',      // Sarah - soft, female
  'antoni': 'ErXwobaYiN019PkySvjV',     // Antoni - crisp, male
  'elli': 'MF3mGyEYCl7XYWbV9V6O',       // Elli - emotional, female
  'josh': 'TxGEqnHWrfWFTfGW9XjX',       // Josh - deep, male
  'arnold': 'VR6AewLTigWG4xSOukaG',     // Arnold - crisp, male
  'adam': 'pNInz6obpgDQGcFmaJgB',       // Adam - deep, male
  'sam': 'yoZ06aMxZJJ28mfd3POQ',        // Sam - dynamic, male
};

// Mock data for testing without API keys
const MOCK_SCENES: VideoScene[] = [
  { text: "Did you know the ancient Mayans predicted solar eclipses with incredible accuracy?", imagePrompt: "Ancient Mayan observatory with starry night sky", duration: 6 },
  { text: "But one day, their entire civilization just... vanished.", imagePrompt: "Abandoned Mayan temple overtaken by jungle", duration: 5 },
  { text: "Theories range from drought to warfare to disease.", imagePrompt: "Dried cracked earth with Mayan ruins in background", duration: 5 },
  { text: "But the truth might be even stranger.", imagePrompt: "Mysterious glowing symbols on Mayan stone wall", duration: 4 },
  { text: "What really happened to the Maya?", imagePrompt: "Mayan calendar stone with dramatic lighting", duration: 4 },
];

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1080&h=1920&fit=crop",
  "https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=1080&h=1920&fit=crop",
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1080&h=1920&fit=crop",
  "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1080&h=1920&fit=crop",
  "https://images.unsplash.com/photo-1464817739973-0128fe77aaa1?w=1080&h=1920&fit=crop",
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface VideoScene {
  text: string;
  imagePrompt: string;
  duration: number;
}

export interface VideoProject {
  id: string;
  topic: string;
  style: string;
  voice: string;
  music: string;
  scenes: VideoScene[];
  status: 'pending' | 'generating_script' | 'generating_images' | 'generating_audio' | 'assembling' | 'complete' | 'error';
  progress: number;
  videoUrl?: string;
  imageUrls?: string[];
  error?: string;
}

// In-memory storage (replace with DB in production)
const projects = new Map<string, VideoProject>();

export function getProject(id: string): VideoProject | undefined {
  return projects.get(id);
}

export async function generateScript(topic: string, style: string): Promise<VideoScene[]> {
  if (MOCK_MODE) {
    console.log('[MOCK] Generating script for:', topic);
    await delay(2000); // Simulate API delay
    return MOCK_SCENES;
  }

  const systemPrompt = `You are a viral video scriptwriter. Create engaging, hook-driven scripts for short-form video content.
        
Style: ${style}

Output ONLY a JSON array of 5-8 scenes. Each scene should be 5-10 seconds of narration.
Format:
[
  {
    "text": "The narration text for this scene",
    "imagePrompt": "Detailed image generation prompt for this scene",
    "duration": 7
  }
]

Rules:
- Start with a strong hook
- Keep sentences short and punchy
- Each scene should be visually distinct
- Image prompts should be detailed and cinematic
- Total video should be 45-60 seconds
- Output ONLY valid JSON, no other text`;

  const response = await getAnthropic().messages.create({
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
  if (content.type !== 'text') throw new Error('No script generated');
  
  // Extract JSON from response (handle potential markdown code blocks)
  let jsonStr = content.text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }
  
  const parsed = JSON.parse(jsonStr);
  return Array.isArray(parsed) ? parsed : parsed.scenes || [];
}

let mockImageIndex = 0;

export async function generateImage(prompt: string, style: string): Promise<string> {
  if (MOCK_MODE) {
    console.log('[MOCK] Generating image for:', prompt.slice(0, 50));
    await delay(1500); // Simulate API delay
    const url = MOCK_IMAGES[mockImageIndex % MOCK_IMAGES.length];
    mockImageIndex++;
    return url;
  }

  const styledPrompt = `${prompt}, ${getStyleSuffix(style)}`;
  
  // Use DALL-E 3 for image generation
  const response = await getOpenAI().images.generate({
    model: 'dall-e-3',
    prompt: styledPrompt,
    n: 1,
    size: '1024x1792', // Vertical for TikTok/Shorts (closest to 9:16)
    quality: 'standard',
  });
  
  if (!response.data || !response.data[0]?.url) {
    throw new Error('No image generated');
  }
  return response.data[0].url;
}

function getStyleSuffix(style: string): string {
  const styles: Record<string, string> = {
    'realistic': 'photorealistic, cinematic lighting, 8k, highly detailed',
    'anime': 'anime style, vibrant colors, studio ghibli inspired',
    'horror': 'dark, eerie, horror movie aesthetic, dramatic shadows',
    'documentary': 'documentary style, realistic, historical accuracy',
    'fantasy': 'fantasy art, magical, ethereal lighting, detailed',
    'minimalist': 'minimalist, clean, modern design, simple',
  };
  return styles[style] || styles['realistic'];
}

export async function generateSpeech(text: string, voice: string = 'rachel'): Promise<Buffer> {
  if (MOCK_MODE) {
    console.log('[MOCK] Generating speech for:', text.slice(0, 50));
    await delay(1500);
    // Return a minimal valid MP3 (silent 1-second audio)
    const silentMp3 = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    const chunks = Array(500).fill(silentMp3);
    return Buffer.concat(chunks);
  }

  // Use ElevenLabs for TTS
  const voiceId = ELEVENLABS_VOICES[voice] || ELEVENLABS_VOICES['rachel'];
  
  const audioStream = await getElevenLabs().textToSpeech.convert(voiceId, {
    text,
    modelId: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
  });

  // Convert stream to Buffer
  const reader = audioStream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function createVideoProject(topic: string, style: string, voice: string, music: string = 'none'): Promise<string> {
  const id = uuidv4();
  
  const project: VideoProject = {
    id,
    topic,
    style,
    voice,
    music,
    scenes: [],
    status: 'pending',
    progress: 0,
  };
  
  projects.set(id, project);
  
  // Start generation in background
  processVideo(id).catch(err => {
    const p = projects.get(id);
    if (p) {
      p.status = 'error';
      p.error = err.message;
    }
  });
  
  return id;
}

async function processVideo(id: string): Promise<void> {
  const project = projects.get(id);
  if (!project) throw new Error('Project not found');
  
  try {
    // Step 1: Generate script
    project.status = 'generating_script';
    project.progress = 10;
    project.scenes = await generateScript(project.topic, project.style);
    project.progress = 20;
    
    // Step 2: Generate images for each scene
    project.status = 'generating_images';
    const imageUrls: string[] = [];
    
    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];
      const imageUrl = await generateImage(scene.imagePrompt, project.style);
      imageUrls.push(imageUrl);
      project.progress = 20 + ((i + 1) / project.scenes.length) * 40;
    }
    
    // Step 3: Generate audio
    project.status = 'generating_audio';
    project.progress = 65;
    const fullScript = project.scenes.map(s => s.text).join(' ');
    const audioBuffer = await generateSpeech(fullScript, project.voice);
    project.progress = 80;
    
    // Step 4: Assemble video with FFmpeg
    project.status = 'assembling';
    project.progress = 85;
    
    if (MOCK_MODE) {
      // In mock mode, skip FFmpeg assembly - just use first image as preview
      console.log('[MOCK] Skipping video assembly');
      await delay(2000);
      // Store image URLs for preview carousel
      project.imageUrls = imageUrls;
      project.videoUrl = imageUrls[0]; // First image as placeholder
    } else {
      const scenesWithUrls = project.scenes.map((scene, i) => ({
        imageUrl: imageUrls[i],
        text: scene.text,
        duration: scene.duration,
      }));
      
      // Get music URL if selected
      const musicTrack = getMusicTrack(project.music);
      const musicUrl = musicTrack && musicTrack.id !== 'none' ? musicTrack.url : undefined;
      
      const result = await assembleVideo(scenesWithUrls, audioBuffer, {
        addCaptions: true,
        musicUrl,
        musicVolume: 0.15, // Background music at 15% volume
      });
      
      project.videoUrl = result.videoPath;
    }
    project.progress = 100;
    project.status = 'complete';
    
  } catch (error) {
    project.status = 'error';
    project.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('Video generation error:', error);
  }
}

export function getAllProjects(): VideoProject[] {
  return Array.from(projects.values());
}
