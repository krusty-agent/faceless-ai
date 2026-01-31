import { NextRequest, NextResponse } from 'next/server';
import { createVideoProject } from '@/lib/video-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, style = 'realistic', voice = 'alloy' } = body;
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }
    
    const projectId = await createVideoProject(topic, style, voice);
    
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
