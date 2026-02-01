import { NextRequest, NextResponse } from 'next/server';
import { createVideoProject, VideoScene } from '@/lib/video-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      topic, 
      style = 'realistic', 
      voice = 'rachel', 
      music = 'none',
      aspectRatio = '9:16',
      duration = 'medium',
      captionStyle = 'default',
      scenes // Optional: pre-made scenes from script editor
    } = body;
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }
    
    // Validate scenes if provided
    const validatedScenes: VideoScene[] | undefined = scenes ? 
      scenes.map((s: { text: string; imagePrompt: string; duration?: number }) => ({
        text: s.text,
        imagePrompt: s.imagePrompt,
        duration: s.duration || 6
      })) : undefined;
    
    const projectId = await createVideoProject(
      topic, 
      style, 
      voice, 
      music, 
      aspectRatio, 
      duration,
      captionStyle,
      validatedScenes
    );
    
    return NextResponse.json({ 
      success: true, 
      projectId,
      message: 'Video generation started'
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to start video generation' },
      { status: 500 }
    );
  }
}
