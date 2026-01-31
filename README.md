# Faceless AI

Create viral TikTok & YouTube videos with AI. No camera, no editing, just results.

## Features

- 🎯 **AI Script Writing** - Hook-driven scripts optimized for engagement
- 🎨 **AI Image Generation** - Stunning visuals with Flux/SDXL
- 🎙️ **AI Voiceover** - Natural-sounding voices with OpenAI TTS
- ⚡ **Fast** - From idea to video in under 2 minutes

## Tech Stack

- Next.js 14 (App Router)
- OpenAI (GPT-4 for scripts, TTS for voice)
- Replicate (Flux for images)
- Tailwind CSS

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your API keys
3. Install dependencies: `npm install`
4. Run dev server: `npm run dev`
5. Open http://localhost:3000

## Environment Variables

```
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
```

## Deployment

Deploy to Vercel or Railway:

```bash
npm run build
npm start
```

## Roadmap

- [ ] Video assembly with FFmpeg/Remotion
- [ ] Auto-captions
- [ ] Background music library
- [ ] Direct TikTok/YouTube upload
- [ ] User accounts & history
- [ ] Stripe payments

## License

MIT
