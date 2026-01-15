import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { GameState } from '../../types';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface GameOverScreenProps {
    gameState: GameState;
    onRestart: () => void;
    onReturnToMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ gameState, onRestart, onReturnToMenu }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        items: 2,
        active: isVisible,
        onSelect: (index) => {
            if (index === 0) onRestart();
            if (index === 1) onReturnToMenu();
        }
    });

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-end pb-40 pointer-events-none">
            <div 
                className={`text-center space-y-2 mb-12 transition-all duration-1000 pointer-events-auto ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
                <p className="text-red-500 font-mono text-xl uppercase tracking-[0.2em] font-bold drop-shadow-[0_0_10px_rgba(255,0,0,1)]">
                  {gameState.gameOverReason}
                </p>
                <p className="text-yellow-500 font-mono text-lg uppercase tracking-widest opacity-80">
                  Final Score: <span className="font-bold text-white">{gameState.score}</span>
                </p>
            </div>

            <div className={`flex flex-col gap-4 items-center w-full max-w-md pointer-events-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <button 
                    onClick={onRestart}
                    onMouseEnter={() => setSelectedIndex(0)}
                    className={`group relative px-12 py-4 bg-transparent border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white font-bold uppercase tracking-[0.3em] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] w-full overflow-hidden
                        ${selectedIndex === 0 ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] scale-105' : ''}
                    `}
                >
                     <span className="relative z-10 flex items-center justify-center gap-4">
                        <RefreshCw size={20} className={gameState.isTesting ? "" : "animate-spin-slow"} />
                        {gameState.isTesting ? "RETRY TEST" : "SYSTEM REBOOT"}
                     </span>
                </button>
                
                <button 
                  onClick={onReturnToMenu}
                  onMouseEnter={() => setSelectedIndex(1)} 
                  className={`text-gray-500 hover:text-white text-sm font-mono uppercase tracking-[0.3em] hover:underline transition-all mt-4 flex items-center gap-2
                    ${selectedIndex === 1 ? 'text-white underline scale-105' : ''}
                  `}
                >
                    <X size={16} />
                    {gameState.isTesting ? 'Return to Editor' : 'Abort Sequence'}
                </button>
            </div>
        </div>
    );
};