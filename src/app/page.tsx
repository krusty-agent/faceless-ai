'use client';

import { useState, useRef, useEffect } from 'react';

const EXAMPLE_TOPICS = [
  "The mysterious disappearance of the Mayan civilization",
  "5 psychological tricks stores use to make you spend more",
  "What would happen if the Moon disappeared tonight",
];

const STYLES = [
  { id: 'realistic', name: 'Cinematic', emoji: '🎬' },
  { id: 'anime', name: 'Anime', emoji: '🎌' },
  { id: 'horror', name: 'Dark', emoji: '🌙' },
  { id: 'documentary', name: 'Documentary', emoji: '📹' },
  { id: 'fantasy', name: 'Fantasy', emoji: '✨' },
  { id: 'minimalist', name: 'Minimal', emoji: '◻️' },
];

const VOICES = [
  { id: 'rachel', name: 'Rachel', desc: 'Calm & Clear', gender: 'F' },
  { id: 'drew', name: 'Drew', desc: 'Confident', gender: 'M' },
  { id: 'sarah', name: 'Sarah', desc: 'Warm & Soft', gender: 'F' },
  { id: 'josh', name: 'Josh', desc: 'Deep & Rich', gender: 'M' },
  { id: 'adam', name: 'Adam', desc: 'Narrator', gender: 'M' },
  { id: 'elli', name: 'Elli', desc: 'Emotional', gender: 'F' },
];

const TEMPLATES = [
  { id: 'mystery', name: 'Mystery', emoji: '🔮', style: 'horror', voice: 'josh', desc: 'Unsolved & Creepy' },
  { id: 'facts', name: 'Facts', emoji: '🧠', style: 'documentary', voice: 'adam', desc: 'Listicle Format' },
  { id: 'story', name: 'Story', emoji: '📖', style: 'realistic', voice: 'sarah', desc: 'Emotional Tale' },
  { id: 'horror', name: 'Horror', emoji: '👻', style: 'horror', voice: 'drew', desc: 'Terrifying' },
];

const DURATIONS = [
  { id: 'short', name: '30s', scenes: 4 },
  { id: 'medium', name: '60s', scenes: 6 },
  { id: 'long', name: '90s', scenes: 8 },
];

interface Scene {
  text: string;
  imagePrompt: string;
  duration?: number;
}

interface Project {
  id: string;
  status: string;
  progress: number;
  topic?: string;
  scenes?: Scene[];
  videoUrl?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  error?: string;
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('realistic');
  const [voice, setVoice] = useState('rachel');
  const [duration, setDuration] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [videoHistory, setVideoHistory] = useState<Project[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('videoHistory');
      if (saved) setVideoHistory(JSON.parse(saved));
    } catch (e) { console.error(e); }
  }, []);

  const saveToHistory = (completedProject: Project) => {
    const updated = [completedProject, ...videoHistory].slice(0, 10);
    setVideoHistory(updated);
    try { localStorage.setItem('videoHistory', JSON.stringify(updated)); } catch (e) { console.error(e); }
  };

  const playVoicePreview = async (voiceId: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingVoice === voiceId) { setPlayingVoice(null); return; }
    setPlayingVoice(voiceId);
    try {
      const audio = new Audio(`/api/voice-preview?voice=${voiceId}`);
      audioRef.current = audio;
      audio.onended = () => { setPlayingVoice(null); audioRef.current = null; };
      audio.onerror = () => { setPlayingVoice(null); audioRef.current = null; };
      await audio.play();
    } catch (err) { console.error(err); setPlayingVoice(null); }
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setStyle(t.style);
    setVoice(t.voice);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setProject(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style, voice, music: 'none', aspectRatio: '9:16', duration, captionStyle: 'bold' }),
      });
      const data = await res.json();
      if (data.projectId) pollStatus(data.projectId);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const pollStatus = async (projectId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${projectId}`);
        const data = await res.json();
        setProject(data);
        if (data.status === 'complete') { setLoading(false); saveToHistory(data); }
        else if (data.status === 'error') { setLoading(false); }
        else { setTimeout(poll, 2000); }
      } catch (err) { console.error(err); setLoading(false); }
    };
    poll();
  };

  const selectedDuration = DURATIONS.find(d => d.id === duration);
  const numScenes = selectedDuration?.scenes || 6;
  const estimatedCost = (0.01 + (numScenes * 0.04) + 0.03).toFixed(2);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 relative z-10">
        
        {/* Hero */}
        <header className="text-center mb-16">
          <div className="tag mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-orange)] animate-pulse" />
            AI-Powered Video Creation
          </div>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-extrabold mb-6 tracking-tight">
            Make Videos<br />
            <span className="gradient-text">Without a Camera</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg sm:text-xl max-w-xl mx-auto">
            Turn any idea into a viral TikTok or YouTube Short. Script, visuals, and voice—all AI generated.
          </p>
        </header>

        {/* Stats bar */}
        <div className="flex justify-center gap-8 sm:gap-16 mb-16 text-center">
          <div>
            <div className="counter">2M+</div>
            <div className="text-[var(--text-secondary)] text-sm mt-1">Videos Made</div>
          </div>
          <div>
            <div className="counter">&lt;2m</div>
            <div className="text-[var(--text-secondary)] text-sm mt-1">Per Video</div>
          </div>
          <div>
            <div className="counter">$0.30</div>
            <div className="text-[var(--text-secondary)] text-sm mt-1">Avg Cost</div>
          </div>
        </div>

        {/* Templates */}
        <section className="mb-12">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-4">Quick Start</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => applyTemplate(t)} className="template-card text-left">
                <div className="text-4xl mb-3">{t.emoji}</div>
                <div className="font-semibold text-lg">{t.name}</div>
                <div className="text-[var(--text-secondary)] text-sm">{t.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Main editor */}
        <div className="bento-card p-6 sm:p-10 mb-8">
          
          {/* Topic input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Your Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What's your video about?"
              className="input-dark h-28 resize-none"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {EXAMPLE_TOPICS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(ex)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-all"
                >
                  {ex.slice(0, 40)}...
                </button>
              ))}
            </div>
          </div>

          {/* Bento grid options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Visual Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`option-pill text-center ${style === s.id ? 'active' : ''}`}
                  >
                    <div className="text-2xl mb-1">{s.emoji}</div>
                    <div className="text-sm font-medium">{s.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Video Length
              </label>
              <div className="flex gap-3">
                {DURATIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDuration(d.id)}
                    className={`option-pill flex-1 flex items-center justify-between ${duration === d.id ? 'active' : ''}`}
                  >
                    <div>
                      <div className="font-semibold text-lg">~{d.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{d.scenes} scenes</div>
                    </div>
                    <div className="option-indicator" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Voices */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Voice — <span className="normal-case">tap to preview</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VOICES.map((v) => (
                <div
                  key={v.id}
                  className={`voice-card flex items-center justify-between ${voice === v.id ? 'active' : ''}`}
                  onClick={() => setVoice(v.id)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{v.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-dark)] text-[var(--text-secondary)]">{v.gender}</span>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">{v.desc}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); playVoicePreview(v.id); }}
                    className={`play-btn ${playingVoice === v.id ? 'playing' : ''}`}
                  >
                    {playingVoice === v.id ? '⏹' : '▶'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Generate section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-[var(--border-subtle)]">
            <div className="flex-1 text-center sm:text-left">
              <div className="text-[var(--text-secondary)] text-sm">Estimated cost</div>
              <div className="text-3xl font-bold text-[var(--accent-orange)]">~${estimatedCost}</div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="btn-fire w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>🔥 Generate Video</>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Progress / Result */}
        {project && (
          <div className="bento-card p-6 sm:p-10 mb-8">
            {project.status !== 'complete' && project.status !== 'error' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className={`status-badge ${project.status === 'error' ? 'error' : 'working'}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {project.status === 'generating_script' && 'Writing script...'}
                    {project.status === 'generating_images' && 'Creating visuals...'}
                    {project.status === 'generating_audio' && 'Recording voice...'}
                    {project.status === 'assembling' && 'Assembling video...'}
                  </div>
                  <span className="text-3xl font-bold">{project.progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
              </>
            )}

            {project.status === 'error' && (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">😕</div>
                <div className="text-xl font-semibold mb-2">Something went wrong</div>
                <div className="text-[var(--text-secondary)]">{project.error}</div>
              </div>
            )}

            {project.status === 'complete' && project.videoUrl && (
              <div className="text-center">
                <div className="status-badge done mb-6 inline-flex">
                  <span>✓</span> Video Ready
                </div>
                <div className="max-w-sm mx-auto">
                  {project.videoUrl.endsWith('.mp4') ? (
                    <div className="video-result">
                      <video src={project.videoUrl} controls autoPlay loop playsInline className="rounded-t-2xl" />
                      <div className="p-5">
                        <a href={project.videoUrl} download className="btn-fire w-full block text-center mb-3">
                          <span>📥 Download Video</span>
                        </a>
                        <button onClick={() => { setProject(null); setTopic(''); }} className="btn-ghost w-full">
                          Create Another
                        </button>
                      </div>
                    </div>
                  ) : project.imageUrls && project.imageUrls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {project.imageUrls.map((url, i) => (
                        <img key={i} src={url} alt={`Scene ${i + 1}`} className="w-full aspect-[9/16] object-cover rounded-xl" />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {videoHistory.length > 0 && !project && (
          <section className="mb-12">
            <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-4">Recent Creations</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {videoHistory.slice(0, 5).map((vid, i) => (
                <a
                  key={i}
                  href={vid.videoUrl}
                  download
                  className="block aspect-[9/16] rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-orange)] transition-all group"
                >
                  {vid.videoUrl?.endsWith('.mp4') ? (
                    <video src={vid.videoUrl} className="w-full h-full object-cover" muted playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                  ) : vid.imageUrls?.[0] ? (
                    <img src={vid.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-12 border-t border-[var(--border-subtle)]">
          <p className="text-[var(--text-secondary)]">
            Built for creators who move fast ⚡
          </p>
        </footer>
      </div>
    </main>
  );
}
