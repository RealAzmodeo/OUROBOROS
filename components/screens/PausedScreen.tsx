import React from 'react';
import { Play, X, Zap } from 'lucide-react';
import { GameState } from '../../types';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface PausedScreenProps {
    gameState: GameState;
    onResume: () => void;
    onAbandon: () => void;
    onDebugWin?: () => void;
}

export const PausedScreen: React.FC<PausedScreenProps> = ({ gameState, onResume, onAbandon, onDebugWin }) => {
    
    // Items: Resume, Abandon. Optional: Debug Win.
    const hasDebug = !!(gameState.evasionState && onDebugWin);
    const itemsCount = hasDebug ? 3 : 2;

    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        items: itemsCount,
        onSelect: (index) => {
            if (index === 0) onResume();
            if (hasDebug) {
                if (index === 1) onDebugWin?.();
                if (index === 2) onAbandon();
            } else {
                if (index === 1) onAbandon();
            }
        },
        onBack: onResume
    });

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-end pb-40 pointer-events-none">
            <div className="flex flex-col gap-4 items-center w-full max-w-md pointer-events-auto">
                <button 
                    onClick={onResume} 
                    onMouseEnter={() => setSelectedIndex(0)}
                    className={`group relative px-12 py-4 bg-transparent border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold uppercase tracking-[0.3em] transition-all hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] w-full overflow-hidden
                        ${selectedIndex === 0 ? 'bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.6)] scale-105' : ''}
                    `}
                >
                     <span className="relative z-10 flex items-center justify-center gap-4">
                        <Play size={20} />
                        RESUME
                     </span>
                </button>
                
                {hasDebug && (
                    <button 
                        onClick={onDebugWin} 
                        onMouseEnter={() => setSelectedIndex(1)}
                        className={`group relative px-12 py-3 bg-purple-900/50 border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white font-bold uppercase tracking-[0.2em] transition-all w-full
                            ${selectedIndex === 1 ? 'bg-purple-500 text-white scale-105' : ''}
                        `}
                    >
                         <span className="relative z-10 flex items-center justify-center gap-3 text-sm">
                            <Zap size={16} />
                            DEBUG: FORCE WIN
                         </span>
                    </button>
                )}
                
                <button 
                  onClick={onAbandon} 
                  onMouseEnter={() => setSelectedIndex(hasDebug ? 2 : 1)}
                  className={`text-gray-500 hover:text-red-500 text-sm font-mono uppercase tracking-[0.3em] hover:underline transition-all mt-4 flex items-center gap-2
                    ${selectedIndex === (hasDebug ? 2 : 1) ? 'text-red-500 underline scale-105' : ''}
                  `}
                >
                    <X size={16} />
                    {gameState.isTesting ? 'Return to Editor' : 'Abandon Run'}
                </button>
            </div>
        </div>
    );
};