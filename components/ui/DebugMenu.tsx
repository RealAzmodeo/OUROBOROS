
import React from 'react';
import { BASE_UPGRADES } from '../../data/constants';
import { Upgrade } from '../../types';
import { X, Plus, Zap, Shield, Activity, Magnet, Crosshair, Terminal } from 'lucide-react';

interface DebugMenuProps {
    onClose: () => void;
    onAddUpgrade: (u: any) => void;
    activeUpgrades: Upgrade[];
}

export const DebugMenu: React.FC<DebugMenuProps> = ({ onClose, onAddUpgrade, activeUpgrades }) => {
    return (
        <div className="fixed top-0 right-0 bottom-0 w-80 bg-[#1A1B26]/95 border-l-2 border-[#C0A080] p-4 z-[100] overflow-y-auto backdrop-blur-sm shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#C0A080]/30">
                <div className="flex items-center gap-2 text-[#C0A080]">
                    <Terminal size={20} />
                    <h2 className="font-display font-bold text-xl tracking-widest uppercase">Debug Console</h2>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-3">
                {BASE_UPGRADES.map((base) => {
                    const existing = activeUpgrades.find(u => u.type === base.type);
                    const level = existing ? existing.level : 0;
                    const maxed = level >= base.maxLevel && !base.isBinary;
                    const isOwned = !!existing;
                    
                    return (
                        <button 
                            key={base.id}
                            onClick={() => onAddUpgrade(base)}
                            disabled={maxed || (base.isBinary && isOwned)}
                            className={`w-full flex items-center justify-between p-3 border rounded text-left group transition-all relative overflow-hidden
                                ${(maxed || (base.isBinary && isOwned)) 
                                    ? 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed' 
                                    : 'bg-black/40 border-gray-700 hover:border-[#C0A080] hover:bg-black/60'}
                            `}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`${isOwned ? 'text-[#C0A080]' : 'text-gray-600'}`}>
                                     {base.type === 'battery' && <Zap size={18} />}
                                     {base.type === 'chassis' && <Shield size={18} />}
                                     {base.type === 'magnet' && <Magnet size={18} />}
                                     {base.type === 'focus' && <Crosshair size={18} />}
                                     {!['battery', 'chassis', 'magnet', 'focus'].includes(base.type) && <Activity size={18} />}
                                </div>
                                <div>
                                    <div className={`font-bold text-sm uppercase tracking-wider ${isOwned ? 'text-white' : 'text-gray-400'}`}>{base.name}</div>
                                    <div className="text-[10px] text-gray-500 font-mono uppercase">
                                        {isOwned 
                                            ? (base.isBinary ? "STATUS: ACTIVE" : `LEVEL: ${level} / ${base.maxLevel}`) 
                                            : "STATUS: NOT INSTALLED"}
                                    </div>
                                </div>
                            </div>
                            {(!maxed && !(base.isBinary && isOwned)) && (
                                <Plus size={16} className="text-gray-600 group-hover:text-[#39FF14] relative z-10" />
                            )}
                        </button>
                    )
                })}
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-800 text-xs text-gray-600 font-mono">
                SYSTEM OVERRIDE ACTIVE. <br/>ACHIEVEMENTS DISABLED.
            </div>
        </div>
    )
}
