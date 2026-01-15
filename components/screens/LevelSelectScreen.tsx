
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, FolderOpen } from 'lucide-react';
import { TechFrame } from '../ui/TechFrame';
import { LevelData } from '../../types';
import { STATIC_LEVELS, getCustomLevels, CUSTOM_LEVEL_START_ID, deleteCustomLevel } from '../../data/levels';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface LevelSelectScreenProps {
    styles: any;
    showCRT: boolean;
    onSelectLevel: (levelId: number) => void;
    onBack: () => void;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({ styles, showCRT, onSelectLevel, onBack }) => {
    const [customLevels, setCustomLevels] = useState<LevelData[]>([]);

    useEffect(() => {
        setCustomLevels(getCustomLevels());
    }, []);

    // Navigation Logic
    // Items order: Campaign Levels -> Endless Button -> Custom Levels
    const totalItems = STATIC_LEVELS.length + 1 + customLevels.length;
    
    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        items: totalItems,
        cols: 3,
        onSelect: (index) => {
            if (index < STATIC_LEVELS.length) {
                onSelectLevel(STATIC_LEVELS[index].id);
            } else if (index === STATIC_LEVELS.length) {
                onSelectLevel(STATIC_LEVELS.length + 1); // Endless
            } else {
                const customIndex = index - (STATIC_LEVELS.length + 1);
                onSelectLevel(CUSTOM_LEVEL_START_ID + customIndex);
            }
        },
        onBack
    });

    const handleDeleteCustom = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (confirm("Delete this custom map?")) {
            deleteCustomLevel(index);
            setCustomLevels(getCustomLevels());
        }
    };

    return (
        <div className={`w-screen h-screen flex flex-col items-center justify-center ${styles.bg} ${styles.text} overflow-hidden relative`}>
             {showCRT && <div className="crt-scanlines" />}
             <div className="container max-w-5xl mx-auto p-8 z-10 h-full flex flex-col">
                 <div className="flex items-center gap-4 mb-8 shrink-0">
                     <button onClick={onBack} className="hover:text-white transition-colors flex items-center gap-2 group">
                         <div className="p-2 border border-current rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                            <ArrowLeft size={24} />
                         </div>
                         <span className="text-sm font-mono uppercase tracking-widest hidden group-hover:inline-block">ESC</span>
                     </button>
                     <h1 className="font-display text-5xl font-bold uppercase tracking-widest">Sector Selection</h1>
                 </div>

                 <div className="overflow-y-auto pr-4 custom-scrollbar flex-1 pb-12">
                     {/* CAMPAIGN */}
                     <h2 className="font-mono text-xl uppercase tracking-widest mb-6 border-b border-white/20 pb-2">Campaign Protocols</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                         {STATIC_LEVELS.map((level, idx) => (
                             <button 
                                key={level.id} 
                                onClick={() => onSelectLevel(level.id)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`group text-left outline-none focus:outline-none transition-all duration-200 ${selectedIndex === idx ? 'scale-105 z-10' : 'opacity-80 hover:opacity-100'}`}
                             >
                                <TechFrame 
                                    color={selectedIndex === idx ? "border-white" : "border-dnd-steel"} 
                                    className={`h-full p-6 ${styles.card} ${selectedIndex === idx ? 'bg-dnd-dark border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`font-mono text-4xl font-bold transition-opacity ${selectedIndex === idx ? 'text-white opacity-100' : 'text-dnd-gold opacity-50'}`}>
                                            {level.id.toString().padStart(2, '0')}
                                        </span>
                                        {level.id === 1 && <span className="text-xs uppercase bg-dnd-crimson text-white px-2 py-1 tracking-widest">Tutorial</span>}
                                    </div>
                                    <h3 className={`font-display text-2xl font-bold uppercase tracking-widest mb-2 ${selectedIndex === idx ? 'text-white' : ''}`}>
                                        {level.name}
                                    </h3>
                                    <div className="flex gap-4 text-xs font-mono opacity-60">
                                        <span>INT: {level.integrity}</span>
                                        <span>SPD: {level.tickRate}ms</span>
                                    </div>
                                </TechFrame>
                             </button>
                         ))}
                     </div>
                     
                     {/* ENDLESS & CUSTOM HEADER */}
                     <h2 className="font-mono text-xl uppercase tracking-widest mb-6 border-b border-white/20 pb-2">Special Operations</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         
                         {/* ENDLESS BUTTON */}
                         <button 
                            onClick={() => onSelectLevel(STATIC_LEVELS.length + 1)} 
                            onMouseEnter={() => setSelectedIndex(STATIC_LEVELS.length)}
                            className={`group text-left outline-none focus:outline-none transition-all duration-200 ${selectedIndex === STATIC_LEVELS.length ? 'scale-105 z-10' : 'opacity-80 hover:opacity-100'}`}
                        >
                            <TechFrame 
                                color="border-dnd-crimson" 
                                className={`h-full p-6 bg-dnd-crimson/10 border-2 border-dnd-crimson ${selectedIndex === STATIC_LEVELS.length ? 'bg-dnd-crimson/30 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : ''}`}
                            >
                                 <div className="flex justify-between items-start mb-4">
                                    <span className="font-mono text-4xl font-bold text-red-500">∞</span>
                                </div>
                                <h3 className="font-display text-2xl font-bold uppercase tracking-widest mb-2 text-red-400 group-hover:text-white">Endless Mode</h3>
                                <p className="text-xs font-mono text-red-300 opacity-80">
                                    Procedurally generated sectors.
                                </p>
                            </TechFrame>
                         </button>

                         {/* CUSTOM LEVELS */}
                         {customLevels.map((level, idx) => {
                             const navIndex = STATIC_LEVELS.length + 1 + idx;
                             return (
                                 <button 
                                    key={`custom-${idx}`} 
                                    onClick={() => onSelectLevel(CUSTOM_LEVEL_START_ID + idx)}
                                    onMouseEnter={() => setSelectedIndex(navIndex)}
                                    className={`group text-left outline-none focus:outline-none transition-all duration-200 ${selectedIndex === navIndex ? 'scale-105 z-10' : 'opacity-80 hover:opacity-100'}`}
                                >
                                    <TechFrame 
                                        color="border-cyan-500" 
                                        className={`h-full p-6 bg-cyan-900/10 border-2 border-cyan-500 ${selectedIndex === navIndex ? 'bg-cyan-900/30 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <FolderOpen className="text-cyan-500" size={32} />
                                            <div 
                                                onClick={(e) => handleDeleteCustom(e, idx)}
                                                className="p-1 text-cyan-700 hover:text-red-500 hover:bg-black/50 rounded transition-colors z-20"
                                            >
                                                <Trash2 size={16} />
                                            </div>
                                        </div>
                                        <h3 className="font-display text-xl font-bold uppercase tracking-widest mb-2 text-cyan-400 group-hover:text-white truncate">
                                            {level.name}
                                        </h3>
                                        <div className="flex gap-4 text-xs font-mono text-cyan-300 opacity-80">
                                            <span>INT: {level.integrity}</span>
                                            <span>SPD: {level.tickRate}ms</span>
                                        </div>
                                    </TechFrame>
                                 </button>
                             );
                         })}

                         {customLevels.length === 0 && (
                             <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded opacity-50 font-mono text-sm text-center">
                                 NO CUSTOM MAPS FOUND.<br/>CREATE ONE IN THE EDITOR!
                             </div>
                         )}
                     </div>
                 </div>
             </div>
        </div>
    );
};
