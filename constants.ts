import { MasteringProfile, ProfileType, DspState } from './types';

// Helper to generate a baseline DspState to avoid repetition
// NOTE: Base Saturation is now 0 for "Pristine" requirement.
const baseDsp = (): DspState => ({
  inputGain: 0, stereoWidth: 100,
  humanizeWow: 0, humanizeFlutter: 0, humanizeNoise: 0, // Clean by default
  eqLowFreq: 80, eqLowGain: 0,
  eqLowMidFreq: 400, eqLowMidGain: 0, eqLowMidQ: 1,
  eqHighMidFreq: 2500, eqHighMidGain: 0, eqHighMidQ: 1,
  eqHighFreq: 10000, eqHighGain: 0,
  compModel: 'VCA_BUS',
  compThreshold: -20, compRatio: 2, compAttack: 0.03, compRelease: 0.25, compMakeup: 0, compMix: 100,
  spatialMode: false, spatialWidth: 0, spatialHeight: 0, spatialRear: 0, // Default Stereo
  envType: 'NONE', envMix: 0, saturationDrive: 0, // PRISTINE: No saturation
  limiterCeiling: -0.2, limiterThreshold: 2 // SAFETY: -0.2dB Ceiling
});

export const PROFILES: Record<ProfileType, MasteringProfile> = {
  [ProfileType.PRISTINE_MASTER]: {
    id: ProfileType.PRISTINE_MASTER,
    name: "Pure Mastering Clean",
    description: "Hi-Res & 3D Ready",
    focus: "Absolute clarity. 96kHz Ready.",
    process: "Linear-phase EQ. Transparent VCA. Subtle spatial expansion.",
    target: "-9 LUFS",
    icon: "💎",
    defaultDsp: {
      ...baseDsp(),
      inputGain: 0, stereoWidth: 100,
      eqHighFreq: 16000, eqHighGain: 1.5,
      compModel: 'VCA_BUS', compRatio: 1.5, compThreshold: -15, compAttack: 0.05,
      spatialMode: true, spatialWidth: 20, spatialHeight: 10, spatialRear: 5, // Subtle 3D
      limiterThreshold: 3
    }
  },
  [ProfileType.BILLBOARD_POP]: {
    id: ProfileType.BILLBOARD_POP,
    name: "The Billboard Pop",
    description: "Cristalino y Competitivo (Sony Style)",
    focus: "Brillo, anchura y consistencia.",
    process: "Curva EQ 'Smile' sutil. Control extremo de sibilancias. La voz flota por encima de todo.",
    target: "-8 LUFS",
    icon: "✨",
    defaultDsp: {
      ...baseDsp(),
      inputGain: -1, stereoWidth: 110,
      eqLowGain: 1.5, eqHighGain: 2.5, eqHighFreq: 12000,
      compModel: 'OPTO_2A', compRatio: 2.5, compThreshold: -22, compMakeup: 2,
      envType: 'STUDIO_A', envMix: 5, saturationDrive: 0, // Clean
      spatialMode: true, spatialWidth: 40, spatialHeight: 0, spatialRear: 0, // Wide but frontal
      limiterThreshold: 4
    }
  },
  [ProfileType.URBAN_DIAMOND]: {
    id: ProfileType.URBAN_DIAMOND,
    name: "Urban Diamond",
    description: "Hip-Hop/Trap/Drill",
    focus: "Impacto visceral y Sub-Bajos 808.",
    process: "Control de transitorios para máxima pegada. Bajos limpios.",
    target: "-6 LUFS (Loud & Proud)",
    icon: "🥶",
    defaultDsp: {
      ...baseDsp(),
      inputGain: 0, stereoWidth: 102,
      eqLowFreq: 55, eqLowGain: 3, eqHighMidGain: 1,
      compModel: 'VCA_BUS', compRatio: 4, compAttack: 0.015, compRelease: 0.1, compThreshold: -18,
      saturationDrive: 0,
      limiterThreshold: 5
    }
  },
  [ProfileType.LATIN_FIRE]: {
    id: ProfileType.LATIN_FIRE,
    name: "Reggaeton / Urbano",
    description: "Reggaeton/Salsa/Latin",
    focus: "El 'Dembow' y la claridad vocal.",
    process: "Boost en 100Hz y 3kHz para percusión y voz.",
    target: "-7 LUFS",
    icon: "🔥",
    defaultDsp: {
      ...baseDsp(),
      inputGain: -0.5, stereoWidth: 105,
      eqLowFreq: 90, eqLowGain: 3, eqHighMidFreq: 3000, eqHighMidGain: 2,
      compModel: 'VCA_BUS', compRatio: 3, compAttack: 0.02,
      envType: 'STUDIO_A', envMix: 5, saturationDrive: 0,
      limiterThreshold: 4.5
    }
  },
  [ProfileType.HOUSE_DEEP]: {
    id: ProfileType.HOUSE_DEEP,
    name: "Deep House / Ibiza",
    description: "Deep/Tech House",
    focus: "Groove y Bajos redondos.",
    process: "Recorte de subs <30Hz, Compresión con 'Pump' rítmico.",
    target: "-8 LUFS",
    icon: "🏖️",
    defaultDsp: {
      ...baseDsp(),
      inputGain: 0, stereoWidth: 115,
      eqLowFreq: 50, eqLowGain: 2, eqHighFreq: 8000, eqHighGain: 1,
      compModel: 'VCA_BUS', compRatio: 4, compAttack: 0.03, compRelease: 0.1, // Pumping
      spatialMode: true, spatialWidth: 50, spatialHeight: 20, spatialRear: 30, // Immersive Club
      limiterThreshold: 4
    }
  },
  [ProfileType.DANCE_FLOOR]: {
    id: ProfileType.DANCE_FLOOR,
    name: "Dancefloor Anthem",
    description: "Commercial Dance/EDM",
    focus: "Energía pura y claridad vocal.",
    process: "Curva 'V' agresiva, compresión 'Glue' apretada, agudos brillantes.",
    target: "-6 LUFS",
    icon: "💃",
    defaultDsp: {
      ...baseDsp(),
      inputGain: -1, stereoWidth: 112,
      eqLowGain: 2.5, eqHighGain: 2.5, eqLowMidGain: -0.5,
      compModel: 'VCA_BUS', compRatio: 4, compRelease: 0.1,
      saturationDrive: 0,
      limiterThreshold: 5
    }
  },
  [ProfileType.ROCK_STADIUM]: {
    id: ProfileType.ROCK_STADIUM,
    name: "Rock Stadium",
    description: "Potente y Dinámico",
    focus: "Pared de sonido, guitarras anchas.",
    process: "Compresión de bus tipo 'Glue' (SSL).",
    target: "-9 LUFS",
    icon: "🎸",
    defaultDsp: {
      ...baseDsp(),
      inputGain: -1, stereoWidth: 115,
      eqLowMidGain: -1, eqHighMidGain: 2, eqHighMidFreq: 3000,
      compModel: 'FET_1176', compRatio: 4, compAttack: 0.005, compRelease: 0.2, compMix: 85,
      saturationDrive: 5, // Slight color allowed here
      limiterThreshold: 3
    }
  },
  [ProfileType.ORGANIC_ACOUSTIC]: {
    id: ProfileType.ORGANIC_ACOUSTIC,
    name: "Organic Acoustic",
    description: "Unplugged & Folk",
    focus: "La intimidad es poder. No aplastar la dinámica.",
    process: "EQ: Realzar 'aire' (15kHz+). Compresión transparente.",
    target: "-11 LUFS",
    icon: "🎻",
    defaultDsp: {
      ...baseDsp(),
      inputGain: 0, stereoWidth: 100,
      eqHighFreq: 15000, eqHighGain: 2,
      compModel: 'OPTO_2A', compRatio: 1.5, compThreshold: -15, compMix: 70,
      envType: 'VINTAGE_MIC_87', envMix: 10,
      limiterThreshold: 1.5
    }
  },
  [ProfileType.CINEMATIC_ORCHESTRAL]: {
    id: ProfileType.CINEMATIC_ORCHESTRAL,
    name: "Cinematic Epic",
    description: "Atmos Soundtrack",
    focus: "Profundidad, épica y realismo 3D.",
    process: "Conservación total de transitorios. Binaural Atmos Simulation.",
    target: "Dynamic Preservation",
    icon: "🎬",
    defaultDsp: {
      ...baseDsp(),
      stereoWidth: 120,
      eqLowGain: 2, eqHighGain: 1,
      compModel: 'TUBE_VARIMU', compRatio: 1.5, compAttack: 0.1, compRelease: 0.5,
      envType: 'CONCERT_HALL', envMix: 25,
      spatialMode: true, spatialWidth: 80, spatialHeight: 60, spatialRear: 50, // FULL 3D
      limiterThreshold: 1
    }
  },
  [ProfileType.EDM_FESTIVAL]: {
    id: ProfileType.EDM_FESTIVAL,
    name: "EDM Mainstage",
    description: "Big Room / Trance",
    focus: "Bombo masivo y agudos cortantes.",
    process: "Sidechain simulado, compresión multibanda agresiva en agudos.",
    target: "-5 LUFS",
    icon: "🎉",
    defaultDsp: {
      ...baseDsp(),
      inputGain: -1.5, stereoWidth: 110,
      eqLowGain: 3, eqHighGain: 3,
      compModel: 'VCA_BUS', compRatio: 8, compThreshold: -24, compMakeup: 4,
      limiterThreshold: 5.5
    }
  },
  [ProfileType.LOFI_CHILL]: {
    id: ProfileType.LOFI_CHILL,
    name: "Lo-Fi Study Beats",
    description: "Warm & Nostalgic",
    focus: "Calidez analógica, reducción de ancho de banda.",
    process: "Saturación de cinta, corte de agudos, énfasis en medios.",
    target: "-10 LUFS",
    icon: "☕",
    defaultDsp: {
      ...baseDsp(),
      stereoWidth: 85,
      humanizeWow: 25, humanizeFlutter: 25, humanizeNoise: 15, // AI Humanization active
      eqHighFreq: 6000, eqHighGain: -4,
      eqLowMidGain: 3,
      compModel: 'TUBE_VARIMU', compRatio: 2,
      envType: 'TAPE_ROOM', envMix: 40, saturationDrive: 20, // Exception: Lofi needs dirt
      limiterThreshold: 2
    }
  },
  [ProfileType.VOCAL_AIR]: {
    id: ProfileType.VOCAL_AIR,
    name: "Vocal Goddess",
    description: "Pop Ballads/R&B",
    focus: "La voz es la reina absoluta.",
    process: "Realce extremo en 12kHz (Air), compresión óptica suave.",
    target: "-9 LUFS",
    icon: "🎤",
    defaultDsp: {
      ...baseDsp(),
      stereoWidth: 100,
      eqHighFreq: 12000, eqHighGain: 4, eqLowMidGain: -1,
      compModel: 'OPTO_2A', compRatio: 3, compThreshold: -20,
      envType: 'VOCAL_BOOTH', envMix: 10,
      limiterThreshold: 3
    }
  },
  [ProfileType.RETRO_SYNTH]: {
    id: ProfileType.RETRO_SYNTH,
    name: "80s Retro Synth",
    description: "Synthwave/Retrowave",
    focus: "Estética Neón y Cajas con Gated Reverb.",
    process: "Calidez en medios-bajos, expansión estéreo amplia.",
    target: "-8 LUFS",
    icon: "👾",
    defaultDsp: {
      ...baseDsp(),
      stereoWidth: 125,
      humanizeWow: 10, humanizeFlutter: 5,
      eqLowMidFreq: 300, eqLowMidGain: 2,
      compModel: 'VCA_BUS', compRatio: 4,
      envType: 'STUDIO_B', envMix: 30, saturationDrive: 10,
      limiterThreshold: 3.5
    }
  },
  [ProfileType.MODERN_METAL]: {
    id: ProfileType.MODERN_METAL,
    name: "Modern Metal",
    description: "Djent/Metalcore",
    focus: "Precisión quirúrgica y agresión.",
    process: "Corte de medios 'Scoop', control de graves ultra-rápido.",
    target: "-6 LUFS",
    icon: "🤘",
    defaultDsp: {
      ...baseDsp(),
      stereoWidth: 110,
      eqLowGain: 2, eqLowMidGain: -3, eqHighGain: 3, // Scooped
      compModel: 'FET_1176', compRatio: 8, compAttack: 0.001, compRelease: 0.05,
      saturationDrive: 15,
      limiterThreshold: 5
    }
  },
  [ProfileType.JAZZ_CLUB]: {
    id: ProfileType.JAZZ_CLUB,
    name: "Jazz Club Blue",
    description: "Jazz/Blues/Soul",
    focus: "Ambiente de sala y separación de instrumentos.",
    process: "Live Mode activado, compresión mínima, EQ cálido.",
    target: "-12 LUFS",
    icon: "🎷",
    defaultDsp: {
      ...baseDsp(),
      stereoWidth: 95,
      eqHighGain: -1, eqLowMidGain: 1,
      compModel: 'TUBE_VARIMU', compRatio: 1.5, compThreshold: -10,
      envType: 'LIVE_CLUB', envMix: 25,
      limiterThreshold: 1
    }
  },
  [ProfileType.PODCAST_PRO]: {
    id: ProfileType.PODCAST_PRO,
    name: "Podcast Broadcast",
    description: "Voiceover/Radio",
    focus: "Inteligibilidad y consistencia de volumen.",
    process: "Compresión de alto ratio, corte de graves (De-rumble).",
    target: "-16 LUFS",
    icon: "🎙️",
    defaultDsp: {
      ...baseDsp(),
      stereoWidth: 100,
      eqLowGain: -12, eqLowFreq: 60, // Cut Rumble
      eqHighMidGain: 3, // Intelligibility
      compModel: 'OPTO_2A', compRatio: 4, compThreshold: -25,
      envType: 'VOCAL_BOOTH', envMix: 5,
      limiterThreshold: 2
    }
  },
  [ProfileType.COUNTRY_GOLD]: {
    id: ProfileType.COUNTRY_GOLD,
    name: "Nashville Gold",
    description: "Country/Americana",
    focus: "Guitarras brillantes y voces presentes.",
    process: "Medios-agudos cristalinos, compresión suave.",
    target: "-10 LUFS",
    icon: "🤠",
    defaultDsp: {
      ...baseDsp(),
      stereoWidth: 105,
      eqHighMidFreq: 2500, eqHighMidGain: 1.5, eqHighGain: 1.5,
      compModel: 'OPTO_2A', compRatio: 2.5,
      envType: 'STUDIO_A', envMix: 15,
      limiterThreshold: 3
    }
  },
  [ProfileType.TECHNO_RUMBLE]: {
    id: ProfileType.TECHNO_RUMBLE,
    name: "Techno Warehouse",
    description: "Industrial/Techno",
    focus: "Oscuridad y el 'Rumble' del bajo.",
    process: "Limitación agresiva, EQ oscuro, Reverb industrial.",
    target: "-5 LUFS",
    icon: "🏭",
    defaultDsp: {
      ...baseDsp(),
      inputGain: -2, stereoWidth: 115,
      eqLowFreq: 50, eqLowGain: 4, eqHighGain: -2,
      compModel: 'FET_1176', compRatio: 12, compAttack: 0.005,
      envType: 'CATHEDRAL', envMix: 35, saturationDrive: 20,
      limiterThreshold: 6
    }
  },
  [ProfileType.TRANCE_STATE]: {
    id: ProfileType.TRANCE_STATE,
    name: "Euphoric Trance",
    description: "Uplifting/Progressive",
    focus: "Atmósfera masiva y Supersaws gigantes.",
    process: "Expansión estéreo extrema (Side boost), Reverb denso, Air boost.",
    target: "-7 LUFS",
    icon: "🌌",
    defaultDsp: {
      ...baseDsp(),
      stereoWidth: 135, // WIDE
      eqHighFreq: 14000, eqHighGain: 3,
      compModel: 'VCA_BUS', compRatio: 2,
      envType: 'CATHEDRAL', envMix: 40,
      spatialMode: true, spatialWidth: 60, spatialHeight: 40, spatialRear: 20,
      limiterThreshold: 4
    }
  },
  [ProfileType.TECHNO_PEAK]: {
    id: ProfileType.TECHNO_PEAK,
    name: "Peak Time Techno",
    description: "Driving/Acid/Hard",
    focus: "Potencia implacable y texturas ácidas.",
    process: "Saturación de tubo extrema, transitorios afilados, limitador al máximo.",
    target: "-5 LUFS (Max)",
    icon: "🔨",
    defaultDsp: {
      ...baseDsp(),
      inputGain: -2, stereoWidth: 102,
      eqLowGain: 3, eqHighMidGain: 3, // Aggressive
      compModel: 'FET_1176', compRatio: 20, compAttack: 0,
      saturationDrive: 40, // Distortion allowed
      limiterThreshold: 7
    }
  },
  [ProfileType.CORRIDOS_TUMBADOS]: {
    id: ProfileType.CORRIDOS_TUMBADOS,
    name: "Corridos Tumbados",
    description: "Regional Mexicano Moderno",
    focus: "Tololoche profundo y Requintos brillantes.",
    process: "Boost en 80Hz para el bajo, brillo en 4kHz para cuerdas, compresión vocal rápida.",
    target: "-7 LUFS",
    icon: "🦁",
    defaultDsp: {
      ...baseDsp(),
      inputGain: -1, stereoWidth: 105,
      eqLowFreq: 80, eqLowGain: 3, eqHighMidFreq: 4000, eqHighMidGain: 2,
      compModel: 'VCA_BUS', compRatio: 2.5,
      envType: 'STUDIO_B', envMix: 15, saturationDrive: 0,
      limiterThreshold: 4
    }
  },
};