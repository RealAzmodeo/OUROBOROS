
import React from 'react';
import { GameState, TutorialStep, Upgrade, LevelData, TutorialHighlightType } from '../types';
import { useThemeStyles } from './ui/ThemeContext';
import GameCanvas from './GameCanvas';
import { TitleScreen } from './screens/TitleScreen';
import { LevelSelectScreen } from './screens/LevelSelectScreen';
import { CollectionScreen } from './screens/CollectionScreen';
import { CreditsScreen } from './screens/CreditsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MapEditor } from './MapEditor';
import { TopHUD, LeftPanel, RightPanel } from './game/HUD';
import { TutorialOverlay } from './ui/TutorialOverlay';
import { TechFrame } from './ui/TechFrame';
import { DangerOverlay } from './ui/DangerOverlay';
import { PausedScreen } from './screens/PausedScreen';
import { LevelUpScreen } from './screens/LevelUpScreen';
import { EvasionRewardScreen } from './screens/EvasionRewardScreen';
import { EvasionFailScreen } from './screens/EvasionFailScreen';
import { EvasionTutorialScreen } from './screens/EvasionTutorialScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { Play } from 'lucide-react';
import { CUSTOM_LEVEL_START_ID } from '../data/levels';

interface ScreenManagerProps {
    gameState: GameState;
    gameStateRef: React.MutableRefObject<GameState>;
    mode: 'vintage' | 'dnd';
    showCRT: boolean;
    highScore: number;
    seenItems: Set<string>;
    showDebugMenu: boolean;
    tutorialStep: number;
    countdown: number;
    activeTutorialStep: TutorialStep | null;
    
    // Actions
    actions: {
        startGame: () => void;
        startTutorialLevel: () => void;
        startActualGameplay: () => void;
        startLevel: (id: number, ups: Upgrade[], mods: any[], score: number, curr: number) => void;
        setGameState: (updater: GameState | ((prev: GameState) => GameState)) => void;
        resetToMenu: () => void;
        toggleCRT: () => void;
        toggleDebugUnlock: () => void;
        startEvasionDebug: () => void;
        handleForceEvasionWin: () => void;
        selectUpgrade: (gs: GameState, u: Upgrade) => void;
        rerollShop: (gs: GameState) => void;
        proceedToNextLevel: () => void;
        dismissTutorial: () => void;
        startTestRun: (data: LevelData) => void;
        completeEvasionTutorial: () => void;
    }
}

export const ScreenManager: React.FC<ScreenManagerProps> = ({ 
    gameState, gameStateRef, mode, showCRT, highScore, seenItems, activeTutorialStep, countdown,
    actions 
}) => {
    const styles = useThemeStyles(mode);

    // Canvas sizing constants
    const GRID_SIZE = 30;
    const BOARD_WIDTH_CELLS = 40;
    const BOARD_HEIGHT_CELLS = 30;
    const CANVAS_WIDTH = BOARD_WIDTH_CELLS * GRID_SIZE; 
    const CANVAS_HEIGHT = BOARD_HEIGHT_CELLS * GRID_SIZE;
    
    // Enhanced proceed logic for custom levels
    const handleNextLevel = () => {
        if (gameState.level >= CUSTOM_LEVEL_START_ID) {
            // If custom level, return to menu on complete
            actions.setGameState(prev => ({ ...prev, status: 'levelselect', isTesting: false, activeLevelConfig: undefined }));
        } else {
            actions.proceedToNextLevel();
        }
    };

    const handleEvasionProceed = (newUpgrades: Upgrade[], bonusCurrency: number = 0) => {
        if (gameState.level >= CUSTOM_LEVEL_START_ID) {
            actions.setGameState(prev => ({ ...prev, status: 'levelselect', isTesting: false, activeLevelConfig: undefined }));
        } else {
            // Start next level immediately, bypassing the shop
            // Grant level completion score + any extra bonus
            actions.startLevel(
                gameState.level + 1, 
                newUpgrades, 
                gameState.activeModifiers, 
                gameState.score + 500, 
                gameState.currency + bonusCurrency
            );
        }
    };

    if (gameState.status === 'editor') {
        return <MapEditor onClose={actions.resetToMenu} onTest={actions.startTestRun} showCRT={showCRT} />;
    }

    if (gameState.status === 'title') {
        return (
          <TitleScreen 
              styles={styles} 
              highScore={highScore} 
              showCRT={showCRT}
              onStart={actions.startGame} 
              onTraining={actions.startTutorialLevel}
              onLevelSelect={() => actions.setGameState(p => ({...p, status: 'levelselect'}))}
              onCollection={() => actions.setGameState(p => ({...p, status: 'collection'}))} 
              onCredits={() => actions.setGameState(p => ({...p, status: 'credits'}))} 
              onEditor={() => actions.setGameState(p => ({...p, status: 'editor'}))} 
              onSettings={() => actions.setGameState(p => ({...p, status: 'settings'}))}
              onDebugEvasion={actions.startEvasionDebug}
          />
        );
    }
  
    if (gameState.status === 'levelselect') {
        return (
          <LevelSelectScreen 
              styles={styles} 
              showCRT={showCRT}
              onSelectLevel={(levelId) => { actions.startLevel(levelId, [], [], 0, 0); }} 
              onBack={() => actions.setGameState(p => ({...p, status: 'title'}))} 
          />
        );
    }
  
    if (gameState.status === 'collection') {
        return <CollectionScreen styles={styles} showCRT={showCRT} seenItems={seenItems} onClose={actions.resetToMenu} onToggleDebugUnlock={actions.toggleDebugUnlock} />;
    }
  
    if (gameState.status === 'credits') {
        return <CreditsScreen styles={styles} showCRT={showCRT} onClose={actions.resetToMenu} />;
    }
  
    if (gameState.status === 'settings') {
        return <SettingsScreen styles={styles} showCRT={showCRT} onToggleCRT={actions.toggleCRT} onClose={actions.resetToMenu} />;
    }

    // GAMEPLAY VIEW
    const currentIntegrity = gameState.snake.filter(s => s.type === 'body' && s.isCharged).length;
    const currentSequence = gameState.snake.filter(s => s.type === 'body' && s.isCharged && s.variant).map(s => s.variant!);
    const reqStr = gameState.requiredSequence.join(',');
    const currStr = currentSequence.join(',');
    const isSequenceMatched = currStr.includes(reqStr);
    const isInvulnerable = gameState.buffs.invulnerableUntil > Date.now();
    const currentShields = gameState.buffs.currentShields;
    const isStasis = gameState.buffs.stasisUntil > Date.now();

    return (
        <div className={`w-screen h-screen flex flex-col items-center justify-center ${styles.bg} ${styles.text} transition-colors duration-500 overflow-hidden`}>
            {showCRT && <div className="crt-scanlines" />}
            
            <div className="flex items-start gap-4">
                <LeftPanel gameState={gameState} styles={styles} />
      
                <div style={{ width: CANVAS_WIDTH }} className="flex flex-col relative">
                    <TopHUD 
                      gameState={gameState} 
                      styles={styles} 
                      highScore={highScore} 
                      currentIntegrity={currentIntegrity} 
                      isSequenceMatched={isSequenceMatched} 
                      isStasis={isStasis}
                      currentShields={currentShields}
                      isInvulnerable={isInvulnerable}
                    />
                    
                    <div className="relative border-x-2 border-b-2 border-opacity-20 border-current">
                          <GameCanvas 
                              gameStateRef={gameStateRef} 
                              mode={mode} 
                              width={CANVAS_WIDTH} 
                              height={CANVAS_HEIGHT}
                              tutorialHighlight={activeTutorialStep?.highlight}
                          />
      
                        {activeTutorialStep && (
                            <TutorialOverlay 
                                step={activeTutorialStep} 
                                onDismiss={actions.dismissTutorial} 
                                snakeHead={gameState.snake[0]} 
                            />
                        )}
                        
                        {gameState.status === 'menu' && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-50">
                                <TechFrame color="border-vintage-orange" className={`${styles.card} max-w-2xl w-full text-center p-12`}>
                                    <h2 className="font-display text-6xl mb-6 uppercase tracking-widest">System Ready</h2>
                                    <div className="h-px bg-current w-full mb-8 opacity-30"></div>
                                    <p className={`font-mono text-lg mb-8 ${styles.textSecondary} text-left pl-12 leading-relaxed`}>
                                      <strong className="text-white block mb-4 uppercase tracking-widest border-b border-gray-700 pb-2">Operational Protocol:</strong>
                                      1. Consume <span className="text-blue-400 font-bold">BLUE MATTER</span> to GROW.<br/>
                                      2. AVOID <span className="text-red-500 font-bold">RED HAZARDS</span>.<br/>
                                      3. Collect <span className="text-white font-bold">COINS</span> for upgrades.<br/>
                                      4. Match the <span className="text-[#39FF14] font-bold">SEQUENCE</span> to unlock Portals.<br/>
                                    </p>
                                    <button onClick={actions.startActualGameplay} className={`w-full py-6 text-2xl font-bold uppercase tracking-widest ${styles.buttonPrimary} relative overflow-hidden group`}>
                                        <span className="relative z-10 flex items-center justify-center"><Play className="inline mr-3" size={32} /> Engage Link</span>
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-1 transition-opacity"></div>
                                    </button>
                                </TechFrame>
                            </div>
                        )}
                        
                        {gameState.status === 'countdown' && (<DangerOverlay count={countdown} message="Initialize System" />)}
                        
                        {gameState.status === 'paused' && (
                            <PausedScreen 
                                gameState={gameState}
                                onResume={() => actions.setGameState(prev => ({...prev, status: prev.evasionState ? 'evasion' : 'playing'}))}
                                onAbandon={gameState.isTesting ? () => actions.setGameState(prev => ({ ...prev, status: 'editor', isTesting: false })) : actions.resetToMenu}
                                onDebugWin={actions.handleForceEvasionWin}
                            />
                        )}
      
                        {gameState.status === 'levelup' && (
                            <LevelUpScreen 
                              gameState={gameState} 
                              styles={styles} 
                              onSelectUpgrade={(u) => actions.selectUpgrade(gameState, u)} 
                              onReroll={() => actions.rerollShop(gameState)} 
                              onNextLevel={handleNextLevel} 
                            />
                        )}
                        
                        {gameState.status === 'evasion_reward' && (
                            <EvasionRewardScreen 
                                gameState={gameState}
                                onProceed={handleEvasionProceed}
                            />
                        )}
                        
                        {gameState.status === 'evasion_fail' && (
                            <EvasionFailScreen 
                                gameState={gameState}
                                onProceed={handleNextLevel}
                            />
                        )}
                        
                        {gameState.status === 'evasion_tutorial' && (
                            <EvasionTutorialScreen 
                                onBegin={actions.completeEvasionTutorial}
                            />
                        )}
      
                        {gameState.status === 'gameover' && (
                            <GameOverScreen 
                              gameState={gameState} 
                              onRestart={actions.startGame} 
                              onReturnToMenu={gameState.isTesting ? () => actions.setGameState(prev => ({ ...prev, status: 'editor', isTesting: false })) : actions.resetToMenu} 
                            />
                        )}
                    </div>
                </div>
      
                <RightPanel 
                  gameState={gameState} 
                  styles={styles} 
                  highScore={highScore}
                  currentIntegrity={currentIntegrity}
                  isSequenceMatched={isSequenceMatched}
                  isStasis={isStasis}
                  currentShields={currentShields}
                  isInvulnerable={isInvulnerable}
                />
            </div>
        </div>
    );
};
