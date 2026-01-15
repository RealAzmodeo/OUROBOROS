
import React from 'react';
import { Coins, RefreshCw, ChevronRight, AlertTriangle, Circle, Square, Diamond, Shield, Snowflake, Home } from 'lucide-react';
import { TechFrame } from '../ui/TechFrame';
import { Upgrade, GameState } from '../../types';
import { AnimatedUpgradeIcon } from '../ui/AnimatedUpgradeIcon';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';
import { CUSTOM_LEVEL_START_ID } from '../../data/levels';

interface LevelUpScreenProps {
    gameState: GameState;
    styles: any;
    onSelectUpgrade: (upgrade: Upgrade) => void;
    onReroll: () => void;
    onNextLevel: () => void;
}

const FormatWithIcons = ({ text, className = "" }: { text: string, className?: string }) => {
    const regex = /(ALPHA|BETA|GAMMA|Alpha|Beta|Gamma|Shield|SHIELD|Coin|COIN|Coins|COINS|Stasis Orb|STASIS ORB)/g;
    const parts = text.split(regex);
    
    return (
        <span className={className}>
            {parts.map((part, i) => {
                const upper = part.toUpperCase();
                
                if (upper === 'ALPHA') return <span key={i} className="inline-flex items-center text-cyan-400 font-bold"><Circle size={14} className="mx-1" fill="currentColor" strokeWidth={2} />{part}</span>;
                if (upper === 'BETA') return <span key={i} className="inline-flex items-center text-cyan-400 font-bold"><Square size={14} className="mx-1" fill="currentColor" strokeWidth={2} />{part}</span>;
                if (upper === 'GAMMA') return <span key={i} className="inline-flex items-center text-cyan-400 font-bold"><Diamond size={14} className="mx-1" fill="currentColor" strokeWidth={2} />{part}</span>;
                if (upper.includes('SHIELD')) return <span key={i} className="inline-flex items-center text-green-400 font-bold"><Shield size={14} className="mx-1" />{part}</span>;
                if (upper.includes('COIN')) return <span key={i} className="inline-flex items-center text-yellow-400 font-bold"><Coins size={14} className="mx-1" />{part}</span>;
                if (upper.includes('STASIS')) return <span key={i} className="inline-flex items-center text-yellow-300 font-bold"><Snowflake size={14} className="mx-1" />{part}</span>;

                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

export const LevelUpScreen: React.FC<LevelUpScreenProps> = ({ gameState, styles, onSelectUpgrade, onReroll, onNextLevel }) => {
    const REROLL_COST = 50;
    const CARD_COST = 200;

    const isCustomLevel = gameState.level >= CUSTOM_LEVEL_START_ID;

    // Indices: 0,1,2 = Upgrades. 3 = Reroll. 4 = Next Level.
    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        items: 5,
        cols: 3, // Sort of works for the grid feel (3 items top, 2 items bottom)
        onSelect: (index) => {
            if (index < 3) {
                const choice = gameState.shop.choices[index];
                const cost = gameState.shop.freePickAvailable ? 0 : CARD_COST;
                if (gameState.shop.freePickAvailable || gameState.currency >= cost) {
                    onSelectUpgrade(choice);
                }
            } else if (index === 3) {
                if (gameState.currency >= REROLL_COST) onReroll();
            } else if (index === 4) {
                onNextLevel();
            }
        }
    });

    return (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center backdrop-blur-md z-50">
            <div className="max-w-6xl w-full p-8 flex flex-col h-full justify-center">
                 <div className="flex justify-between items-end mb-8 border-b border-white/20 pb-4">
                     <h2 className="font-display text-5xl text-white uppercase tracking-widest">System Upgrade</h2>
                     <div className="text-right">
                         <div className="text-sm uppercase text-gray-500 tracking-widest">Available Credits</div>
                         <div className="text-4xl font-display text-yellow-500 flex items-center justify-end gap-2"><Coins /> {gameState.currency}</div>
                     </div>
                 </div>
                 
                 <div className="flex gap-4 mb-8 justify-center">
                      {gameState.shop.choices.map((upgrade, idx) => {
                          const isAffordable = gameState.shop.freePickAvailable || gameState.currency >= CARD_COST;
                          const cost = gameState.shop.freePickAvailable ? 0 : CARD_COST;
                          const isSelected = selectedIndex === idx;

                          return (
                             <button 
                               key={idx} 
                               onClick={() => {
                                   if (isAffordable) onSelectUpgrade(upgrade);
                               }} 
                               onMouseEnter={() => setSelectedIndex(idx)}
                               disabled={!isAffordable}
                               className={`group relative flex-1 max-w-sm text-left transition-all duration-200 outline-none
                                    ${!isAffordable ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-2'}
                                    ${isSelected ? '-translate-y-2 ring-2 ring-white z-10' : ''}
                               `}
                             >
                                 <TechFrame color={isSelected ? 'border-white' : styles.border} className={`h-full p-6 flex flex-col gap-4 ${styles.bg} border-2 ${isSelected ? 'border-white' : (isAffordable ? 'border-gray-600 group-hover:border-white' : 'border-gray-800')}`}>
                                     <div className="flex justify-between items-start">
                                          <div className={`rounded-full border-2 ${styles.border} bg-black w-[84px] h-[84px] flex items-center justify-center overflow-hidden`}>
                                              <AnimatedUpgradeIcon type={upgrade.type} size={80} />
                                          </div>
                                          <div className={`px-3 py-1 text-sm font-bold uppercase tracking-widest ${cost === 0 ? 'bg-blue-500 text-white' : 'bg-gray-800 text-yellow-500'}`}>
                                              {cost === 0 ? 'FREE' : `${cost} CR`}
                                          </div>
                                     </div>
                                     
                                     <div className="flex-1">
                                         <h3 className={`font-display font-bold text-2xl uppercase ${styles.text} mb-1`}>{upgrade.name}</h3>
                                         <div className="text-xs uppercase tracking-widest opacity-50 mb-4">Level {upgrade.level}</div>
                                         <p className={`font-mono text-base leading-relaxed ${styles.textSecondary}`}>
                                             <FormatWithIcons text={upgrade.description} />
                                         </p>
                                     </div>

                                     {upgrade.difficultyModifier && (
                                        <div className="mt-4 pt-4 border-t border-red-900/50">
                                            <div className="flex items-center gap-2 text-red-500 mb-1">
                                                <AlertTriangle size={16} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Anomaly Detected</span>
                                            </div>
                                            <p className="font-mono text-sm text-red-400">
                                                <FormatWithIcons text={upgrade.difficultyModifier.description} />
                                            </p>
                                        </div>
                                     )}
                                 </TechFrame>
                             </button>
                          );
                      })}
                 </div>

                 <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/10">
                     <button 
                          onClick={onReroll}
                          onMouseEnter={() => setSelectedIndex(3)}
                          disabled={gameState.currency < REROLL_COST}
                          className={`flex items-center gap-3 px-8 py-4 font-bold uppercase tracking-widest border-2 transition-all outline-none 
                            ${gameState.currency >= REROLL_COST ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10' : 'border-gray-800 text-gray-600 cursor-not-allowed'}
                            ${selectedIndex === 3 ? 'bg-yellow-500/20 ring-2 ring-yellow-500 scale-105' : ''}
                          `}
                     >
                         <RefreshCw size={24} /> 
                         <span>Reroll System ({REROLL_COST} CR)</span>
                     </button>

                     <button 
                          onClick={onNextLevel}
                          onMouseEnter={() => setSelectedIndex(4)}
                          className={`flex items-center gap-3 px-12 py-4 font-bold uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.5)] outline-none
                            ${selectedIndex === 4 ? 'ring-4 ring-blue-300 scale-105' : ''}
                          `}
                     >
                         <span>{gameState.isTesting || isCustomLevel ? 'Mission Complete' : `Deploy to Sector ${gameState.level + 1}`}</span>
                         {gameState.isTesting || isCustomLevel ? <Home size={24} /> : <ChevronRight size={24} />}
                     </button>
                 </div>
            </div>
         </div>
    );
};
