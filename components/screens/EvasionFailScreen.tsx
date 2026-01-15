import React from 'react';
import { TechFrame } from '../ui/TechFrame';
import { GameState } from '../../types';
import { ChevronRight, Coins, AlertTriangle } from 'lucide-react';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface EvasionFailScreenProps {
    gameState: GameState;
    onProceed: () => void;
}

export const EvasionFailScreen: React.FC<EvasionFailScreenProps> = ({ gameState, onProceed }) => {
    // Coins collected during this specific evasion run
    const coinsWon = gameState.evasionState?.coinsCollected || 0;

    useMenuNavigation({
        items: 1,
        onSelect: onProceed
    });

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
            <TechFrame className="max-w-xl w-full p-8 text-center" color="border-red-500">
                <div className="mb-6 flex justify-center text-red-500 animate-pulse">
                     <AlertTriangle size={64} />
                </div>
                
                <h2 className="font-display text-4xl font-bold uppercase tracking-widest text-red-500 mb-2">
                    Evasion Failed
                </h2>
                <p className="font-mono text-gray-400 mb-8 uppercase tracking-widest text-sm">
                    Protocol Terminated. Connection Unstable.
                </p>

                <div className="bg-gray-900/50 border border-gray-700 p-6 rounded mb-8">
                    <div className="text-xs font-mono uppercase text-gray-500 mb-2">Data Salvaged</div>
                    <div className="text-4xl font-display font-bold text-yellow-500 flex items-center justify-center gap-3">
                         <Coins size={32} />
                         <span>{coinsWon} CR</span>
                    </div>
                </div>

                <div className="text-sm font-mono text-gray-500 mb-8 italic">
                    Module Reward Lost. Proceeding to next sector...
                </div>

                <button 
                    onClick={onProceed}
                    className="w-full py-4 bg-red-600/20 hover:bg-red-600/40 border border-red-500 text-red-500 hover:text-white font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group outline-none focus:outline-none ring-4 ring-red-500/50"
                >
                    <span>Initialize Sector {gameState.level + 1}</span>
                    <span className="text-xs opacity-60 ml-2">[ENTER]</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </TechFrame>
        </div>
    );
};