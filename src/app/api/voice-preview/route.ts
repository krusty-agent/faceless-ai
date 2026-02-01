import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// ElevenLabs voice IDs
const ELEVENLABS_VOICES: Record<string, string> = {
  'rachel': '21m00Tcm4TlvDq8ikWAM',
  'drew': '29vD33N1CtxCmqQRPOHJ',
  'sarah': 'EXAVITQu4vr4xnSDxMaL',
  'josh': 'TxGEqnHWrfWFTfGW9XjX',
  'adam': 'pNInz6obpgDQGcFmaJgB',
  'elli': 'MF3mGyEYCl7XYWbV9V6O',
};

const PREVIEW_TEXT = "This is how your video will sound. Pretty cool, right?";

// Cache previews in memory (they don't change)
const previewCache = new Map<string, Buffer>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const voice = searchParams.get('voice') || 'rachel';
  
  const voiceId = ELEVENLABS_VOICES[voice];
  if (!voiceId) {
    return NextResponse.json({ error: 'Invalid voice' }, { status: 400 });
  }

  // Check cache first
  if (previewCache.has(voice)) {
    const cached = previewCache.get(voice)!;
    return new NextResponse(new Uint8Array(cached), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24h
      },
    });
  }

  // Check if we have API key
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'Voice preview unavailable in demo mode' }, { status: 503 });
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: PREVIEW_TEXT,
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
    
    const buffer = Buffer.concat(chunks);
    
    // Cache for future requests
    previewCache.set(voice, buffer);
    
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Voice preview error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
