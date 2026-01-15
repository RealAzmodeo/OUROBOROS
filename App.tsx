
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'lucide-react';
import { GameState, LevelData, TutorialStep, Upgrade } from './types';
import { useThemeStyles } from './components/ui/ThemeContext';
import { BASE_UPGRADES, MECHANIC_DB, VFX_DB } from './data/constants';
import { ENEMY_DB } from './data/enemies';
import { resolveUpgradePurchase, ANOMALY_DB } from './utils/shopSystem';
import { audio } from './utils/audio';
import { DebugMenu } from './components/ui/DebugMenu';
import { TUTORIAL_STEPS, HP_TUTORIAL_STEP, WRONG_MATTER_STEP, HAZARD_DEATH_STEP, SUMMARY_STEP } from './data/tutorial';

import { useKeyboard } from './hooks/useKeyboard';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameActions } from './hooks/useGameActions';
import { ScreenManager } from './components/ScreenManager';

const INITIAL_GAME_STATE: GameState = {
    snake: [],
    enemies: [],
    pickups: [],
    coins: [],
    particles: [],
    walls: [],
    score: 0,
    highScore: 0,
    currency: 0,
    status: 'title', 
    level: 1,
    targetIntegrity: 3,
    activeUpgrades: [],
    activeModifiers: [],
    pendingType: null,
    stats: { alphaChain: 0, betaCount: 0, gammaCount: 0 },
    buffs: { invulnerableUntil: 0, stasisUntil: 0, currentShields: 0, velocitySyncActiveUntil: 0, velocitySyncCooldownUntil: 0 },
    requiredSequence: [],
    shop: { choices: [], freePickAvailable: false },
    tickRate: 100,
    activeLevelConfig: undefined,
    isTesting: false,
    evasionLevel: 1
};

const App: React.FC = () => {
  const mode = 'dnd';
  const styles = useThemeStyles(mode);
  
  // Settings State
  const [showCRT, setShowCRT] = useState<boolean>(() => localStorage.getItem('neon_ouroboros_crt') !== 'false');
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const toggleCRT = useCallback(() => {
      setShowCRT(prev => {
          const next = !prev;
          localStorage.setItem('neon_ouroboros_crt', next.toString());
          return next;
      });
  }, []);
  
  // Init Audio
  useEffect(() => {
    const initAudio = () => {
        audio.init();
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    return () => {
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Persistence
  const [seenItems, setSeenItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('neon_ouroboros_seen');
      return saved ? new Set(JSON.parse(saved)) : new Set(['alpha', 'beta', 'gamma', 'static', 'wall', 'portal', 'sequence']);
    } catch {
      return new Set(['alpha', 'beta', 'gamma']);
    }
  });
  
  const [seenEvasionTutorial, setSeenEvasionTutorial] = useState<boolean>(() => {
      return localStorage.getItem('neon_ouroboros_seen_evasion') === 'true';
  });

  const [highScore, setHighScore] = useState<number>(() => {
      try { return parseInt(localStorage.getItem('neon_ouroboros_hiscore') || '0'); } catch { return 0; }
  });

  const updateHighScore = useCallback((score: number) => {
      setHighScore(current => {
          if (score > current) {
              localStorage.setItem('neon_ouroboros_hiscore', score.toString());
              return score;
          }
          return current;
      });
  }, []);

  const unlock = useCallback((...ids: string[]) => {
    setSeenItems(prev => {
        const next = new Set(prev);
        let changed = false;
        ids.forEach(id => {
            if (!next.has(id)) {
                next.add(id);
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('neon_ouroboros_seen', JSON.stringify(Array.from(next)));
            return next;
        }
        return prev;
    });
  }, []);

  const toggleDebugUnlock = useCallback(() => {
    setSeenItems(prev => {
        const allIds = new Set([
            ...BASE_UPGRADES.map(u => u.type),
            ...ENEMY_DB.map(e => e.type),
            ...MECHANIC_DB.map(m => m.id),
            ...VFX_DB.map(v => v.id),
            ...ANOMALY_DB.map(a => a.type)
        ]);
        if (prev.size >= allIds.size) {
             const defaults = new Set(['alpha', 'beta', 'gamma', 'static', 'wall', 'portal', 'sequence']);
             localStorage.setItem('neon_ouroboros_seen', JSON.stringify(Array.from(defaults)));
             return defaults;
        } else {
             localStorage.setItem('neon_ouroboros_seen', JSON.stringify(Array.from(allIds)));
             return allIds;
        }
    });
  }, []);

  const completeEvasionTutorial = useCallback(() => {
      setSeenEvasionTutorial(true);
      localStorage.setItem('neon_ouroboros_seen_evasion', 'true');
      // setGameState via action later
  }, []);

  // --- HOOK STATE ---
  const [tutorialInputHistory, setTutorialInputHistory] = useState<Set<string>>(new Set());
  const [seenHpTutorial, setSeenHpTutorial] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showTutorialMsg, setShowTutorialMsg] = useState<boolean>(false);
  const [lastShownStep, setLastShownStep] = useState<number>(-1);

  // --- ACTIONS & LOOP ---
  // To avoid circular dependency, we use Refs to pass current state to useKeyboard
  // while useGameLoop manages the actual state updates.
  
  // These refs track the current UI state for the keyboard hook
  const statusRef = useRef(INITIAL_GAME_STATE.status);
  const levelRef = useRef(INITIAL_GAME_STATE.level);

  // Ref for keyboard input 
  const directionRef = useKeyboard(
      statusRef, 
      levelRef,
      () => setGameState(prev => {
          if (prev.status === 'paused') {
              return { ...prev, status: prev.evasionState ? 'evasion' : 'playing' };
          } else {
              return { ...prev, status: 'paused' };
          }
      }),
      () => dismissTutorial(), 
      (key) => setTutorialInputHistory(prev => new Set(prev).add(key)),
      () => actions.handleAbility() 
  );

  const { 
      gameStateRef, 
      uiState, 
      setGameState, 
      tutorialStep,
      setTutorialStep 
  } = useGameLoop({
      initialState: { ...INITIAL_GAME_STATE, highScore },
      directionRef,
      tutorialInputCount: tutorialInputHistory.size,
      seenHpTutorial,
      seenEvasionTutorial,
      onUnlock: (id) => unlock(id),
      onGameOver: (score) => updateHighScore(score),
      playSfx: (type) => audio.play(type as any)
  });
  
  // Sync Refs
  useEffect(() => {
      statusRef.current = uiState.status;
      levelRef.current = uiState.level;
  }, [uiState.status, uiState.level]);

  // Helper to trigger tutorial
  const triggerTutorial = useCallback((stepId: number) => {
      setTutorialStep(stepId);
      setLastShownStep(stepId);
      setShowTutorialMsg(true);
      setGameState(prev => ({...prev, status: stepId === 100 ? 'tutorial_summary' : 'tutorial'}));
  }, [setGameState, setTutorialStep]);

  const actions = useGameActions(
      setGameState, 
      unlock, 
      directionRef.reset, 
      setCountdown, 
      setTutorialStep, 
      setLastShownStep, 
      setTutorialInputHistory, 
      setShowTutorialMsg, 
      highScore
  );

  // Dismiss tutorial logic
  const dismissTutorial = useCallback(() => {
      setShowTutorialMsg(false);
      if (tutorialStep === 2) { triggerTutorial(3); return; }
      if (tutorialStep === 4) { triggerTutorial(5); return; }
      if (tutorialStep === 6) {
          setGameState(prev => {
              const p = prev.portal!;
              const newWalls = [...prev.walls, 
                  { x: p.x - 2, y: p.y, width: 1, height: 1, type: 'trap' as const },
                  { x: p.x + 2, y: p.y, width: 1, height: 1, type: 'trap' as const },
                  { x: p.x, y: p.y - 2, width: 1, height: 1, type: 'trap' as const }
              ];
              const newCoins = [...prev.coins, 
                  { id: 'tut-coin-1', x: p.x + 3, y: p.y, value: 10 },
                  { id: 'tut-coin-2', x: p.x - 3, y: p.y, value: 10 }
              ];
              return {...prev, walls: newWalls, coins: newCoins};
          });
          triggerTutorial(7);
          return;
      }
      if (tutorialStep === 100) {
          setGameState(prev => ({ ...prev, status: 'title', isTesting: false, activeLevelConfig: undefined }));
      } else {
           setGameState(prev => ({...prev, status: 'playing'}));
      }
  }, [tutorialStep, triggerTutorial, setGameState]);

  // Audio Music Manager
  useEffect(() => {
      audio.init(); 
      const status = uiState.status;
      if (['title', 'menu', 'levelselect', 'collection', 'credits', 'settings', 'editor'].includes(status)) {
          audio.playMusic('menu');
      } else if (['playing', 'tutorial', 'levelup', 'paused', 'countdown'].includes(status)) {
          audio.playMusic('game');
      } else if (status === 'gameover') {
          audio.playMusic('gameover');
      } else if (status === 'evasion') {
          audio.playMusic('evasion');
      } else {
          audio.playMusic('none');
      }
  }, [uiState.status]);

  // Tutorial State Watcher
  useEffect(() => {
      if (uiState.level !== 0 && !uiState.status.includes('tutorial')) return;
      if (showTutorialMsg) return;

      if (uiState.status === 'tutorial' && seenHpTutorial && tutorialStep !== 99 && !showTutorialMsg) {
          triggerTutorial(99);
          return;
      }
      if (uiState.status === 'tutorial_summary' && !showTutorialMsg) {
          triggerTutorial(100);
          return;
      }
      if (uiState.level === 0) {
          if (tutorialStep !== lastShownStep && tutorialStep >= 0) {
              triggerTutorial(tutorialStep);
          }
      }
  }, [uiState, tutorialStep, lastShownStep, showTutorialMsg, seenHpTutorial, triggerTutorial]);

  // Countdown Logic
  useEffect(() => {
    if (uiState.status === 'countdown') {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => { 
                if (uiState.level === 0) {
                    triggerTutorial(0);
                    setGameState(prev => ({...prev, status: 'tutorial'}));
                } else {
                    setGameState(prev => ({...prev, status: 'playing'}));
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }
  }, [uiState.status, countdown, uiState.level, triggerTutorial, setGameState]);

  // Handle Debug Upgrade Add
  const handleAddDebugUpgrade = useCallback((base: any) => {
        setGameState(prev => {
            const existing = prev.activeUpgrades.find(u => u.type === base.type);
            let nextLevel = 1;
            if (existing) {
                if (existing.isBinary) return prev; 
                if (existing.level >= existing.maxLevel) return prev;
                nextLevel = existing.level + 1;
            }
            const newUpgrade: Upgrade = {
                ...base,
                level: nextLevel,
                description: existing ? "DEBUG UPGRADE" : base.description,
                value: base.value + (base.valuePerLevel * (nextLevel - 1))
            };
            const newUpgrades = resolveUpgradePurchase(prev.activeUpgrades, newUpgrade);
            let newBuffs = { ...prev.buffs };
            if (base.type === 'chassis') newBuffs.currentShields = nextLevel; 
            return { ...prev, activeUpgrades: newUpgrades, buffs: newBuffs };
        });
        audio.play('powerup');
    }, [setGameState]);

  // Determine active tutorial step to render
  let activeStep = null;
  if (showTutorialMsg) {
      if (uiState.status === 'tutorial_summary') activeStep = SUMMARY_STEP;
      else if (tutorialStep === 99) activeStep = HP_TUTORIAL_STEP;
      else if (tutorialStep === 97) activeStep = WRONG_MATTER_STEP;
      else if (tutorialStep === 98) activeStep = HAZARD_DEATH_STEP;
      else activeStep = TUTORIAL_STEPS[tutorialStep];
  }

  // Action Bundle for ScreenManager
  const screenActions = {
      startGame: () => {
          if (uiState.isTesting && uiState.activeLevelConfig) {
              actions.initializeLevel(uiState.activeLevelConfig, [], [], 0, 0, true);
          } else if (uiState.status === 'gameover' && !uiState.isTesting) {
              setGameState(prev => ({ ...prev, evasionLevel: 1 }));
              actions.startLevel(1, [], [], 0, 0);
          } else {
              setGameState(prev => ({ ...prev, status: 'menu' }));
              unlock('alpha', 'beta', 'gamma', 'static', 'wall', 'portal', 'sequence', 'crt', 'portal_vfx', 'explosion');
          }
          audio.play('ui_select');
      },
      startTutorialLevel: () => actions.startLevel(0, [], [], 0, 0),
      startActualGameplay: () => {
          audio.play('ui_select');
          actions.startLevel(1, [], [], 0, 0);
      },
      startLevel: actions.startLevel,
      setGameState,
      resetToMenu: () => setGameState(prev => ({ ...prev, status: 'title', isTesting: false, activeLevelConfig: undefined })),
      toggleCRT,
      toggleDebugUnlock,
      startEvasionDebug: () => actions.startEvasionDebug(seenEvasionTutorial),
      handleForceEvasionWin: () => {
          setGameState(prev => ({
              ...prev,
              evasionLevel: prev.evasionLevel + 1,
              evasionState: undefined,
              status: 'evasion_reward',
              currency: prev.currency + 500
          }));
      },
      selectUpgrade: actions.selectUpgrade,
      rerollShop: actions.rerollShop,
      proceedToNextLevel: () => {
          if (uiState.isTesting) {
              alert("Level Complete! Returning to Editor.");
              setGameState(prev => ({ ...prev, status: 'editor', isTesting: false }));
          } else {
              actions.startLevel(uiState.level + 1, uiState.activeUpgrades, uiState.activeModifiers, uiState.score + 500, uiState.currency);
          }
      },
      dismissTutorial,
      startTestRun: (data: LevelData) => actions.initializeLevel(data, [], [], 0, 0, true),
      completeEvasionTutorial: () => {
          completeEvasionTutorial();
          setGameState(prev => ({...prev, status: 'evasion'}));
      }
  };

  return (
    <>
      {(uiState.status === 'playing' || uiState.status === 'paused' || uiState.isTesting) && (
          <button 
              onClick={() => setShowDebugMenu(!showDebugMenu)}
              className="fixed top-6 right-6 z-[100] p-3 bg-black/80 text-white hover:text-yellow-400 border border-white/20 hover:border-yellow-400 rounded-full transition-all backdrop-blur-md shadow-lg group"
              title="Open Debug Console"
          >
              <Terminal size={24} className="group-hover:rotate-12 transition-transform" />
          </button>
      )}

      {showDebugMenu && (
          <DebugMenu 
              activeUpgrades={uiState.activeUpgrades}
              onAddUpgrade={handleAddDebugUpgrade}
              onClose={() => setShowDebugMenu(false)}
          />
      )}

      <ScreenManager 
          gameState={uiState}
          gameStateRef={gameStateRef}
          mode={mode}
          showCRT={showCRT}
          highScore={highScore}
          seenItems={seenItems}
          showDebugMenu={showDebugMenu}
          tutorialStep={tutorialStep}
          countdown={countdown}
          activeTutorialStep={activeStep}
          actions={screenActions}
      />
    </>
  );
};

export default App;
