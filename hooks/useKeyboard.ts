
import React, { useEffect, useRef } from 'react';
import { Point } from '../types';

export interface InputController {
    directionRef: React.MutableRefObject<Point>;
    getNextDirection: () => Point;
    reset: (defaultDir?: Point) => void;
}

export const useKeyboard = (
    statusRef: React.MutableRefObject<string>,
    levelRef: React.MutableRefObject<number>,
    onPauseToggle: () => void,
    onTutorialDismiss: () => void,
    onTutorialInput?: (key: string) => void,
    onAbilityUse?: () => void,
    onDash?: () => void
): InputController => {
    // Current "Executed" direction
    const directionRef = useRef<Point>({ x: 0, y: 0 });

    // Input Buffer
    const inputQueueRef = useRef<Point[]>([]);

    const lastPausePress = useRef(0);
    const lastAbilityPress = useRef(0);
    const lastDashPress = useRef(0);
    const lastTutorialPress = useRef(0);
    const isFirstPoll = useRef(true);

    const reset = (defaultDir: Point = { x: 0, y: 0 }) => {
        directionRef.current = defaultDir;
        inputQueueRef.current = [];
    };

    const getNextDirection = (): Point => {
        if (inputQueueRef.current.length > 0) {
            const next = inputQueueRef.current.shift()!;
            directionRef.current = next;
            return next;
        }
        return directionRef.current;
    };

    // Helper to queue input safely
    const queueInput = (newDir: Point) => {
        // Determine what we are comparing against (tail of queue, or current dir)
        const lastScheduled = inputQueueRef.current.length > 0
            ? inputQueueRef.current[inputQueueRef.current.length - 1]
            : directionRef.current;

        // Prevent 180 degree turns
        if (newDir.x === -lastScheduled.x && newDir.y === -lastScheduled.y) return;

        // Prevent dupes (pressing same key twice)
        if (newDir.x === lastScheduled.x && newDir.y === lastScheduled.y) return;

        // Cap queue size to prevent massive lag
        if (inputQueueRef.current.length < 3) {
            inputQueueRef.current.push(newDir);
        }
    };

    // KEYBOARD HANDLERS
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const status = statusRef.current;
            const level = levelRef.current;

            if ((e.key === 'Enter' || e.key === ' ') && (status === 'tutorial' || status === 'tutorial_summary')) {
                onTutorialDismiss();
                return;
            }

            if (e.key === ' ' && status === 'playing' && onDash) {
                onDash();
                return;
            }

            if (e.key === 'Escape' || e.key === 'Enter') {
                if (status === 'playing' || status === 'paused' || status === 'evasion') {
                    onPauseToggle();
                    return;
                }
            }

            if (e.key === 'Shift') {
                if (status === 'playing' && onAbilityUse) {
                    onAbilityUse();
                }
            }

            // --- STANDARD GAME MOVEMENT (Snake) ---
            if (status === 'playing') {
                let newDir: Point | null = null;
                if (e.key === 'ArrowUp') newDir = { x: 0, y: -1 };
                if (e.key === 'ArrowDown') newDir = { x: 0, y: 1 };
                if (e.key === 'ArrowLeft') newDir = { x: -1, y: 0 };
                if (e.key === 'ArrowRight') newDir = { x: 1, y: 0 };

                if (newDir) {
                    queueInput(newDir);
                    if (onTutorialInput && level === 0) {
                        onTutorialInput(e.key);
                    }
                }
            }
            // --- EVASION PROTOCOL MOVEMENT (Runner) ---
            else if (status === 'evasion') {
                // Evasion is instant, no buffer needed
                if (e.key === 'ArrowLeft') directionRef.current = { x: -1, y: 0 };
                if (e.key === 'ArrowRight') directionRef.current = { x: 1, y: 0 };
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const status = statusRef.current;
            if (status === 'evasion') {
                const cur = directionRef.current;
                if (e.key === 'ArrowLeft' && cur.x === -1) directionRef.current = { x: 0, y: 0 };
                if (e.key === 'ArrowRight' && cur.x === 1) directionRef.current = { x: 0, y: 0 };
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [onPauseToggle, onTutorialDismiss, onTutorialInput, onAbilityUse]);

    useEffect(() => {
        isFirstPoll.current = true;
        // Clear queue on status change to avoid carrying inputs between screens
        // Since we don't depend on status in deps anymore, we assume reset() is called by actions when switching modes
    }, []);

    // GAMEPAD POLLING LOOP
    useEffect(() => {
        let animationFrameId: number;

        const pollGamepad = () => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gp = gamepads[0];

            if (gp) {
                if (isFirstPoll.current) {
                    isFirstPoll.current = false;
                } else {
                    const now = Date.now();
                    const status = statusRef.current;
                    const BUTTON_START = 9;
                    const BUTTON_SELECT = 8;
                    const BUTTON_A = 0;
                    const BUTTON_X = 2;
                    const BUTTON_Y = 3;
                    const BUTTON_RB = 5;
                    const THRESHOLD = 0.5;

                    if (gp.buttons[BUTTON_START]?.pressed || gp.buttons[BUTTON_SELECT]?.pressed) {
                        if (now - lastPausePress.current > 500) {
                            if (['playing', 'paused', 'evasion'].includes(status)) {
                                onPauseToggle();
                                lastPausePress.current = now;
                            }
                        }
                    }

                    if (gp.buttons[BUTTON_A]?.pressed) {
                        if ((status === 'tutorial' || status === 'tutorial_summary') && now - lastTutorialPress.current > 300) {
                            onTutorialDismiss();
                            lastTutorialPress.current = now;
                        }
                    }

                    if (onAbilityUse && status === 'playing') {
                        if (gp.buttons[BUTTON_X]?.pressed || gp.buttons[BUTTON_Y]?.pressed || gp.buttons[BUTTON_RB]?.pressed) {
                            if (now - lastAbilityPress.current > 300) {
                                onAbilityUse();
                                lastAbilityPress.current = now;
                            }
                        }
                    }

                    const xVal = gp.axes[0];
                    const yVal = gp.axes[1];

                    let dx = 0;
                    let dy = 0;

                    if (gp.buttons[12]?.pressed) dy = -1;
                    else if (gp.buttons[13]?.pressed) dy = 1;
                    else if (gp.buttons[14]?.pressed) dx = -1;
                    else if (gp.buttons[15]?.pressed) dx = 1;

                    if (dx === 0 && dy === 0) {
                        if (Math.abs(xVal) > THRESHOLD || Math.abs(yVal) > THRESHOLD) {
                            if (Math.abs(xVal) > Math.abs(yVal)) {
                                dx = xVal > 0 ? 1 : -1;
                            } else {
                                dy = yVal > 0 ? 1 : -1;
                            }
                        }
                    }

                    if (dx !== 0 || dy !== 0) {
                        if (status === 'playing') {
                            queueInput({ x: dx, y: dy });
                        } else if (status === 'evasion') {
                            if (dx !== 0) directionRef.current = { x: dx, y: 0 };
                        }
                    } else {
                        if (status === 'evasion') {
                            directionRef.current = { x: 0, y: 0 };
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(pollGamepad);
        };

        animationFrameId = requestAnimationFrame(pollGamepad);
        return () => cancelAnimationFrame(animationFrameId);
    }, [onPauseToggle, onTutorialDismiss, onAbilityUse]);

    return { directionRef, getNextDirection, reset };
};
