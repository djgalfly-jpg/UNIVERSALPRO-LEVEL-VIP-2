# Universal Orchard Mastering V2.2

**World-Class Hybrid Mastering Suite & Image Studio**

This is a proprietary mastering console designed for major label workflows. It combines analog DSP simulation (Compressors, EQ, Tape Saturation) with AI-powered analysis and visual asset editing.

## Credits

**System Architecture & Engineering:**
- **Orlando Galdamez** (Latin Grammy® Member)
- **Krylin** (Latin Grammy® Member)

## Features

- **Audio Engine**: 64-bit floating point processing pipeline.
- **Dolby Atmos / 3D**: Binaural spatializer for immersive monitoring.
- **AI Humanizer**: Detects and "humanizes" AI-generated stems.
- **Gemini Integration**: 
  - Deep spectral analysis for auto-mastering settings.
  - Generative image editing for album artwork.
- **Hi-Res Export**: Support for 96kHz/24bit WAV export.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Audio**: Web Audio API (Native Nodes + AudioWorklet architecture concepts)
- **AI**: Google Gemini 2.5 Flash & Pro Models via `@google/genai` SDK

## Deployment

This project is set up to be deployed on static hosting (GitHub Pages, Vercel, Netlify).
Ensure your build environment supports ES Modules.

## Security

Confidential software for internal use at Universal Orchard Global Entertainment.
