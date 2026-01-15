
import { useState, useEffect, useRef } from 'react';
import { audio } from '../utils/audio';

interface MenuNavOptions {
    items: number;
    cols?: number; // For grid navigation
    onSelect?: (index: number) => void;
    onBack?: () => void;
    onLeft?: (index: number) => void;
    onRight?: (index: number) => void;
    active?: boolean;
    loop?: boolean;
}

export const useMenuNavigation = ({ items, cols = 1, onSelect, onBack, onLeft, onRight, active = true, loop = true }: MenuNavOptions) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const lastInputTime = useRef(0);
    // Track button states to detect rising edges
    const buttonState = useRef<{ [key: number]: boolean }>({});
    const isFirstPoll = useRef(true);

    // Reset index when active state changes or items count changes significantly
    useEffect(() => {
        if (!active) return;
        // Optional: Reset selection on mount/activation
        // setSelectedIndex(0); 
        isFirstPoll.current = true;
    }, [active]);

    // Keyboard Input
    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const isNavKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape'].includes(e.key);
            if (!isNavKey) return;

            // Prevent default scrolling for arrows
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();

            if (e.key === 'ArrowUp') {
                setSelectedIndex(prev => {
                     const next = prev - cols;
                     if (next < 0) return loop ? (items - 1) : prev;
                     return next;
                });
                audio.play('ui_hover');
            } else if (e.key === 'ArrowDown') {
                setSelectedIndex(prev => {
                     const next = prev + cols;
                     if (next >= items) return loop ? 0 : prev;
                     return next;
                });
                audio.play('ui_hover');
            } else if (e.key === 'ArrowLeft') {
                if (onLeft) {
                    onLeft(selectedIndex);
                } else if (cols > 1) {
                    setSelectedIndex(prev => {
                        const rowStart = Math.floor(prev / cols) * cols;
                        const colIndex = prev % cols;
                        if (colIndex === 0) return loop ? rowStart + cols - 1 : prev;
                        return prev - 1;
                    });
                    audio.play('ui_hover');
                }
            } else if (e.key === 'ArrowRight') {
                if (onRight) {
                    onRight(selectedIndex);
                } else if (cols > 1) {
                     setSelectedIndex(prev => {
                        const rowStart = Math.floor(prev / cols) * cols;
                        const colIndex = prev % cols;
                        if (colIndex === cols - 1) return loop ? rowStart : prev;
                        if (prev + 1 >= items) return loop ? rowStart : prev;
                        return prev + 1;
                    });
                    audio.play('ui_hover');
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (onSelect) {
                    audio.play('ui_select');
                    onSelect(selectedIndex);
                }
            } else if (e.key === 'Escape') {
                if (onBack) {
                    audio.play('ui_select');
                    onBack();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [active, items, cols, onSelect, onBack, onLeft, onRight, loop, selectedIndex]);

    // Gamepad Input
    useEffect(() => {
        if (!active) return;
        
        let animationFrameId: number;

        const pollGamepad = () => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gp = gamepads[0];
            
            if (gp) {
                const now = Date.now();
                const threshold = 0.5;
                const DEBOUNCE_MS = 150;

                // Handle Buttons (Rising Edge Detection)
                // 0 = A/Cross (Select)
                // 1 = B/Circle (Back)
                const isAPressed = gp.buttons[0]?.pressed;
                const isBPressed = gp.buttons[1]?.pressed;

                // On first poll, strictly sync state but DO NOT trigger actions to prevent "hold-to-skip" bugs
                if (isFirstPoll.current) {
                    buttonState.current[0] = isAPressed;
                    buttonState.current[1] = isBPressed;
                    isFirstPoll.current = false;
                } else {
                    if (isAPressed && !buttonState.current[0]) {
                        if (onSelect) {
                            audio.play('ui_select');
                            onSelect(selectedIndex);
                        }
                    }
                    if (isBPressed && !buttonState.current[1]) {
                        if (onBack) {
                            audio.play('ui_select');
                            onBack();
                        }
                    }
                    buttonState.current[0] = isAPressed;
                    buttonState.current[1] = isBPressed;
                }
                
                // Directional Navigation (Throttled)
                if (now - lastInputTime.current > DEBOUNCE_MS) {
                    let direction = null;

                    // Stick Axes or D-Pad Buttons (12=Up, 13=Down, 14=Left, 15=Right)
                    if (gp.axes[1] < -threshold || gp.buttons[12]?.pressed) direction = 'up';
                    else if (gp.axes[1] > threshold || gp.buttons[13]?.pressed) direction = 'down';
                    else if (gp.axes[0] < -threshold || gp.buttons[14]?.pressed) direction = 'left';
                    else if (gp.axes[0] > threshold || gp.buttons[15]?.pressed) direction = 'right';

                    if (direction) {
                        lastInputTime.current = now;
                        
                        setSelectedIndex(prev => {
                            let next = prev;
                            let playedSound = false;

                            if (direction === 'up') {
                                next = prev - cols;
                                if (next < 0) next = loop ? (items - 1) : prev;
                            } else if (direction === 'down') {
                                next = prev + cols;
                                if (next >= items) next = loop ? 0 : prev;
                            } else if (direction === 'left') {
                                if (onLeft) {
                                    onLeft(prev);
                                    return prev; // Callback handles logic, no selection change usually
                                }
                                if (cols > 1) {
                                    const rowStart = Math.floor(prev / cols) * cols;
                                    const colIndex = prev % cols;
                                    if (colIndex === 0) next = loop ? rowStart + cols - 1 : prev;
                                    else next = prev - 1;
                                }
                            } else if (direction === 'right') {
                                if (onRight) {
                                    onRight(prev);
                                    return prev;
                                }
                                if (cols > 1) {
                                    const rowStart = Math.floor(prev / cols) * cols;
                                    const colIndex = prev % cols;
                                    if (colIndex === cols - 1) next = loop ? rowStart : prev;
                                    else if (prev + 1 >= items) next = loop ? rowStart : prev;
                                    else next = prev + 1;
                                }
                            }
                            
                            if (next !== prev || direction === 'left' || direction === 'right') {
                                if (!onLeft && !onRight) audio.play('ui_hover');
                            }
                            
                            return next;
                        });
                    }
                }
            }
            
            animationFrameId = requestAnimationFrame(pollGamepad);
        };

        animationFrameId = requestAnimationFrame(pollGamepad);
        return () => cancelAnimationFrame(animationFrameId);
    }, [active, items, cols, onSelect, onBack, onLeft, onRight, loop, selectedIndex]);

    return {
        selectedIndex,
        setSelectedIndex
    };
};
