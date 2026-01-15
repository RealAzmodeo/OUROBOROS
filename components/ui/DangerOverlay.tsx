
import React from 'react';

export const DangerOverlay: React.FC<{ count: number; message: string }> = ({ count, message }) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 overflow-hidden pointer-events-none">
        {/* Rolling Scanline Background Effect */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
             style={{ 
                 background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 50%)',
                 backgroundSize: '100% 4px'
             }} 
        />
        <div className="absolute left-0 w-full h-screen bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan-slow z-0 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center justify-center">
             <div className="font-display font-bold text-white tracking-tighter tabular-nums leading-none mix-blend-screen animate-pulse" 
                  style={{ 
                      fontSize: '12rem', 
                      textShadow: '4px 4px 0px rgba(0,0,0,1), -2px -2px 0px rgba(255,255,255,0.2)' 
                  }}>
                {count > 0 ? count : <span className="text-8xl tracking-widest">ENGAGE</span>}
            </div>
            
            <div className="mt-8 flex items-center gap-6">
                 <div className="h-px w-24 bg-white/80" />
                 <span className="font-mono text-white text-xl uppercase tracking-[0.5em] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                    {message}
                 </span>
                 <div className="h-px w-24 bg-white/80" />
            </div>
        </div>

        <style>{`
            @keyframes scan-slow {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }
            .animate-scan-slow {
                animation: scan-slow 3s linear infinite;
            }
        `}</style>
    </div>
);
