
import React, { useState } from 'react';
import { Monitor, ArrowLeft, Volume2, VolumeX, Speaker, Music } from 'lucide-react';
import { TechFrame } from '../ui/TechFrame';
import { audio } from '../../utils/audio';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';

interface SettingsScreenProps {
    styles: any;
    showCRT: boolean;
    onToggleCRT: () => void;
    onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ styles, showCRT, onToggleCRT, onClose }) => {
    const [sfxVolume, setSfxVolume] = useState(audio.getSfxVolume());
    const [sfxMuted, setSfxMuted] = useState(audio.isSfxMuted());
    const [musicVolume, setMusicVolume] = useState(audio.getMusicVolume());
    
    // Actions for Sliders
    const adjustSfx = (delta: number) => {
        const newVal = Math.max(0, Math.min(1, sfxVolume + delta));
        audio.setSfxVolume(newVal);
        setSfxVolume(newVal);
        if (newVal > 0 && sfxMuted) {
            setSfxMuted(false);
            audio.setSfxMute(false);
        }
        if (newVal > 0 && delta > 0) audio.play('ui_select');
    };

    const adjustMusic = (delta: number) => {
        const newVal = Math.max(0, Math.min(1, musicVolume + delta));
        audio.setMusicVolume(newVal);
        setMusicVolume(newVal);
        if (delta > 0) audio.play('ui_hover');
    };

    const toggleSfxMute = () => {
        const m = !sfxMuted;
        audio.setSfxMute(m);
        setSfxMuted(m);
        audio.play('ui_select');
    };

    // Use unified navigation hook
    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        items: 4,
        onSelect: (index) => {
            if (index === 0) onToggleCRT();
            if (index === 1) toggleSfxMute();
            if (index === 3) onClose();
        },
        onBack: onClose,
        onLeft: (index) => {
            if (index === 1) adjustSfx(-0.1);
            if (index === 2) adjustMusic(-0.1);
        },
        onRight: (index) => {
            if (index === 1) adjustSfx(0.1);
            if (index === 2) adjustMusic(0.1);
        }
    });

    const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        audio.setSfxVolume(v);
        setSfxVolume(v);
        if (v > 0 && sfxMuted) {
            setSfxMuted(false);
            audio.setSfxMute(false);
        }
    };

    const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        audio.setMusicVolume(v);
        setMusicVolume(v);
    };

    const getRowStyle = (idx: number) => 
        `flex items-center justify-between p-6 border transition-all ${selectedIndex === idx ? 'bg-white/10 border-white scale-105 z-10' : 'bg-black/20 border-gray-700 hover:bg-black/30'}`;

    return (
        <div className={`w-screen h-screen flex flex-col items-center justify-center ${styles.bg} ${styles.text} overflow-hidden relative`}>
            {showCRT && <div className="crt-scanlines" />}
            <TechFrame className="p-12 text-center max-w-2xl w-full" color="border-dnd-gold">
                <h2 className="font-display text-5xl font-bold uppercase tracking-widest mb-12">Settings</h2>
                
                <div className="flex flex-col gap-6">
                    {/* Visual FX */}
                    <div 
                        className={getRowStyle(0)}
                        onMouseEnter={() => setSelectedIndex(0)}
                        onClick={onToggleCRT}
                    >
                        <div className="text-left">
                            <div className="flex items-center gap-3 mb-2">
                                <Monitor size={24} />
                                <h3 className="font-bold uppercase tracking-widest text-xl">Retro FX</h3>
                            </div>
                            <p className="font-mono text-sm opacity-60">CRT scanlines, chromatic aberration, and vignette.</p>
                        </div>
                        <div className={`w-20 h-10 rounded-full flex items-center p-1 border-2 transition-all ${showCRT ? 'border-[#39FF14] bg-[#39FF14]/10 justify-end' : 'border-gray-600 bg-gray-900 justify-start'}`}>
                            <div className={`w-7 h-7 rounded-full shadow-lg transform transition-all ${showCRT ? 'bg-[#39FF14]' : 'bg-gray-500'}`} />
                        </div>
                    </div>

                    {/* SFX Volume */}
                    <div 
                        className={getRowStyle(1)}
                        onMouseEnter={() => setSelectedIndex(1)}
                    >
                        <div className="text-left flex-1 mr-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Volume2 size={24} />
                                <h3 className="font-bold uppercase tracking-widest text-xl">SFX Volume</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="0" max="1" step="0.1" 
                                    value={sfxVolume} 
                                    onChange={handleSfxVolumeChange}
                                    className="w-full accent-[#C0A080] h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="font-mono text-xl w-12 text-right">{(sfxVolume * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleSfxMute(); }}
                            className={`p-3 border-2 transition-all rounded ${sfxMuted ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-gray-600 text-gray-400 hover:text-white'}`}
                        >
                            {sfxMuted ? <VolumeX size={24} /> : <Speaker size={24} />}
                        </button>
                    </div>

                    {/* Music Volume */}
                    <div 
                        className={getRowStyle(2)}
                        onMouseEnter={() => setSelectedIndex(2)}
                    >
                        <div className="text-left flex-1 mr-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Music size={24} />
                                <h3 className="font-bold uppercase tracking-widest text-xl">Music Volume</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="0" max="1" step="0.1" 
                                    value={musicVolume} 
                                    onChange={handleMusicVolumeChange}
                                    className="w-full accent-[#C0A080] h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="font-mono text-xl w-12 text-right">{(musicVolume * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onClose} 
                    onMouseEnter={() => setSelectedIndex(3)}
                    className={`mt-12 group flex items-center justify-center gap-2 mx-auto font-bold uppercase tracking-widest transition-all border-b border-transparent pb-1 text-lg
                        ${selectedIndex === 3 ? 'text-white border-current scale-105' : 'text-gray-500 hover:text-white hover:border-current'}
                    `}
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Return to Main Menu
                </button>
            </TechFrame>
        </div>
    );
};
