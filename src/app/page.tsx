'use client';

import { useState, useRef, useEffect } from 'react';

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

const ASPECT_RATIOS = [
  { id: '9:16', name: 'TikTok/Reels', desc: '9:16 vertical', width: 1024, height: 1792 },
  { id: '16:9', name: 'YouTube', desc: '16:9 horizontal', width: 1792, height: 1024 },
  { id: '1:1', name: 'Instagram', desc: '1:1 square', width: 1024, height: 1024 },
];

const DURATIONS = [
  { id: 'short', name: '~30s', scenes: 4, desc: '4 scenes' },
  { id: 'medium', name: '~60s', scenes: 6, desc: '6 scenes' },
  { id: 'long', name: '~90s', scenes: 8, desc: '8 scenes' },
];

const CAPTION_STYLES = [
  { id: 'default', name: 'Classic', desc: 'White with shadow', font: 'Arial', color: '#FFFFFF', outline: '#000000', position: 'bottom' },
  { id: 'bold', name: 'Bold', desc: 'Yellow, impactful', font: 'Impact', color: '#FFFF00', outline: '#000000', position: 'bottom' },
  { id: 'minimal', name: 'Minimal', desc: 'Subtle white', font: 'Helvetica', color: '#FFFFFF', outline: 'none', position: 'bottom' },
  { id: 'neon', name: 'Neon', desc: 'Cyan glow', font: 'Arial', color: '#00FFFF', outline: '#FF00FF', position: 'bottom' },
  { id: 'horror', name: 'Horror', desc: 'Red, dripping', font: 'Georgia', color: '#FF0000', outline: '#000000', position: 'center' },
  { id: 'retro', name: 'Retro', desc: 'Orange VHS', font: 'Courier', color: '#FFA500', outline: '#000000', position: 'top' },
];

const TEMPLATES = [
  { 
    id: 'mystery', 
    name: '🔮 Mystery',
    desc: 'Unsolved mysteries & conspiracies',
    style: 'horror',
    voice: 'josh',
    music: 'mysterious',
    captionStyle: 'horror',
    prompt: 'Create a mysterious, suspenseful story about'
  },
  { 
    id: 'facts', 
    name: '🧠 Facts',
    desc: '5 surprising facts format',
    style: 'documentary',
    voice: 'adam',
    music: 'upbeat',
    captionStyle: 'bold',
    prompt: 'List 5 mind-blowing facts about'
  },
  { 
    id: 'story', 
    name: '📖 Story',
    desc: 'Emotional narrative',
    style: 'realistic',
    voice: 'sarah',
    music: 'calm',
    captionStyle: 'minimal',
    prompt: 'Tell an emotional story about'
  },
  { 
    id: 'horror', 
    name: '👻 Horror',
    desc: 'Creepy short horror',
    style: 'horror',
    voice: 'drew',
    music: 'mysterious',
    captionStyle: 'horror',
    prompt: 'Tell a terrifying horror story about'
  },
  { 
    id: 'explainer', 
    name: '💡 Explainer',
    desc: 'How things work',
    style: 'minimalist',
    voice: 'rachel',
    music: 'none',
    captionStyle: 'default',
    prompt: 'Explain in simple terms how'
  },
  { 
    id: 'anime', 
    name: '🎌 Anime',
    desc: 'Epic anime style',
    style: 'anime',
    voice: 'elli',
    music: 'dramatic-orchestral',
    captionStyle: 'neon',
    prompt: 'Create an epic anime-style story about'
  },
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
  const [music, setMusic] = useState('none');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [duration, setDuration] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Script editing state
  const [editableScenes, setEditableScenes] = useState<Scene[] | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // New features
  const [captionStyle, setCaptionStyle] = useState('default');
  const [showHistory, setShowHistory] = useState(false);
  const [videoHistory, setVideoHistory] = useState<Project[]>([]);

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    setStyle(template.style);
    setVoice(template.voice);
    setMusic(template.music);
    setCaptionStyle(template.captionStyle);
    
    // Update topic if empty
    if (!topic.trim()) {
      setTopic(template.prompt + ' ');
    }
  };

  // Save to history when video completes
  const saveToHistory = (completedProject: Project) => {
    setVideoHistory(prev => [completedProject, ...prev].slice(0, 20)); // Keep last 20
    // Also save to localStorage
    try {
      const history = JSON.parse(localStorage.getItem('videoHistory') || '[]');
      history.unshift(completedProject);
      localStorage.setItem('videoHistory', JSON.stringify(history.slice(0, 20)));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  };

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('videoHistory');
      if (saved) {
        setVideoHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  const playVoicePreview = async (voiceId: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      return;
    }
    
    setPlayingVoice(voiceId);
    
    try {
      const audio = new Audio(`/api/voice-preview?voice=${voiceId}`);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingVoice(null);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        setPlayingVoice(null);
        audioRef.current = null;
      };
      
      await audio.play();
    } catch (err) {
      console.error('Failed to play voice preview:', err);
      setPlayingVoice(null);
    }
  };

  // Calculate estimated cost
  const selectedDuration = DURATIONS.find(d => d.id === duration);
  const numScenes = selectedDuration?.scenes || 6;
  const estimatedCost = (0.01 + (numScenes * 0.04) + 0.03).toFixed(2); // Script + images + voice

  // Step 1: Generate script only (for editing)
  const handleGenerateScript = async () => {
    if (!topic.trim()) return;
    
    setScriptLoading(true);
    setEditableScenes(null);
    setProject(null);
    
    const selectedDuration = DURATIONS.find(d => d.id === duration);
    const numScenes = selectedDuration?.scenes || 6;
    
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style, numScenes }),
      });
      
      const data = await res.json();
      if (data.scenes) {
        setEditableScenes(data.scenes);
      } else if (data.error) {
        alert('Failed to generate script: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate script');
    } finally {
      setScriptLoading(false);
    }
  };

  // Step 2: Generate video with edited script
  const handleGenerateVideo = async () => {
    if (!editableScenes || editableScenes.length === 0) return;
    
    setLoading(true);
    setProject(null);
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          style, 
          voice, 
          music, 
          aspectRatio, 
          duration,
          captionStyle,
          scenes: editableScenes // Pass the edited scenes
        }),
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

  // Legacy: Direct generation (skipping script edit)
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setProject(null);
    setEditableScenes(null);
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style, voice, music, aspectRatio, duration, captionStyle }),
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

  // Update a scene's text
  const updateSceneText = (index: number, newText: string) => {
    if (!editableScenes) return;
    const updated = [...editableScenes];
    updated[index] = { ...updated[index], text: newText };
    setEditableScenes(updated);
  };

  // Update a scene's image prompt
  const updateSceneImagePrompt = (index: number, newPrompt: string) => {
    if (!editableScenes) return;
    const updated = [...editableScenes];
    updated[index] = { ...updated[index], imagePrompt: newPrompt };
    setEditableScenes(updated);
  };

  // Delete a scene
  const deleteScene = (index: number) => {
    if (!editableScenes || editableScenes.length <= 2) return; // Keep at least 2 scenes
    setEditableScenes(editableScenes.filter((_, i) => i !== index));
  };

  // Add a new scene
  const addScene = () => {
    if (!editableScenes) return;
    setEditableScenes([
      ...editableScenes,
      { text: 'New scene narration...', imagePrompt: 'Describe the visual for this scene', duration: 5 }
    ]);
  };

  const pollStatus = async (projectId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${projectId}`);
        const data = await res.json();
        setProject(data);
        
        if (data.status === 'complete') {
          setLoading(false);
          saveToHistory(data);
        } else if (data.status === 'error') {
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
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-block mb-4">
            <span className="badge mb-4">✨ AI-Powered Video Creation</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 gradient-text tracking-tight">
            Faceless AI
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Create viral TikTok & YouTube videos in seconds. 
            <span className="text-gray-300"> No camera, no editing—just results.</span>
          </p>
          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mt-6 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-sm transition-all border border-white/10 hover:border-white/20"
          >
            📚 {showHistory ? 'Hide' : 'View'} History {videoHistory.length > 0 && `(${videoHistory.length})`}
          </button>
        </div>

        {/* Video History */}
        {showHistory && videoHistory.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">📚</span> Your Creations
              </h2>
              <span className="text-sm text-gray-400">{videoHistory.length} videos</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {videoHistory.slice(0, 8).map((vid, i) => (
                <div key={i} className="video-preview group cursor-pointer">
                  {vid.videoUrl?.endsWith('.mp4') ? (
                    <video
                      src={vid.videoUrl}
                      className="w-full aspect-[9/16] object-cover rounded-2xl"
                      muted
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                  ) : vid.imageUrls?.[0] ? (
                    <img
                      src={vid.imageUrls[0]}
                      alt="Preview"
                      className="w-full aspect-[9/16] object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="w-full aspect-[9/16] bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center text-4xl">
                      🎬
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex flex-col items-center justify-end p-4 gap-3">
                    {vid.videoUrl?.endsWith('.mp4') && (
                      <a
                        href={vid.videoUrl}
                        download
                        className="w-full py-2.5 bg-white text-black rounded-xl text-sm font-semibold text-center hover:bg-gray-100 transition-colors"
                      >
                        📥 Download
                      </a>
                    )}
                    <span className="text-xs text-gray-300 text-center line-clamp-2">
                      {vid.topic?.slice(0, 40)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold">Quick Start Templates</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className="template-card p-4 rounded-2xl text-left group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{t.name.split(' ')[0]}</div>
                <div className="text-sm font-semibold text-white mb-1">{t.name.split(' ').slice(1).join(' ')}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="section-divider"></div>

        {/* Input Section */}
        <div className="glass-card p-6 sm:p-8 mb-8">
          <label className="block text-xl font-semibold mb-2">
            What's your video about?
          </label>
          <p className="text-gray-400 text-sm mb-4">Enter a topic or click an example below</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {EXAMPLE_TOPICS.slice(0, 3).map((ex, i) => (
              <button
                key={i}
                onClick={() => setTopic(ex)}
                className="text-xs px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-full border border-purple-500/20 hover:border-purple-500/40 transition-all"
              >
                {ex.length > 45 ? ex.slice(0, 45) + '...' : ex}
              </button>
            ))}
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The mysterious disappearance of the Mayan civilization..."
            className="input-glass h-32 resize-none text-lg"
          />

          {/* Style Selection */}
          <div className="mt-8">
            <label className="block text-lg font-semibold mb-4">Visual Style</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`select-btn text-center ${style === s.id ? 'active' : ''}`}
                >
                  <div className="text-3xl mb-2">{s.emoji}</div>
                  <div className="text-sm font-medium">{s.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div className="mt-8">
            <label className="block text-lg font-semibold mb-1">Voice</label>
            <p className="text-gray-400 text-sm mb-4">Click the speaker icon to preview</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VOICES.map((v) => (
                <div
                  key={v.id}
                  className={`select-btn flex items-center justify-between ${voice === v.id ? 'active' : ''}`}
                >
                  <button
                    onClick={() => setVoice(v.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{v.desc}</div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playVoicePreview(v.id);
                    }}
                    className={`ml-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      playingVoice === v.id 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-110' 
                        : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                    }`}
                    title={`Preview ${v.name}'s voice`}
                  >
                    {playingVoice === v.id ? '⏹' : '🔊'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Music & Caption Row */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Music Selection */}
            <div>
              <label className="block text-lg font-semibold mb-4">Background Music</label>
              <div className="grid grid-cols-5 gap-2">
                {MUSIC.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMusic(m.id)}
                    className={`select-btn p-3 text-center ${music === m.id ? 'active' : ''}`}
                  >
                    <div className="text-2xl mb-1">{m.emoji}</div>
                    <div className="text-xs font-medium">{m.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Style */}
            <div>
              <label className="block text-lg font-semibold mb-4">Caption Style</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CAPTION_STYLES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCaptionStyle(c.id)}
                    className={`select-btn p-3 text-center ${captionStyle === c.id ? 'active' : ''}`}
                  >
                    <div 
                      className="text-lg font-bold mb-1"
                      style={{ 
                        color: c.color,
                        textShadow: c.outline !== 'none' ? `2px 2px 0 ${c.outline}` : 'none'
                      }}
                    >
                      Aa
                    </div>
                    <div className="text-xs font-medium">{c.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aspect Ratio & Duration Row */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-lg font-semibold mb-4">Format</label>
              <div className="space-y-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`select-btn w-full text-left ${aspectRatio === ar.id ? 'active' : ''}`}
                  >
                    <div className="font-semibold">{ar.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ar.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-lg font-semibold mb-4">Length</label>
              <div className="space-y-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDuration(d.id)}
                    className={`select-btn w-full text-left ${duration === d.id ? 'active' : ''}`}
                  >
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="mt-8 p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-300 font-medium">Estimated cost</span>
                <div className="text-xs text-gray-500 mt-1">
                  {numScenes} images + voiceover + script
                </div>
              </div>
              <span className="text-3xl font-bold text-green-400">~${estimatedCost}</span>
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGenerateScript}
              disabled={loading || scriptLoading || !topic.trim()}
              className="btn-secondary flex-1 py-4 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scriptLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Writing Script...
                </span>
              ) : '✍️ Generate Script'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || scriptLoading || !topic.trim()}
              className="btn-primary flex-1 py-4 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating Video...
                </span>
              ) : '⚡ Quick Generate'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            💡 <span className="text-gray-400">Generate Script</span> lets you preview and edit before creating
          </p>
        </div>

        {/* Script Editor */}
        {editableScenes && editableScenes.length > 0 && !project && (
          <div className="glass-card p-6 sm:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="text-3xl">📝</span> Edit Your Script
                </h2>
                <p className="text-gray-400 text-sm mt-1">Customize the narration and visuals for each scene</p>
              </div>
              <button
                onClick={addScene}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all border border-white/10 hover:border-white/20"
              >
                + Add Scene
              </button>
            </div>
            
            <div className="space-y-4">
              {editableScenes.map((scene, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-2xl border transition-all ${
                    editingIndex === index 
                      ? 'border-purple-500/50 bg-purple-500/5' 
                      : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-300 font-medium">
                      Scene {index + 1}
                    </span>
                    <button
                      onClick={() => deleteScene(index)}
                      disabled={editableScenes.length <= 2}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title={editableScenes.length <= 2 ? 'Minimum 2 scenes required' : 'Delete scene'}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-300 font-medium block mb-2">🎙️ Narration</label>
                      <textarea
                        value={scene.text}
                        onChange={(e) => updateSceneText(index, e.target.value)}
                        onFocus={() => setEditingIndex(index)}
                        onBlur={() => setEditingIndex(null)}
                        className="input-glass text-sm"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-300 font-medium block mb-2">🎨 Image Prompt</label>
                      <textarea
                        value={scene.imagePrompt}
                        onChange={(e) => updateSceneImagePrompt(index, e.target.value)}
                        onFocus={() => setEditingIndex(index)}
                        onBlur={() => setEditingIndex(null)}
                        className="input-glass text-sm"
                        rows={2}
                        placeholder="Describe what the AI should generate for this scene..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setEditableScenes(null)}
                className="flex-1 py-4 border border-white/20 rounded-2xl hover:bg-white/5 transition-all font-medium"
              >
                ← Back to Settings
              </button>
              <button
                onClick={handleGenerateVideo}
                disabled={loading}
                className="btn-primary flex-1 sm:flex-[2] py-4 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating Video...
                  </span>
                ) : '🎬 Generate Video'}
              </button>
            </div>
          </div>
        )}

        {/* Progress Section */}
        {project && (
          <div className={`glass-card p-6 sm:p-8 mb-8 ${project.status !== 'complete' && project.status !== 'error' ? 'animate-pulse-glow' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                  project.status === 'complete' ? 'bg-green-500/20' : 
                  project.status === 'error' ? 'bg-red-500/20' : 'bg-purple-500/20'
                }`}>
                  {project.status === 'generating_script' && '📝'}
                  {project.status === 'generating_images' && '🎨'}
                  {project.status === 'generating_audio' && '🎙️'}
                  {project.status === 'assembling' && '🎬'}
                  {project.status === 'complete' && '✅'}
                  {project.status === 'error' && '❌'}
                </div>
                <div>
                  <span className="font-semibold text-lg block">
                    {project.status === 'generating_script' && 'Writing script...'}
                    {project.status === 'generating_images' && 'Creating visuals...'}
                    {project.status === 'generating_audio' && 'Recording voiceover...'}
                    {project.status === 'assembling' && 'Assembling video...'}
                    {project.status === 'complete' && 'Your video is ready!'}
                    {project.status === 'error' && 'Something went wrong'}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {project.status !== 'complete' && project.status !== 'error' && 'This usually takes 1-2 minutes'}
                  </span>
                </div>
              </div>
              <span className="text-3xl font-bold text-purple-400">{project.progress}%</span>
            </div>
            
            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full progress-bar transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>

            {project.error && (
              <div className="mt-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300">
                <span className="font-medium">Error: </span>{project.error}
              </div>
            )}

            {project.scenes && project.scenes.length > 0 && project.status !== 'complete' && (
              <div className="mt-6">
                <h3 className="font-semibold mb-4">📜 Generated Script</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {project.scenes.map((scene, i) => (
                    <p key={i} className="p-4 bg-black/30 rounded-xl border border-white/5">
                      <span className="text-purple-400 font-medium mr-2">{i + 1}.</span>
                      {scene.text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {project.videoUrl && project.status === 'complete' && (
              <div className="mt-8">
                <div className="max-w-md mx-auto">
                  {project.videoUrl.endsWith('.mp4') ? (
                    <>
                      <div className="video-preview">
                        <video 
                          src={project.videoUrl} 
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="w-full rounded-2xl shadow-2xl"
                        />
                      </div>
                      <div className="mt-6 space-y-3">
                        <a
                          href={project.videoUrl}
                          download
                          className="block w-full py-4 text-center bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl font-bold text-lg hover:from-green-400 hover:to-emerald-400 transition-all shadow-lg shadow-green-500/20"
                        >
                          📥 Download Video
                        </a>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin + project.videoUrl);
                              alert('Link copied!');
                            }}
                            className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-medium"
                          >
                            📋 Copy Link
                          </button>
                          <a
                            href={`https://twitter.com/intent/tweet?text=Check out this AI-generated video!&url=${encodeURIComponent(window.location.origin + (project.videoUrl || ''))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-medium text-center"
                          >
                            🐦 Share
                          </a>
                        </div>
                        <button
                          onClick={() => {
                            setProject(null);
                            setTopic('');
                            setEditableScenes(null);
                          }}
                          className="w-full py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-all font-medium"
                        >
                          ✨ Create Another Video
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {project.imageUrls && project.imageUrls.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            {project.imageUrls.map((url, i) => (
                              <img 
                                key={i}
                                src={url} 
                                alt={`Scene ${i + 1}`}
                                className="w-full aspect-[9/16] object-cover rounded-2xl"
                              />
                            ))}
                          </div>
                          <div className="p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-200 text-sm">
                            🎭 <span className="font-medium">Demo Mode:</span> Add API keys to generate real videos with AI voiceover
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={project.videoUrl} 
                          alt="Preview" 
                          className="w-full rounded-2xl shadow-2xl"
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
        <div className="mt-16 mb-12">
          <div className="section-divider mb-12"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center p-6 glass-card">
              <div className="text-5xl mb-4 animate-float">🎯</div>
              <h3 className="font-bold text-lg mb-2">Hook-Driven Scripts</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI writes scripts optimized for maximum engagement and watch time
              </p>
            </div>
            <div className="text-center p-6 glass-card" style={{ animationDelay: '0.1s' }}>
              <div className="text-5xl mb-4 animate-float" style={{ animationDelay: '0.2s' }}>🎨</div>
              <h3 className="font-bold text-lg mb-2">Stunning Visuals</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Generated images perfectly match your chosen style and story
              </p>
            </div>
            <div className="text-center p-6 glass-card" style={{ animationDelay: '0.2s' }}>
              <div className="text-5xl mb-4 animate-float" style={{ animationDelay: '0.4s' }}>🚀</div>
              <h3 className="font-bold text-lg mb-2">Fast & Easy</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                From idea to finished video in under 2 minutes
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-500 text-sm">
          <p>Built with AI • No camera required</p>
        </footer>
      </div>
    </main>
  );
}
