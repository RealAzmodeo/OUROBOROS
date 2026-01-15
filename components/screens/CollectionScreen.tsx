
import React, { useState } from 'react';
import { ArrowLeft, Terminal, Skull, Activity, Eye, AlertTriangle, FastForward, Ghost, ListPlus, Maximize, Zap, Lock, Magnet, HelpCircle, EyeOff, Clock, RefreshCcw } from 'lucide-react';
import { BASE_UPGRADES, MECHANIC_DB, VFX_DB } from '../../data/constants';
import { ENEMY_DB } from '../../data/enemies';
import { ANOMALY_DB } from '../../utils/shopSystem';
import { VfxPreview } from '../VfxPreview';
import { EntityPreview } from '../EntityPreview';
import { AnimatedUpgradeIcon } from '../ui/AnimatedUpgradeIcon';
import { ModifierType } from '../../types';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface CollectionScreenProps {
    styles: any;
    showCRT: boolean;
    seenItems: Set<string>;
    onClose: () => void;
    onToggleDebugUnlock: () => void;
}

export const CollectionScreen: React.FC<CollectionScreenProps> = ({ styles, showCRT, seenItems, onClose, onToggleDebugUnlock }) => {
    const tabs = ['modules', 'enemies', 'mechanics', 'visuals', 'anomalies'] as const;
    const [activeCollectionTab, setActiveCollectionTab] = useState<typeof tabs[number]>('modules');

    // Indices: 0-4 for tabs, 5 for Back button
    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        items: tabs.length + 1,
        cols: tabs.length, 
        onSelect: (index) => {
            if (index < tabs.length) {
                setActiveCollectionTab(tabs[index]);
            } else {
                onClose();
            }
        },
        onBack: onClose
    });

    const getCollectionContent = () => {
        if (activeCollectionTab === 'modules') return BASE_UPGRADES.map((item) => ({...item, isSeen: seenItems.has(item.type)}));
        if (activeCollectionTab === 'enemies') return ENEMY_DB.map((item) => ({...item, isSeen: seenItems.has(item.type)}));
        if (activeCollectionTab === 'mechanics') return MECHANIC_DB.map((item) => ({...item, isSeen: seenItems.has(item.id)}));
        if (activeCollectionTab === 'visuals') return VFX_DB.map((item) => ({...item, isSeen: seenItems.has(item.id)}));
        if (activeCollectionTab === 'anomalies') return ANOMALY_DB.map((item) => ({...item, isSeen: seenItems.has(item.type)}));
        return [];
    };

    const getAnomalyIcon = (type: ModifierType) => {
        switch (type) {
            case 'speed_boost': return <FastForward size={40} className="text-orange-500" />;
            case 'extra_enemy': return <Ghost size={40} className="text-red-400" />;
            case 'extra_sequence': return <ListPlus size={40} className="text-purple-400" />;
            case 'extra_integrity': return <Maximize size={40} className="text-blue-400" />;
            case 'enemy_speed': return <Zap size={40} className="text-yellow-500" />;
            case 'portal_traps': return <Lock size={40} className="text-red-600" />;
            case 'magnetic_wall': return <Magnet size={40} className="text-blue-500" />;
            case 'sequence_corruption': return <HelpCircle size={40} className="text-pink-500" />;
            case 'trap_migration': return <Activity size={40} className="text-orange-400" />;
            case 'flickering_matter': return <EyeOff size={40} className="text-gray-400" />;
            case 'rapid_decay': return <Clock size={40} className="text-red-600" />;
            case 'enemy_replication': return <Ghost size={40} className="text-green-500" />;
            case 'head_trauma': return <Skull size={40} className="text-red-800" />;
            case 'credit_scramble': return <RefreshCcw size={40} className="text-yellow-600" />;
            default: return <AlertTriangle size={40} className="text-red-500" />;
        }
    }

    return (
        <div className={`w-screen h-screen flex flex-col ${styles.bg} ${styles.text} overflow-hidden`}>
            {showCRT && <div className="crt-scanlines" />}
            <div className="container mx-auto max-w-6xl h-full flex flex-col p-8">
                <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-6">
                         <button 
                            onClick={onClose} 
                            onMouseEnter={() => setSelectedIndex(tabs.length)}
                            className={`flex items-center gap-2 font-bold uppercase tracking-widest transition-colors text-lg
                                ${selectedIndex === tabs.length ? 'text-white border-b-2 border-white' : 'hover:text-white'}
                            `}
                         >
                             <ArrowLeft /> Return
                         </button>
                         <h2 className="font-display text-4xl font-bold uppercase tracking-widest border-l-2 border-gray-700 pl-6">Collection // {activeCollectionTab}</h2>
                     </div>
                     
                     <button onClick={onToggleDebugUnlock} className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity">
                         <Terminal size={16} /> DEBUG: TOGGLE UNLOCK
                     </button>
                </div>

                <div className="flex gap-4 mb-8 border-b border-gray-800 pb-1 overflow-x-auto">
                    {tabs.map((tab, idx) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveCollectionTab(tab)} 
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`px-6 py-2 font-bold uppercase tracking-widest border-b-2 transition-colors text-lg whitespace-nowrap 
                                ${activeCollectionTab === tab ? 'border-dnd-gold text-dnd-gold' : 'border-transparent text-gray-600 hover:text-gray-400'}
                                ${selectedIndex === idx ? 'bg-white/10' : ''}
                            `}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-8 pr-2 custom-scrollbar">
                    {getCollectionContent().map((item: any, idx: number) => (
                        <div key={idx} className={`relative p-6 border-2 border-dnd-steel/30 bg-black/20 hover:bg-black/40 transition-colors ${!item.isSeen ? 'opacity-50 grayscale' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white truncate pr-2">
                                    {item.name}
                                </h3>
                                {/* Icons for tabs other than modules */}
                                {activeCollectionTab === 'enemies' && (
                                    <Skull size={24} className={item.isSeen ? 'text-red-400' : 'text-gray-600'} />
                                )}
                                {activeCollectionTab === 'mechanics' && (
                                    <Activity size={24} className={item.isSeen ? 'text-yellow-400' : 'text-gray-600'} />
                                )}
                                {activeCollectionTab === 'visuals' && (
                                    <Eye size={24} className={item.isSeen ? 'text-purple-400' : 'text-gray-600'} />
                                )}
                                {activeCollectionTab === 'anomalies' && (
                                    <AlertTriangle size={24} className={item.isSeen ? 'text-red-500' : 'text-gray-600'} />
                                )}
                            </div>
                            
                            {/* MODULE PREVIEW */}
                            {activeCollectionTab === 'modules' && item.isSeen && (
                                <div className="w-full h-32 mb-4 flex items-center justify-center bg-black/50 border border-gray-800 rounded relative overflow-hidden">
                                     {/* Background glow for aesthetic */}
                                     <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                     <AnimatedUpgradeIcon type={item.type} size={80} />
                                </div>
                            )}

                            {activeCollectionTab === 'visuals' && item.isSeen && (
                                <VfxPreview id={item.id} />
                            )}
                            
                            {(activeCollectionTab === 'enemies' || activeCollectionTab === 'mechanics') && item.isSeen && (
                                <EntityPreview id={activeCollectionTab === 'enemies' ? item.type : item.id} category={activeCollectionTab === 'enemies' ? 'enemy' : 'mechanic'} />
                            )}
                            
                            {activeCollectionTab === 'anomalies' && item.isSeen && (
                                <div className="w-full h-24 mb-4 flex items-center justify-center bg-black/50 border border-gray-800 rounded">
                                    {getAnomalyIcon(item.type)}
                                </div>
                            )}

                            <p className="font-mono text-base leading-relaxed opacity-80 text-dnd-paper">
                                {item.description}
                            </p>
                            
                            {activeCollectionTab === 'modules' && item.isSeen && (
                                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs font-mono uppercase text-gray-500">
                                    <span>Max Level: {item.maxLevel}</span>
                                    <span>Type: {item.isBinary ? 'Passive' : 'Scalable'}</span>
                                </div>
                            )}

                            {!item.isSeen && (
                                <div className="absolute top-4 right-4">
                                    <div className="border border-red-500/50 text-red-500/80 px-2 py-1 text-xs uppercase tracking-widest font-bold">LOCKED</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
