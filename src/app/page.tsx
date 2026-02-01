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
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 gradient-text">
            Faceless AI
          </h1>
          <p className="text-xl text-gray-400">
            Create viral TikTok & YouTube videos in seconds. No camera needed.
          </p>
          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all"
          >
            📚 {showHistory ? 'Hide' : 'Show'} History ({videoHistory.length})
          </button>
        </div>

        {/* Video History */}
        {showHistory && videoHistory.length > 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/10">
            <h2 className="text-lg font-bold mb-4">📚 Recent Videos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {videoHistory.slice(0, 8).map((vid, i) => (
                <div key={i} className="relative group">
                  {vid.videoUrl?.endsWith('.mp4') ? (
                    <video
                      src={vid.videoUrl}
                      className="w-full aspect-[9/16] object-cover rounded-lg"
                      muted
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                  ) : vid.imageUrls?.[0] ? (
                    <img
                      src={vid.imageUrls[0]}
                      alt="Preview"
                      className="w-full aspect-[9/16] object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-[9/16] bg-white/10 rounded-lg flex items-center justify-center">
                      🎬
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all rounded-lg flex flex-col items-center justify-center gap-2">
                    {vid.videoUrl?.endsWith('.mp4') && (
                      <a
                        href={vid.videoUrl}
                        download
                        className="px-3 py-1 bg-purple-500 rounded text-sm"
                      >
                        📥 Download
                      </a>
                    )}
                    <span className="text-xs text-gray-300 px-2 text-center">
                      {vid.topic?.slice(0, 30)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/10">
          <h2 className="text-lg font-bold mb-4">⚡ Quick Templates</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className="p-3 rounded-xl border border-white/10 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left"
              >
                <div className="text-xl mb-1">{t.name.split(' ')[0]}</div>
                <div className="text-sm font-medium">{t.name.split(' ').slice(1).join(' ')}</div>
                <div className="text-xs text-gray-400">{t.desc}</div>
              </button>
            ))}
          </div>
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
            <label className="block text-lg font-medium mb-3">Voice <span className="text-sm font-normal text-gray-400">(click 🔊 to preview)</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VOICES.map((v) => (
                <div
                  key={v.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    voice === v.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <button
                    onClick={() => setVoice(v.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-gray-400">{v.desc}</div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playVoicePreview(v.id);
                    }}
                    className={`ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      playingVoice === v.id 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title={`Preview ${v.name}'s voice`}
                  >
                    {playingVoice === v.id ? '⏹' : '🔊'}
                  </button>
                </div>
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

          {/* Caption Style */}
          <div className="mt-6">
            <label className="block text-lg font-medium mb-3">Caption Style</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {CAPTION_STYLES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCaptionStyle(c.id)}
                  className={`p-3 rounded-xl border transition-all ${
                    captionStyle === c.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div 
                    className="text-sm font-bold mb-1"
                    style={{ 
                      color: c.color,
                      textShadow: c.outline !== 'none' ? `2px 2px 0 ${c.outline}` : 'none'
                    }}
                  >
                    Aa
                  </div>
                  <div className="text-xs">{c.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio & Duration Row */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-lg font-medium mb-3">Format</label>
              <div className="space-y-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`w-full p-3 rounded-xl border transition-all text-left ${
                      aspectRatio === ar.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-medium">{ar.name}</div>
                    <div className="text-xs text-gray-400">{ar.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-lg font-medium mb-3">Length</label>
              <div className="space-y-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDuration(d.id)}
                    className={`w-full p-3 rounded-xl border transition-all text-left ${
                      duration === d.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-gray-400">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Estimated cost:</span>
              <span className="text-xl font-bold text-green-400">~${estimatedCost}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {numScenes} images + voiceover + script generation
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleGenerateScript}
              disabled={loading || scriptLoading || !topic.trim()}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-cyan-500 transition-all"
            >
              {scriptLoading ? '✍️ Writing...' : '✍️ Generate Script'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || scriptLoading || !topic.trim()}
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              {loading ? 'Generating...' : '⚡ Quick Generate'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            💡 Use "Generate Script" to preview and edit before creating video
          </p>
        </div>

        {/* Script Editor */}
        {editableScenes && editableScenes.length > 0 && !project && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">📝 Edit Your Script</h2>
              <button
                onClick={addScene}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all"
              >
                + Add Scene
              </button>
            </div>
            
            <div className="space-y-4">
              {editableScenes.map((scene, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${
                    editingIndex === index 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-purple-400 font-medium">Scene {index + 1}</span>
                    <button
                      onClick={() => deleteScene(index)}
                      disabled={editableScenes.length <= 2}
                      className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                      title={editableScenes.length <= 2 ? 'Minimum 2 scenes required' : 'Delete scene'}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Narration</label>
                      <textarea
                        value={scene.text}
                        onChange={(e) => updateSceneText(index, e.target.value)}
                        onFocus={() => setEditingIndex(index)}
                        onBlur={() => setEditingIndex(null)}
                        className="w-full bg-black/30 rounded-lg p-3 text-sm text-white placeholder-gray-500 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Image Prompt</label>
                      <textarea
                        value={scene.imagePrompt}
                        onChange={(e) => updateSceneImagePrompt(index, e.target.value)}
                        onFocus={() => setEditingIndex(index)}
                        onBlur={() => setEditingIndex(null)}
                        className="w-full bg-black/30 rounded-lg p-3 text-sm text-white placeholder-gray-500 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
                        rows={2}
                        placeholder="Describe what the AI should generate for this scene..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditableScenes(null)}
                className="flex-1 py-3 border border-white/20 rounded-xl hover:bg-white/10 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleGenerateVideo}
                disabled={loading}
                className="flex-2 py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                {loading ? 'Generating...' : '🎬 Generate Video'}
              </button>
            </div>
          </div>
        )}

        {/* Progress Section */}
        {project && (
          <div className={`bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 ${project.status !== 'complete' && project.status !== 'error' ? 'animate-pulse-glow' : ''}`}>
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
            
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full progress-bar transition-all duration-500 rounded-full"
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
                        loop
                        playsInline
                        className="w-full rounded-lg shadow-2xl"
                      />
                      <div className="mt-4 space-y-3">
                        <a
                          href={project.videoUrl}
                          download
                          className="block w-full py-3 text-center bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold hover:from-green-500 hover:to-emerald-500 transition-all"
                        >
                          📥 Download Video
                        </a>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(window.location.origin + project.videoUrl)}
                            className="flex-1 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-sm"
                          >
                            📋 Copy Link
                          </button>
                          <a
                            href={`https://twitter.com/intent/tweet?text=Check out this AI-generated video!&url=${encodeURIComponent(window.location.origin + (project.videoUrl || ''))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-sm text-center"
                          >
                            🐦 Share
                          </a>
                        </div>
                        <button
                          onClick={() => {
                            setProject(null);
                            setTopic('');
                          }}
                          className="w-full py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-sm"
                        >
                          ✨ Create Another
                        </button>
                      </div>
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
