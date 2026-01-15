import React from 'react';
import { Play, Book, Users, PenTool, Trophy, Grid, GraduationCap, Settings, Zap } from 'lucide-react';
import { TechFrame } from '../ui/TechFrame';
import { audio } from '../../utils/audio';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface TitleScreenProps {
    styles: any;
    highScore: number;
    showCRT: boolean;
    onStart: () => void;
    onTraining: () => void;
    onLevelSelect: () => void;
    onCollection: () => void;
    onCredits: () => void;
    onEditor: () => void;
    onSettings: () => void;
    onDebugEvasion: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ styles, highScore, showCRT, onStart, onTraining, onLevelSelect, onCollection, onCredits, onEditor, onSettings, onDebugEvasion }) => {
    
    // Wrapper to ensure AudioContext starts
    const handleStart = () => {
        audio.init();
        onStart();
    };

    const menuItems = [
        { action: handleStart, label: 'Engage' }, // 0
        { action: onTraining, label: 'Training' }, // 1
        { action: onLevelSelect, label: 'Levels' }, // 2
        { action: onCollection, label: 'Data' }, // 3
        { action: onCredits, label: 'Credits' }, // 4
        { action: onSettings, label: 'Settings' } // 5
    ];

    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        items: menuItems.length,
        onSelect: (index) => menuItems[index].action(),
        cols: 1
    });

    const getBtnStyle = (index: number) => {
        const isSelected = selectedIndex === index;
        return `transition-all duration-200 ${isSelected ? 'ring-2 ring-white scale-105 z-10' : 'opacity-80'}`;
    };

    return (
        <div className={`w-screen h-screen flex flex-col items-center justify-center ${styles.bg} ${styles.text} overflow-hidden relative`}>
              {showCRT && <div className="crt-scanlines" />}
              {/* DEV ACCESS BUTTONS */}
              <div className="absolute top-6 right-6 flex flex-col gap-2 items-end z-50">
                  <button 
                      onClick={onEditor}
                      className="flex items-center gap-2 px-4 py-2 bg-black/20 text-gray-500 hover:text-[#C0A080] border border-transparent hover:border-[#C0A080] rounded transition-all group font-mono text-sm uppercase tracking-widest"
                  >
                      <PenTool size={18} className="group-hover:rotate-12 transition-transform" />
                      <span>Dev Access</span>
                  </button>
                  <button 
                      onClick={onDebugEvasion}
                      className="flex items-center gap-2 px-4 py-2 bg-black/20 text-gray-500 hover:text-purple-400 border border-transparent hover:border-purple-400 rounded transition-all group font-mono text-sm uppercase tracking-widest"
                  >
                      <Zap size={18} className="group-hover:rotate-12 transition-transform" />
                      <span>Debug: Evasion</span>
                  </button>
              </div>

              <TechFrame className="p-16 text-center max-w-4xl w-full" color="border-dnd-gold">
                   <h1 className="font-display font-bold text-8xl tracking-tighter mb-4 text-dnd-gold drop-shadow-[0_0_15px_rgba(192,160,128,0.5)]">
                       NEON // OUROBOROS
                   </h1>
                   <p className="font-mono text-2xl uppercase tracking-[0.3em] opacity-60 mb-8">Tactical Snake Action</p>
                   
                   <div className="mb-12 flex justify-center items-center gap-2 text-yellow-500/80 font-mono text-lg">
                       <Trophy size={20} /> HIGH SCORE: {highScore}
                   </div>

                   <div className="flex flex-col gap-6 max-w-md mx-auto">
                       <button 
                            onClick={handleStart} 
                            onMouseEnter={() => setSelectedIndex(0)}
                            className={`group relative py-4 px-8 text-2xl font-bold uppercase tracking-widest ${styles.buttonPrimary} overflow-hidden ${getBtnStyle(0)}`}
                       >
                           <span className="relative z-10 flex items-center justify-center gap-4">
                               <Play className="group-hover:translate-x-1 transition-transform" /> Engage
                           </span>
                       </button>

                       <button 
                            onClick={onTraining} 
                            onMouseEnter={() => setSelectedIndex(1)}
                            className={`group py-3 px-8 text-lg font-bold uppercase tracking-widest bg-cyan-900/50 text-cyan-400 border-2 border-cyan-700 hover:bg-cyan-800 flex items-center justify-center gap-2 ${getBtnStyle(1)}`}
                        >
                           <GraduationCap size={20} /> Training Sim
                       </button>

                       <div className="flex gap-4">
                            <button 
                                onClick={onLevelSelect} 
                                onMouseEnter={() => setSelectedIndex(2)}
                                className={`group flex-1 py-3 px-4 text-lg font-bold uppercase tracking-widest ${styles.buttonSecondary} flex items-center justify-center gap-2 ${getBtnStyle(2)}`}
                            >
                                <Grid size={20} /> Levels
                            </button>
                            <button 
                                onClick={onCollection} 
                                onMouseEnter={() => setSelectedIndex(3)}
                                className={`group flex-1 py-3 px-4 text-lg font-bold uppercase tracking-widest ${styles.buttonSecondary} flex items-center justify-center gap-2 ${getBtnStyle(3)}`}
                            >
                                <Book size={20} /> Data
                            </button>
                       </div>
                       
                       <div className="flex gap-4">
                           <button 
                                onClick={onCredits} 
                                onMouseEnter={() => setSelectedIndex(4)}
                                className={`group flex-1 py-3 px-4 text-lg font-bold uppercase tracking-widest ${styles.buttonSecondary} flex items-center justify-center gap-2 ${getBtnStyle(4)}`}
                            >
                               <Users size={20} /> Credits
                           </button>
                           <button 
                                onClick={onSettings} 
                                onMouseEnter={() => setSelectedIndex(5)}
                                className={`group flex-1 py-3 px-4 text-lg font-bold uppercase tracking-widest ${styles.buttonSecondary} flex items-center justify-center gap-2 ${getBtnStyle(5)}`}
                            >
                               <Settings size={20} /> Settings
                           </button>
                       </div>
                   </div>
              </TechFrame>
          </div>
    );
};