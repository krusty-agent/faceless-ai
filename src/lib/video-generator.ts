import OpenAI from 'openai';
import Replicate from 'replicate';
import { v4 as uuidv4 } from 'uuid';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;
let replicate: Replicate | null = null;

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
  scenes: VideoScene[];
  status: 'pending' | 'generating_script' | 'generating_images' | 'generating_audio' | 'assembling' | 'complete' | 'error';
  progress: number;
  videoUrl?: string;
  error?: string;
}

// In-memory storage (replace with DB in production)
const projects = new Map<string, VideoProject>();

export function getProject(id: string): VideoProject | undefined {
  return projects.get(id);
}

export async function generateScript(topic: string, style: string): Promise<VideoScene[]> {
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

export async function generateImage(prompt: string, style: string): Promise<string> {
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
  const mp3 = await getOpenAI().audio.speech.create({
    model: 'tts-1',
    voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
    input: text,
    speed: 1.0,
  });
  
  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer;
}

export async function createVideoProject(topic: string, style: string, voice: string): Promise<string> {
  const id = uuidv4();
  
  const project: VideoProject = {
    id,
    topic,
    style,
    voice,
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
    project.progress = 25;
    
    // Step 2: Generate images for each scene
    project.status = 'generating_images';
    const imageUrls: string[] = [];
    
    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];
      const imageUrl = await generateImage(scene.imagePrompt, project.style);
      imageUrls.push(imageUrl);
      project.progress = 25 + ((i + 1) / project.scenes.length) * 35;
    }
    
    // Step 3: Generate audio
    project.status = 'generating_audio';
    const fullScript = project.scenes.map(s => s.text).join(' ');
    const audioBuffer = await generateSpeech(fullScript, project.voice);
    project.progress = 75;
    
    // Step 4: Assemble video (placeholder - would use FFmpeg)
    project.status = 'assembling';
    project.progress = 90;
    
    // For MVP, we'll just store the assets and assemble client-side
    // or use a service like Creatomate/Shotstack
    project.videoUrl = imageUrls[0]; // Placeholder
    project.progress = 100;
    project.status = 'complete';
    
  } catch (error) {
    project.status = 'error';
    project.error = error instanceof Error ? error.message : 'Unknown error';
  }
}

export function getAllProjects(): VideoProject[] {
  return Array.from(projects.values());
}
