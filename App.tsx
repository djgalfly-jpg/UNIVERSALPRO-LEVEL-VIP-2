import React, { useState } from 'react';
import { MasteringConsole } from './components/MasteringConsole';
import { ImageStudio } from './components/ImageStudio';
import { Disc3, Image as ImageIcon, Menu, Globe, ShieldCheck, Activity, Box, Lock, LogOut, ChevronRight } from 'lucide-react';

enum Tab {
  MASTERING = 'MASTERING',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  DISTRIBUTION = 'DISTRIBUTION',
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.MASTERING);

  return (
    <div className="h-screen bg-black text-zinc-300 flex font-sans overflow-hidden selection:bg-red-600 selection:text-white">
      
      {/* SIDEBAR NAVIGATION - MAJOR LABEL STYLE */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between shrink-0 z-20">
        <div>
           {/* BRANDING HEADER */}
           <div className="h-16 flex items-center px-6 border-b border-zinc-900 bg-red-600 text-white">
              <Globe className="w-5 h-5 mr-3" />
              <div>
                <h1 className="text-sm font-black tracking-tighter leading-none">UNIVERSAL ORCHARD</h1>
                <p className="text-[9px] font-mono tracking-widest opacity-80">GLOBAL ENTERTAINMENT</p>
              </div>
           </div>

           {/* USER PROFILE */}
           <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                 <span className="font-bold text-xs text-zinc-400">ENG</span>
              </div>
              <div>
                 <div className="text-xs font-bold text-white">Chief Engineer</div>
                 <div className="text-[10px] text-zinc-500 font-mono">ID: SONY-992-X</div>
              </div>
           </div>

           {/* NAVIGATION */}
           <nav className="p-4 space-y-1">
             <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Workstation</div>
             
             <button
               onClick={() => setActiveTab(Tab.MASTERING)}
               className={`w-full px-3 py-3 rounded text-xs font-medium transition-all flex items-center justify-between group
                 ${activeTab === Tab.MASTERING 
                   ? 'bg-zinc-900 text-white border-l-2 border-red-600' 
                   : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                 }`}
             >
               <div className="flex items-center gap-3">
                 <Activity className="w-4 h-4" />
                 <span>Mastering Console</span>
               </div>
               {activeTab === Tab.MASTERING && <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_5px_red]"></div>}
             </button>

             <button
               onClick={() => setActiveTab(Tab.IMAGE_STUDIO)}
               className={`w-full px-3 py-3 rounded text-xs font-medium transition-all flex items-center justify-between group
                 ${activeTab === Tab.IMAGE_STUDIO 
                   ? 'bg-zinc-900 text-white border-l-2 border-red-600' 
                   : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                 }`}
             >
               <div className="flex items-center gap-3">
                 <ImageIcon className="w-4 h-4" />
                 <span>Visual Assets</span>
               </div>
             </button>

             <button disabled className="w-full px-3 py-3 rounded text-xs font-medium text-zinc-700 flex items-center gap-3 cursor-not-allowed opacity-50">
                 <Box className="w-4 h-4" />
                 <span>Global Distribution</span>
             </button>
           </nav>
        </div>

        {/* BOTTOM STATUS */}
        <div className="p-4 bg-zinc-900/50">
           <div className="bg-black border border-zinc-800 rounded p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                 <ShieldCheck className="w-3 h-3 text-red-600" />
                 <span className="text-[10px] font-bold text-red-600 uppercase">Confidential</span>
              </div>
              <p className="text-[9px] text-zinc-500 leading-relaxed">
                 This software is proprietary. Unauthorized access is a violation of international copyright law.
              </p>
           </div>
           <button className="flex items-center gap-2 text-[10px] text-zinc-500 hover:text-white transition-colors w-full justify-center py-2">
              <LogOut className="w-3 h-3" /> SECURITY LOGOUT
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-black overflow-hidden flex flex-col relative">
         {/* TOP BAR */}
         <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 bg-black/95 backdrop-blur z-10">
            <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-mono">PROJECT:</span>
                <span className="text-xs text-white font-bold uppercase tracking-wider">UNTITLED SESSION 001</span>
                <span className="px-2 py-0.5 bg-zinc-900 rounded text-[9px] text-zinc-500 border border-zinc-800">48kHz / 24bit</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-mono text-zinc-400">SERVER: ONLINE (EU-WEST)</span>
                </div>
            </div>
         </header>

         {/* WORKSPACE */}
         <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black pointer-events-none"></div>
            <div className="h-full p-6 overflow-y-auto custom-scrollbar">
                {activeTab === Tab.MASTERING ? <MasteringConsole /> : <ImageStudio />}
            </div>
         </div>
      </main>
    </div>
  );
};

export default App;