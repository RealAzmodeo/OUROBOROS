import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

interface TouchControlsProps {
    onMove: (dir: { x: number, y: number }) => void;
    onAbility: () => void;
    styles: any;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onMove, onAbility, styles }) => {
    return (
        <div className="fixed bottom-8 left-0 right-0 px-8 flex justify-between items-end pointer-events-none z-[100]">
            {/* D-PAD */}
            <div className="grid grid-cols-3 gap-2 pointer-events-auto bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                <div />
                <button
                    className="p-4 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all"
                    onTouchStart={() => onMove({ x: 0, y: -1 })}
                    onClick={() => onMove({ x: 0, y: -1 })}
                >
                    <ArrowUp size={32} />
                </button>
                <div />

                <button
                    className="p-4 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all"
                    onTouchStart={() => onMove({ x: -1, y: 0 })}
                    onClick={() => onMove({ x: -1, y: 0 })}
                >
                    <ArrowLeft size={32} />
                </button>
                <div />
                <button
                    className="p-4 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all"
                    onTouchStart={() => onMove({ x: 1, y: 0 })}
                    onClick={() => onMove({ x: 1, y: 0 })}
                >
                    <ArrowRight size={32} />
                </button>

                <div />
                <button
                    className="p-4 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all"
                    onTouchStart={() => onMove({ x: 0, y: 1 })}
                    onClick={() => onMove({ x: 0, y: 1 })}
                >
                    <ArrowDown size={32} />
                </button>
                <div />
            </div>

            {/* ABILITY BUTTON */}
            <button
                className="w-24 h-24 pointer-events-auto bg-cyan-500/20 backdrop-blur-md border-2 border-cyan-500/50 rounded-full flex items-center justify-center text-cyan-400 active:scale-90 active:bg-cyan-500/40 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                onTouchStart={onAbility}
                onClick={onAbility}
            >
                <Zap size={48} />
            </button>
        </div>
    );
};
