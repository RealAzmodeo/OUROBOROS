
import React, { useState, useCallback, useEffect } from 'react';
import { BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS, GRID_SIZE, ItemType, EnemyType, LevelData } from '../types';
import { TechFrame } from './ui/TechFrame';
import { Copy, Save, Eraser, MousePointer2, AlertTriangle, Shield, Play, User, Terminal, ArrowLeft, DoorOpen, Hash, FolderOpen, Trash2, Download } from 'lucide-react';
import { saveCustomLevel, getCustomLevels, deleteCustomLevel, STATIC_LEVELS } from '../data/levels';

interface MapEditorProps {
    showCRT: boolean;
    onClose: () => void;
    onTest: (levelData: LevelData) => void;
}

type ToolType = 'wall' | 'trap' | 'gate' | 'eraser' | 'static' | 'patrol' | 'wanderer' | 'chaser';

export const MapEditor: React.FC<MapEditorProps> = ({ showCRT, onClose, onTest }) => {
    // State for grid (40x30 chars)
    const [grid, setGrid] = useState<string[][]>(
        Array(BOARD_HEIGHT_CELLS).fill(null).map(() => Array(BOARD_WIDTH_CELLS).fill('.'))
    );
    const [activeTool, setActiveTool] = useState<ToolType>('wall');
    const [gateChannel, setGateChannel] = useState<string>('G'); // 'G' or '0'-'9'
    const [isDragging, setIsDragging] = useState(false);
    
    // Metadata State
    const [levelName, setLevelName] = useState("Custom Level");
    const [integrity, setIntegrity] = useState(5);
    const [tickRate, setTickRate] = useState(100);
    const [bonusEnemies, setBonusEnemies] = useState(3);
    const [sequence, setSequence] = useState<ItemType[]>(['alpha', 'beta']);
    
    // Auto-suggest next ID
    const [suggestedId, setSuggestedId] = useState(99);

    useEffect(() => {
        const lastId = STATIC_LEVELS.length > 0 ? STATIC_LEVELS[STATIC_LEVELS.length - 1].id : 0;
        setSuggestedId(lastId + 1);
    }, []);
    
    const [savedMaps, setSavedMaps] = useState<LevelData[]>([]);
    const [showLoadMenu, setShowLoadMenu] = useState(false);

    useEffect(() => {
        setSavedMaps(getCustomLevels());
    }, [showLoadMenu]);

    // Paint function
    const paint = (x: number, y: number) => {
        if (x < 0 || x >= BOARD_WIDTH_CELLS || y < 0 || y >= BOARD_HEIGHT_CELLS) return;
        
        const newGrid = [...grid];
        newGrid[y] = [...newGrid[y]];
        
        let char = '.';
        if (activeTool === 'wall') char = '#';
        else if (activeTool === 'trap') char = 'T';
        else if (activeTool === 'gate') char = gateChannel; // Use selected channel
        else if (activeTool === 'eraser') char = '.';
        else if (activeTool === 'static') char = 'S';
        else if (activeTool === 'patrol') char = 'P';
        else if (activeTool === 'wanderer') char = 'W';
        else if (activeTool === 'chaser') char = 'C';

        newGrid[y][x] = char;
        setGrid(newGrid);
    };

    const handleMouseDown = (x: number, y: number) => {
        setIsDragging(true);
        paint(x, y);
    };

    const handleMouseEnter = (x: number, y: number) => {
        if (isDragging) paint(x, y);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Helper to build level object
    const buildLevelObject = (): LevelData => {
         const layoutRows = grid.map(row => row.join(''));
         return {
            id: 99, 
            name: levelName,
            integrity: integrity,
            sequence: sequence,
            enemyCountBonus: bonusEnemies,
            enemyTypes: ['static', 'patrol', 'wanderer', 'chaser'], 
            tickRate: tickRate,
            layout: layoutRows
         };
    };

    const handleSave = () => {
        if (!levelName.trim()) {
            alert("Please enter a Level Name.");
            return;
        }
        const data = buildLevelObject();
        saveCustomLevel(data);
        alert(`Saved "${levelName}" to browser storage! You can play it from the Level Select menu.`);
        setSavedMaps(getCustomLevels());
    };

    const handleLoad = (map: LevelData) => {
        setLevelName(map.name || "Untitled");
        setIntegrity(map.integrity);
        setTickRate(map.tickRate);
        setBonusEnemies(map.enemyCountBonus);
        setSequence(map.sequence);
        
        // Parse Layout to Grid
        const newGrid = map.layout.map(row => row.split(''));
        // Ensure dimensions match
        if (newGrid.length < BOARD_HEIGHT_CELLS) {
            const diff = BOARD_HEIGHT_CELLS - newGrid.length;
            for(let i=0; i<diff; i++) newGrid.push(Array(BOARD_WIDTH_CELLS).fill('.'));
        }
        setGrid(newGrid);
        setShowLoadMenu(false);
    };

    const handleDelete = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this map?")) {
            deleteCustomLevel(index);
            setSavedMaps(getCustomLevels());
        }
    };

    // Export Logic
    const generateCode = () => {
        const data = buildLevelObject();
        const varName = `LEVEL_${levelName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
        
        // Compress Layout
        const compressedLayoutLines: string[] = [];
        let emptyCount = 0;
        const emptyRowStr = '.'.repeat(BOARD_WIDTH_CELLS);

        data.layout.forEach(row => {
            if (row === emptyRowStr) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    compressedLayoutLines.push(`        ...emptyRows(${emptyCount})`);
                    emptyCount = 0;
                }
                compressedLayoutLines.push(`        "${row}"`);
            }
        });
        if (emptyCount > 0) {
            compressedLayoutLines.push(`        ...emptyRows(${emptyCount})`);
        }
        
        return `
import { LevelData, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS } from '../../types';

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH_CELLS);
const emptyRows = (count: number) => Array(count).fill(EMPTY_ROW);

// INSTRUCTIONS:
// 1. Create a new file in 'data/maps/', e.g., 'level_${suggestedId.toString().padStart(2, '0')}.ts'
// 2. Paste this code.
// 3. CHANGE 'id: ${suggestedId}' below to the correct sequential number (previous max + 1).
// 4. That's it! The game will automatically load it.

export const ${varName}: LevelData = {
    id: ${suggestedId}, // <<< ENSURE THIS IS UNIQUE AND SEQUENTIAL
    name: "${levelName}",
    integrity: ${integrity},
    sequence: [${sequence.map(s => `'${s}'`).join(', ')}],
    enemyCountBonus: ${bonusEnemies},
    enemyTypes: ['static', 'patrol', 'wanderer', 'chaser'], 
    tickRate: ${tickRate},
    layout: [
${compressedLayoutLines.join(',\n')}
    ]
};
`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateCode());
        alert("Code copied!\n\nFollow the instructions in the comment block to add it to the game permanently.");
    };

    const downloadFile = () => {
        const code = generateCode();
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `level_${suggestedId.toString().padStart(2, '0')}.ts`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleTest = () => {
        const data = buildLevelObject();
        onTest(data);
    };

    const handleChannelChange = (val: string) => {
        setGateChannel(val);
    };

    return (
        <div className="fixed inset-0 bg-[#1A1B26] text-[#E3DAC9] z-50 flex flex-col overflow-hidden" onMouseUp={handleMouseUp}>
            {showCRT && <div className="crt-scanlines" />}
            {/* Header */}
            <div className="h-16 border-b-2 border-[#C0A080] flex items-center justify-between px-6 bg-[#1A1B26]">
                <div className="flex items-center gap-4">
                     <button onClick={onClose} className="hover:text-white"><ArrowLeft /></button>
                     <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-[#C0A080]">Map Editor // Architect Protocol</h1>
                </div>
                <div className="flex gap-4">
                     <button onClick={() => setShowLoadMenu(!showLoadMenu)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white border border-gray-600 font-bold uppercase text-sm hover:bg-gray-700 transition-colors">
                         <FolderOpen size={16} /> Load
                     </button>
                     <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-900 text-green-200 border border-green-400 font-bold uppercase text-sm hover:bg-green-800 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                         <Save size={16} /> Save Map
                     </button>
                     <button onClick={handleTest} className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-blue-200 border border-blue-400 font-bold uppercase text-sm hover:bg-blue-800 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                         <Play size={16} /> Test
                     </button>
                     <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-[#8A1C1C] text-[#C0A080] border border-[#C0A080] font-bold uppercase text-sm hover:bg-[#C0A080] hover:text-[#8A1C1C] transition-colors">
                         <Copy size={16} /> Copy
                     </button>
                     <button onClick={downloadFile} className="flex items-center gap-2 px-4 py-2 bg-[#8A1C1C] text-[#C0A080] border border-[#C0A080] font-bold uppercase text-sm hover:bg-[#C0A080] hover:text-[#8A1C1C] transition-colors">
                         <Download size={16} /> Download
                     </button>
                </div>
            </div>

            {/* Load Menu Overlay */}
            {showLoadMenu && (
                <div className="absolute top-16 right-0 w-80 bg-[#12131b] border-l-2 border-b-2 border-[#C0A080] z-50 shadow-2xl animate-in slide-in-from-top-5 duration-200">
                    <div className="p-4 border-b border-gray-800">
                        <h3 className="font-bold text-white uppercase tracking-widest">Load Custom Map</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {savedMaps.length === 0 && (
                            <div className="p-4 text-sm text-gray-500 italic">No saved maps found.</div>
                        )}
                        {savedMaps.map((map, idx) => (
                            <div key={idx} onClick={() => handleLoad(map)} className="p-3 border-b border-gray-800 hover:bg-white/5 cursor-pointer flex justify-between items-center group">
                                <div>
                                    <div className="font-bold text-cyan-400">{map.name}</div>
                                    <div className="text-[10px] text-gray-500">{map.integrity} INT | {map.tickRate}ms</div>
                                </div>
                                <button onClick={(e) => handleDelete(idx, e)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden z-10">
                {/* Left Sidebar - Tools */}
                <div className="w-64 border-r-2 border-[#C0A080]/30 p-4 flex flex-col gap-6 bg-[#12131b]">
                    <div>
                        <h3 className="font-mono text-xs uppercase tracking-widest text-[#718096] mb-3">Structures</h3>
                        <div className="grid grid-cols-2 gap-2">
                             <ToolButton active={activeTool === 'wall'} onClick={() => setActiveTool('wall')} icon={<Shield size={16} />} label="Wall (#)" />
                             <ToolButton active={activeTool === 'trap'} onClick={() => setActiveTool('trap')} icon={<AlertTriangle size={16} />} label="Trap (T)" color="text-red-500" />
                             <ToolButton active={activeTool === 'gate'} onClick={() => setActiveTool('gate')} icon={<DoorOpen size={16} />} label="Gate" color="text-cyan-400" />
                             <ToolButton active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} icon={<Eraser size={16} />} label="Erase (.)" />
                        </div>
                        
                        {/* Gate Channel Selector */}
                        {activeTool === 'gate' && (
                            <div className="mt-4 p-3 bg-black/30 border border-cyan-900/50 rounded">
                                <label className="block text-xs uppercase tracking-widest text-cyan-500 mb-2">Gate Channel</label>
                                <div className="grid grid-cols-4 gap-1">
                                    <button 
                                        onClick={() => handleChannelChange('G')}
                                        className={`px-1 py-1 text-xs font-mono border ${gateChannel === 'G' ? 'bg-cyan-600 text-white border-white' : 'bg-transparent text-cyan-600 border-cyan-900 hover:border-cyan-500'}`}
                                        title="Auto Pair"
                                    >
                                        Auto
                                    </button>
                                    {['0','1','2','3','4','5','6','7','8','9'].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => handleChannelChange(num)}
                                            className={`px-1 py-1 text-xs font-mono border ${gateChannel === num ? 'bg-cyan-600 text-white border-white' : 'bg-transparent text-cyan-600 border-cyan-900 hover:border-cyan-500'}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="font-mono text-xs uppercase tracking-widest text-[#718096] mb-3">Enemies</h3>
                        <div className="grid grid-cols-2 gap-2">
                             <ToolButton active={activeTool === 'static'} onClick={() => setActiveTool('static')} icon={<AlertTriangle size={16} />} label="Static (S)" />
                             <ToolButton active={activeTool === 'patrol'} onClick={() => setActiveTool('patrol')} icon={<User size={16} />} label="Patrol (P)" />
                             <ToolButton active={activeTool === 'wanderer'} onClick={() => setActiveTool('wanderer')} icon={<User size={16} />} label="Wander (W)" />
                             <ToolButton active={activeTool === 'chaser'} onClick={() => setActiveTool('chaser')} icon={<AlertTriangle size={16} />} label="Chase (C)" color="text-red-500" />
                        </div>
                    </div>
                    
                    <div className="mt-auto p-4 bg-black/20 border border-[#C0A080]/20 text-xs font-mono text-[#718096]">
                        <p className="mb-2">INSTRUCTIONS:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Draw on the grid.</li>
                            <li>Use <strong>Save Map</strong> to play it later from Main Menu.</li>
                            <li>Use <strong>Test</strong> for quick check.</li>
                        </ul>
                    </div>
                </div>

                {/* Center - Canvas */}
                <div className="flex-1 overflow-auto p-8 bg-[#0d0e15] flex items-center justify-center">
                     <div 
                        className="bg-[#1A1B26] border border-[#C0A080]/50 shadow-2xl relative select-none"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${BOARD_WIDTH_CELLS}, 20px)`,
                            gridTemplateRows: `repeat(${BOARD_HEIGHT_CELLS}, 20px)`,
                        }}
                        onMouseLeave={handleMouseUp}
                     >
                         {grid.map((row, y) => row.map((cell, x) => (
                             <div 
                                key={`${x}-${y}`}
                                onMouseDown={() => handleMouseDown(x, y)}
                                onMouseEnter={() => handleMouseEnter(x, y)}
                                className={`
                                    w-[20px] h-[20px] max-w-[20px] max-h-[20px] min-w-[20px] min-h-[20px] leading-none text-[10px]
                                    border-[0.5px] border-[#2d3748] cursor-crosshair overflow-hidden flex items-center justify-center flex-none
                                    ${cell === '#' ? 'bg-[#552222]' : ''}
                                    ${cell === 'T' ? 'bg-red-600' : ''}
                                    ${(cell === 'G' || (cell >= '0' && cell <= '9')) ? 'bg-cyan-900 border-cyan-500 border-2 text-white font-mono' : ''}
                                    ${cell === 'S' || cell === 'P' || cell === 'W' || cell === 'C' ? 'bg-[#C0A080] font-bold text-black' : ''}
                                `}
                             >
                                 {(cell !== '#' && cell !== '.' && cell !== 'T') && cell}
                             </div>
                         )))}
                     </div>
                </div>

                {/* Right Sidebar - Config */}
                <div className="w-80 border-l-2 border-[#C0A080]/30 p-6 flex flex-col gap-6 bg-[#12131b] overflow-y-auto">
                    <h3 className="font-display font-bold uppercase tracking-widest text-[#C0A080]">Level Config</h3>
                    
                    <div className="space-y-4">
                        <ConfigInput label="Level Name" value={levelName} onChange={(e) => setLevelName(e.target.value)} />
                        
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#718096] mb-1">Tick Rate (Speed)</label>
                            <div className="flex items-center gap-2">
                                <input type="range" min="40" max="200" value={tickRate} onChange={(e) => setTickRate(Number(e.target.value))} className="w-full accent-[#C0A080]" />
                                <span className="font-mono text-sm w-12 text-right">{tickRate}ms</span>
                            </div>
                        </div>

                        <ConfigInput type="number" label="Target Integrity" value={integrity} onChange={(e) => setIntegrity(Number(e.target.value))} />
                        <ConfigInput type="number" label="Bonus Random Enemies" value={bonusEnemies} onChange={(e) => setBonusEnemies(Number(e.target.value))} />
                        
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#718096] mb-1">Sequence</label>
                            <div className="flex gap-2 mb-2">
                                <button onClick={() => setSequence([...sequence, 'alpha'])} className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs border border-blue-500 rounded">+ Alpha</button>
                                <button onClick={() => setSequence([...sequence, 'beta'])} className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs border border-blue-500 rounded">+ Beta</button>
                                <button onClick={() => setSequence([...sequence, 'gamma'])} className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs border border-blue-500 rounded">+ Gamma</button>
                            </div>
                            <div className="flex flex-wrap gap-1 p-2 bg-black/30 min-h-[40px]">
                                {sequence.map((s, i) => (
                                    <span key={i} onClick={() => setSequence(sequence.filter((_, idx) => idx !== i))} className="cursor-pointer px-1 bg-gray-800 text-[10px] text-white border border-gray-600 hover:bg-red-900">{s[0].toUpperCase()}</span>
                                ))}
                                {sequence.length === 0 && <span className="text-xs text-gray-600 italic">No Sequence</span>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <label className="block text-xs uppercase tracking-widest text-[#718096] mb-1">Export Preview</label>
                        <textarea 
                            readOnly 
                            className="w-full h-32 bg-black text-[#718096] font-mono text-[10px] p-2 resize-none focus:outline-none"
                            value={generateCode()}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color?: string}> = ({active, onClick, icon, label, color}) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 p-2 text-xs font-bold uppercase transition-all
        ${active ? 'bg-[#C0A080] text-[#1A1B26]' : `bg-transparent text-[#718096] hover:text-[#C0A080] border border-[#718096] hover:border-[#C0A080]`}
        `}
    >
        <span className={active ? 'text-black' : color}>{icon}</span>
        {label}
    </button>
);

const ConfigInput: React.FC<{label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string}> = ({label, value, onChange, type="text"}) => (
    <div>
        <label className="block text-xs uppercase tracking-widest text-[#718096] mb-1">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={onChange}
            className="w-full bg-black/30 border border-[#718096] text-[#E3DAC9] px-2 py-1 text-sm font-mono focus:border-[#C0A080] focus:outline-none"
        />
    </div>
);
