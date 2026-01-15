import React from 'react';
import { TechFrame } from './TechFrame';
import { Play, Scan, ShieldAlert, Goal, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TutorialStep, Segment, BOARD_HEIGHT_CELLS } from '../../types';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface TutorialOverlayProps {
    step: TutorialStep;
    onDismiss: () => void;
    snakeHead?: Segment;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onDismiss, snakeHead }) => {
    // Dynamic positioning
    let posClass = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"; 

    if (step.highlight === 'snake' && snakeHead) {
        if (snakeHead.y < BOARD_HEIGHT_CELLS / 2) {
             posClass = "bottom-32 left-1/2 -translate-x-1/2";
        } else {
             posClass = "top-32 left-1/2 -translate-x-1/2";
        }
    } else {
        if (step.position === 'top') posClass = "top-32 left-1/2 -translate-x-1/2";
        if (step.position === 'bottom') posClass = "bottom-32 left-1/2 -translate-x-1/2";
    }
    
    if (step.highlight === 'hud_goals' || step.highlight === 'hud_integrity' || step.highlight === 'hud_sequence') {
        posClass = "top-64 left-1/2 -translate-x-1/2";
    }

    useMenuNavigation({
        items: 1,
        onSelect: onDismiss,
        onBack: onDismiss
    });

    return (
        <>
            {step.highlight === 'hud_sequence' && (
                <div className="absolute -top-[5.5rem] left-[46%] -translate-x-1/2 w-64 h-20 border-2 border-[#39FF14] animate-pulse shadow-[0_0_20px_#39FF14] flex items-start justify-center pt-1 z-50 pointer-events-none">
                    <div className="bg-[#39FF14] text-black text-[10px] font-bold px-1">SEQUENCE</div>
                </div>
            )}
            
            {step.highlight === 'hud_integrity' && (
                <div className="absolute -top-[5.5rem] left-[62%] -translate-x-1/2 w-52 h-20 border-2 border-[#39FF14] animate-pulse shadow-[0_0_20px_#39FF14] flex items-start justify-center pt-1 z-50 pointer-events-none">
                        <div className="bg-[#39FF14] text-black text-[10px] font-bold px-1">INTEGRITY</div>
                </div>
            )}

            <div className={`absolute ${posClass} z-50 pointer-events-auto`}>
                <TechFrame color="border-cyan-500" className="bg-black/95 backdrop-blur-md p-6 max-w-md w-full shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-cyan-900/30 border border-cyan-500 rounded-sm text-cyan-400 shrink-0">
                            {step.id === 0 && <Play />}
                            {step.id === 1 && <Scan />}
                            {step.id === 2 && <ShieldAlert className="text-orange-500" />}
                            {step.id === 3 && <ShieldAlert className="text-red-500" />}
                            {step.id === 4 && <Goal />}
                            {step.id === 5 && <Goal />}
                            {step.id === 6 && <CheckCircle2 className="text-green-500" />}
                            {step.id >= 7 && <AlertTriangle className="text-red-500" />}
                            {step.id === 99 && <ShieldAlert className="text-red-500" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-display text-xl font-bold uppercase tracking-widest text-cyan-400 mb-2">
                                {step.title}
                            </h3>
                            <p className="font-mono text-sm text-cyan-100/90 leading-relaxed mb-6 whitespace-pre-wrap">
                                {step.message}
                            </p>
                            
                            <div className="flex justify-end">
                                <button 
                                    onClick={onDismiss}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all font-mono text-xs uppercase tracking-widest group focus:outline-none ring-2 ring-cyan-400"
                                >
                                    <span>{step.id === 100 ? "Initialize" : "Continue"}</span>
                                    <Play size={12} className="group-hover:translate-x-1 transition-transform" />
                                    <span className="text-[10px] opacity-60 ml-2">[ENTER]</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </TechFrame>
            </div>
        </>
    );
};