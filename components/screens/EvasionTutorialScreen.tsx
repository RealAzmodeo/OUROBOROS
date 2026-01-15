import React from 'react';
import { TechFrame } from '../ui/TechFrame';
import { Play, MoveLeft, MoveRight, Zap } from 'lucide-react';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface EvasionTutorialScreenProps {
    onBegin: () => void;
}

export const EvasionTutorialScreen: React.FC<EvasionTutorialScreenProps> = ({ onBegin }) => {
    
    useMenuNavigation({
        items: 1,
        onSelect: onBegin
    });

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
            <TechFrame className="max-w-2xl w-full p-8" color="border-purple-500">
                <div className="flex items-center gap-4 mb-8 border-b border-purple-500/30 pb-4">
                     <div className="p-3 bg-purple-900/30 border border-purple-500 rounded text-purple-400">
                         <Zap size={32} />
                     </div>
                     <div>
                         <h2 className="font-display text-3xl font-bold uppercase tracking-widest text-purple-400">
                             Secret Protocol Detected
                         </h2>
                         <p className="font-mono text-xs text-purple-200/50 uppercase tracking-widest">
                             Evasion Minigame Interface
                         </p>
                     </div>
                </div>

                <div className="space-y-6 mb-8">
                    <p className="font-mono text-lg text-gray-300 leading-relaxed">
                        You have entered a hidden data stream. 
                        Survive the gauntlet to earn a <span className="text-purple-400 font-bold">BONUS MODULE</span>.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900/50 p-4 border border-gray-700 rounded flex flex-col items-center text-center">
                             <div className="flex gap-2 text-white mb-2">
                                 <MoveLeft size={32} />
                                 <MoveRight size={32} />
                             </div>
                             <div className="font-bold uppercase text-sm text-gray-400 mb-1">Navigation</div>
                             <p className="text-xs font-mono text-gray-500">
                                 Use LEFT and RIGHT arrows to switch lanes.
                             </p>
                        </div>
                        
                        <div className="bg-gray-900/50 p-4 border border-gray-700 rounded flex flex-col items-center text-center">
                             <div className="w-8 h-8 bg-red-600 shadow-[0_0_15px_red] mb-2 rounded-sm" />
                             <div className="font-bold uppercase text-sm text-gray-400 mb-1">Avoid Hazards</div>
                             <p className="text-xs font-mono text-gray-500">
                                 Red Data Spikes are LETHAL. Hitting one ends the protocol immediately.
                             </p>
                        </div>
                    </div>
                    
                    <div className="bg-yellow-900/20 p-4 border border-yellow-700/50 rounded flex items-center gap-4">
                        <div className="text-yellow-500 font-display text-4xl font-bold">!</div>
                        <p className="font-mono text-sm text-yellow-200/80">
                            Collect <span className="text-yellow-400 font-bold">GOLD DATA</span> to earn extra credits. Complete the run to unlock a free upgrade.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={onBegin}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group outline-none focus:outline-none ring-4 ring-purple-500/50"
                >
                    <span>Initiate Sequence</span>
                    <span className="text-xs opacity-60 ml-1">[ENTER]</span>
                    <Play size={20} className="fill-current group-hover:translate-x-1 transition-transform" />
                </button>
            </TechFrame>
        </div>
    );
};