'use client';

import { useState } from 'react';

const EXAMPLE_TOPICS = [
  "The mysterious disappearance of the Mayan civilization",
  "5 psychological tricks that stores use to make you buy more",
  "What would happen if the Moon disappeared tonight",
  "The terrifying last hours of Pompeii",
  "Why you should NEVER swim in these lakes",
  "The real reason why ancient Egyptians were obsessed with cats",
];

const STYLES = [
  { id: 'realistic', name: 'Realistic', emoji: '📸' },
  { id: 'anime', name: 'Anime', emoji: '🎌' },
  { id: 'horror', name: 'Horror', emoji: '👻' },
  { id: 'documentary', name: 'Documentary', emoji: '🎬' },
  { id: 'fantasy', name: 'Fantasy', emoji: '✨' },
  { id: 'minimalist', name: 'Minimalist', emoji: '⬜' },
];

const VOICES = [
  { id: 'rachel', name: 'Rachel', desc: 'Calm F' },
  { id: 'drew', name: 'Drew', desc: 'Confident M' },
  { id: 'sarah', name: 'Sarah', desc: 'Soft F' },
  { id: 'josh', name: 'Josh', desc: 'Deep M' },
  { id: 'adam', name: 'Adam', desc: 'Narrator M' },
  { id: 'elli', name: 'Elli', desc: 'Emotional F' },
];

const MUSIC = [
  { id: 'none', name: 'No Music', emoji: '🔇' },
  { id: 'dramatic-orchestral', name: 'Epic', emoji: '🎬' },
  { id: 'mysterious', name: 'Dark', emoji: '🌙' },
  { id: 'upbeat', name: 'Energy', emoji: '⚡' },
  { id: 'calm', name: 'Gentle', emoji: '🌊' },
];

interface Project {
  id: string;
  status: string;
  progress: number;
  scenes?: { text: string; imagePrompt: string }[];
  videoUrl?: string;
  imageUrls?: string[];
  error?: string;
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('realistic');
  const [voice, setVoice] = useState('rachel');
  const [music, setMusic] = useState('none');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setProject(null);
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style, voice, music }),
      });
      
      const data = await res.json();
      if (data.projectId) {
        pollStatus(data.projectId);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const pollStatus = async (projectId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${projectId}`);
        const data = await res.json();
        setProject(data);
        
        if (data.status === 'complete' || data.status === 'error') {
          setLoading(false);
        } else {
          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    poll();
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 gradient-text">
            Faceless AI
          </h1>
          <p className="text-xl text-gray-400">
            Create viral TikTok & YouTube videos in seconds. No camera needed.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/10">
          <label className="block text-lg font-medium mb-3">
            What's your video about?
          </label>
          <div className="mb-3 flex flex-wrap gap-2">
            {EXAMPLE_TOPICS.slice(0, 3).map((ex, i) => (
              <button
                key={i}
                onClick={() => setTopic(ex)}
                className="text-xs px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-full border border-purple-500/30 transition-all"
              >
                {ex.length > 40 ? ex.slice(0, 40) + '...' : ex}
              </button>
            ))}
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The mysterious disappearance of the Mayan civilization..."
            className="w-full h-32 bg-black/30 rounded-xl p-4 text-white placeholder-gray-500 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
          />

          {/* Style Selection */}
          <div className="mt-6">
            <label className="block text-lg font-medium mb-3">Style</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-3 rounded-xl border transition-all ${
                    style === s.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className="text-sm">{s.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div className="mt-6">
            <label className="block text-lg font-medium mb-3">Voice</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  className={`p-3 rounded-xl border transition-all ${
                    voice === v.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-gray-400">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Music Selection */}
          <div className="mt-6">
            <label className="block text-lg font-medium mb-3">Background Music</label>
            <div className="grid grid-cols-5 gap-3">
              {MUSIC.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMusic(m.id)}
                  className={`p-3 rounded-xl border transition-all ${
                    music === m.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="text-2xl mb-1">{m.emoji}</div>
                  <div className="text-xs">{m.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="mt-8 w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            {loading ? 'Generating...' : '✨ Generate Video'}
          </button>
        </div>

        {/* Progress Section */}
        {project && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">
                {project.status === 'generating_script' && '📝 Writing script...'}
                {project.status === 'generating_images' && '🎨 Creating visuals...'}
                {project.status === 'generating_audio' && '🎙️ Recording voiceover...'}
                {project.status === 'assembling' && '🎬 Assembling video...'}
                {project.status === 'complete' && '✅ Complete!'}
                {project.status === 'error' && '❌ Error'}
              </span>
              <span className="text-purple-400">{project.progress}%</span>
            </div>
            
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>

            {project.error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                {project.error}
              </div>
            )}

            {project.scenes && project.scenes.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-3">Generated Script:</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {project.scenes.map((scene, i) => (
                    <p key={i} className="p-3 bg-black/20 rounded-lg">
                      {scene.text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {project.videoUrl && (
              <div className="mt-6">
                <h3 className="font-medium mb-3">
                  {project.videoUrl.endsWith('.mp4') ? 'Your Video:' : 'Preview (Demo Mode):'}
                </h3>
                <div className="max-w-sm mx-auto">
                  {project.videoUrl.endsWith('.mp4') ? (
                    <>
                      <video 
                        src={project.videoUrl} 
                        controls
                        autoPlay
                        className="w-full rounded-lg shadow-2xl"
                      />
                      <a
                        href={project.videoUrl}
                        download
                        className="mt-4 block w-full py-3 text-center bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold hover:from-green-500 hover:to-emerald-500 transition-all"
                      >
                        📥 Download Video
                      </a>
                    </>
                  ) : (
                    <>
                      {project.imageUrls && project.imageUrls.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            {project.imageUrls.map((url, i) => (
                              <img 
                                key={i}
                                src={url} 
                                alt={`Scene ${i + 1}`}
                                className="w-full aspect-[9/16] object-cover rounded-lg"
                              />
                            ))}
                          </div>
                          <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm">
                            🎭 Demo Mode: Add API keys to generate real videos with AI voiceover
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={project.videoUrl} 
                          alt="Preview" 
                          className="w-full rounded-lg shadow-2xl"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold mb-2">Hook-Driven</h3>
            <p className="text-gray-400 text-sm">
              AI writes scripts optimized for engagement
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="font-bold mb-2">Stunning Visuals</h3>
            <p className="text-gray-400 text-sm">
              Generated images match your style perfectly
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="font-bold mb-2">Fast & Easy</h3>
            <p className="text-gray-400 text-sm">
              From idea to video in under 2 minutes
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
