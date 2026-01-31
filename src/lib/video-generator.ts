import OpenAI from 'openai';
import Replicate from 'replicate';
import { v4 as uuidv4 } from 'uuid';
import { assembleVideo } from './video-assembler';
import { getMusicTrack } from './music';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;
let replicate: Replicate | null = null;

const MOCK_MODE = process.env.MOCK_MODE === 'true' || (!process.env.OPENAI_API_KEY && !process.env.REPLICATE_API_TOKEN);

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function getReplicate(): Replicate {
  if (!replicate) {
    replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  }
  return replicate;
}

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

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a viral video scriptwriter. Create engaging, hook-driven scripts for short-form video content.
        
Style: ${style}

Output a JSON array of 5-8 scenes. Each scene should be 5-10 seconds of narration.
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
- Total video should be 45-60 seconds`
      },
      {
        role: 'user',
        content: `Create a viral short video script about: ${topic}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No script generated');
  
  const parsed = JSON.parse(content);
  return parsed.scenes || parsed;
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
  
  const output = await getReplicate().run(
    "black-forest-labs/flux-schnell",
    {
      input: {
        prompt: styledPrompt,
        num_outputs: 1,
        aspect_ratio: "9:16", // Vertical for TikTok/Shorts
        output_format: "webp",
        output_quality: 90,
      }
    }
  );
  
  // Flux returns an array of URLs
  const urls = output as string[];
  return urls[0];
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

export async function generateSpeech(text: string, voice: string = 'alloy'): Promise<Buffer> {
  if (MOCK_MODE) {
    console.log('[MOCK] Generating speech for:', text.slice(0, 50));
    await delay(1500);
    // Return a minimal valid MP3 (silent 1-second audio)
    // This is a tiny valid MP3 header + silence
    const silentMp3 = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    // Repeat to make ~30 seconds of "audio" at low bitrate
    const chunks = Array(500).fill(silentMp3);
    return Buffer.concat(chunks);
  }

  const mp3 = await getOpenAI().audio.speech.create({
    model: 'tts-1',
    voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
    input: text,
    speed: 1.0,
  });
  
  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer;
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
