import React from 'react';
import { TechFrame } from '../ui/TechFrame';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface CreditsScreenProps {
    styles: any;
    showCRT: boolean;
    onClose: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ styles, showCRT, onClose }) => {
    
    useMenuNavigation({
        items: 1,
        onSelect: onClose,
        onBack: onClose
    });

    return (
        <div className={`w-screen h-screen flex flex-col items-center justify-center ${styles.bg} ${styles.text} overflow-hidden`}>
               {showCRT && <div className="crt-scanlines" />}
               <TechFrame className="p-12 text-center max-w-2xl w-full" color="border-dnd-gold">
                   <h2 className="font-display text-5xl font-bold uppercase tracking-widest mb-12">Credits</h2>
                   
                   <div className="mb-12">
                       <h3 className="font-mono text-sm uppercase tracking-widest opacity-50 mb-2">Designer</h3>
                       <p className="font-display text-3xl font-bold">German Molto</p>
                   </div>
                   
                   <div className="mb-12">
                        <h3 className="font-mono text-sm uppercase tracking-widest opacity-50 mb-2">Technologies</h3>
                        <p className="font-mono text-lg">React • TypeScript • Tailwind • Canvas API</p>
                   </div>

                   <button 
                        onClick={onClose} 
                        className="font-bold uppercase tracking-widest hover:text-white transition-colors border-b border-transparent hover:border-current pb-1 text-lg outline-none focus:outline-none ring-2 ring-white/50 p-2"
                   >
                       Return to Main Menu
                   </button>
               </TechFrame>
          </div>
    );
};