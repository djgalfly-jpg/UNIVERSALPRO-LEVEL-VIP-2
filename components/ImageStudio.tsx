import React, { useState, useRef } from 'react';
import { editImageWithGemini } from '../services/geminiService';
import { Wand2, ImagePlus, Upload, RefreshCw, AlertCircle, Download } from 'lucide-react';

export const ImageStudio: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large. Please use an image under 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!originalImage) return;
    if (!prompt.trim()) {
      setError("Please enter a description of how you want to edit the image.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await editImageWithGemini(originalImage, prompt);
      setGeneratedImage(result);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate image. " + (err.message || "Please try again with a different prompt."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-indigo-400" />
          Nano Banana Studio
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          AI-powered artwork editing. Upload your album cover and use natural language to transform it.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Editor Controls */}
        <div className="flex flex-col gap-6">
          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all
              ${originalImage 
                ? 'border-zinc-700 bg-zinc-900/30' 
                : 'border-indigo-500/50 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500'
              }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleFileChange}
            />
            
            {originalImage ? (
              <div className="relative w-full aspect-square max-h-[300px] flex items-center justify-center overflow-hidden rounded-lg">
                <img src={originalImage} alt="Original" className="object-contain w-full h-full" />
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white backdrop-blur-md">Original</div>
              </div>
            ) : (
              <div className="text-center">
                 <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                    <Upload className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-medium text-zinc-200">Upload Album Artwork</h3>
                 <p className="text-sm text-zinc-500 mt-2">Supports JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-3">
             <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Instructions</label>
             <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., 'Add a vintage retro filter', 'Make it black and white', 'Remove the background person', 'Add neon lights'"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[120px] resize-none"
             />
          </div>

          {/* Action Button */}
          <button
             onClick={handleEdit}
             disabled={loading || !originalImage || !prompt}
             className={`py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all
               ${loading || !originalImage || !prompt
                 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                 : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
               }`}
          >
             {loading ? (
                <>
                   <RefreshCw className="w-5 h-5 animate-spin" /> PROCESSING...
                </>
             ) : (
                <>
                   <Wand2 className="w-5 h-5" /> GENERATE EDIT
                </>
             )}
          </button>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 text-red-400 text-sm">
               <AlertCircle className="w-5 h-5 flex-shrink-0" />
               <p>{error}</p>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 flex flex-col">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-300">Result</h3>
              {generatedImage && (
                <a 
                  href={generatedImage} 
                  download="universal-orchard-edit.png"
                  className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Download className="w-3 h-3" /> Save Image
                </a>
              )}
           </div>

           <div className="flex-1 rounded-lg bg-zinc-900 border border-dashed border-zinc-800 flex items-center justify-center overflow-hidden relative">
              {generatedImage ? (
                 <img src={generatedImage} alt="Generated" className="w-full h-full object-contain animate-fade-in" />
              ) : (
                 <div className="text-center text-zinc-600">
                    {loading ? (
                      <div className="flex flex-col items-center gap-4">
                         <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                         <p className="font-mono text-sm animate-pulse">Gemini 2.5 is thinking...</p>
                      </div>
                    ) : (
                      <>
                        <ImagePlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Edited image will appear here</p>
                      </>
                    )}
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};