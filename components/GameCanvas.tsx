

import React, { useRef, useEffect } from 'react';
import { GameState, GRID_SIZE, ThemeMode, TutorialHighlightType } from '../types';
import { getDistance } from '../utils/geometry';
import { drawPortal, drawShield, drawMagnetLink, drawFocusGuide, drawPortalSpawnAnimation, drawSecretPortalSpawnAnimation, drawStaticEffect } from '../utils/drawing';
import { particleSystem } from '../utils/particleSystem';

interface GameCanvasProps {
    gameStateRef: React.MutableRefObject<GameState>;
    mode: ThemeMode;
    width: number;
    height: number;
    tutorialHighlight?: TutorialHighlightType;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameStateRef, mode, width, height, tutorialHighlight }) => {
    const staticCanvasRef = useRef<HTMLCanvasElement>(null);
    const dynamicCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // To detect theme/highlight changes inside the loop without restarting it constantly
    const propsRef = useRef({ mode, tutorialHighlight });

    // Cache to track when to redraw static layer
    const staticCacheRef = useRef({
        level: -1,
        lastTrapMoveTime: 0,
        width: 0,
        height: 0
    });

    useEffect(() => {
        propsRef.current = { mode, tutorialHighlight };
    }, [mode, tutorialHighlight]);

    const colors = {
        bg: '#1A1B26',
        head: '#FFFFFF',
        enemy: '#FF0033', // Red
        frozenEnemy: '#FF0033',
        grid: '#2d3748',
        portalOpen: '#39FF14', // Neon Green
        portalClosed: '#FF0033', // Red
        secretPortal: '#8B5CF6', // Purple
        alpha: '#00F0FF',
        beta: '#00F0FF',
        gamma: '#00F0FF',
        stasis: '#FFD700',
        shieldPickup: '#39FF14',
        deadly: '#FF0033',
        trap: '#FF0000',
        gate: '#00F0FF',
        shield: '#FFD700',
        sequence: '#39FF14',
        coin: '#FFD700',
        boss: '#FF0000', // Red boss
        bossHp: '#FF0000'
    };

    const getItemColor = (type: string, isDeadly: boolean) => {
        if (isDeadly) return colors.deadly;
        if (type === 'stasis_orb') return colors.stasis;
        if (type === 'shield') return colors.shieldPickup;
        if (type === 'chronos_anchor') return '#FFAA00';
        if (type === 'omega_particle') return '#FF00FF';
        return colors.alpha;
    };

    useEffect(() => {
        const staticCanvas = staticCanvasRef.current;
        const dynamicCanvas = dynamicCanvasRef.current;
        const container = containerRef.current;

        if (!staticCanvas || !dynamicCanvas || !container) return;

        const staticCtx = staticCanvas.getContext('2d');
        const ctx = dynamicCanvas.getContext('2d'); // Dynamic context

        if (!staticCtx || !ctx) return;

        // Scaling helpers
        const PAD = GRID_SIZE * 0.15; // ~4.5px at size 30
        const INNER_SIZE = GRID_SIZE - (PAD * 2);
        const CENTER = GRID_SIZE / 2;

        let animationFrameId: number;

        const renderStaticLayer = (gameState: GameState) => {
            // Clear
            staticCtx.fillStyle = colors.bg;
            staticCtx.fillRect(0, 0, width, height);

            // Draw Grid
            staticCtx.strokeStyle = colors.grid;
            staticCtx.lineWidth = 1;
            staticCtx.beginPath();
            for (let x = 0; x <= width; x += GRID_SIZE) { staticCtx.moveTo(x, 0); staticCtx.lineTo(x, height); }
            for (let y = 0; y <= height; y += GRID_SIZE) { staticCtx.moveTo(0, y); staticCtx.lineTo(width, y); }
            staticCtx.stroke();

            // SEAMLESS WALL RENDERING
            const standardWalls = gameState.walls.filter(w => w.type === 'wall');
            const wallColor = colors.enemy;

            // 1. Build Lookup Map for seamless connection
            const wallSet = new Set<string>();
            standardWalls.forEach(w => {
                for (let i = 0; i < w.width; i++) {
                    for (let j = 0; j < w.height; j++) {
                        wallSet.add(`${w.x + i},${w.y + j}`);
                    }
                }
            });

            staticCtx.save();

            // 2. Draw Fills (Background)
            staticCtx.fillStyle = '#330000';
            standardWalls.forEach(w => {
                // Expand slightly (+1px total) to overlap neighbors and prevent sub-pixel seams
                staticCtx.fillRect(
                    w.x * GRID_SIZE - 0.5,
                    w.y * GRID_SIZE - 0.5,
                    w.width * GRID_SIZE + 1,
                    w.height * GRID_SIZE + 1
                );
            });

            // 3. Draw Seamless Edges
            staticCtx.strokeStyle = wallColor;
            staticCtx.lineWidth = 2;
            staticCtx.shadowColor = wallColor;
            staticCtx.shadowBlur = 15;
            staticCtx.beginPath();

            wallSet.forEach(key => {
                const [sx, sy] = key.split(',').map(Number);
                const px = sx * GRID_SIZE;
                const py = sy * GRID_SIZE;

                // Neighbors
                const n = wallSet.has(`${sx},${sy - 1}`);
                const s = wallSet.has(`${sx},${sy + 1}`);
                const e = wallSet.has(`${sx + 1},${sy}`);
                const w = wallSet.has(`${sx - 1},${sy}`);

                // Draw line if neighbor is missing (Edge)
                if (!n) { staticCtx.moveTo(px, py); staticCtx.lineTo(px + GRID_SIZE, py); }
                if (!s) { staticCtx.moveTo(px, py + GRID_SIZE); staticCtx.lineTo(px + GRID_SIZE, py + GRID_SIZE); }
                if (!w) { staticCtx.moveTo(px, py); staticCtx.lineTo(px, py + GRID_SIZE); }
                if (!e) { staticCtx.moveTo(px + GRID_SIZE, py); staticCtx.lineTo(px + GRID_SIZE, py + GRID_SIZE); }
            });

            staticCtx.stroke();
            staticCtx.restore();

            // Update Cache
            staticCacheRef.current = {
                level: gameState.level,
                lastTrapMoveTime: gameState.lastTrapMoveTime || 0,
                width,
                height
            };
        };

        const renderEvasion = (gameState: GameState) => {
            const es = gameState.evasionState;
            if (!es) return;
            const now = Date.now();

            // 1. Draw Speed Lines Background
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = '#1F2937'; // Dark gray
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Vertical lines stretch
            for (let x = 0; x <= width; x += GRID_SIZE) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            ctx.stroke();

            // Horizontal lines scrolling
            const offset = es.gridOffset % GRID_SIZE;
            ctx.strokeStyle = '#111827';
            ctx.beginPath();
            for (let y = offset; y <= height; y += GRID_SIZE * 2) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();

            // 2. Obstacles (Red Data Spikes)
            es.obstacles.forEach(o => {
                const px = o.x * GRID_SIZE;
                const py = o.y * GRID_SIZE;
                const pw = o.width * GRID_SIZE;

                ctx.fillStyle = '#991B1B'; // Dark Red
                ctx.shadowColor = '#EF4444'; // Bright Red Glow
                ctx.shadowBlur = 10;
                ctx.fillRect(px, py, pw, GRID_SIZE);
                ctx.shadowBlur = 0;

                // Spike details
                ctx.fillStyle = '#EF4444';
                ctx.beginPath();
                for (let i = 0; i < o.width; i++) {
                    const spx = px + (i * GRID_SIZE);
                    ctx.moveTo(spx, py);
                    ctx.lineTo(spx + GRID_SIZE / 2, py + GRID_SIZE * 0.8);
                    ctx.lineTo(spx + GRID_SIZE, py);
                }
                ctx.fill();
            });

            // 3. Coins (Data Packets)
            es.coins.forEach(c => {
                const px = c.x * GRID_SIZE + CENTER;
                const py = c.y * GRID_SIZE + CENTER;
                const size = GRID_SIZE * 0.42;
                const angle = (now / 1000) * Math.PI * 2;
                const scaleX = Math.cos(angle);

                ctx.save();
                ctx.translate(px, py);
                ctx.fillStyle = colors.coin;
                ctx.shadowColor = colors.coin;
                ctx.shadowBlur = 12;
                ctx.fillRect(-(size * scaleX) / 2, -size / 2, size * scaleX, size);
                ctx.restore();
            });

            // 4. Player (Head Only)
            // Fixed vertical position at bottom
            const playerPx = es.playerX * GRID_SIZE;
            const playerPy = (30 - 4) * GRID_SIZE; // Matches logic 26

            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 15;
            ctx.fillRect(playerPx + 2, playerPy + 2, GRID_SIZE - 4, GRID_SIZE - 4);

            // Trail
            ctx.globalAlpha = 0.3;
            ctx.fillRect(playerPx + 4, playerPy - 10, GRID_SIZE - 8, 10);
            ctx.fillRect(playerPx + 6, playerPy - 20, GRID_SIZE - 12, 10);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;

            // Overlay Speed Lines (Foregound)
            if (Math.random() > 0.8) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                const x = Math.random() * width;
                const w = Math.random() * 2 + 1;
                ctx.fillRect(x, 0, w, height);
            }

            // Render Particles for Evasion
            particleSystem.update();
            particleSystem.draw(ctx, GRID_SIZE, CENTER);

            animationFrameId = requestAnimationFrame(renderLoop);
        };

        const renderLoop = () => {
            const gameState = gameStateRef.current;
            const { tutorialHighlight } = propsRef.current;
            const now = Date.now();

            // CHECK IF STATIC LAYER NEEDS REDRAW
            if (
                gameState.level !== staticCacheRef.current.level ||
                (gameState.lastTrapMoveTime || 0) !== staticCacheRef.current.lastTrapMoveTime ||
                width !== staticCacheRef.current.width ||
                height !== staticCacheRef.current.height
            ) {
                renderStaticLayer(gameState);
            }

            if (gameState.status === 'evasion') {
                renderEvasion(gameState);
                return;
            }

            // CLEAR DYNAMIC CANVAS
            ctx.clearRect(0, 0, width, height);

            // --- CAMERA SHAKE ---
            let shakeX = 0;
            let shakeY = 0;
            let timeSinceDeath = 0;

            if (gameState.status === 'gameover' && gameState.gameOverTimestamp) {
                timeSinceDeath = now - gameState.gameOverTimestamp;
                // Intense shake for first 1.5s
                const intensity = Math.max(0, 1 - timeSinceDeath / 1200) * 20;
                shakeX = (Math.random() - 0.5) * intensity;
                shakeY = (Math.random() - 0.5) * intensity;
            } else if (gameState.shakeMagnitude > 0) {
                shakeX = (Math.random() - 0.5) * gameState.shakeMagnitude;
                shakeY = (Math.random() - 0.5) * gameState.shakeMagnitude;
            }

            // Flash screen white briefly on death (Draw on Dynamic Layer)
            if (timeSinceDeath < 100) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
            }

            // Apply shake to container
            if (shakeX !== 0 || shakeY !== 0) {
                container.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
            } else {
                container.style.transform = 'none';
            }

            // --- 1. Draw DYNAMIC Walls (Traps & Gates) ---
            const pulse = (Math.sin(now / 300) + 1) / 2; // 0..1 smooth wave

            const trapWalls = gameState.walls.filter(w => w.type === 'trap');
            const gateWalls = gameState.walls.filter(w => w.type === 'gate');

            // Draw Traps (with pulse)
            ctx.save();
            trapWalls.forEach(w => {
                const px = w.x * GRID_SIZE;
                const py = w.y * GRID_SIZE;
                const pw = w.width * GRID_SIZE;
                const ph = w.height * GRID_SIZE;

                ctx.strokeStyle = '#FF0000';
                ctx.shadowColor = '#FF0000';
                ctx.shadowBlur = 15;
                ctx.lineWidth = 4;
                ctx.strokeRect(px, py, pw, ph);
                ctx.fillStyle = '#660000';
                ctx.fillRect(px, py, pw, ph);
            });
            ctx.restore();

            // --- 1.5 Draw Gates (Seamless Forcefields) ---
            gateWalls.forEach(g => {
                const px = g.x * GRID_SIZE;
                const py = g.y * GRID_SIZE;
                const clusterId = g.gateClusterId!;

                // Check connectivity within the SAME cluster for seamless rendering
                const hasTop = gateWalls.some(w => w.gateClusterId === clusterId && w.x === g.x && w.y === g.y - 1);
                const hasBottom = gateWalls.some(w => w.gateClusterId === clusterId && w.x === g.x && w.y === g.y + 1);
                const hasLeft = gateWalls.some(w => w.gateClusterId === clusterId && w.x === g.x - 1 && w.y === g.y);
                const hasRight = gateWalls.some(w => w.gateClusterId === clusterId && w.x === g.x + 1 && w.y === g.y);

                // 1. Forcefield Fill (Very Faint)
                const baseAlpha = 0.05 + (Math.sin(now / 500) * 0.02);
                ctx.fillStyle = `rgba(0, 240, 255, ${baseAlpha})`;
                ctx.fillRect(px, py, GRID_SIZE, GRID_SIZE);

                // 2. Animated Scanlines (Global Sync for Seamlessness)
                ctx.save();
                ctx.beginPath();
                ctx.rect(px, py, GRID_SIZE, GRID_SIZE);
                ctx.clip();

                const scanSpace = 6;
                const scanOffset = Math.floor(now / 40) % scanSpace;

                ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
                ctx.lineWidth = 1;

                for (let i = -1; i < (GRID_SIZE / scanSpace) + 1; i++) {
                    const y = py + scanOffset + (i * scanSpace);
                    if (y >= py && y <= py + GRID_SIZE) {
                        ctx.beginPath();
                        ctx.moveTo(px, y);
                        ctx.lineTo(px + GRID_SIZE, y);
                        ctx.stroke();
                    }
                }

                if (Math.random() > 0.92) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    const nx = px + Math.random() * GRID_SIZE;
                    const ny = py + Math.random() * GRID_SIZE;
                    ctx.fillRect(nx, ny, 2, 2);
                }
                ctx.restore();

                // 3. Faint Frame (Edges)
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (!hasTop) { ctx.moveTo(px, py); ctx.lineTo(px + GRID_SIZE, py); }
                if (!hasBottom) { ctx.moveTo(px, py + GRID_SIZE); ctx.lineTo(px + GRID_SIZE, py + GRID_SIZE); }
                if (!hasLeft) { ctx.moveTo(px, py); ctx.lineTo(px, py + GRID_SIZE); }
                if (!hasRight) { ctx.moveTo(px + GRID_SIZE, py); ctx.lineTo(px + GRID_SIZE, py + GRID_SIZE); }
                ctx.stroke();

                // 4. Heavy Holographic Brackets (Corners Only)
                ctx.strokeStyle = colors.gate;
                ctx.shadowColor = colors.gate;
                ctx.shadowBlur = 10;
                ctx.lineWidth = 3;
                ctx.beginPath();

                const cornerSize = 8;
                if (!hasTop && !hasLeft) {
                    ctx.moveTo(px, py + cornerSize); ctx.lineTo(px, py); ctx.lineTo(px + cornerSize, py);
                }
                if (!hasTop && !hasRight) {
                    ctx.moveTo(px + GRID_SIZE - cornerSize, py); ctx.lineTo(px + GRID_SIZE, py); ctx.lineTo(px + GRID_SIZE, py + cornerSize);
                }
                if (!hasBottom && !hasLeft) {
                    ctx.moveTo(px, py + GRID_SIZE - cornerSize); ctx.lineTo(px, py + GRID_SIZE); ctx.lineTo(px + cornerSize, py + GRID_SIZE);
                }
                if (!hasBottom && !hasRight) {
                    ctx.moveTo(px + GRID_SIZE - cornerSize, py + GRID_SIZE); ctx.lineTo(px + GRID_SIZE, py + GRID_SIZE); ctx.lineTo(px + GRID_SIZE, py + GRID_SIZE - cornerSize);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;

                // 5. Channel ID
                if (g.gateChannel !== undefined && g.gateChannel !== -1) {
                    ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
                    ctx.font = 'bold 12px "Space Mono"';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowBlur = 0;
                    ctx.fillText(g.gateChannel.toString(), px + GRID_SIZE / 2, py + GRID_SIZE / 2);
                }
            });

            // --- 2.5 Magnet Visuals ---
            const magnetUpgrade = gameState.activeUpgrades.find(u => u.type === 'magnet');
            if (magnetUpgrade && gameState.snake.length > 0) {
                const range = magnetUpgrade.level * 2 + 3;
                const head = gameState.snake[0];
                const headCx = head.x * GRID_SIZE + CENTER;
                const headCy = head.y * GRID_SIZE + CENTER;

                gameState.coins.forEach(c => {
                    const dist = getDistance(head, c);
                    if (dist < range) {
                        drawMagnetLink(ctx, headCx, headCy, c.x * GRID_SIZE + CENTER, c.y * GRID_SIZE + CENTER, now);
                    }
                });
            }

            // --- BOSS RENDERING ---
            if (gameState.boss) {
                const b = gameState.boss;
                const bx = b.x * GRID_SIZE;
                const by = b.y * GRID_SIZE;
                const bw = b.width * GRID_SIZE;
                const bh = b.height * GRID_SIZE;
                const cx = bx + bw / 2;
                const cy = by + bh / 2;

                ctx.save();

                // Glitch effect
                if (Math.random() > 0.95) {
                    const jx = (Math.random() - 0.5) * 10;
                    const jy = (Math.random() - 0.5) * 10;
                    ctx.translate(jx, jy);
                }

                // Draw Body
                ctx.fillStyle = colors.boss;
                ctx.shadowColor = colors.boss;
                ctx.shadowBlur = 20;
                ctx.fillRect(bx, by, bw, bh);

                // Inner Details based on type
                // Wrapped in save/restore to ensure transforms don't affect HP number
                ctx.save();
                ctx.fillStyle = '#FFF';
                ctx.shadowBlur = 0;
                if (b.type === 'cipher') {
                    // Draw Sequence above boss
                    if (b.requiredSequence) {
                        const iconSize = 14;
                        const gap = 4;
                        const totalW = (iconSize * 3) + (gap * 2);
                        let startX = cx - totalW / 2;
                        let startY = by - 20;

                        b.requiredSequence.forEach((type, i) => {
                            const px = startX + i * (iconSize + gap);
                            ctx.fillStyle = getItemColor(type, false);
                            if (type === 'alpha') {
                                ctx.beginPath(); ctx.arc(px + iconSize / 2, startY, iconSize / 2, 0, Math.PI * 2); ctx.fill();
                            } else if (type === 'beta') {
                                ctx.fillRect(px, startY - iconSize / 2, iconSize, iconSize);
                            } else { // Gamma
                                ctx.beginPath();
                                ctx.moveTo(px + iconSize / 2, startY - iconSize / 2);
                                ctx.lineTo(px + iconSize, startY);
                                ctx.lineTo(px + iconSize / 2, startY + iconSize / 2);
                                ctx.lineTo(px, startY);
                                ctx.fill();
                            }
                        });

                        // TARGET LOCK VISUAL
                        // Check if player has matching sequence
                        const chargedSegments = gameState.snake
                            .filter(s => s.type === 'body' && s.isCharged && s.variant)
                            .map(s => s.variant!);

                        if (chargedSegments.length >= b.requiredSequence.length) {
                            const tailSeq = chargedSegments.slice(-(b.requiredSequence.length));
                            const match = tailSeq.every((val, i) => val === b.requiredSequence![i]);

                            if (match) {
                                // SHOW SHIELD SHATTERING LOOP INSTEAD OF TARGET LINES
                                ctx.translate(cx, cy);

                                // 1. Draw Exploding Fragments (Looping)
                                const explosionTime = now % 800; // 0.8s loop
                                const progress = explosionTime / 800;
                                const spread = 20 + (progress * 60);

                                ctx.save();
                                for (let i = 0; i < 8; i++) {
                                    ctx.rotate(Math.PI * 2 / 8);
                                    ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
                                    const shardX = spread;
                                    const shardY = 0;
                                    ctx.beginPath();
                                    ctx.moveTo(shardX, shardY);
                                    ctx.lineTo(shardX - 10, shardY + 5);
                                    ctx.lineTo(shardX - 10, shardY - 5);
                                    ctx.fill();
                                }
                                ctx.restore();

                                // 2. Draw Cracked Center
                                const shakeX = (Math.random() - 0.5) * 4;
                                const shakeY = (Math.random() - 0.5) * 4;
                                ctx.translate(shakeX, shakeY);

                                ctx.strokeStyle = '#FFFFFF';
                                ctx.lineWidth = 3;
                                ctx.beginPath();
                                ctx.arc(0, 0, GRID_SIZE, 0, Math.PI * 2);
                                ctx.stroke();

                                // Draw Shatter Cracks inside
                                ctx.beginPath();
                                ctx.moveTo(-20, -20); ctx.lineTo(20, 20);
                                ctx.moveTo(20, -20); ctx.lineTo(-20, 20);
                                ctx.moveTo(0, -30); ctx.lineTo(0, 30);
                                ctx.stroke();

                                // Warning text
                                ctx.font = 'bold 12px "Space Mono"';
                                ctx.fillStyle = '#FFFFFF';
                                ctx.textAlign = 'center';
                                ctx.shadowColor = '#FFF';
                                ctx.shadowBlur = 10;
                                const blink = Math.floor(now / 100) % 2 === 0;
                                if (blink) ctx.fillText("SHIELD DOWN", 0, GRID_SIZE + 20);

                            }
                        }
                    }
                } else if (b.type === 'timekeeper') {
                    // Clock face
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(cx, cy, bw / 3, 0, Math.PI * 2); ctx.stroke();
                    const handAngle = (now / 500);
                    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(handAngle) * bw / 3, cy + Math.sin(handAngle) * bw / 3); ctx.stroke();

                    // Draw Tethers to Anchors
                    const anchors = gameState.pickups.filter(p => p.itemType === 'chronos_anchor');
                    anchors.forEach(a => {
                        ctx.save();
                        ctx.strokeStyle = '#FFAA00';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(a.x * GRID_SIZE + CENTER, a.y * GRID_SIZE + CENTER);
                        ctx.stroke();
                        ctx.restore();
                    });

                    // Floating text
                    ctx.font = 'bold 12px "Space Mono"';
                    ctx.fillStyle = '#FFAA00';
                    ctx.textAlign = 'center';
                    ctx.fillText("DESTROY ANCHORS", cx, by - 15);

                } else if (b.type === 'colossus') {
                    // Heavy armor plates
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(bx + 5, by + 5, bw - 10, bh - 10);
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(bx + bw, by); ctx.lineTo(bx, by + bh); ctx.stroke();
                } else if (b.type === 'rival') {
                    // Snake head lookalike
                    ctx.fillStyle = '#000';
                    ctx.fillRect(bx + bw * 0.2, by + bh * 0.2, bw * 0.6, bh * 0.6);
                }
                ctx.restore();

                // Draw HP Number inside body
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 24px "Space Mono"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 4;
                ctx.fillText(Math.ceil(b.hp).toString(), cx, cy);

                ctx.restore();
            }

            // --- 3. Draw Portal ---
            if (gameState.portal) {
                const px = gameState.portal.x * GRID_SIZE + CENTER;
                const py = gameState.portal.y * GRID_SIZE + CENTER;
                const portalSize = GRID_SIZE * 1.3;

                const currentSequence = gameState.snake.filter(s => s.type === 'body' && s.isCharged && s.variant).map(s => s.variant!);
                const reqStr = gameState.requiredSequence.join(',');
                const currStr = currentSequence.join(',');
                const isSequenceMatched = currStr.includes(reqStr);

                // Allow open portal if boss level (assumes victory if portal exists on boss level)
                const isBossLevel = gameState.level % 5 === 0 && gameState.level < 1000 && gameState.level !== 0;
                const isOpen = isSequenceMatched || isBossLevel;

                const portalColor = isOpen ? colors.portalOpen : colors.portalClosed;
                const age = gameState.portal.createdAt ? now - gameState.portal.createdAt : 9999;

                if (age < 2000) {
                    drawPortalSpawnAnimation(ctx, px, py, portalSize, age / 2000);
                } else {
                    if (isOpen) {
                        // Spawn particles via System instead of local array
                        if (Math.random() > 0.7) {
                            particleSystem.spawn('pickup', gameState.portal.x, gameState.portal.y, portalColor);
                        }
                    }
                    drawPortal(ctx, px, py, portalSize, now, portalColor, isOpen);
                }
            }

            // --- 3.5 SECRET PORTAL ---
            if (gameState.secretPortal) {
                const px = gameState.secretPortal.x * GRID_SIZE + CENTER;
                const py = gameState.secretPortal.y * GRID_SIZE + CENTER;
                const portalSize = GRID_SIZE * 1.3;
                const age = gameState.secretPortal.createdAt ? now - gameState.secretPortal.createdAt : 9999;

                if (age < 2000) {
                    drawSecretPortalSpawnAnimation(ctx, px, py, portalSize, age / 2000);
                } else {
                    drawPortal(ctx, px, py, portalSize, now, colors.secretPortal, true);
                }
            }

            // --- 4. Draw Coins ---
            gameState.coins.forEach(c => {
                const px = c.x * GRID_SIZE + CENTER;
                const py = c.y * GRID_SIZE + CENTER;
                const size = GRID_SIZE * 0.42;
                const spinSpeed = 2000;
                const angle = (now / spinSpeed) * Math.PI * 2;
                const scaleX = Math.cos(angle);
                const floatY = Math.sin(now / 800) * 3;

                ctx.save();
                ctx.translate(px, py + floatY);
                ctx.fillStyle = colors.coin;
                ctx.shadowColor = colors.coin;
                ctx.shadowBlur = 12;
                ctx.fillRect(-(size * scaleX) / 2, -size / 2, size * scaleX, size);
                if (Math.abs(scaleX) > 0.3) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.globalAlpha = 0.6;
                    const shineWidth = size * 0.2 * scaleX;
                    ctx.fillRect(-shineWidth / 2, -size * 0.4, shineWidth, size * 0.8);
                    ctx.globalAlpha = 1.0;
                }
                ctx.restore();
            });

            // --- 5. Draw Pickups ---
            const flickeringActive = gameState.activeModifiers.some(m => m.type === 'flickering_matter');
            const flickerOpacity = flickeringActive ? ((Math.floor(now / 200) % 2 === 0) ? 0.0 : 1.0) : 1.0;

            gameState.pickups.forEach(p => {
                const px = p.x * GRID_SIZE;
                const py = p.y * GRID_SIZE;
                const cx = px + CENTER;
                const cy = py + CENTER;
                const isDeadly = gameState.pendingType &&
                    p.itemType !== 'stasis_orb' &&
                    p.itemType !== 'shield' &&
                    p.itemType !== 'chronos_anchor' &&
                    p.itemType !== 'omega_particle' &&
                    gameState.pendingType !== p.itemType;

                const color = getItemColor(p.itemType, !!isDeadly);

                ctx.save();
                if (isDeadly) {
                    const jitterX = (Math.random() - 0.5) * 4;
                    const jitterY = (Math.random() - 0.5) * 4;
                    ctx.translate(jitterX, jitterY);
                }

                // Random sparkle effect via Particle System
                if (Math.random() < 0.05 && flickerOpacity > 0) {
                    particleSystem.spawn('pickup', p.x, p.y, color);
                }

                ctx.fillStyle = color;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = flickerOpacity;

                if (isDeadly) {
                    ctx.shadowColor = colors.deadly;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.moveTo(px + PAD, py + PAD);
                    ctx.lineTo(px + GRID_SIZE - PAD, py + GRID_SIZE - PAD);
                    ctx.moveTo(px + GRID_SIZE - PAD, py + PAD);
                    ctx.lineTo(px + PAD, py + GRID_SIZE - PAD);
                    ctx.stroke();
                    ctx.globalAlpha = 0.8 * flickerOpacity;
                } else {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                }

                if (p.itemType === 'alpha') {
                    ctx.beginPath();
                    ctx.arc(cx, cy, INNER_SIZE / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.itemType === 'beta') {
                    ctx.beginPath();
                    ctx.fillRect(px + PAD, py + PAD, INNER_SIZE, INNER_SIZE);
                } else if (p.itemType === 'gamma') {
                    ctx.beginPath();
                    ctx.moveTo(cx, py + PAD);
                    ctx.lineTo(px + GRID_SIZE - PAD, cy);
                    ctx.lineTo(cx, py + GRID_SIZE - PAD);
                    ctx.lineTo(px + PAD, cy);
                    ctx.fill();
                } else if (p.itemType === 'stasis_orb') {
                    const time = now / 500;
                    ctx.beginPath();
                    ctx.arc(cx, cy, INNER_SIZE / 3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;

                    ctx.beginPath();
                    ctx.ellipse(cx, cy, INNER_SIZE / 1.5, INNER_SIZE / 4, time, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.ellipse(cx, cy, INNER_SIZE / 1.5, INNER_SIZE / 4, -time, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (p.itemType === 'shield') {
                    const size = INNER_SIZE * 0.8;
                    ctx.save();
                    ctx.translate(cx, cy);
                    const float = Math.sin(now / 400) * 2;
                    ctx.translate(0, float);
                    ctx.beginPath();
                    ctx.moveTo(0, size / 2);
                    ctx.quadraticCurveTo(size / 2, size / 3, size / 2, -size / 4);
                    ctx.lineTo(size / 2, -size / 2);
                    ctx.lineTo(-size / 2, -size / 2);
                    ctx.lineTo(-size / 2, -size / 4);
                    ctx.quadraticCurveTo(-size / 2, size / 3, 0, size / 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.beginPath();
                    ctx.arc(size / 4, -size / 4, size / 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } else if (p.itemType === 'chronos_anchor') {
                    // Timer hourglass shape
                    ctx.fillStyle = '#FFAA00';
                    ctx.beginPath();
                    ctx.moveTo(cx - 5, cy - 10);
                    ctx.lineTo(cx + 5, cy - 10);
                    ctx.lineTo(cx, cy);
                    ctx.lineTo(cx + 5, cy + 10);
                    ctx.lineTo(cx - 5, cy + 10);
                    ctx.lineTo(cx, cy);
                    ctx.fill();
                    // Countdown ring
                    if (p.expiresAt) {
                        const remaining = Math.max(0, p.expiresAt - now);
                        const total = 8000;
                        const pct = remaining / total;
                        ctx.strokeStyle = pct < 0.3 ? '#F00' : '#FFAA00';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx, cy, INNER_SIZE / 1.5, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * pct));
                        ctx.stroke();
                    }
                } else if (p.itemType === 'omega_particle') {
                    // Spinny purple thing
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(now / 300);
                    ctx.fillStyle = '#FF00FF';
                    ctx.fillRect(-5, -5, 10, 10);
                    ctx.rotate(Math.PI / 4);
                    ctx.strokeStyle = '#FF00FF';
                    ctx.strokeRect(-8, -8, 16, 16);
                    ctx.restore();
                }

                if (isDeadly && flickerOpacity > 0) {
                    ctx.fillStyle = '#FF0000';
                    ctx.globalAlpha = 0.5;
                    if (Math.random() > 0.6) ctx.fillRect(px, py + Math.random() * GRID_SIZE, GRID_SIZE, 2);
                    if (Math.random() > 0.6) ctx.fillRect(px + Math.random() * GRID_SIZE, py, 2, GRID_SIZE);
                    if (Math.random() > 0.8) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(px + Math.random() * GRID_SIZE, py + Math.random() * GRID_SIZE, 4, 4);
                    }
                }

                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 0;
                ctx.restore();
            });

            // --- 6. Draw Enemies & Trails ---
            const stasisTimeLeft = Math.max(0, gameState.buffs.stasisUntil - now);

            gameState.enemies.forEach(e => {
                const px = e.x * GRID_SIZE;
                const py = e.y * GRID_SIZE;
                const cx = px + CENTER;
                const cy = py + CENTER;
                const enemyBaseColor = e.color || colors.enemy;

                if (e.trail && e.trail.length > 0) {
                    e.trail.forEach((pos, idx) => {
                        const tPx = pos.x * GRID_SIZE;
                        const tPy = pos.y * GRID_SIZE;
                        const opacity = (1 - (idx / e.trail.length)) * 0.4;
                        ctx.save();
                        ctx.globalAlpha = opacity;
                        ctx.fillStyle = enemyBaseColor;
                        ctx.fillRect(tPx + PAD, tPy + PAD, INNER_SIZE, INNER_SIZE);
                        ctx.restore();
                    });
                }

                const drawEnemyBody = (x: number, y: number) => {
                    if (e.type === 'static') {
                        ctx.beginPath();
                        ctx.moveTo(x + CENTER, y + PAD);
                        ctx.lineTo(x + GRID_SIZE - PAD, y + GRID_SIZE - PAD);
                        ctx.lineTo(x + PAD, y + GRID_SIZE - PAD);
                        ctx.fill();
                    } else if (e.type === 'chaser') {
                        ctx.beginPath();
                        ctx.moveTo(x + CENTER, y + PAD);
                        ctx.lineTo(x + GRID_SIZE - PAD, y + CENTER);
                        ctx.lineTo(x + CENTER, y + GRID_SIZE - PAD);
                        ctx.lineTo(x + PAD, y + CENTER);
                        ctx.fill();
                    } else if (e.type === 'ghost') {
                        // Ghostly shape (floating veil)
                        ctx.beginPath();
                        ctx.moveTo(x + PAD, y + GRID_SIZE - PAD);
                        ctx.quadraticCurveTo(x + CENTER, y + PAD, x + GRID_SIZE - PAD, y + GRID_SIZE - PAD);
                        ctx.lineTo(x + GRID_SIZE - PAD, y + CENTER);
                        ctx.lineTo(x + PAD, y + CENTER);
                        ctx.closePath();
                        ctx.fill();
                        // Eyes
                        ctx.fillStyle = '#000';
                        ctx.fillRect(x + CENTER - 6, y + CENTER - 2, 3, 3);
                        ctx.fillRect(x + CENTER + 3, y + CENTER - 2, 3, 3);
                        ctx.fillStyle = enemyBaseColor;
                    } else if (e.type === 'replicator') {
                        // Binary Spore (Pulsing circle with core)
                        const pulse = Math.sin(now / 200) * 3;
                        ctx.beginPath();
                        ctx.arc(x + CENTER, y + CENTER, (INNER_SIZE / 2) + pulse, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#FFF';
                        ctx.beginPath();
                        ctx.arc(x + CENTER, y + CENTER, INNER_SIZE / 4, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = enemyBaseColor;
                    } else if (e.type === 'splitter') {
                        // Fragmenter (3-part cluster)
                        ctx.beginPath(); ctx.arc(x + PAD + 4, y + PAD + 4, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + GRID_SIZE - PAD - 4, y + PAD + 4, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + CENTER, y + GRID_SIZE - PAD - 4, 6, 0, Math.PI * 2); ctx.fill();
                    } else {
                        ctx.fillRect(x + PAD, y + PAD, INNER_SIZE, INNER_SIZE);
                    }
                };

                ctx.save();
                ctx.fillStyle = enemyBaseColor;
                ctx.shadowColor = enemyBaseColor;
                ctx.shadowBlur = e.frozen ? 5 : 15;
                if (e.type === 'ghost') ctx.globalAlpha = 0.6 + (Math.sin(now / 100) * 0.2);
                drawEnemyBody(px, py);
                ctx.restore();

                if (e.frozen) {
                    const ramp = Math.max(0, 1 - (stasisTimeLeft / 4000));
                    const jitterChance = 0.2 + (ramp * 0.8);

                    if (Math.random() < jitterChance) {
                        const magnitude = 2 + (ramp * 6);
                        const jx = (Math.random() - 0.5) * magnitude;
                        const jy = (Math.random() - 0.5) * magnitude;

                        ctx.save();
                        ctx.translate(jx, jy);
                        ctx.globalCompositeOperation = 'screen';
                        ctx.fillStyle = '#00FFFF';
                        ctx.globalAlpha = 0.6 + (ramp * 0.4);
                        drawEnemyBody(px, py);
                        if (Math.random() > 0.5) {
                            ctx.fillStyle = '#FFF';
                            ctx.fillRect(px + Math.random() * GRID_SIZE, py + Math.random() * GRID_SIZE, GRID_SIZE, 2);
                        }
                        ctx.restore();
                    }
                    if (ramp < 0.5) {
                        ctx.save();
                        ctx.strokeStyle = '#FFD700';
                        ctx.globalAlpha = 0.3;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(px, py, GRID_SIZE, GRID_SIZE);
                        ctx.restore();
                    }
                }
            });

            // --- 7. Draw Snake ---
            const isInvulnerable = gameState.buffs.invulnerableUntil > now;

            gameState.snake.forEach((s, i) => {
                if (i === 0) return;
                const prev = gameState.snake[i - 1];
                const cx = s.x * GRID_SIZE + CENTER;
                const cy = s.y * GRID_SIZE + CENTER;
                const pcx = prev.x * GRID_SIZE + CENTER;
                const pcy = prev.y * GRID_SIZE + CENTER;

                let connColor = '#444';
                let lineWidth = 2;

                if (s.isCharged && prev.type === 'body' && prev.isCharged) {
                    connColor = (s.isSequencePart && prev.isSequencePart) ? colors.sequence : colors.alpha;
                    lineWidth = 4;
                }
                if (isInvulnerable) connColor = '#FFFFFF';

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(pcx, pcy);
                ctx.strokeStyle = connColor;
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            });

            gameState.snake.forEach((s, i) => {
                const px = s.x * GRID_SIZE;
                const py = s.y * GRID_SIZE;
                const cx = px + CENTER;
                const cy = py + CENTER;

                if (s.type === 'head') {
                    ctx.fillStyle = colors.head;
                    ctx.shadowColor = '#FFF';
                    ctx.shadowBlur = 15;

                    if (isInvulnerable) {
                        const blink = Math.sin(now / 50) > 0;
                        ctx.fillStyle = blink ? '#FFF' : '#FFFF00';
                        ctx.shadowColor = blink ? '#FFF' : '#FFFF00';
                        ctx.shadowBlur = 20;
                    }

                    ctx.fillRect(px + 2, py + 2, GRID_SIZE - 4, GRID_SIZE - 4);
                    ctx.shadowBlur = 0;

                    if (gameState.buffs.currentShields > 0) {
                        drawShield(ctx, cx, cy, GRID_SIZE, now);
                    }

                    // --- DIEGETIC DASH COOLDOWN ---
                    const dashCd = gameState.buffs.dashCooldownUntil - now;
                    if (dashCd > 0) {
                        const pct = Math.max(0, dashCd / 5000);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(now / 100) * 0.2})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx, cy, CENTER + 4, -0.5 * Math.PI, (pct * 2 * Math.PI) - 0.5 * Math.PI);
                        ctx.stroke();
                    } else if (gameState.status === 'playing') {
                        // "Ready" pulse
                        const pulse = (Math.sin(now / 200) + 1) / 2;
                        ctx.strokeStyle = `rgba(0, 240, 255, ${pulse * 0.4})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(cx, cy, CENTER + 6 + (pulse * 4), 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    if (gameState.activeUpgrades.some(u => u.type === 'focus')) {
                        let target: { x: number, y: number } | null = null;
                        if (gameState.pendingType) {
                            const candidates = gameState.pickups.filter(p => p.itemType === gameState.pendingType);
                            let minDist = Infinity;
                            candidates.forEach(p => {
                                const d = getDistance(s, p);
                                if (d < minDist) { minDist = d; target = p; }
                            });
                        } else if (gameState.portal && gameState.pickups.length > 0) {
                            // Skip
                        } else if (gameState.requiredSequence.length > 0) {
                            const neededTypes = new Set(gameState.requiredSequence);
                            const candidates = gameState.pickups.filter(p => neededTypes.has(p.itemType as any));
                            let minDist = Infinity;
                            candidates.forEach(p => {
                                const d = getDistance(s, p);
                                if (d < minDist) { minDist = d; target = p; }
                            });
                        }
                        if (target) {
                            drawFocusGuide(ctx, cx, cy, (target as any).x * GRID_SIZE + CENTER, (target as any).y * GRID_SIZE + CENTER, GRID_SIZE, now);
                        }
                    }
                    return;
                }

                const variant = s.variant;
                if (!variant) {
                    if (s.createdAt) {
                        const age = now - s.createdAt;
                        if (age > 3000) {
                            const blink = Math.floor(now / 100) % 2 === 0;
                            ctx.fillStyle = blink ? '#FF0000' : '#444';
                        } else {
                            ctx.fillStyle = '#444';
                        }
                    } else {
                        ctx.fillStyle = '#444';
                    }
                    ctx.fillRect(px + 6, py + 6, GRID_SIZE - 12, GRID_SIZE - 12);
                    return;
                }

                let color = s.isSequencePart ? colors.sequence : getItemColor(variant, false);
                if (isInvulnerable) color = '#FFF';

                ctx.beginPath();
                if (variant === 'alpha') {
                    ctx.arc(cx, cy, INNER_SIZE / 2 - 2, 0, Math.PI * 2);
                } else if (variant === 'beta') {
                    const size = INNER_SIZE - 4;
                    ctx.rect(cx - size / 2, cy - size / 2, size, size);
                } else if (variant === 'gamma') {
                    ctx.moveTo(cx, py + PAD);
                    ctx.lineTo(px + GRID_SIZE - PAD, cy);
                    ctx.lineTo(cx, py + GRID_SIZE - PAD);
                    ctx.lineTo(px + PAD, cy);
                    ctx.closePath();
                }

                if (s.isCharged) {
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            // --- 8. Draw Particles (Using Pooled System) ---
            particleSystem.update();
            particleSystem.draw(ctx, GRID_SIZE, 0); // Particles are in Grid Coords in our logic

            if (gameState.status === 'gameover' && timeSinceDeath < 1000) {
                const glitchChance = 1 - (timeSinceDeath / 1000);
                if (Math.random() < glitchChance * 0.5) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const w = Math.random() * 200 + 50;
                    const h = Math.random() * 20 + 2;
                    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 0, 0, 0.3)';
                    ctx.fillRect(x, y, w, h);
                }
            }

            // --- 9. Tutorial Highlights ---
            if (tutorialHighlight) {
                ctx.save();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 5]);
                const scale = 1 + Math.sin(now / 200) * 0.1;
                let tx = 0, ty = 0;
                let doHighlight = false;

                if (tutorialHighlight === 'snake' && gameState.snake.length > 0) {
                    tx = gameState.snake[0].x * GRID_SIZE + CENTER;
                    ty = gameState.snake[0].y * GRID_SIZE + CENTER;
                    doHighlight = true;
                } else if (['alpha', 'beta', 'gamma'].includes(tutorialHighlight)) {
                    const target = gameState.pickups.find(p => p.itemType === tutorialHighlight);
                    if (target) {
                        tx = target.x * GRID_SIZE + CENTER;
                        ty = target.y * GRID_SIZE + CENTER;
                        doHighlight = true;
                    }
                } else if (tutorialHighlight === 'portal' && gameState.portal) {
                    tx = gameState.portal.x * GRID_SIZE + CENTER;
                    ty = gameState.portal.y * GRID_SIZE + CENTER;
                    doHighlight = true;
                } else if (tutorialHighlight === 'trap') {
                    const target = gameState.walls.find(w => w.type === 'trap');
                    if (target) {
                        tx = target.x * GRID_SIZE + CENTER;
                        ty = target.y * GRID_SIZE + CENTER;
                        doHighlight = true;
                    }
                }
                if (doHighlight) {
                    ctx.translate(tx, ty);
                    ctx.scale(scale, scale);
                    ctx.strokeRect(-GRID_SIZE, -GRID_SIZE, GRID_SIZE * 2, GRID_SIZE * 2);
                }
                ctx.restore();
            }

            // --- 10. Low Integrity Glitch ---
            const chargeCount = gameState.snake.filter(s => s.type === 'body' && s.isCharged).length;
            if (chargeCount <= 2 && gameState.status === 'playing' && gameState.level !== 0 && !gameState.boss) {
                if (Math.random() > 0.85) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    const gh = Math.random() * 40 + 10;
                    const gy = Math.random() * height;
                    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 51, 0.15)' : 'rgba(0, 240, 255, 0.15)';
                    ctx.fillRect(0, gy, width, gh);

                    // Tiny text glitches
                    if (Math.random() > 0.9) {
                        ctx.font = '10px "Space Mono"';
                        ctx.fillStyle = '#FF0033';
                        ctx.fillText("INTEGRITY CRITICAL", Math.random() * width, Math.random() * height);
                    }
                    ctx.restore();
                }
            }

            // --- 11. Draw Static Overlay (Game Over / Paused) ---
            if (gameState.status === 'gameover' || gameState.status === 'paused') {
                const text = gameState.status === 'paused' ? "SYSTEM PAUSED" : "SIGNAL LOST";
                drawStaticEffect(ctx, width, height, now, text, timeSinceDeath);
            }

            animationFrameId = requestAnimationFrame(renderLoop);
        };

        animationFrameId = requestAnimationFrame(renderLoop);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [width, height]); // Only width/height as deps. State is read via refs.

    return (
        <div ref={containerRef} style={{ width, height, position: 'relative', overflow: 'hidden' }} className="bg-[#1A1B26]">
            {/* Static Layer: Background, Grid, Non-Moving Walls */}
            <canvas
                ref={staticCanvasRef}
                width={width}
                height={height}
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
            />
            {/* Dynamic Layer: Entities, Animations, Traps, Gates */}
            <canvas
                ref={dynamicCanvasRef}
                width={width}
                height={height}
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
            />
        </div>
    );
};

export default GameCanvas;
