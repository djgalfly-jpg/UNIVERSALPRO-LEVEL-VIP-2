export enum ProfileType {
  PRISTINE_MASTER = 'PRISTINE_MASTER', // New Flagship Profile
  BILLBOARD_POP = 'BILLBOARD_POP',
  URBAN_DIAMOND = 'URBAN_DIAMOND',
  HOUSE_DEEP = 'HOUSE_DEEP', // New House Profile
  ROCK_STADIUM = 'ROCK_STADIUM',
  ORGANIC_ACOUSTIC = 'ORGANIC_ACOUSTIC',
  CINEMATIC_ORCHESTRAL = 'CINEMATIC_ORCHESTRAL',
  EDM_FESTIVAL = 'EDM_FESTIVAL',
  LOFI_CHILL = 'LOFI_CHILL',
  VOCAL_AIR = 'VOCAL_AIR',
  RETRO_SYNTH = 'RETRO_SYNTH',
  MODERN_METAL = 'MODERN_METAL',
  JAZZ_CLUB = 'JAZZ_CLUB',
  LATIN_FIRE = 'LATIN_FIRE',
  PODCAST_PRO = 'PODCAST_PRO',
  COUNTRY_GOLD = 'COUNTRY_GOLD',
  TECHNO_RUMBLE = 'TECHNO_RUMBLE',
  DANCE_FLOOR = 'DANCE_FLOOR',
  TRANCE_STATE = 'TRANCE_STATE',
  TECHNO_PEAK = 'TECHNO_PEAK',
  CORRIDOS_TUMBADOS = 'CORRIDOS_TUMBADOS',
}

export enum ExportMode {
  STANDARD = 'STANDARD',
  HI_RES = 'HI_RES',
  DOLBY_ATMOS = 'DOLBY_ATMOS',
}

export type CompressorModel = 'FET_1176' | 'OPTO_2A' | 'VCA_BUS' | 'TUBE_VARIMU';
export type EnvironmentType = 'NONE' | 'STUDIO_A' | 'STUDIO_B' | 'VOCAL_BOOTH' | 'LIVE_CLUB' | 'CONCERT_HALL' | 'CATHEDRAL' | 'VINTAGE_MIC_57' | 'VINTAGE_MIC_87' | 'TAPE_ROOM' | 'VINYL_BOOTH';

// --- V3.0 ANALOG DSP STATE ---
export interface DspState {
  // 1. INPUT STAGE
  inputGain: number; // -20 to +10 dB
  stereoWidth: number; // 0 to 200%

  // 2. HUMANIZER (AI DE-DETECTION)
  humanizeWow: number; // Pitch drift 0-100
  humanizeFlutter: number; // Fast pitch jitter 0-100
  humanizeNoise: number; // Analog floor 0-100

  // 3. PARAMETRIC EQ
  eqLowFreq: number; eqLowGain: number;
  eqLowMidFreq: number; eqLowMidGain: number; eqLowMidQ: number;
  eqHighMidFreq: number; eqHighMidGain: number; eqHighMidQ: number;
  eqHighFreq: number; eqHighGain: number;

  // 4. COMPRESSOR LAB
  compModel: CompressorModel;
  compThreshold: number; 
  compRatio: number; 
  compAttack: number; 
  compRelease: number; 
  compMakeup: number; 
  compMix: number; // Parallel compression 0-100%

  // 5. IMMERSIVE / SPATIAL AUDIO (REPLACES SIMPLE REVERB)
  spatialMode: boolean; // True for Atmos simulation
  spatialWidth: number; // 0-100 (Wideness)
  spatialHeight: number; // 0-100 (Virtual Ceiling/Elevation)
  spatialRear: number; // 0-100 (Virtual Surround)
  envType: EnvironmentType; // Impulse Response for the "Room"
  envMix: number; // 0-100%
  saturationDrive: number; // Tube warmth

  // 6. MASTER LIMITER (SAFETY)
  limiterCeiling: number; // -0.1 dB
  limiterThreshold: number; // Push
}

export interface MasteringProfile {
  id: ProfileType;
  name: string;
  description: string;
  focus: string;
  process: string;
  target: string;
  icon: string;
  defaultDsp: DspState; // ENGINEER PRESET SETTINGS
}

export interface AudioAnalysisMetrics {
  bpm: number;
  peak: number;
  rms: number;
  clippingDetected: boolean;
  aiProbability: number; // 0-100
  detectedAiModel?: string; // e.g., "Suno v3", "Udio"
  spectralCutoff?: number; // e.g., 16000Hz (common in AI)
  duration: number;
}

export interface ImageEditState {
  originalImage: string | null;
  generatedImage: string | null;
  prompt: string;
  isLoading: boolean;
  error: string | null;
}