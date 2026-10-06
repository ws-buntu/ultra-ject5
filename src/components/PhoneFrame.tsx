import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Maximize2, Minimize2 } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  const [time, setTime] = useState('08:38 AM');
  const [isFrameless, setIsFrameless] = useState(() => {
    try {
      return localStorage.getItem('ultra_jects5_frameless') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Sync clock with user's system time or keep it updated
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${String(hours).padStart(2, '0')}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleFrameless = () => {
    const next = !isFrameless;
    setIsFrameless(next);
    try {
      localStorage.setItem('ultra_jects5_frameless', String(next));
    } catch {}
  };

  if (isFrameless) {
    return (
      <div id="phone-frame-outer" className="w-full min-h-screen bg-[#0a0a0a] flex flex-col font-sans antialiased text-stone-100">
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-screen relative shadow-2xl">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="phone-frame-outer" className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 md:p-6 font-sans antialiased overflow-y-auto selection:bg-stone-700 selection:text-white">
      {/* Visual background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />

      {/* Frame Wrapper */}
      <div className="relative w-full max-w-md h-[100dvh] sm:h-[860px] sm:max-h-[95vh] bg-[#0a0a0a] sm:rounded-[42px] shadow-2xl sm:border-[10px] border-stone-900 flex flex-col overflow-hidden ring-1 ring-white/5 ring-offset-2 ring-offset-[#050505]">
        
        {/* Notch Container */}
        <div className="h-6 bg-[#0a0a0a] flex justify-center items-center z-50 shrink-0 select-none">
          <div className="w-28 h-3.5 bg-black rounded-b-xl flex items-center justify-between px-3">
            {/* Camera sensor */}
            <div className="w-2 h-2 rounded-full bg-stone-900 border border-stone-800/50" />
            {/* Speaker bar */}
            <div className="w-10 h-1 bg-stone-900 rounded-full" />
            {/* Proximity sensor */}
            <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-7 bg-[#0a0a0a] flex items-center justify-between px-5 text-stone-500 select-none text-[11px] font-medium z-40 shrink-0">
          {/* Simulated Network & Local Time */}
          <span>{time}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-wider text-stone-600 font-bold">5G</span>
            <Wifi className="w-3 h-3 text-stone-500" />
            <Battery className="w-3.5 h-3.5 text-stone-500" />
            <button
              onClick={toggleFrameless}
              className="ml-1 text-stone-600 hover:text-stone-300 transition-colors p-0.5 cursor-pointer"
              title="Expand to Fullscreen View"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 bg-[#0a0a0a] flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* Home Screen Indicator Pill */}
        <div className="h-4 bg-[#0a0a0a] flex items-center justify-center pb-1 z-40 shrink-0 select-none">
          <div className="w-28 h-1 bg-stone-800 rounded-full" />
        </div>
      </div>
      
      {/* Helpful Tip & View Mode Switcher */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mt-2 px-2 text-[10px] text-stone-500 font-mono select-none">
        <span>Ultra-Ject5 Mobile Engine</span>
        <button
          onClick={toggleFrameless}
          className="text-stone-400 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Maximize2 className="w-2.5 h-2.5" /> Full Width Mode
        </button>
      </div>
    </div>
  );
}
