
import React, { useState, useEffect, useRef } from 'react';
import { TechFrame } from '../ui/TechFrame';
import { Upgrade, GameState } from '../../types';
import { BASE_UPGRADES } from '../../data/constants';
import { AnimatedUpgradeIcon } from '../ui/AnimatedUpgradeIcon';
import { Zap, Sparkles, Star } from 'lucide-react';
import { audio } from '../../utils/audio';
import { resolveUpgradePurchase } from '../../utils/shopSystem';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface EvasionRewardScreenProps {
    gameState: GameState;
    onProceed: (newUpgrades: Upgrade[], bonusCurrency?: number) => void;
}

interface UIParticle {
    id: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
    color: string;
    rotation: number;
    scale: number;
}

export const EvasionRewardScreen: React.FC<EvasionRewardScreenProps> = ({ gameState, onProceed }) => {
    const [phase, setPhase] = useState<'spinning' | 'flash' | 'reveal'>('spinning');
    const [selectedUpgrade, setSelectedUpgrade] = useState<Upgrade | null>(null);
    const [displayedUpgrade, setDisplayedUpgrade] = useState<Upgrade | null>(null);
    const [particles, setParticles] = useState<UIParticle[]>([]);
    
    const availableUpgrades = useRef<Upgrade[]>([]);
    const spinTimer = useRef<ReturnType<typeof setTimeout>>(null);
    const spinCount = useRef(0);

    // 1. Initialize Pool
    useEffect(() => {
        availableUpgrades.current = BASE_UPGRADES.map(base => {
             const existing = gameState.activeUpgrades.find(u => u.type === base.type);
             if (existing) {
                 if (existing.isBinary || existing.level >= existing.maxLevel) return null;
                 return { 
                     ...existing, 
                     level: existing.level + 1, 
                     value: existing.value + existing.valuePerLevel, 
                     description: "BONUS UPGRADE",
                     difficultyModifier: undefined
                 };
             }
             return { 
                 ...base, 
                 level: 1, 
                 description: "BONUS MODULE",
                 difficultyModifier: undefined 
             } as Upgrade;
        }).filter(Boolean) as Upgrade[];

        if (availableUpgrades.current.length === 0) {
            // Fallback: No upgrades available, just give cash and proceed
            onProceed(gameState.activeUpgrades, 1000);
            return;
        }

        triggerSpin();

        return () => {
            if (spinTimer.current) clearTimeout(spinTimer.current);
        };
    }, []);

    const triggerSpin = () => {
        if (availableUpgrades.current.length === 0) return;

        const maxSpins = 25;
        const current = spinCount.current;
        
        const random = availableUpgrades.current[Math.floor(Math.random() * availableUpgrades.current.length)];
        setDisplayedUpgrade(random);
        audio.play('ui_hover');

        if (current < maxSpins) {
            spinCount.current++;
            const progress = current / maxSpins;
            const delay = 50 + (progress * progress * 250); 
            
            spinTimer.current = setTimeout(triggerSpin, delay);
        } else {
            lockInReward(random);
        }
    };

    const lockInReward = (finalUpgrade: Upgrade) => {
        setSelectedUpgrade(finalUpgrade);
        setPhase('flash');
        audio.play('powerup');
        audio.play('sequence_match');
        
        const newParticles: UIParticle[] = [];
        for(let i=0; i<40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const dist = 300 + Math.random() * 100;
            newParticles.push({
                id: i,
                x: 0, y: 0,
                tx: Math.cos(angle) * dist,
                ty: Math.sin(angle) * dist,
                color: i % 2 === 0 ? '#A855F7' : '#FFFFFF',
                rotation: Math.random() * 360,
                scale: 0.5 + Math.random()
            });
        }
        setParticles(newParticles);

        setTimeout(() => {
            setPhase('reveal');
        }, 150);
    };

    const handleClaim = () => {
        if (!selectedUpgrade) return;
        const newUpgrades = resolveUpgradePurchase(gameState.activeUpgrades, selectedUpgrade);
        
        // Pass new upgrades to parent to start next level
        onProceed(newUpgrades, 0);
    };

    // Keyboard Hook
    useMenuNavigation({
        items: 1,
        active: phase === 'reveal',
        onSelect: handleClaim
    });

    const activeItem = selectedUpgrade || displayedUpgrade;
    if (!activeItem) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" />

            {phase === 'reveal' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <div className="w-[150vmax] h-[150vmax] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(168,85,247,0.4)_10deg,transparent_20deg,rgba(168,85,247,0.4)_30deg,transparent_40deg,rgba(168,85,247,0.4)_50deg,transparent_60deg,rgba(168,85,247,0.4)_70deg,transparent_80deg,rgba(168,85,247,0.4)_90deg,transparent_100deg,rgba(168,85,247,0.4)_110deg,transparent_120deg,rgba(168,85,247,0.4)_130deg,transparent_140deg,rgba(168,85,247,0.4)_150deg,transparent_160deg,rgba(168,85,247,0.4)_170deg,transparent_180deg,rgba(168,85,247,0.4)_190deg,transparent_200deg,rgba(168,85,247,0.4)_210deg,transparent_220deg,rgba(168,85,247,0.4)_230deg,transparent_240deg,rgba(168,85,247,0.4)_250deg,transparent_260deg,rgba(168,85,247,0.4)_270deg,transparent_280deg,rgba(168,85,247,0.4)_290deg,transparent_300deg,rgba(168,85,247,0.4)_310deg,transparent_320deg,rgba(168,85,247,0.4)_330deg,transparent_340deg,rgba(168,85,247,0.4)_350deg,transparent_360deg)] animate-spin-slow" />
                </div>
            )}

            <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-500 ${phase === 'flash' ? 'opacity-100' : 'opacity-0'}`} />

            <div className={`relative z-10 flex flex-col items-center transition-all duration-300 ${phase === 'reveal' ? 'scale-100' : 'scale-90'}`}>
                
                <div className="mb-8 text-center space-y-2">
                    <h2 className={`font-display text-5xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] transition-all ${phase === 'reveal' ? 'scale-110' : ''}`}>
                        Protocol Complete
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-purple-300 font-mono uppercase tracking-[0.3em] text-sm opacity-80">
                        <Star size={14} className="animate-spin-slow" />
                        <span>Anomaly-Free Reward</span>
                        <Star size={14} className="animate-spin-slow" />
                    </div>
                </div>

                <div className="relative">
                    {phase === 'reveal' && particles.map(p => (
                        <div 
                            key={p.id}
                            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-sm pointer-events-none animate-explode"
                            style={{
                                backgroundColor: p.color,
                                '--tx': `${p.tx}px`,
                                '--ty': `${p.ty}px`,
                                '--rot': `${p.rotation}deg`
                            } as any}
                        />
                    ))}

                    <TechFrame 
                        className={`
                            relative w-80 p-8 bg-black/80 backdrop-blur-md transition-all duration-300
                            ${phase === 'reveal' ? 'border-purple-400 shadow-[0_0_60px_rgba(168,85,247,0.6)] translate-y-0' : 'border-gray-600 translate-y-4'}
                        `} 
                        color={phase === 'reveal' ? 'border-purple-400' : 'border-gray-600'}
                    >
                        <div className="flex justify-center mb-6">
                            <div className={`
                                w-32 h-32 rounded-full flex items-center justify-center bg-black border-4 overflow-hidden
                                transition-all duration-200
                                ${phase === 'reveal' ? 'border-[#39FF14] scale-110 shadow-[0_0_30px_#39FF14]' : 'border-gray-700'}
                            `}>
                                <AnimatedUpgradeIcon type={activeItem.type} size={100} />
                            </div>
                        </div>

                        <div className="text-center space-y-4">
                            <h3 className={`font-display text-3xl font-bold uppercase leading-none ${phase === 'reveal' ? 'text-white' : 'text-gray-400'}`}>
                                {activeItem.name}
                            </h3>
                            
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
                            
                            <div className="text-purple-300 font-mono text-xs uppercase tracking-widest h-8 flex items-center justify-center">
                                {phase === 'spinning' ? (
                                    <span className="animate-pulse">Analyzing...</span>
                                ) : (
                                    <span className="flex items-center gap-2 text-[#39FF14]">
                                        <Sparkles size={14} /> MODULE READY
                                    </span>
                                )}
                            </div>
                        </div>
                    </TechFrame>
                </div>

                <div className={`mt-12 transition-all duration-500 delay-300 ${phase === 'reveal' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <button 
                        onClick={handleClaim}
                        className="group relative px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] overflow-hidden outline-none focus:outline-none ring-4 ring-purple-300"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative z-10 flex items-center gap-3">
                            <Zap size={20} className="fill-current" />
                            Install & Deploy <span className="text-xs opacity-60 ml-1">[ENTER]</span>
                        </span>
                    </button>
                </div>

            </div>

            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                @keyframes explode {
                    0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
                    100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0) rotate(var(--rot)); opacity: 0; }
                }
                .animate-explode {
                    animation: explode 0.8s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
                }
            `}</style>
        </div>
    );
};
