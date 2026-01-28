import { GoogleGenAI } from "@google/genai";
import { DspState, ProfileType } from "../types";
import { PROFILES } from "../constants";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const editImageWithGemini = async (
  base64Image: string,
  prompt: string,
  mimeType: string = 'image/png'
): Promise<string> => {
  try {
    const ai = getAiClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: cleanBase64 } },
          { text: `Edit this image: ${prompt}. Return only the edited image.` },
        ],
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data returned from the model.");
  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    throw error;
  }
};

export const performDeepAnalysisAndMaster = async (
  metrics: { 
    bpm: number; 
    peak: number; 
    rms: number; 
    clippingDetected: boolean;
    duration: number;
    spectralCutoff?: number; 
  }
): Promise<{ 
    dspState: DspState; 
    selectedProfileId: ProfileType;
    analysisSummary: string;
    correctionStrategy: string;
    aiDetectionReport: {
        isAi: boolean;
        confidence: number;
        suspectedModel: string;
    }
}> => {
  try {
    const ai = getAiClient();
    
    // List available profiles for the AI to choose from
    const profileKeys = Object.keys(PROFILES).join(', ');

    const prompt = `
      You are a Senior Mastering Engineer at a major label (Sony/Universal).
      
      INPUT METRICS:
      - RMS: ${metrics.rms.toFixed(2)} dB
      - Peak: ${metrics.peak.toFixed(2)} dB
      - Spectral Cutoff: ${metrics.spectralCutoff ? metrics.spectralCutoff + 'Hz' : 'N/A'}
      - Duration: ${metrics.duration.toFixed(1)}s
      
      AVAILABLE PRESETS:
      ${profileKeys}
      
      TASK 1: GENRE & PRESET MATCHING
      Based on the metrics (RMS/Loudness often indicates genre), select the BEST matching preset ID from the list above.
      
      TASK 2: AI FORENSICS
      - If spectral cutoff < 17.5kHz, it's likely Suno/Udio (Low sample rate generation).
      - If RMS is very high (>-6) with cutoff, highly likely AI.
      
      TASK 3: FINE TUNING
      Return the ID of the selected preset. Also provide a specific 'dspState' object. 
      Start with the default settings for that genre (you know them: Pop=Bright, Trap=Bass, etc) but tweak them slightly for *this* specific analysis.
      
      RETURN JSON ONLY:
      {
        "selectedProfileId": "BILLBOARD_POP" (or others),
        "dspState": { ...full DspState object with numeric values... },
        "analysisSummary": "Detected contemporary Pop arrangement...",
        "correctionStrategy": "Selected 'Billboard Pop' preset. Tightened low-end at 60Hz and added air at 12kHz.",
        "aiDetectionReport": {
            "isAi": boolean,
            "confidence": number,
            "suspectedModel": "string"
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    if (!response.text) throw new Error("No text");
    const result = JSON.parse(response.text);
    
    // 1. VALIDATE PROFILE ID
    let selectedProfileId = result.selectedProfileId as ProfileType;
    if (!selectedProfileId || !PROFILES[selectedProfileId]) {
        selectedProfileId = ProfileType.BILLBOARD_POP;
        result.selectedProfileId = selectedProfileId;
    }
    
    // 2. MERGE DSP STATE (CRITICAL FIX)
    // The AI often returns partial objects. We must merge this over the full default object
    // to ensure no properties (like limiterThreshold) are undefined, which causes toFixed() errors.
    const baseDsp = PROFILES[selectedProfileId].defaultDsp;
    const aiDsp = result.dspState || {};
    
    const safeDsp = { ...baseDsp, ...aiDsp };
    
    // Ensure numeric types (AI might return strings)
    (Object.keys(safeDsp) as Array<keyof DspState>).forEach(key => {
        const val = (safeDsp as any)[key];
        if (typeof val === 'string') {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                (safeDsp as any)[key] = num;
            }
        }
    });

    result.dspState = safeDsp;

    return result;

  } catch (error) {
    // Fallback if AI fails
    console.error("AI Mastering Failed:", error);
    return {
        selectedProfileId: ProfileType.BILLBOARD_POP,
        dspState: PROFILES[ProfileType.BILLBOARD_POP].defaultDsp,
        analysisSummary: "Offline Analysis.",
        correctionStrategy: "Applied default Billboard Pop safety chain due to AI service unavailability.",
        aiDetectionReport: { isAi: false, confidence: 0, suspectedModel: "Unknown" }
    };
  }
};