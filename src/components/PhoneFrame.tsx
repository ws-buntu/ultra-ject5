import React, { useState, useEffect } from 'react';
import { Wifi, Battery, ShieldAlert } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  const [time, setTime] = useState('08:38 AM');

  useEffect(() => {
    // Sync clock with user's system time or keep it updated
    const updateTime = () => {
      const now = new Date();
      // Adjust to 2026-07-18 format or current system time
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

  return (
    <div id="phone-frame-outer" className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased overflow-x-hidden selection:bg-stone-700 selection:text-white">
      {/* Visual background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />

      {/* Frame Wrapper */}
      <div className="relative w-full max-w-[420px] aspect-[9/19.5] bg-[#0a0a0a] rounded-[50px] shadow-2xl border-[11px] border-stone-900 flex flex-col overflow-hidden ring-1 ring-white/5 ring-offset-4 ring-offset-[#050505]">
        
        {/* Notch Container */}
        <div className="absolute top-0 inset-x-0 h-7 bg-[#0a0a0a] flex justify-center z-50">
          <div className="w-36 h-4.5 bg-black rounded-b-2xl flex items-center justify-between px-4">
            {/* Camera sensor */}
            <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800/50" />
            {/* Speaker bar */}
            <div className="w-12 h-1 bg-stone-900 rounded-full" />
            {/* Proximity sensor */}
            <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-10 bg-[#0a0a0a] flex items-end justify-between px-6 pb-1 text-stone-500 select-none text-[11px] font-medium z-40">
          {/* Simulated Network & Local Time */}
          <span>{time}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] tracking-wider text-stone-600 font-bold">5G</span>
            <Wifi className="w-3.5 h-3.5 text-stone-500" />
            <div className="flex items-center gap-0.5">
              <Battery className="w-4 h-4 text-stone-500" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] flex flex-col no-scrollbar">
          {children}
        </div>

        {/* Home Screen Indicator Pill */}
        <div className="h-6 bg-[#0a0a0a] flex items-center justify-center pb-2 z-40 select-none">
          <div className="w-32 h-1 bg-stone-800 rounded-full" />
        </div>
      </div>
      
      {/* Helpful Tip */}
      <div className="mt-4 text-center select-none max-w-sm">
        <p className="text-xs text-stone-500 font-mono">
          Ultra-Ject5 • Secure Session Protocol Active
        </p>
        <p className="text-[10px] text-stone-600 mt-1">
          Designed with high-density mobile layout paradigms for seamless thumb interaction.
        </p>
      </div>
    </div>
  );
}
