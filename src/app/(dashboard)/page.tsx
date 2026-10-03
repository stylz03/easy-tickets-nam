"use client";
import React, { useState } from 'react';
import { Monitor, Smartphone, Tablet, ExternalLink, Moon, Sun, Trees } from 'lucide-react';

export default function PresentationDashboard() {
  const [active, setActive] = useState(1);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const url = `/design/${active}`;

  // Iframe dimensions based on device
  const getIframeClasses = () => {
    switch (device) {
      case "mobile":
        return "w-[390px] h-[844px] rounded-[3rem] border-[14px] border-slate-800 shadow-2xl shrink-0";
      case "tablet":
        return "w-[820px] h-[1180px] rounded-[2rem] border-[14px] border-slate-800 shadow-2xl shrink-0";
      case "desktop":
      default:
        return "w-full h-full rounded-t-xl border-x-2 border-t-2 border-slate-800 shadow-2xl mt-4";
    }
  };

  return (
    <div className="flex flex-col w-full h-full text-slate-200">
      {/* HEADER */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">ET</div>
          <h1 className="font-semibold text-slate-100 tracking-tight">Easy Tickets <span className="text-slate-500 font-normal">| MVP Showcase</span></h1>
        </div>
        
        {/* DESIGN TOGGLES */}
        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-full border border-slate-700/50 hidden md:flex">
          <button 
            onClick={() => setActive(1)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${active === 1 ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Sun className="w-4 h-4" /> Light
          </button>
          <button 
            onClick={() => setActive(2)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${active === 2 ? 'bg-cyan-900 text-cyan-50 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Moon className="w-4 h-4" /> Neon
          </button>
          <button 
            onClick={() => setActive(3)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${active === 3 ? 'bg-amber-900 text-amber-50 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Trees className="w-4 h-4" /> Earthy
          </button>
        </div>

        {/* DEVICE TOGGLES & ACTIONS */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button 
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-md transition-colors ${device === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded-md transition-colors ${device === 'tablet' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-md transition-colors ${device === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          <a 
            href={url} 
            target="_blank" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span className="hidden sm:inline">Open Live</span> <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* VIEWER AREA */}
      <main className="flex-1 flex flex-col items-center overflow-auto bg-[#020617]">
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative flex items-center justify-center ${device !== 'desktop' ? 'h-auto min-h-full py-12' : 'w-full h-full px-8 overflow-hidden'}`}>
          <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-white ${getIframeClasses()}`}>
            <iframe 
              key={`${active}-${device}`} // Force iframe refresh on design switch
              src={url}
              className="w-full h-full border-none"
              title="Design Preview"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
