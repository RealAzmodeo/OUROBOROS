import { useRef, useState, useEffect, useCallback } from 'react';
import { GameState } from '../types';
import { processGameTick, processEvasionTick } from '../utils/gameLogic';
import { particleSystem } from '../utils/particleSystem';
import { InputController } from './useKeyboard';

interface UseGameLoopProps {
    initialState: GameState;
    directionRef: InputController; // Changed from Ref to Controller
    tutorialInputCount: number;
    seenHpTutorial: boolean;
    seenEvasionTutorial: boolean;
    onUnlock: (id: string) => void;
    onGameOver: (score: number) => void;
    playSfx: (type: string) => void;
}

export const useGameLoop = ({
    initialState,
    directionRef: inputController,
    tutorialInputCount,
    seenHpTutorial,
    seenEvasionTutorial,
    onUnlock,
    onGameOver,
    playSfx
}: UseGameLoopProps) => {
    // The master source of truth for the game logic
    const gameStateRef = useRef<GameState>(initialState);
    
    // The UI State (synced periodically to trigger renders)
    const [uiState, setUiState] = useState<GameState>(initialState);
    
    // Internal refs
    const frameIdRef = useRef<number>(0);
    const lastTickRef = useRef<number>(0);
    const tutorialStepRef = useRef<number>(-1);
    
    // Capture latest inputs/props for the closure
    const propsRef = useRef({ 
        tutorialInputCount, 
        seenHpTutorial, 
        seenEvasionTutorial, 
        onUnlock, 
        onGameOver, 
        playSfx 
    });

    useEffect(() => {
        propsRef.current = { 
            tutorialInputCount, 
            seenHpTutorial, 
            seenEvasionTutorial, 
            onUnlock, 
            onGameOver, 
            playSfx 
        };
    }, [tutorialInputCount, seenHpTutorial, seenEvasionTutorial, onUnlock, onGameOver, playSfx]);

    // Force update UI state (manually trigger render)
    const syncUi = () => {
        setUiState({ ...gameStateRef.current });
    };

    // Manual setter to update state from outside (e.g. MapEditor, LevelSelect)
    const setGameState = useCallback((
        updater: GameState | ((prev: GameState) => GameState)
    ) => {
        if (typeof updater === 'function') {
            gameStateRef.current = updater(gameStateRef.current);
        } else {
            gameStateRef.current = updater;
        }
        syncUi();
    }, []);

    // Set tutorial step
    const setTutorialStep = useCallback((step: number) => {
        tutorialStepRef.current = step;
        syncUi();
    }, []);

    const gameLoop = useCallback((timestamp: number) => {
        const state = gameStateRef.current;
        const { tutorialInputCount, seenHpTutorial, seenEvasionTutorial, onUnlock, onGameOver, playSfx } = propsRef.current;

        // Skip if not playing/gameover
        if (state.status !== 'playing' && state.status !== 'gameover' && state.status !== 'evasion') {
            frameIdRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        // EVASION LOOP (30ms fixed)
        if (state.status === 'evasion') {
            if (timestamp - lastTickRef.current > 30) {
                 const result = processEvasionTick(state, {
                    direction: inputController.directionRef.current, // Evasion doesn't use buffer
                    timestamp,
                    tutorialStep: 0,
                    tutorialInputCount: 0,
                    seenHpTutorial: true,
                    seenEvasionTutorial: true,
                    unlockCallback: onUnlock,
                    playSfx
                });
                
                gameStateRef.current = result.newState;
                if (result.resetInput) inputController.reset();
                
                syncUi();
                lastTickRef.current = timestamp;
            }
        }
        // STANDARD LOOP
        else {
             let effectiveTickRate = state.tickRate || 100;
             if (state.buffs.velocitySyncActiveUntil > Date.now()) {
                const syncUpgrade = state.activeUpgrades.find(u => u.type === 'velocity_sync');
                if (syncUpgrade) {
                    const percentage = syncUpgrade.value / 100;
                    const slowdownFactor = 1 / (1 - percentage);
                    effectiveTickRate = effectiveTickRate * slowdownFactor;
                }
             }

             if (timestamp - lastTickRef.current > effectiveTickRate) {
                 // Consume Buffer
                 const nextDirection = inputController.getNextDirection();

                 const result = processGameTick(state, {
                    direction: nextDirection,
                    timestamp,
                    tutorialStep: tutorialStepRef.current,
                    tutorialInputCount,
                    seenHpTutorial,
                    seenEvasionTutorial,
                    unlockCallback: onUnlock,
                    playSfx
                 });

                 gameStateRef.current = result.newState;

                 // Process VFX Events into System
                 if (result.vfxEvents) {
                     result.vfxEvents.forEach(evt => {
                         particleSystem.spawn(evt.type, evt.x, evt.y, evt.color);
                     });
                 }

                 if (result.resetInput) {
                     inputController.reset();
                 }
                 if (result.forcedDirection) {
                     inputController.directionRef.current = result.forcedDirection;
                 }

                 if (result.nextTutorialStep !== tutorialStepRef.current) {
                     tutorialStepRef.current = result.nextTutorialStep;
                 }

                 if (result.newState.status === 'gameover') {
                     onGameOver(result.newState.score);
                 }
                 
                 if (result.tutorialError) {
                     tutorialStepRef.current = result.tutorialError;
                 }
                 
                 syncUi();
                 lastTickRef.current = timestamp;
             }
        }

        frameIdRef.current = requestAnimationFrame(gameLoop);
    }, [inputController]);

    useEffect(() => {
        frameIdRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(frameIdRef.current);
    }, [gameLoop]);

    return {
        gameStateRef,
        uiState,
        setGameState,
        tutorialStep: tutorialStepRef.current,
        setTutorialStep
    };
};