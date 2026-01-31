import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/video-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = getProject(params.id);
  
  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(project);
}
