# Faceless AI

Create viral TikTok & YouTube videos with AI. No camera, no editing, just results.

![Demo](https://placehold.co/600x400/1a1a2e/ffffff?text=Faceless+AI)

## Features

- 🎯 **AI Script Writing** - Hook-driven scripts optimized for engagement (GPT-4o-mini)
- 🎨 **AI Image Generation** - Stunning visuals with Flux Schnell (9:16 vertical)
- 🎙️ **AI Voiceover** - Natural-sounding voices with OpenAI TTS (6 voices)
- 🎬 **Auto Video Assembly** - FFmpeg-based stitching with captions
- ⚡ **Fast** - From idea to video in under 2 minutes

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **AI Models:** OpenAI GPT-4o-mini + TTS, Replicate Flux Schnell
- **Video:** FFmpeg for assembly, ASS subtitles for captions
- **State:** In-memory (swap for Redis/DB in production)

## Getting Started

### 1. Clone & Install

```bash
git clone <repo>
cd storyshort-clone
npm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

```env
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
```

**Don't have API keys?** The app works in demo mode with mock data!

### 3. Install FFmpeg (required for video assembly)

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (via chocolatey)
choco install ffmpeg
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🚀

## How It Works

1. **Enter topic** → "The mysterious disappearance of the Mayan civilization"
2. **Pick style** → Documentary, Horror, Anime, Fantasy, etc.
3. **Choose voice** → Alloy, Nova, Onyx, Echo, Fable, Shimmer
4. **Generate** → AI writes script, generates images, records voiceover
5. **Download** → Get your finished MP4 video with captions!

## API Endpoints

### POST `/api/generate`

Start video generation:

```json
{
  "topic": "5 psychological tricks stores use",
  "style": "documentary",
  "voice": "nova"
}
```

Returns: `{ "projectId": "uuid" }`

### GET `/api/status/[id]`

Poll generation progress:

```json
{
  "id": "uuid",
  "status": "generating_images",
  "progress": 45,
  "scenes": [...],
  "videoUrl": "/videos/video-123.mp4"
}
```

Status values: `pending` → `generating_script` → `generating_images` → `generating_audio` → `assembling` → `complete`

## Configuration

### Voice Options

| Voice   | Description        |
|---------|-------------------|
| alloy   | Neutral, balanced |
| echo    | Male, confident   |
| fable   | British accent    |
| onyx    | Deep, authoritative |
| nova    | Female, warm      |
| shimmer | Soft, gentle      |

### Style Options

| Style       | Visual Treatment                        |
|-------------|----------------------------------------|
| realistic   | Photorealistic, cinematic lighting, 8K |
| anime       | Studio Ghibli inspired, vibrant        |
| horror      | Dark, eerie, dramatic shadows          |
| documentary | Realistic, historical accuracy         |
| fantasy     | Magical, ethereal lighting             |
| minimalist  | Clean, modern design                   |

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

Note: FFmpeg isn't available on Vercel by default. For production, consider:
- Serverless FFmpeg layers
- External video APIs (Creatomate, Shotstack)
- Self-hosted on Railway/Render

### Docker

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY . .
RUN npm ci && npm run build
CMD ["npm", "start"]
```

## Roadmap

- [x] AI script generation
- [x] AI image generation
- [x] AI voiceover
- [x] FFmpeg video assembly
- [x] Burn-in captions (ASS subtitles)
- [x] Demo mode (mock data)
- [ ] Background music library
- [ ] Direct TikTok/YouTube upload
- [ ] User accounts & history
- [ ] Stripe payments
- [ ] Custom voice cloning

## Costs

Estimated per video (5 scenes, 45 seconds):
- GPT-4o-mini: ~$0.001
- OpenAI TTS: ~$0.02
- Replicate Flux: ~$0.05 × 5 = $0.25
- **Total: ~$0.27 per video**

## License

MIT
