
import React, { useEffect, useState } from 'react';
import { Circle, Square, Diamond, Snowflake, Coins, Zap, Magnet, Shield, Crosshair, Activity, Lock, ArrowRight, AlertOctagon, FastForward, Ghost, ListPlus, Maximize, AlertTriangle, Clock, HelpCircle, EyeOff, Skull, RefreshCcw } from 'lucide-react';
import { GameState, DifficultyModifier, ModifierType } from '../../types';
import { BASE_UPGRADES } from '../../data/constants';

interface HUDProps {
    gameState: GameState;
    styles: any;
    highScore: number;
    currentIntegrity: number;
    isSequenceMatched: boolean;
    isStasis: boolean;
    currentShields: number;
    isInvulnerable: boolean;
}

const FormatWithIcons = ({ text, className = "" }: { text: string, className?: string }) => {
    // Simple passthrough since icons are handled by Lucide in most UIs, 
    // but useful if description text has embedded keywords in future.
    return <span className={className}>{text}</span>;
};

export const TopHUD: React.FC<HUDProps> = ({ gameState, styles, highScore, currentIntegrity, isSequenceMatched, isStasis }) => {
    
    const [animateSequence, setAnimateSequence] = useState(false);
    const [animateIntegrity, setAnimateIntegrity] = useState(false);
    
    // Trigger animations when states become true
    useEffect(() => {
        if (isSequenceMatched) {
            setAnimateSequence(true);
            const t = setTimeout(() => setAnimateSequence(false), 2000);
            return () => clearTimeout(t);
        }
    }, [isSequenceMatched]);

    useEffect(() => {
        if (currentIntegrity >= gameState.targetIntegrity) {
            setAnimateIntegrity(true);
            const t = setTimeout(() => setAnimateIntegrity(false), 2000);
            return () => clearTimeout(t);
        }
    }, [currentIntegrity, gameState.targetIntegrity]);

    // Calculate Sequence Progress
    const chargedSegments = gameState.snake.filter(s => s.type === 'body' && s.isCharged && s.variant).map(s => s.variant!);
    let matchProgress = 0;
    
    if (isSequenceMatched) {
        matchProgress = gameState.requiredSequence.length;
    } else {
        for (let len = Math.min(chargedSegments.length, gameState.requiredSequence.length); len > 0; len--) {
             const suffix = chargedSegments.slice(-len);
             const prefix = gameState.requiredSequence.slice(0, len);
             if (suffix.every((val, idx) => val === prefix[idx])) {
                 matchProgress = len;
                 break;
             }
        }
    }
    
    const now = Date.now();
    const velocitySyncActive = gameState.buffs.velocitySyncActiveUntil > now;
    const velocitySyncOnCooldown = gameState.buffs.velocitySyncCooldownUntil > now;
    const hasVelocitySync = gameState.activeUpgrades.some(u => u.type === 'velocity_sync');
    
    const isCorrupted = gameState.activeModifiers.some(m => m.type === 'sequence_corruption');
    const isOverIntegrity = currentIntegrity >= gameState.targetIntegrity + 5;

    // EVASION PROTOCOL HUD
    if (gameState.status === 'evasion' && gameState.evasionState) {
        const timeLeft = gameState.evasionState.timer / 1000;
        return (
            <div className={`flex justify-between items-center px-6 py-2 border-b-2 border-purple-500 bg-[#1A1B26] z-10 mb-1`}>
                 <div className="flex flex-col">
                     <h1 className="font-display font-bold text-2xl tracking-tighter text-purple-400">EVASION PROTOCOL</h1>
                     <span className="font-mono text-xs uppercase tracking-widest text-purple-200/50">Level {gameState.evasionLevel}</span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                     <span className="font-mono text-4xl font-bold text-white tabular-nums">{timeLeft.toFixed(2)}</span>
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-500">SEC</span>
                 </div>

                 <div className="flex items-center gap-3 text-yellow-500">
                     <div className="flex flex-col items-end">
                        <span className="text-3xl font-bold font-display tabular-nums leading-none">{gameState.currency}</span>
                        <span className="text-sm uppercase tracking-widest opacity-80">Credits</span>
                     </div>
                     <Coins size={36} strokeWidth={1.5} />
                 </div>
            </div>
        )
    }

    return (
        <div className={`flex justify-between items-end pb-4 border-b-2 ${styles.border} z-10 bg-[#1A1B26] mb-1`}>
             {/* LEFT: Name and Sector */}
             <div className="flex flex-col pl-2">
                 <h1 className="font-display font-bold text-4xl tracking-tighter leading-none whitespace-nowrap">NEON // OUROBOROS</h1>
                 <span className="font-mono text-base uppercase tracking-widest mt-1">
                     {gameState.isTesting ? (
                         <span className="text-yellow-500 font-bold animate-pulse">TEST SIMULATION</span>
                     ) : (
                         <>Sector <span className="font-bold text-xl">{gameState.level}</span></>
                     )}
                 </span>
             </div>

             {/* CENTER: Goal (Sequence + Integrity) OR Boss Objective */}
             <div className="flex items-center gap-6">
                 {gameState.boss ? (
                     <div className="flex flex-col items-center animate-pulse">
                         <div className="px-12 py-4 bg-red-600 border-4 border-white/50 rounded-sm text-white font-display font-black text-4xl tracking-[0.2em] shadow-[0_0_40px_rgba(255,0,0,0.8)] skew-x-[-10deg]">
                             KILL THE BOSS
                         </div>
                     </div>
                 ) : (
                     <>
                         {/* Sequence Icons */}
                         <div className={`flex flex-col items-center transition-transform duration-300 ${animateSequence ? 'scale-125' : ''}`}>
                             <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">Sequence Protocol</span>
                             {gameState.requiredSequence.length > 0 ? (
                                <div className={`
                                    flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-gray-800 transition-all duration-300
                                    ${isCorrupted ? 'border-red-500/50' : ''}
                                    ${animateSequence ? 'border-[#39FF14] bg-[#39FF14]/20' : ''}
                                `}>
                                    {isCorrupted ? (
                                        // CORRUPTED VIEW
                                        <div className="flex items-center gap-2 text-red-500 animate-pulse font-mono">
                                            <AlertTriangle size={16} />
                                            <span>DATA CORRUPT</span>
                                            <AlertTriangle size={16} />
                                        </div>
                                    ) : (
                                        gameState.requiredSequence.map((t, i) => {
                                            const isMatched = i < matchProgress;
                                            const isNext = i === matchProgress;
                                            
                                            return (
                                                <React.Fragment key={i}>
                                                    {i > 0 && (
                                                        <ArrowRight 
                                                            size={14} 
                                                            className={`mx-0.5 ${isMatched ? 'text-[#39FF14]' : 'text-gray-700'}`} 
                                                        />
                                                    )}
                                                    <div className={`
                                                        relative p-1 rounded transition-all duration-300
                                                        ${isMatched ? 'text-[#39FF14] scale-110' : 'text-gray-600'}
                                                        ${isNext ? 'text-white animate-pulse' : ''}
                                                    `}>
                                                        {t === 'alpha' && <Circle size={20} fill={isMatched ? 'currentColor' : 'none'} strokeWidth={isMatched ? 2 : 1.5} />}
                                                        {t === 'beta' && <Square size={20} fill={isMatched ? 'currentColor' : 'none'} strokeWidth={isMatched ? 2 : 1.5} />}
                                                        {t === 'gamma' && <Diamond size={20} fill={isMatched ? 'currentColor' : 'none'} strokeWidth={isMatched ? 2 : 1.5} />}
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </div>
                             ) : <span className="font-mono text-gray-600 text-sm">NO SEQUENCE</span>}
                         </div>

                         <div className={`h-8 w-px ${styles.border} opacity-20`}></div>

                         {/* Integrity Text */}
                         <div className={`flex flex-col items-center transition-transform duration-300 ${animateIntegrity ? 'scale-110' : ''}`}>
                             <span className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1 ${isOverIntegrity ? 'text-purple-400 animate-pulse' : ''}`}>
                                 {isOverIntegrity ? 'OVER-INTEGRITY' : 'Chassis Integrity'}
                             </span>
                             <div className={`
                                text-2xl font-mono font-bold leading-none flex items-baseline relative
                                ${currentIntegrity >= gameState.targetIntegrity ? 'text-[#39FF14]' : ''}
                                ${animateIntegrity ? 'text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]' : ''}
                             `}>
                                {animateIntegrity && (
                                    <div className="absolute inset-0 border-2 border-purple-500 rounded-full animate-ping opacity-75"></div>
                                )}
                                {currentIntegrity}<span className="text-sm opacity-40 mx-1">/</span>{gameState.targetIntegrity}
                             </div>
                         </div>
                     </>
                 )}

                 {/* Ability HUD (Velocity Sync) */}
                 {hasVelocitySync && (
                     <div className="flex flex-col items-center ml-4">
                         <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">SYNC [SHIFT]</span>
                         <div className={`flex items-center gap-2 px-2 py-1 rounded border ${velocitySyncActive ? 'bg-cyan-900/40 border-cyan-500 animate-pulse text-cyan-400' : (velocitySyncOnCooldown ? 'bg-red-900/20 border-red-500/50 text-red-500' : 'bg-gray-800 border-gray-600 text-white')}`}>
                            <Clock size={16} className={velocitySyncActive ? "animate-spin" : ""} />
                            <span className="font-mono font-bold text-sm">
                                {velocitySyncActive ? 'ACTIVE' : (velocitySyncOnCooldown ? 'COOLDOWN' : 'READY')}
                            </span>
                         </div>
                     </div>
                 )}

                 {/* Timer HUD for Stasis */}
                 {isStasis && (
                     <div className="flex items-center gap-2 ml-4 text-yellow-400 animate-pulse">
                         <Snowflake size={24} />
                         <span className="font-mono font-bold text-xl">{((gameState.buffs.stasisUntil - Date.now())/1000).toFixed(1)}s</span>
                     </div>
                 )}
             </div>

             {/* RIGHT: Currency & Score */}
             <div className="flex flex-col items-end gap-1 pr-2">
                 <div className="flex items-center gap-3 text-yellow-500">
                     <div className="flex flex-col items-end">
                        <span className="text-3xl font-bold font-display tabular-nums leading-none">{gameState.currency}</span>
                        <span className="text-sm uppercase tracking-widest opacity-80">Credits</span>
                     </div>
                     <Coins size={36} strokeWidth={1.5} />
                 </div>
                 <div className="text-sm opacity-80 font-mono tracking-wider">
                     SCORE: {gameState.score} | HI: {highScore}
                 </div>
             </div>
          </div>
    );
};

export const LeftPanel: React.FC<{ gameState: GameState, styles: any }> = ({ gameState, styles }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className={`w-64 flex flex-col gap-4 py-4 px-2 ${styles.text}`}>
            <div className="border-b-2 border-opacity-30 border-current pb-2 mb-2">
                <h3 className="font-display font-bold text-xl uppercase tracking-widest opacity-80">Installed Modules</h3>
            </div>
            
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar" style={{maxHeight: '800px'}}>
                {BASE_UPGRADES.map((base) => {
                     const active = gameState.activeUpgrades.find(u => u.type === base.type);
                     const isOwned = !!active;
                     
                     // Determine Colors
                     let iconColor = "text-gray-700";
                     let borderColor = "border-gray-800";
                     let bgColor = "bg-gray-900/30";
                     let textColor = "text-gray-600";
                     
                     if (isOwned) {
                         borderColor = "border-gray-600";
                         bgColor = "bg-black/40";
                         textColor = "text-white";
                         if (base.type === 'battery') iconColor = "text-yellow-400";
                         else if (base.type === 'magnet') iconColor = "text-blue-400";
                         else if (base.type === 'chassis') iconColor = "text-green-400";
                         else if (base.type === 'focus') iconColor = "text-red-400";
                         else iconColor = "text-cyan-400";
                     }

                     return (
                         <div 
                            key={base.id}
                            onMouseEnter={() => setHoveredId(base.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className={`relative flex items-center gap-3 px-3 py-3 rounded border ${borderColor} ${bgColor} transition-colors select-none group cursor-help`}
                         >
                             <div className={`${iconColor} shrink-0 p-2 bg-black/50 rounded`}>
                                 {base.type === 'battery' && <Zap size={20} />}
                                 {base.type === 'magnet' && <Magnet size={20} />}
                                 {base.type === 'chassis' && <Shield size={20} />}
                                 {base.type === 'focus' && <Crosshair size={20} />}
                                 {!['battery','magnet','chassis', 'focus'].includes(base.type) && <Activity size={20} />}
                             </div>
                             
                             <div className="flex flex-col overflow-hidden leading-none flex-1">
                                 <span className={`font-bold uppercase text-xs tracking-wider truncate mb-1.5 ${textColor}`}>
                                     {base.name}
                                 </span>
                                 <div className="flex items-center gap-1">
                                     {isOwned ? (
                                         <>
                                             {base.isBinary ? (
                                                 <span className="text-[10px] font-mono text-cyan-500">ACTIVE</span>
                                             ) : (
                                                 <div className="flex gap-1">
                                                     {Array.from({length: base.maxLevel}).map((_, i) => (
                                                         <div 
                                                            key={i} 
                                                            className={`w-1.5 h-1.5 rounded-full ${(active?.level || 0) > i ? iconColor : 'bg-gray-700'}`} 
                                                         />
                                                     ))}
                                                 </div>
                                             )}
                                         </>
                                     ) : (
                                         <span className="text-[10px] font-mono text-gray-700 flex items-center gap-1"><Lock size={10} /> OFFLINE</span>
                                     )}
                                 </div>
                             </div>

                             {/* TOOLTIP */}
                             {hoveredId === base.id && (
                                <div className="absolute left-full top-0 ml-4 z-50 w-64 bg-black/95 border border-dnd-gold p-4 shadow-xl rounded pointer-events-none">
                                    <div className="absolute left-[-6px] top-4 w-3 h-3 bg-black border-l border-b border-dnd-gold rotate-45"></div>
                                    <h4 className="font-bold text-dnd-gold uppercase tracking-wider mb-1 text-sm">{base.name}</h4>
                                    <div className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-widest">
                                        {base.isBinary ? "Passive Module" : "Scalable Module"}
                                    </div>
                                    <p className="text-xs text-gray-300 font-mono leading-relaxed mb-2">
                                        {base.description}
                                    </p>
                                    {isOwned && !base.isBinary && (
                                        <div className="text-[10px] text-cyan-400 font-mono mt-2 pt-2 border-t border-gray-800">
                                            <div className="flex justify-between">
                                                <span>Current Level:</span>
                                                <span className="text-white font-bold">{active?.level}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Effect Strength:</span>
                                                <span className="text-white font-bold">{active?.value}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500 mt-1">
                                                <span>Max Level:</span>
                                                <span>{base.maxLevel}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             )}
                         </div>
                     );
                 })}
            </div>
        </div>
    );
};

const AnomalyItem: React.FC<{ modifier: DifficultyModifier, onHover: (type: string | null) => void, isHovered: boolean }> = ({ modifier, onHover, isHovered }) => {
    let icon = <AlertTriangle size={20} />;
    let color = "text-red-500";
    
    switch (modifier.type as ModifierType) {
        case 'speed_boost': icon = <FastForward size={20} />; color = "text-orange-500"; break;
        case 'extra_enemy': icon = <Ghost size={20} />; color = "text-red-400"; break;
        case 'extra_sequence': icon = <ListPlus size={20} />; color = "text-purple-400"; break;
        case 'extra_integrity': icon = <Maximize size={20} />; color = "text-blue-400"; break;
        case 'enemy_speed': icon = <Zap size={20} />; color = "text-yellow-500"; break;
        case 'portal_traps': icon = <Lock size={20} />; color = "text-red-600"; break;
        case 'magnetic_wall': icon = <Magnet size={20} />; color = "text-blue-500"; break;
        case 'sequence_corruption': icon = <HelpCircle size={20} />; color = "text-pink-500"; break;
        case 'trap_migration': icon = <Activity size={20} />; color = "text-orange-400"; break;
        case 'flickering_matter': icon = <EyeOff size={20} />; color = "text-gray-400"; break;
        case 'rapid_decay': icon = <Clock size={20} />; color = "text-red-600"; break;
        case 'enemy_replication': icon = <Ghost size={20} />; color = "text-green-500"; break;
        case 'head_trauma': icon = <Skull size={20} />; color = "text-red-800"; break;
        case 'credit_scramble': icon = <RefreshCcw size={20} />; color = "text-yellow-600"; break;
    }

    const displayName = modifier.name || modifier.type.replace(/_/g, ' ');

    return (
        <div 
            className={`relative flex items-start gap-3 p-3 bg-red-900/10 border border-red-500/20 rounded ${color} cursor-help hover:bg-red-900/30 transition-colors`}
            onMouseEnter={() => onHover(modifier.type + (modifier.data || ''))}
            onMouseLeave={() => onHover(null)}
        >
            <div className="shrink-0 mt-0.5">{icon}</div>
            <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-widest">{displayName}</span>
            </div>

            {/* TOOLTIP */}
            {isHovered && (
                <div className="absolute right-full top-0 mr-4 z-50 w-64 bg-black/95 border border-red-500 p-4 shadow-xl rounded pointer-events-none">
                    <div className="absolute right-[-6px] top-4 w-3 h-3 bg-black border-r border-t border-red-500 rotate-45"></div>
                    <div className="flex items-center gap-2 mb-2 text-red-500">
                        <AlertTriangle size={16} />
                        <h4 className="font-bold uppercase tracking-wider text-sm">Active Anomaly</h4>
                    </div>
                    <h5 className="text-xs font-bold text-white uppercase mb-1">{displayName}</h5>
                    <p className="text-xs text-red-200 font-mono leading-relaxed">
                        {modifier.description}
                    </p>
                </div>
            )}
        </div>
    );
};

export const RightPanel: React.FC<HUDProps> = ({ gameState, styles, currentShields, isInvulnerable, isSequenceMatched }) => {
    const isOverIntegrity = gameState.snake.filter(s => s.type === 'body' && s.isCharged).length >= gameState.targetIntegrity + 5;
    const [hoveredAnomaly, setHoveredAnomaly] = useState<string | null>(null);

    return (
        <div className={`w-64 flex flex-col gap-6 py-4 px-2 ${styles.text}`}>
             {/* DIAGNOSTICS */}
             <div>
                 <div className="border-b-2 border-opacity-30 border-current pb-2 mb-4">
                    <h3 className="font-display font-bold text-xl uppercase tracking-widest opacity-80">Diagnostics</h3>
                 </div>
                 
                 <div className="space-y-3">
                      {/* Hull Status */}
                      {gameState.pendingType ? (
                          <div className="flex flex-col items-center justify-center p-3 rounded border-2 bg-red-600 text-white border-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]">
                              <div className="flex items-center gap-2 mb-1">
                                  <AlertOctagon size={24} className="animate-bounce" />
                                  <span className="text-sm uppercase font-bold tracking-widest">CRITICAL</span>
                              </div>
                              <div className="text-[10px] uppercase font-mono mb-2">Hull Breach Detected</div>
                              <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded">
                                  <span className="text-[10px] mr-1">REQ:</span>
                                  {gameState.pendingType === 'alpha' && <Circle size={14} fill="currentColor" />}
                                  {gameState.pendingType === 'beta' && <Square size={14} fill="currentColor" />}
                                  {gameState.pendingType === 'gamma' && <Diamond size={14} fill="currentColor" />}
                              </div>
                          </div>
                      ) : (
                          <div className="flex items-center justify-between w-full px-3 py-3 rounded border bg-blue-900/10 border-blue-500/30 text-blue-400">
                              <span className="text-xs uppercase font-bold tracking-widest">Hull Status</span>
                              <span className="text-xs font-mono">STABLE</span>
                          </div>
                      )}

                      {/* Shield Status */}
                      <div className={`flex flex-col w-full px-3 py-3 rounded border ${currentShields > 0 ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-gray-900/20 border-gray-800 text-gray-700'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs uppercase font-bold tracking-widest">Shield Integrity</span>
                            <span className="text-xs font-mono">{currentShields > 0 ? `${currentShields * 33}%` : '0%'}</span>
                          </div>
                          <div className="flex gap-1 h-2">
                              {Array.from({length: 3}).map((_, i) => (
                                  <div key={i} className={`flex-1 rounded-sm ${currentShields > i ? 'bg-green-400 shadow-[0_0_5px_currentColor]' : 'bg-gray-800'}`} />
                              ))}
                          </div>
                      </div>
                      
                      {/* Invulnerability Status */}
                      <div className={`flex items-center justify-between w-full px-3 py-3 rounded border transition-colors ${isInvulnerable ? 'bg-white/10 border-white text-white animate-pulse' : 'bg-gray-900/20 border-gray-800 text-gray-700'}`}>
                          <span className="text-xs uppercase font-bold tracking-widest">Phase Shift</span>
                          <span className="text-xs font-mono">{isInvulnerable ? 'ACTIVE' : 'READY'}</span>
                      </div>

                      {/* Portal Status */}
                      <div className={`flex items-center justify-between w-full px-3 py-3 rounded border ${gameState.portal ? (isSequenceMatched ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]' : 'bg-red-900/20 border-red-500 text-red-500') : (gameState.secretPortal ? 'bg-purple-900/20 border-purple-500 text-purple-400 animate-pulse' : 'bg-gray-900/20 border-gray-800 text-gray-700')}`}>
                           <span className="text-xs uppercase font-bold tracking-widest">Slipgate</span>
                           <span className="text-xs font-mono">
                               {gameState.secretPortal ? 'SECRET' : (gameState.portal ? (isSequenceMatched ? 'OPEN' : 'LOCKED') : 'OFFLINE')}
                           </span>
                      </div>
                      
                      {/* Over-Integrity Alert */}
                      {isOverIntegrity && (
                          <div className="flex flex-col items-center justify-center p-2 border border-purple-500/50 bg-purple-900/20 text-purple-400 animate-pulse rounded text-center">
                              <span className="text-[10px] uppercase font-bold tracking-widest mb-1">Evasion Protocol</span>
                              <span className="text-[10px] font-mono">BONUS READY</span>
                          </div>
                      )}
                 </div>
             </div>

             {/* ANOMALIES */}
             <div className="flex-1 mt-4">
                 <div className="border-b-2 border-opacity-30 border-current pb-2 mb-4 flex justify-between items-center">
                    <h3 className="font-display font-bold text-xl uppercase tracking-widest opacity-80 text-red-400">Anomalies</h3>
                    {gameState.activeModifiers.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded">{gameState.activeModifiers.length}</span>}
                 </div>
                 
                 <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar" style={{maxHeight: '400px'}}>
                     {gameState.activeModifiers.length === 0 ? (
                         <div className="p-4 border border-dashed border-gray-700 text-gray-600 text-center font-mono text-xs uppercase">
                             System Nominal.<br/>No Anomalies Detected.
                         </div>
                     ) : (
                         gameState.activeModifiers.map((mod, idx) => (
                             <AnomalyItem 
                                key={idx} 
                                modifier={mod} 
                                isHovered={hoveredAnomaly === mod.type + (mod.data || '')}
                                onHover={setHoveredAnomaly}
                             />
                         ))
                     )}
                 </div>
             </div>
        </div>
    );
};
