// Royalty-free background music options
// These are public domain / CC0 tracks from various sources

export interface MusicTrack {
  id: string;
  name: string;
  description: string;
  url: string;
  duration: number; // seconds
  mood: 'dramatic' | 'upbeat' | 'mysterious' | 'calm' | 'none';
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'none',
    name: 'No Music',
    description: 'Voice only',
    url: '',
    duration: 0,
    mood: 'none',
  },
  {
    id: 'dramatic-orchestral',
    name: 'Epic Journey',
    description: 'Cinematic orchestral',
    // Using a public domain orchestral piece
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d1718ab41b.mp3',
    duration: 120,
    mood: 'dramatic',
  },
  {
    id: 'mysterious',
    name: 'Dark Secrets',
    description: 'Mysterious ambient',
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946276e959.mp3',
    duration: 150,
    mood: 'mysterious',
  },
  {
    id: 'upbeat',
    name: 'Energy Rise',
    description: 'Motivational electronic',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    duration: 100,
    mood: 'upbeat',
  },
  {
    id: 'calm',
    name: 'Gentle Flow',
    description: 'Peaceful piano',
    url: 'https://cdn.pixabay.com/audio/2022/01/27/audio_15bd58c2cf.mp3',
    duration: 180,
    mood: 'calm',
  },
];

export function getMusicTrack(id: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find(track => track.id === id);
}

export function getMusicForStyle(style: string): MusicTrack[] {
  // Suggest music based on video style
  const styleMoodMap: Record<string, MusicTrack['mood'][]> = {
    'realistic': ['calm', 'dramatic'],
    'anime': ['upbeat', 'dramatic'],
    'horror': ['mysterious', 'dramatic'],
    'documentary': ['calm', 'dramatic'],
    'fantasy': ['dramatic', 'mysterious'],
    'minimalist': ['calm'],
  };
  
  const moods = styleMoodMap[style] || ['calm', 'dramatic'];
  return MUSIC_TRACKS.filter(t => t.mood === 'none' || moods.includes(t.mood));
}
