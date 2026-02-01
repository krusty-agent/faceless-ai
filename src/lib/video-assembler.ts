import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface AssemblyScene {
  imageUrl: string;
  text: string;
  duration: number; // seconds
  startTime: number; // when this scene starts in the audio
}

export interface AssemblyResult {
  videoPath: string;
  thumbnailPath?: string;
  duration: number;
}

export interface CaptionStyleConfig {
  font: string;
  color: string;
  outline: string;
  position: 'top' | 'center' | 'bottom';
}

export const CAPTION_STYLES: Record<string, CaptionStyleConfig> = {
  default: { font: 'Arial', color: '#FFFFFF', outline: '#000000', position: 'bottom' },
  bold: { font: 'Impact', color: '#FFFF00', outline: '#000000', position: 'bottom' },
  minimal: { font: 'Helvetica', color: '#FFFFFF', outline: 'none', position: 'bottom' },
  neon: { font: 'Arial', color: '#00FFFF', outline: '#FF00FF', position: 'bottom' },
  horror: { font: 'Georgia', color: '#FF0000', outline: '#000000', position: 'center' },
  retro: { font: 'Courier', color: '#FFA500', outline: '#000000', position: 'top' },
};

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destPath, buffer);
}

/**
 * Calculate scene timing based on text length and audio duration
 */
function calculateSceneTiming(scenes: { text: string; duration: number }[], totalAudioDuration: number): AssemblyScene[] {
  // Estimate word-based timing
  const totalWords = scenes.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0);
  const wordsPerSecond = totalWords / totalAudioDuration;
  
  let currentTime = 0;
  return scenes.map(scene => {
    const wordCount = scene.text.split(/\s+/).length;
    const estimatedDuration = Math.max(2, wordCount / wordsPerSecond);
    
    const result = {
      imageUrl: '', // Will be filled in
      text: scene.text,
      duration: estimatedDuration,
      startTime: currentTime,
    };
    
    currentTime += estimatedDuration;
    return result;
  });
}

/**
 * Convert hex color to ASS color format (&HAABBGGRR)
 */
function hexToAssColor(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  // Convert RGB to BGR for ASS format
  const r = hex.substring(0, 2);
  const g = hex.substring(2, 4);
  const b = hex.substring(4, 6);
  return `&H00${b}${g}${r}`.toUpperCase();
}

/**
 * Get alignment value for ASS (numpad style: 1-9)
 */
function getAlignment(position: 'top' | 'center' | 'bottom'): number {
  switch (position) {
    case 'top': return 8; // Top center
    case 'center': return 5; // Middle center
    case 'bottom': return 2; // Bottom center
  }
}

/**
 * Generate ASS subtitle file for captions
 */
function generateSubtitles(scenes: AssemblyScene[], captionStyle: string = 'default'): string {
  const style = CAPTION_STYLES[captionStyle] || CAPTION_STYLES.default;
  
  const primaryColor = hexToAssColor(style.color);
  const outlineColor = style.outline === 'none' ? '&H00000000' : hexToAssColor(style.outline);
  const outlineWidth = style.outline === 'none' ? 0 : 4;
  const alignment = getAlignment(style.position);
  const marginV = style.position === 'center' ? 0 : 80;
  
  const header = `[Script Info]
Title: AI Generated Video
ScriptType: v4.00+
PlayDepth: 0
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.font},72,${primaryColor},&H000000FF,${outlineColor},&H80000000,-1,0,0,0,100,100,0,0,1,${outlineWidth},2,${alignment},40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = scenes.map(scene => {
    const start = formatAssTime(scene.startTime);
    const end = formatAssTime(scene.startTime + scene.duration);
    // Escape special characters and add word wrapping
    const text = scene.text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
  });

  return header + events.join('\n');
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

/**
 * Assemble video from images + audio using FFmpeg
 */
export async function assembleVideo(
  scenes: { imageUrl: string; text: string; duration: number }[],
  audioBuffer: Buffer,
  options: {
    width?: number;
    height?: number;
    outputPath?: string;
    addCaptions?: boolean;
    captionStyle?: string;
    musicUrl?: string;
    musicVolume?: number; // 0.0 to 1.0
    generateThumbnail?: boolean;
  } = {}
): Promise<AssemblyResult> {
  const {
    width = 1080,
    height = 1920,
    addCaptions = true,
    captionStyle = 'default',
    musicUrl,
    musicVolume = 0.2, // Background music at 20% volume by default
    generateThumbnail = true,
  } = options;

  // Create temp directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faceless-'));
  const outputDir = path.join(process.cwd(), 'public', 'videos');
  await fs.mkdir(outputDir, { recursive: true });
  
  const outputFilename = `video-${Date.now()}.mp4`;
  const outputPath = options.outputPath || path.join(outputDir, outputFilename);

  try {
    // 1. Save audio file
    const audioPath = path.join(tempDir, 'audio.mp3');
    await fs.writeFile(audioPath, audioBuffer);

    // 2. Get audio duration
    const { stdout: durationOut } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${audioPath}"`
    );
    const audioDuration = parseFloat(durationOut.trim());

    // 3. Calculate scene timing based on audio duration
    const timedScenes = calculateSceneTiming(scenes, audioDuration);

    // 4. Download and process images
    const imageFiles: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const imagePath = path.join(tempDir, `image-${i.toString().padStart(3, '0')}.webp`);
      await downloadFile(scenes[i].imageUrl, imagePath);
      
      // Convert to properly sized PNG for FFmpeg
      const pngPath = path.join(tempDir, `image-${i.toString().padStart(3, '0')}.png`);
      await execAsync(
        `ffmpeg -y -i "${imagePath}" -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black" "${pngPath}"`
      );
      imageFiles.push(pngPath);
      timedScenes[i].imageUrl = pngPath;
    }

    // 5. Create subtitle file if needed
    let subtitlePath = '';
    if (addCaptions) {
      subtitlePath = path.join(tempDir, 'captions.ass');
      const subtitles = generateSubtitles(timedScenes, captionStyle);
      await fs.writeFile(subtitlePath, subtitles);
    }

    // 6. Create FFmpeg concat input file
    const concatPath = path.join(tempDir, 'concat.txt');
    const concatContent = timedScenes.map((scene, i) => 
      `file '${imageFiles[i]}'\nduration ${scene.duration}`
    ).join('\n') + `\nfile '${imageFiles[imageFiles.length - 1]}'`; // Last image repeated for concat demuxer
    await fs.writeFile(concatPath, concatContent);

    // 7. Download and prepare background music if provided
    let musicPath = '';
    if (musicUrl) {
      musicPath = path.join(tempDir, 'music.mp3');
      await downloadFile(musicUrl, musicPath);
    }

    // 8. Assemble video with FFmpeg
    let filterComplex = `[0:v]fps=30[v]`;
    if (addCaptions) {
      filterComplex = `[0:v]fps=30,ass='${subtitlePath.replace(/'/g, "'\\''")}'[v]`;
    }

    // Build audio filter for mixing voice + music
    let audioFilter = '';
    let audioMap = '-map 1:a';
    
    if (musicPath) {
      // Mix voice (at full volume) with music (at musicVolume)
      // Voice is input 1, music is input 2
      const voiceVol = 1.0;
      const musicVol = musicVolume;
      audioFilter = `-filter_complex "[1:a]volume=${voiceVol}[voice];[2:a]volume=${musicVol}[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]"`;
      audioMap = '-map "[aout]"';
    }

    const ffmpegCmd = [
      'ffmpeg -y',
      `-f concat -safe 0 -i "${concatPath}"`,
      `-i "${audioPath}"`,
      musicPath ? `-i "${musicPath}"` : '',
      musicPath ? audioFilter : `-filter_complex "${filterComplex}"`,
      musicPath ? `-filter_complex "${filterComplex}"` : '',
      '-map "[v]"',
      audioMap,
      '-c:v libx264 -preset fast -crf 23',
      '-c:a aac -b:a 192k',
      '-movflags +faststart',
      '-t', audioDuration.toString(),
      `"${outputPath}"`
    ].filter(Boolean).join(' ');

    await execAsync(ffmpegCmd);

    // Generate thumbnail from first frame
    let thumbnailPath: string | undefined;
    if (generateThumbnail) {
      try {
        const thumbnailFilename = `thumb-${Date.now()}.jpg`;
        const thumbnailFullPath = path.join(outputDir, thumbnailFilename);
        await execAsync(
          `ffmpeg -y -i "${outputPath}" -ss 00:00:01 -vframes 1 -q:v 2 "${thumbnailFullPath}"`
        );
        thumbnailPath = `/videos/${thumbnailFilename}`;
      } catch (e) {
        console.error('Failed to generate thumbnail:', e);
      }
    }

    return {
      videoPath: `/videos/${outputFilename}`,
      thumbnailPath,
      duration: audioDuration,
    };

  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Simpler version: Create video from images without audio (for testing)
 */
export async function createSlideshow(
  imageUrls: string[],
  durationPerImage: number = 3
): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'slideshow-'));
  const outputDir = path.join(process.cwd(), 'public', 'videos');
  await fs.mkdir(outputDir, { recursive: true });
  
  const outputFilename = `slideshow-${Date.now()}.mp4`;
  const outputPath = path.join(outputDir, outputFilename);

  try {
    // Download images
    for (let i = 0; i < imageUrls.length; i++) {
      const imagePath = path.join(tempDir, `img-${i.toString().padStart(3, '0')}.png`);
      await downloadFile(imageUrls[i], imagePath);
    }

    // Create concat file
    const concatPath = path.join(tempDir, 'concat.txt');
    const files = await fs.readdir(tempDir);
    const pngFiles = files.filter(f => f.endsWith('.png')).sort();
    
    const concatContent = pngFiles.map(f => 
      `file '${path.join(tempDir, f)}'\nduration ${durationPerImage}`
    ).join('\n') + `\nfile '${path.join(tempDir, pngFiles[pngFiles.length - 1])}'`;
    
    await fs.writeFile(concatPath, concatContent);

    // Create video
    await execAsync(
      `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,fps=30" -c:v libx264 -preset fast -crf 23 "${outputPath}"`
    );

    return `/videos/${outputFilename}`;

  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  }
}
