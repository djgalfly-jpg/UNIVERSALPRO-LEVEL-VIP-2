import React, { useState, useRef, useEffect } from 'react';
import { DspState, CompressorModel, EnvironmentType, ProfileType } from '../types';
import { PROFILES } from '../constants';
import { Knob } from './Knob';
import { performDeepAnalysisAndMaster } from '../services/geminiService';
import { Play, Pause, Upload, Brain, X, Settings2, RefreshCw, AlertTriangle, Gauge, Waves, Mic2, Radio, Speaker, CheckCircle2, Download, Fingerprint, ScanEye, Sparkles, Activity, FileAudio, Zap, ChevronDown, ArrowRight, Power, Globe, Headphones } from 'lucide-react';

// --- AUDIO HELPERS ---

const createImpulse = (ctx: BaseAudioContext, type: EnvironmentType): AudioBuffer => {
    const rate = ctx.sampleRate;
    let duration = 0.5;
    let decay = 2.0;
    
    switch(type) {
        case 'STUDIO_A': duration = 0.8; decay = 4.0; break;
        case 'STUDIO_B': duration = 0.4; decay = 6.0; break;
        case 'VOCAL_BOOTH': duration = 0.2; decay = 10.0; break;
        case 'LIVE_CLUB': duration = 1.5; decay = 3.0; break;
        case 'CONCERT_HALL': duration = 3.0; decay = 2.0; break;
        case 'CATHEDRAL': duration = 5.0; decay = 1.0; break;
        case 'VINTAGE_MIC_57': duration = 0.05; decay = 20.0; break; 
        case 'VINTAGE_MIC_87': duration = 0.1; decay = 15.0; break;
        case 'TAPE_ROOM': duration = 0.6; decay = 5.0; break;
        case 'VINYL_BOOTH': duration = 0.3; decay = 8.0; break;
        default: duration = 0.1; decay = 20.0;
    }

    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        let n = i / length;
        let env = Math.pow(1 - n, decay);
        left[i] = (Math.random() * 2 - 1) * env;
        right[i] = (Math.random() * 2 - 1) * env;
    }
    return impulse;
};

const makeSaturationCurve = (amount: number) => {
  // If amount is 0, return a linear curve (clean)
  if (amount <= 0) {
      const curve = new Float32Array(2);
      curve[0] = -1;
      curve[1] = 1;
      return curve;
  }
  const k = amount;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
};

// WAV Encoder
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const bufferToWav = (buffer: AudioBuffer, len: number) => {
  const numOfChan = buffer.numberOfChannels,
  length = len * numOfChan * 2 + 44,
  bufferArr = new ArrayBuffer(length),
  view = new DataView(bufferArr),
  channels = [],
  sampleRate = buffer.sampleRate;
  
  let offset = 0, pos = 0;

  // write WAVE header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len * numOfChan * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, len * numOfChan * 2, true);

  // write interleaved data
  for(let i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  offset = 44;
  while(pos < len){
    for(let i = 0; i < numOfChan; i++){
       let sample = Math.max(-1, Math.min(1, channels[i][pos])); 
       sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; 
       view.setInt16(offset, sample, true); 
       offset += 2; 
    }
    pos++;
  }
  return new Blob([view], { type: 'audio/wav' });
};

// --- COMPONENTS ---

const Meter: React.FC<{ value: number; label: string; min?: number; max?: number; color?: string; height?: string }> = ({ value, label, min=-60, max=0, color='bg-green-500', height='h-24' }) => {
  const range = max - min;
  const clamped = Math.max(min, Math.min(max, value));
  const percent = ((clamped - min) / range) * 100;
  
  let dynamicColor = color;
  if (value > -3 && value <= 0) dynamicColor = 'bg-amber-500';
  if (value > 0) dynamicColor = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]';

  const ticks = [-6, -12, -18, -24, -30, -40, -50];

  return (
    <div className={`flex flex-col items-center gap-1 w-full ${height}`}>
      <div className="w-full flex-1 bg-zinc-950/50 rounded-sm border border-zinc-800 relative overflow-hidden group">
          {/* Ticks */}
          {ticks.map(t => {
             const tP = ((t - min) / range) * 100;
             return <div key={t} className="absolute w-full h-px bg-zinc-800 z-10 group-hover:bg-zinc-700 transition-colors" style={{bottom: `${tP}%`}}></div>
          })}
          
          <div className={`w-full absolute bottom-0 transition-all duration-75 ease-out ${dynamicColor}`} style={{ height: `${percent}%` }} />
      </div>
      <span className="text-[9px] font-mono text-zinc-500 tracking-wider">{label}</span>
    </div>
  )
}

const RackModule: React.FC<{ title: string; children: React.ReactNode; color?: string; active?: boolean; onToggle?: () => void; rightElement?: React.ReactNode; height?: string }> = ({ title, children, color = 'text-zinc-500', active = true, onToggle, rightElement, height = 'h-full' }) => (
  <div className={`bg-[#0c0c0e] border border-zinc-900 rounded shadow-2xl relative flex flex-col ${height}`}>
      {/* Rack Screws */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-zinc-800 border border-zinc-950 shadow-inner flex items-center justify-center"><div className="w-1 h-px bg-zinc-950 transform rotate-45"></div></div>
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-zinc-800 border border-zinc-950 shadow-inner flex items-center justify-center"><div className="w-1 h-px bg-zinc-950 transform rotate-45"></div></div>
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-zinc-800 border border-zinc-950 shadow-inner flex items-center justify-center"><div className="w-1 h-px bg-zinc-950 transform rotate-45"></div></div>
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-zinc-800 border border-zinc-950 shadow-inner flex items-center justify-center"><div className="w-1 h-px bg-zinc-950 transform rotate-45"></div></div>

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-2 bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-900/50 mx-1 mt-1 rounded-t-sm">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${active ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'bg-zinc-800'}`}></div>
             <h3 className={`text-[11px] font-bold font-mono tracking-[0.2em] uppercase ${color} drop-shadow-sm`}>{title}</h3>
          </div>
          <div className="flex items-center gap-3">
              {rightElement}
              {onToggle && (
                  <button onClick={onToggle} title={active ? "Bypass" : "Activate"} className={`transition-colors hover:text-white ${active ? 'text-green-500 hover:text-green-400' : 'text-zinc-700'}`}>
                      <Power className="w-3 h-3" />
                  </button>
              )}
          </div>
      </div>

      {/* Plate Content */}
      <div className={`flex-1 p-4 relative ${active ? '' : 'opacity-40 grayscale pointer-events-none'}`}>
          {/* Subtle texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
          <div className="relative z-10 h-full">
            {children}
          </div>
      </div>
  </div>
);

// --- MAIN CONSOLE ---

export const MasteringConsole: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<ProfileType>(ProfileType.PRISTINE_MASTER);
  // SAFETY: Fallback in case PROFILES is missing the key
  const [dsp, setDsp] = useState<DspState>(PROFILES[ProfileType.PRISTINE_MASTER]?.defaultDsp || PROFILES[ProfileType.BILLBOARD_POP].defaultDsp);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Meters
  const [inL, setInL] = useState(-60);
  const [inR, setInR] = useState(-60);
  const [outL, setOutL] = useState(-60);
  const [outR, setOutR] = useState(-60);
  const [gr, setGr] = useState(0);

  const [analyzing, setAnalyzing] = useState(false);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // Audio Graph
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<any>({});
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>();
  const envBufferCache = useRef<Map<string, AudioBuffer>>(new Map());
  
  // Spectrum Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper to build the graph for both Realtime and Offline contexts
  const buildGraph = (ctx: BaseAudioContext, destination: AudioNode) => {
     const n: any = {};
     
     // Nodes
     n.inputGain = ctx.createGain();
     n.wowDelay = ctx.createDelay(1.0); n.wowDelay.delayTime.value = 0.05;
     n.wowOsc = ctx.createOscillator();
     n.wowOscGain = ctx.createGain();
     n.eqLow = ctx.createBiquadFilter(); n.eqLow.type = 'lowshelf';
     n.eqLowMid = ctx.createBiquadFilter(); n.eqLowMid.type = 'peaking';
     n.eqHighMid = ctx.createBiquadFilter(); n.eqHighMid.type = 'peaking';
     n.eqHigh = ctx.createBiquadFilter(); n.eqHigh.type = 'highshelf';
     n.compressor = ctx.createDynamicsCompressor();
     n.makeupGain = ctx.createGain();
     
     // --- SPATIAL AUDIO BLOCK (3D/ATMOS SIMULATION) ---
     // We create a dry path (mid/center) and a spatial path (sides/rear)
     n.spatialSplitter = ctx.createChannelSplitter(2);
     n.spatialMerger = ctx.createChannelMerger(2);
     
     n.spatialDryGain = ctx.createGain(); // Center image
     n.spatialWetGain = ctx.createGain(); // Spatial/Rear/Height image

     // "Bed" Reverb (Impulse)
     n.convolver = ctx.createConvolver();
     
     // 3D Panners (Binaural HRTF)
     // Rear Panner (Simulating Surround)
     n.pannerRear = ctx.createPanner();
     n.pannerRear.panningModel = 'HRTF';
     n.pannerRear.distanceModel = 'inverse';
     n.pannerRear.refDistance = 1;
     n.pannerRear.maxDistance = 10000;
     // Position slightly behind and to the side
     n.pannerRear.positionX.value = 5; 
     n.pannerRear.positionY.value = 0;
     n.pannerRear.positionZ.value = 5; 

     // Height Panner (Simulating Atmos Ceiling)
     n.pannerHeight = ctx.createPanner();
     n.pannerHeight.panningModel = 'HRTF';
     n.pannerHeight.positionX.value = 0;
     n.pannerHeight.positionY.value = 10; // UP
     n.pannerHeight.positionZ.value = 0;

     // Signal flow for processing
     n.saturator = ctx.createWaveShaper(); n.saturator.oversample = '4x';
     n.limiterPreGain = ctx.createGain(); 
     
     // ZERO CLIPPING LIMITER SETUP
     n.limiter = ctx.createDynamicsCompressor(); 
     n.limiter.ratio.value = 20; // Hard Limit
     n.limiter.attack.value = 0; // Instant catch
     n.limiter.release.value = 0.1;

     // --- CONNECTIONS ---
     // 1. Pre-Processing & EQ
     n.inputGain.connect(n.wowDelay);
     n.wowOsc.connect(n.wowOscGain);
     n.wowOscGain.connect(n.wowDelay.delayTime);
     n.wowOsc.start();
     
     n.wowDelay.connect(n.eqLow);
     n.eqLow.connect(n.eqLowMid);
     n.eqLowMid.connect(n.eqHighMid);
     n.eqHighMid.connect(n.eqHigh);
     n.eqHigh.connect(n.compressor);
     n.compressor.connect(n.makeupGain);

     // 2. Spatial Routing
     n.makeupGain.connect(n.spatialDryGain); // Direct path (Dry)
     
     // Create a "Wet" path for the Spatializers
     n.makeupGain.connect(n.convolver); 
     n.convolver.connect(n.spatialWetGain);
     
     n.makeupGain.connect(n.pannerRear); // Send signal to simulated rear speakers
     n.pannerRear.connect(n.spatialWetGain);

     n.makeupGain.connect(n.pannerHeight); // Send signal to simulated ceiling speakers
     n.pannerHeight.connect(n.spatialWetGain);

     // 3. Summing
     n.spatialDryGain.connect(n.saturator);
     n.spatialWetGain.connect(n.saturator);

     // 4. Output Stage
     n.saturator.connect(n.limiterPreGain);
     n.limiterPreGain.connect(n.limiter);
     n.limiter.connect(destination);

     return n;
  };

  const applyDspToNodes = (n: any, ctx: BaseAudioContext, state: DspState) => {
    // Safety check for state
    if (!state) return;
    const t = ctx.currentTime;
    
    // Gain
    const inputGain = state.inputGain ?? 0;
    n.inputGain.gain.setValueAtTime(Math.pow(10, inputGain / 20), t);

    // Humanizer
    const humanizeWow = state.humanizeWow ?? 0;
    const humanizeFlutter = state.humanizeFlutter ?? 0;
    const totalWow = (humanizeWow / 100) * 0.002;
    const totalFlutter = (humanizeFlutter / 100) * 0.001;
    n.wowOsc.frequency.setValueAtTime(0.5 + (humanizeFlutter / 20), t);
    n.wowOscGain.gain.setValueAtTime(totalWow + totalFlutter, t);

    // EQ
    n.eqLow.frequency.value = state.eqLowFreq ?? 80; n.eqLow.gain.value = state.eqLowGain ?? 0;
    n.eqLowMid.frequency.value = state.eqLowMidFreq ?? 400; n.eqLowMid.gain.value = state.eqLowMidGain ?? 0; n.eqLowMid.Q.value = state.eqLowMidQ ?? 1;
    n.eqHighMid.frequency.value = state.eqHighMidFreq ?? 2500; n.eqHighMid.gain.value = state.eqHighMidGain ?? 0; n.eqHighMid.Q.value = state.eqHighMidQ ?? 1;
    n.eqHigh.frequency.value = state.eqHighFreq ?? 10000; n.eqHigh.gain.value = state.eqHighGain ?? 0;

    // Comp
    let att = state.compAttack ?? 0.03;
    let knee = 5;
    if (state.compModel === 'FET_1176') { att = Math.min(att, 0.001); knee = 0; }
    else if (state.compModel === 'OPTO_2A') { att = Math.max(att, 0.01); knee = 20; }
    
    n.compressor.threshold.setValueAtTime(state.compThreshold ?? -20, t);
    n.compressor.ratio.setValueAtTime(state.compRatio ?? 2, t);
    n.compressor.attack.setValueAtTime(att, t);
    n.compressor.release.setValueAtTime(state.compRelease ?? 0.25, t);
    n.compressor.knee.setValueAtTime(knee, t);
    n.makeupGain.gain.setValueAtTime(Math.pow(10, (state.compMakeup ?? 0) / 20), t);

    // --- SPATIAL / ATMOS CONTROL ---
    const envType = state.envType ?? 'NONE';
    if (envType !== 'NONE') {
        // FIX: Include sample rate in cache key to avoid mismatch errors (e.g. 48k playback vs 96k export)
        const cacheKey = `${envType}_${ctx.sampleRate}`;
        let buf = envBufferCache.current.get(cacheKey);
        
        if(!buf) {
            buf = createImpulse(ctx, envType);
            envBufferCache.current.set(cacheKey, buf);
        }
        n.convolver.buffer = buf;
    }

    // Panner Positions (Simulating 3D movement)
    // Height (0 to 100 mapped to Y axis 0 to 20)
    const heightY = ((state.spatialHeight || 0) / 100) * 20;
    n.pannerHeight.positionY.setTargetAtTime(heightY, t, 0.1);

    // Rear (0 to 100 mapped to Z axis -5 to +20)
    const rearZ = ((state.spatialRear || 0) / 100) * 20;
    n.pannerRear.positionZ.setTargetAtTime(rearZ, t, 0.1);
    
    // Mix Logic (Strictly respects spatialMode toggle for A/B)
    const dryAmt = 1.0;
    let wetAmt = (state.spatialWidth || 0) / 100; // General width drives the wet mix
    
    if (state.spatialMode === false) {
        wetAmt = 0; // Bypass Spatial Processing
    }
    
    // Smooth transition to avoid clicks when toggling
    n.spatialDryGain.gain.setTargetAtTime(dryAmt, t, 0.05);
    n.spatialWetGain.gain.setTargetAtTime(wetAmt, t, 0.05);

    // Saturation
    const drive = state.saturationDrive ?? 0;
    n.saturator.curve = makeSaturationCurve(drive / 5);

    // Limiter
    const limThresh = state.limiterThreshold ?? 0;
    const limCeiling = state.limiterCeiling ?? -0.1;
    n.limiterPreGain.gain.setValueAtTime(Math.pow(10, limThresh / 20), t);
    const strictCeiling = Math.min(-0.2, limCeiling);
    n.limiter.threshold.setValueAtTime(strictCeiling, t);
  };

  // --- AUDIO INIT (REALTIME) ---
  const initAudioEngine = () => {
      if (ctxRef.current) return;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;

      const nodes = buildGraph(ctx, ctx.destination);
      
      // Analyzers for realtime
      nodes.inAn = ctx.createAnalyser(); nodes.inAn.fftSize = 256;
      nodes.outAn = ctx.createAnalyser(); nodes.outAn.fftSize = 512; // Higher Res for Spectrum
      nodes.outAn.smoothingTimeConstant = 0.8;
      
      // Insert Analyzers
      nodes.inputGain.disconnect(); nodes.inputGain.connect(nodes.inAn); nodes.inAn.connect(nodes.wowDelay);
      nodes.limiter.disconnect(); nodes.limiter.connect(nodes.outAn); nodes.outAn.connect(ctx.destination);

      if (audioElRef.current) {
          sourceRef.current = ctx.createMediaElementSource(audioElRef.current);
          sourceRef.current.connect(nodes.inputGain);
      }
      nodesRef.current = nodes;
  };

  useEffect(() => {
    if (!ctxRef.current || !nodesRef.current.inputGain) return;
    applyDspToNodes(nodesRef.current, ctxRef.current, dsp);
  }, [dsp]);

  // --- RENDER LOOP (METERS + SPECTRUM) ---
  useEffect(() => {
    const update = () => {
      if (ctxRef.current && nodesRef.current.inAn) {
        const n = nodesRef.current;
        
        // 1. RMS METERS
        const getRMS = (an: AnalyserNode) => {
           const d = new Float32Array(an.fftSize);
           an.getFloatTimeDomainData(d);
           let s = 0;
           for(let x of d) s += x*x;
           return 20 * Math.log10(Math.sqrt(s/d.length) || 0.0001);
        };
        const iL = getRMS(n.inAn);
        const oL = getRMS(n.outAn);
        
        let grVal = 0;
        // Safety for compThreshold
        const thresh = dsp?.compThreshold ?? -20;
        const ratio = dsp?.compRatio ?? 2;
        if (iL > thresh) grVal = (iL - thresh) * (1 - 1/ratio);

        setInL(iL); setInR(iL); setOutL(oL); setOutR(oL); setGr(Math.min(grVal, 20));

        // 2. SPECTRUM ANALYZER DRAWING
        if (canvasRef.current && n.outAn) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const bufferLength = n.outAn.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                n.outAn.getByteFrequencyData(dataArray);

                const width = canvas.width;
                const height = canvas.height;
                ctx.clearRect(0, 0, width, height);

                // Draw Background Grid
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, width, height);
                ctx.strokeStyle = '#222';
                ctx.beginPath();
                ctx.moveTo(0, height/2); ctx.lineTo(width, height/2);
                ctx.moveTo(width/3, 0); ctx.lineTo(width/3, height);
                ctx.moveTo(2*width/3, 0); ctx.lineTo(2*width/3, height);
                ctx.stroke();

                const barWidth = (width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for(let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] / 255 * height;
                    
                    // Gradient based on frequency
                    const r = i > bufferLength / 2 ? 255 : 100 + (i * 2);
                    const g = 50;
                    const b = 50 + (128 - i/2);

                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            }
        }

        rafRef.current = requestAnimationFrame(update);
      }
    };
    if (isPlaying) update();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, dsp]);

  // --- HANDLERS ---
  const togglePlay = () => {
      if (!audioUrl) return;
      initAudioEngine();
      if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
      
      if (isPlaying) audioElRef.current?.pause();
      else audioElRef.current?.play();
      setIsPlaying(!isPlaying);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
          setAudioFile(f);
          setAudioUrl(URL.createObjectURL(f));
          setAiReport(null);
          
          // AUTO-ANALYZE ON UPLOAD
          setAnalyzing(true);
          try {
              const buffer = await f.arrayBuffer();
              const offlineCtx = new OfflineAudioContext(1, 44100 * 2, 44100); 
              const audioBuffer = await offlineCtx.decodeAudioData(buffer);
              
              const result = await performDeepAnalysisAndMaster({
                  bpm: 124, peak: -2.0, rms: -10.0, clippingDetected: false, duration: audioBuffer.duration,
                  spectralCutoff: 17500
              });
              
              setSelectedProfileId(result.selectedProfileId);
              setDsp(result.dspState);
              setAiReport(result.aiDetectionReport);
          } catch (e) {
              console.error(e);
          } finally {
              setAnalyzing(false);
          }
      }
  };

  const loadProfile = (pid: ProfileType) => {
      setSelectedProfileId(pid);
      setDsp(PROFILES[pid].defaultDsp);
      setShowProfileMenu(false);
  };

  const handleAiAnalyze = async () => {
      if (!audioFile) return;
      setAnalyzing(true);
      try {
          const buffer = await audioFile.arrayBuffer();
          const offlineCtx = new OfflineAudioContext(1, 44100 * 2, 44100); 
          const audioBuffer = await offlineCtx.decodeAudioData(buffer);
          
          const result = await performDeepAnalysisAndMaster({
              bpm: 124, peak: -2.0, rms: -10.0, clippingDetected: false, duration: audioBuffer.duration,
              spectralCutoff: 17500
          });
          
          setSelectedProfileId(result.selectedProfileId);
          setDsp(result.dspState);
          setAiReport(result.aiDetectionReport);
      } catch (e) {
          console.error(e);
      } finally {
          setAnalyzing(false);
      }
  };

  const handleDownload = async () => {
      if (!audioFile) return;
      setIsProcessingDownload(true);
      
      // Use a let variable for the context to ensure we can close it in finally block
      let decodeCtx: AudioContext | null = null;

      try {
          const fileBuf = await audioFile.arrayBuffer();
          
          // Create a new context specifically for decoding. 
          // We don't use the main ref one to avoid state conflicts.
          decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const decodedBuffer = await decodeCtx.decodeAudioData(fileBuf);
          
          // HI-RES EXPORT LOGIC (96kHz)
          const isHiRes = dsp?.spatialMode === true; 
          const targetSampleRate = isHiRes ? 96000 : 44100;
          
          // Calculate correct length based on sample rate ratio
          // If source is 44.1k and target is 96k, duration is same, but sample count differs.
          const length = Math.ceil(decodedBuffer.duration * targetSampleRate);

          const offlineCtx = new OfflineAudioContext(2, length, targetSampleRate);
          
          // Re-create graph for offline context
          const source = offlineCtx.createBufferSource();
          source.buffer = decodedBuffer;
          
          const graph = buildGraph(offlineCtx, offlineCtx.destination);
          
          source.connect(graph.inputGain);
          applyDspToNodes(graph, offlineCtx, dsp);
          source.start();
          
          const renderedBuffer = await offlineCtx.startRendering();
          const wavBlob = bufferToWav(renderedBuffer, renderedBuffer.length);
          const url = URL.createObjectURL(wavBlob);
          
          // Robust download triggering
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `Mastered_${isHiRes ? 'HiRes_Atmos_' : ''}${audioFile.name.replace(/\.[^/.]+$/, "")}.wav`;
          
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          setTimeout(() => {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
          }, 100);

      } catch (e) {
          console.error("Download failed", e);
          alert("Error exportando el archivo. Intenta de nuevo. Detalles en consola.");
      } finally {
          // Always close the decode context
          if (decodeCtx) {
              await decodeCtx.close();
          }
          setIsProcessingDownload(false);
      }
  };

  // SAFETY: Ensure currentProfile exists
  const currentProfile = PROFILES[selectedProfileId] || PROFILES[ProfileType.BILLBOARD_POP];

  return (
    <div className="flex flex-col h-full max-w-[1600px] mx-auto space-y-4">
      <audio ref={audioElRef} src={audioUrl || ''} onEnded={() => setIsPlaying(false)} crossOrigin="anonymous"/>

      {/* --- MASTER CONTROL SECTION --- */}
      <div className="grid grid-cols-12 gap-4">
          
          {/* TRANSPORT & INFO (LEFT) */}
          <div className="col-span-12 lg:col-span-8 bg-[#0c0c0e] border border-zinc-900 rounded-sm p-4 relative shadow-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-600 animate-pulse' : 'bg-zinc-800'}`}></div>
                     <span className="text-xs font-mono text-zinc-400 tracking-widest">TRANSPORT CONTROL</span>
                 </div>
                 {/* PROFILE DROPDOWN */}
                 <div className="relative">
                      <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-sm border border-zinc-800 transition-all">
                          <span className="text-xl">{currentProfile.icon}</span>
                          <div className="text-left">
                              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Master Profile</div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">{currentProfile.name} <ChevronDown className="w-3 h-3"/></div>
                          </div>
                      </button>
                      {showProfileMenu && (
                          <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                              {Object.values(PROFILES).map((p) => (
                                  <button 
                                      key={p.id}
                                      onClick={() => loadProfile(p.id)}
                                      className={`w-full text-left px-4 py-3 border-b border-zinc-900 hover:bg-zinc-900 flex items-center gap-3 ${selectedProfileId === p.id ? 'bg-red-900/10 text-white' : 'text-zinc-400'}`}
                                  >
                                      <span className="text-lg">{p.icon}</span>
                                      <div>
                                          <div className="text-xs font-bold">{p.name}</div>
                                          <div className="text-[9px] text-zinc-600">{p.description}</div>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      )}
                 </div>
              </div>

              <div className="flex items-center gap-6">
                  {/* PLAY BUTTONS */}
                  <div className="flex gap-2">
                      <button 
                          onClick={togglePlay} 
                          className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${isPlaying ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-black border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}
                      >
                          {isPlaying ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current ml-1"/>}
                      </button>
                      {!audioUrl && (
                          <label className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
                              <Upload className="w-6 h-6"/>
                              <input type="file" onChange={handleUpload} className="hidden" accept="audio/*"/>
                          </label>
                      )}
                  </div>

                  {/* SPECTRUM ANALYZER / FILE INFO */}
                  <div className="flex-1 bg-black h-16 rounded-sm border border-zinc-900 flex items-center relative overflow-hidden">
                      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" width={400} height={100}></canvas>
                      
                      <div className="relative z-10 px-4 flex flex-col w-full pointer-events-none">
                          {audioFile ? (
                             <>
                                <span className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Active Waveform</span>
                                <span className="text-sm font-mono text-white truncate">{audioFile.name}</span>
                                <span className="text-[10px] text-zinc-600 mt-1 flex items-center gap-2">
                                  {dsp?.spatialMode ? (
                                    <>
                                        <span className="text-blue-400 font-bold flex items-center gap-1 animate-pulse"><Globe className="w-3 h-3"/> ATMOS BINAURAL</span>
                                        <span className="text-zinc-700">|</span>
                                        <span className="text-zinc-400">96kHz</span>
                                    </>
                                  ) : (
                                    <>
                                        <span className="text-zinc-400 flex items-center gap-1"><Headphones className="w-3 h-3"/> STEREO</span>
                                        <span className="text-zinc-700">|</span>
                                        <span className="text-zinc-500">48kHz</span>
                                    </>
                                  )}
                                </span>
                             </>
                          ) : (
                             <span className="text-xs font-mono text-zinc-700 text-center w-full">NO SIGNAL</span>
                          )}
                      </div>
                  </div>
              </div>

              {/* AI ACTION STRIP */}
              <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      {aiReport && (
                          <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                              <Fingerprint className={`w-4 h-4 ${aiReport.isAi ? 'text-red-500' : 'text-green-500'}`} />
                              <div className="flex flex-col leading-none">
                                  <span className="text-[8px] text-zinc-500 font-bold uppercase">Source Origin</span>
                                  <span className={`text-[10px] font-bold ${aiReport.isAi ? 'text-red-500' : 'text-green-500'}`}>
                                      {aiReport.isAi ? 'ARTIFICIAL / GENERATED' : 'ORGANIC / HUMAN'}
                                  </span>
                              </div>
                          </div>
                      )}
                      {analyzing && <span className="text-[10px] text-zinc-500 animate-pulse">Running Deep Spectral Analysis...</span>}
                  </div>

                  {audioFile && (
                        <button 
                          onClick={handleDownload}
                          disabled={isProcessingDownload}
                          className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-2 uppercase tracking-wider bg-red-950/20 px-3 py-1 rounded border border-red-900/50 hover:bg-red-950/40 transition-all"
                        >
                          {isProcessingDownload ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Download className="w-3 h-3"/>}
                          Export Master WAV {dsp?.spatialMode && '(Hi-Res)'}
                        </button>
                  )}
              </div>
          </div>

          {/* MASTER METERS (RIGHT) */}
          <div className="col-span-12 lg:col-span-4 bg-[#0c0c0e] border border-zinc-900 rounded-sm p-4 relative shadow-2xl flex flex-col">
               <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-mono text-zinc-500">STEREO BUS OUTPUT</span>
                   <span className="text-[10px] font-mono text-red-500 font-bold">LOUDNESS UNIT</span>
               </div>
               <div className="flex-1 flex gap-2">
                   <Meter value={inL} label="IN L" color="bg-zinc-500" height="h-full"/>
                   <Meter value={inR} label="IN R" color="bg-zinc-500" height="h-full"/>
                   <div className="w-px bg-zinc-800 mx-2"></div>
                   <Meter value={gr * -1} label="GR" max={0} min={-20} color="bg-red-600" height="h-full"/>
                   <div className="w-px bg-zinc-800 mx-2"></div>
                   <Meter value={outL} label="OUT L" color="bg-green-500" height="h-full"/>
                   <Meter value={outR} label="OUT R" color="bg-green-500" height="h-full"/>
               </div>
          </div>
      </div>

      {/* --- RACK STACK (SIGNAL FLOW) --- */}
      <div className="grid grid-cols-12 gap-4 pb-20">
          
          {/* ROW 1: PRE-PROC */}
          <div className="col-span-12 md:col-span-4 h-56">
             <RackModule title="01 / INPUT PRE-AMP" color="text-zinc-400">
                <div className="h-full flex flex-col justify-between py-2">
                    <div className="flex justify-around">
                         <Knob label="TRIM" value={dsp?.inputGain} min={-20} max={10} unit="dB" onChange={v => setDsp(p => ({...p, inputGain: v}))} color="text-red-600" size="lg"/>
                         <Knob label="WIDTH" value={dsp?.stereoWidth} min={0} max={200} unit="%" onChange={v => setDsp(p => ({...p, stereoWidth: v}))} color="text-zinc-400" size="lg"/>
                    </div>
                    <div className="bg-black/50 p-2 rounded border border-zinc-800 mx-2">
                         <div className="text-[8px] text-zinc-600 uppercase text-center mb-1">Pristine Signal Path</div>
                         <div className="w-full h-1 bg-zinc-900 overflow-hidden"><div className="h-full bg-green-900 w-[100%] opacity-50"></div></div>
                    </div>
                </div>
             </RackModule>
          </div>
          
          <div className="col-span-12 md:col-span-4 h-56">
             <RackModule title="02 / AI HUMANIZER" color="text-orange-500" rightElement={<span className="text-[9px] text-orange-500 font-mono border border-orange-900 px-1">OPTIONAL</span>}>
                <div className="h-full flex flex-col justify-center gap-4">
                    <div className="flex justify-around">
                        <Knob label="HUMANIZE" value={dsp?.humanizeWow} min={0} max={100} onChange={v => setDsp(p => ({...p, humanizeWow: v}))} color="text-orange-500"/>
                        <Knob label="DRIFT" value={dsp?.humanizeFlutter} min={0} max={100} onChange={v => setDsp(p => ({...p, humanizeFlutter: v}))} color="text-orange-500"/>
                    </div>
                    <div className="px-4">
                        <div className="flex justify-between text-[8px] text-zinc-500 mb-1"><span>ANALOG NOISE FLOOR</span><span>{dsp?.humanizeNoise || 0}%</span></div>
                        <input type="range" min="0" max="100" value={dsp?.humanizeNoise || 0} onChange={(e) => setDsp(prev => ({...prev, humanizeNoise: parseInt(e.target.value)}))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-orange-600 [&::-webkit-slider-thumb]:rounded-full" />
                    </div>
                </div>
             </RackModule>
          </div>

          <div className="col-span-12 md:col-span-4 h-56">
             <RackModule title="03 / ATMOS SPATIALIZER" color="text-purple-400" active={dsp?.spatialMode} onToggle={() => setDsp(p => ({...p, spatialMode: !p.spatialMode}))}>
                <div className="h-full flex flex-col justify-between py-2">
                    <div className="px-4 flex justify-center">
                         <div className={`text-[9px] font-mono px-3 py-1 rounded mb-2 inline-block transition-colors ${dsp?.spatialMode ? 'bg-purple-900/40 text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'}`}>
                             {dsp?.spatialMode ? 'BINAURAL 3D ACTIVE' : 'STEREO BYPASS'}
                         </div>
                    </div>
                    <div className="flex justify-around">
                        <Knob label="WIDTH" value={dsp?.spatialWidth} min={0} max={100} unit="%" onChange={v => setDsp(p => ({...p, spatialWidth: v}))} color="text-purple-500"/>
                        <Knob label="HEIGHT" value={dsp?.spatialHeight} min={0} max={100} unit="%" onChange={v => setDsp(p => ({...p, spatialHeight: v}))} color="text-purple-400"/>
                        <Knob label="REAR" value={dsp?.spatialRear} min={0} max={100} unit="%" onChange={v => setDsp(p => ({...p, spatialRear: v}))} color="text-purple-600"/>
                    </div>
                </div>
             </RackModule>
          </div>

          {/* ROW 2: EQ (FULL WIDTH) */}
          <div className="col-span-12 h-64">
             <RackModule title="04 / PARAMETRIC EQ-4000" color="text-blue-400">
                 <div className="h-full flex items-center justify-between px-2 lg:px-12 gap-2 lg:gap-8">
                     {/* BANDS */}
                     {[
                        { label: 'LOW', freq: dsp?.eqLowFreq, gain: dsp?.eqLowGain, setF: (v:number)=>setDsp(p=>({...p, eqLowFreq:v})), setG: (v:number)=>setDsp(p=>({...p, eqLowGain:v})), minF: 20, maxF: 200 },
                        { label: 'LO-MID', freq: dsp?.eqLowMidFreq, gain: dsp?.eqLowMidGain, setF: (v:number)=>setDsp(p=>({...p, eqLowMidFreq:v})), setG: (v:number)=>setDsp(p=>({...p, eqLowMidGain:v})), minF: 200, maxF: 1000 },
                        { label: 'HI-MID', freq: dsp?.eqHighMidFreq, gain: dsp?.eqHighMidGain, setF: (v:number)=>setDsp(p=>({...p, eqHighMidFreq:v})), setG: (v:number)=>setDsp(p=>({...p, eqHighMidGain:v})), minF: 1000, maxF: 5000 },
                        { label: 'HIGH', freq: dsp?.eqHighFreq, gain: dsp?.eqHighGain, setF: (v:number)=>setDsp(p=>({...p, eqHighFreq:v})), setG: (v:number)=>setDsp(p=>({...p, eqHighGain:v})), minF: 5000, maxF: 20000 },
                     ].map((band, i) => (
                         <div key={i} className="flex-1 flex flex-col items-center gap-4 border-r last:border-0 border-zinc-800/50 relative">
                             <div className="text-[10px] font-bold text-blue-500">{band.label}</div>
                             <Knob label="GAIN" value={band.gain} min={-12} max={12} unit="dB" onChange={band.setG} color="text-blue-400" size="lg"/>
                             <div className="flex flex-col items-center w-full px-4">
                                 <span className="text-[9px] font-mono text-zinc-500 mb-1">{band.freq || 0}Hz</span>
                                 <input type="range" min={band.minF} max={band.maxF} value={band.freq || 0} onChange={(e) => band.setF(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full" />
                             </div>
                         </div>
                     ))}
                 </div>
             </RackModule>
          </div>

          {/* ROW 3: COMPRESSOR (FULL WIDTH) */}
          <div className="col-span-12 h-64">
             <RackModule title="05 / DYNAMICS PROCESSOR" color="text-amber-500">
                <div className="h-full flex flex-col lg:flex-row gap-8 items-center px-4 lg:px-12">
                     <div className="flex flex-col gap-2 w-full lg:w-48">
                         <div className="text-[9px] text-zinc-500 font-bold uppercase mb-2">Circuit Type</div>
                         {(['VCA_BUS', 'FET_1176', 'OPTO_2A'] as CompressorModel[]).map(m => (
                             <button 
                                key={m}
                                onClick={() => setDsp(p => ({...p, compModel: m}))}
                                className={`text-[10px] font-bold px-3 py-2 rounded border text-left transition-all ${dsp?.compModel === m ? 'bg-amber-600/20 border-amber-500 text-amber-500' : 'bg-black border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                             >
                                {m.replace('_', ' ')}
                             </button>
                         ))}
                     </div>
                     
                     <div className="w-px h-32 bg-zinc-800 hidden lg:block"></div>

                     <div className="flex-1 grid grid-cols-4 gap-4 w-full">
                         <Knob label="THRESHOLD" value={dsp?.compThreshold} min={-60} max={0} unit="dB" onChange={v => setDsp(p => ({...p, compThreshold: v}))} color="text-amber-500" size="lg"/>
                         <Knob label="RATIO" value={dsp?.compRatio} min={1.5} max={20} unit=":1" onChange={v => setDsp(p => ({...p, compRatio: v}))} color="text-amber-500" size="lg"/>
                         <Knob label="ATTACK" value={(dsp?.compAttack || 0) * 1000} min={0.1} max={100} unit="ms" onChange={v => setDsp(p => ({...p, compAttack: v/1000}))} color="text-zinc-400"/>
                         <Knob label="RELEASE" value={(dsp?.compRelease || 0) * 1000} min={10} max={1000} unit="ms" onChange={v => setDsp(p => ({...p, compRelease: v/1000}))} color="text-zinc-400"/>
                     </div>
                </div>
             </RackModule>
          </div>

          {/* ROW 4: LIMITER (FULL WIDTH) */}
          <div className="col-span-12 h-40">
             <RackModule title="06 / MASTER LIMITER (ZERO CLIP)" color="text-red-600">
                 <div className="h-full flex items-center justify-between px-4 lg:px-20 gap-8">
                      <div className="flex-1 flex items-center gap-8 border-r border-zinc-800 pr-8">
                           <Knob label="CEILING" value={dsp?.limiterCeiling} min={-3} max={0} unit="dB" onChange={v => setDsp(p => ({...p, limiterCeiling: v}))} color="text-zinc-500"/>
                           <div className="flex-1">
                               <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Reduction</div>
                               <div className="w-full bg-zinc-900 h-4 rounded overflow-hidden relative border border-zinc-800">
                                   <div className="absolute right-0 top-0 bottom-0 bg-red-600 transition-all duration-75" style={{width: `${gr * 5}%`}}></div>
                               </div>
                           </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                          <div className="text-right">
                              <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Push Gain</div>
                              <div className="text-2xl font-black text-white font-mono">{(dsp?.limiterThreshold || 0).toFixed(1)} dB</div>
                          </div>
                          <Knob label="MAXIMIZE" value={dsp?.limiterThreshold} min={0} max={12} unit="dB" onChange={v => setDsp(p => ({...p, limiterThreshold: v}))} color="text-red-600" size="lg"/>
                      </div>
                 </div>
             </RackModule>
          </div>

      </div>
    </div>
  );
};