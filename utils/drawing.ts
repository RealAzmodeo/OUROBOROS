

import { Point } from '../types';

export interface VisualParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

/**
 * Draws the Portal with its rotating rings and core.
 */
export const drawPortal = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    baseSize: number, // Should be passed in as GRID_SIZE * 1.5 usually
    now: number,
    color: string,
    isOpen: boolean
) => {
    ctx.save();
    ctx.translate(x, y);

    // 1. Outer Rotating Dashed Ring
    ctx.save();
    // SPEED REDUCED: Divider increased from 150 to 300
    ctx.rotate((now / 300) % (Math.PI * 2)); 
    ctx.strokeStyle = color;
    ctx.lineWidth = 3; // Slightly thicker
    ctx.setLineDash([baseSize * 0.2, baseSize * 0.1]); 
    ctx.beginPath();
    ctx.arc(0, 0, baseSize * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Inner Rotating Square
    ctx.save();
    // SPEED REDUCED: Divider increased from 100 to 200
    ctx.rotate((now / 200) % (Math.PI * 2)); 
    
    // Add a scale pulse for more energy
    const squarePulse = isOpen ? 1 + (Math.sin(now / 80) * 0.2) : 1;
    ctx.scale(squarePulse, squarePulse);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = isOpen ? 25 : 5; 
    
    const innerSize = baseSize * 0.5;
    ctx.beginPath();
    ctx.rect(-innerSize/2, -innerSize/2, innerSize, innerSize);
    ctx.stroke();
    
    // If open, fill it partially
    if (isOpen) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    ctx.restore();

    // 3. Center Core
    const pulse = (Math.sin(now / 100) + 1) / 2; // Fast pulse
    const coreSize = (baseSize * 0.2) + (pulse * (baseSize * 0.1));
    
    ctx.fillStyle = isOpen ? '#FFFFFF' : color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
    ctx.fill();

    // 4. Locked State Icon (X)
    if (!isOpen) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#000'; // Black X on Red Core
        ctx.lineWidth = 3;
        ctx.beginPath();
        const xSize = coreSize * 0.5;
        ctx.moveTo(-xSize, -xSize); ctx.lineTo(xSize, xSize);
        ctx.moveTo(xSize, -xSize); ctx.lineTo(-xSize, xSize);
        ctx.stroke();
    }

    ctx.restore();
};

/**
 * Draws a massive, complex spawn animation for the Green Portal.
 * Triggered on Sequence completion.
 */
export const drawPortalSpawnAnimation = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    progress: number // 0 to 1 over the animation duration (approx 2s)
) => {
    ctx.save();
    ctx.translate(x, y);

    // Easing for impact
    const eased = 1 - Math.pow(1 - progress, 3); // Cubic out
    
    // 1. Massive Expansion Ring (Shockwave)
    if (progress < 0.5) {
        const ringSize = size * 5 * progress;
        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 5 * (1 - progress*2);
        ctx.globalAlpha = 1 - (progress * 2);
        ctx.beginPath();
        ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 2. Vertical Data Beam
    if (progress < 0.8) {
        const beamW = size * (1 - progress); 
        const beamH = 1000;
        ctx.fillStyle = '#39FF14';
        ctx.globalAlpha = (1 - progress) * 0.5;
        ctx.fillRect(-beamW/2, -beamH/2, beamW, beamH);
        
        // Center white core beam
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = (1 - progress) * 0.8;
        ctx.fillRect(-beamW/4, -beamH/2, beamW/2, beamH);
    }

    // 3. Spinning Hex Grid
    ctx.globalAlpha = 1.0;
    const spin = progress * Math.PI * 4;
    ctx.rotate(spin);
    
    const hexScale = size * eased;
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 20 * (1 - progress);
    
    // Draw Hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = Math.cos(angle) * hexScale;
        const hy = Math.sin(angle) * hexScale;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // 4. Converging Data Particles
    // Just draw some lines flying IN
    ctx.rotate(-spin * 2); // Counter rotate
    const particleCount = 8;
    for(let i=0; i<particleCount; i++) {
        const angle = (Math.PI*2 / particleCount) * i;
        const dist = (size * 3) * (1 - eased); // Fly in from 3x size to 0
        if (dist > 10) {
            ctx.fillStyle = '#FFF';
            ctx.fillRect(Math.cos(angle)*dist, Math.sin(angle)*dist, 4, 4);
        }
    }

    ctx.restore();
};

/**
 * Draws a dark, void-like spawn animation for the Secret Portal.
 */
export const drawSecretPortalSpawnAnimation = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    progress: number
) => {
    ctx.save();
    ctx.translate(x, y);

    // Shake effect
    const shake = (1 - progress) * 5;
    ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);

    // 1. Implosion Rings (Reverse shockwave)
    if (progress < 0.8) {
        const ringSize = size * 4 * (1 - progress);
        ctx.strokeStyle = '#8B5CF6'; // Purple
        ctx.lineWidth = 4;
        ctx.globalAlpha = progress;
        ctx.beginPath();
        ctx.arc(0, 0, ringSize, 0, Math.PI*2);
        ctx.stroke();
    }

    // 2. Dark Core Growing
    const coreSize = size * progress;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, coreSize, 0, Math.PI*2);
    ctx.fill();

    // 3. Lightning Arcs
    ctx.strokeStyle = '#FFF';
    ctx.shadowColor = '#8B5CF6';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    
    for(let i=0; i<4; i++) {
        ctx.rotate(Math.random() * Math.PI);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        let lx = 0, ly = 0;
        for(let j=0; j<5; j++) {
            lx += (Math.random()-0.5) * 20;
            ly -= size * 0.4; // Upward
            ctx.lineTo(lx, ly);
        }
        ctx.stroke();
    }

    ctx.restore();
};

/**
 * Draws a standard visual particle.
 */
export const drawParticle = (ctx: CanvasRenderingContext2D, p: VisualParticle) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha = 1.0;
};

/**
 * Draws a shield around the target.
 */
export const drawShield = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    now: number
) => {
    ctx.save();
    ctx.translate(x, y);
    
    const pulse = Math.sin(now / 200) * 0.1 + 1;
    ctx.scale(pulse, pulse);

    // Inner glow
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating segment
    ctx.rotate(now / 500);
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();
};

/**
 * Draws a visual guide arrow pointing to a target.
 */
export const drawFocusGuide = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    gridSize: number,
    now: number
) => {
    const angle = Math.atan2(targetY - startY, targetX - startX);
    const dist = 40; // Pixel distance from head to draw arrow

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);
    
    const float = Math.sin(now / 150) * 5;
    ctx.translate(dist + float, 0);

    ctx.fillStyle = '#FF0033'; // Red arrow for high visibility
    ctx.shadowColor = '#FF0033';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.fill();

    ctx.restore();
};

/**
 * Draws a beam from source to target for Magnet effect.
 */
export const drawMagnetLink = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    now: number
) => {
    ctx.save();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3 + (Math.sin(now / 50) * 0.2); // Fast flicker
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.restore();
};

/**
 * Draws a full-screen "Broken Signal" effect.
 * Used for Game Over and Paused screens.
 */
export const drawStaticEffect = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    now: number,
    text: string = "SIGNAL LOST",
    timeSinceDeath: number = 0
) => {
    // FADE IN LOGIC FOR GAME OVER TEXT
    let alpha = 1.0;
    if (text === "SIGNAL LOST" && timeSinceDeath > 0) {
        if (timeSinceDeath < 1000) alpha = 0; // Wait 1s
        else if (timeSinceDeath < 2000) alpha = (timeSinceDeath - 1000) / 1000;
    }

    // 1. Fill Background (Semi-transparent overlay)
    ctx.fillStyle = `rgba(5, 5, 5, ${Math.min(0.75, alpha)})`;
    ctx.fillRect(0, 0, width, height);

    if (alpha <= 0.05) return;

    // 2. Glitchy Text
    const cx = width / 2;
    const cy = height / 2;
    
    // SHIFT TEXT UPWARD to make room for buttons below
    const textY = cy - 80; 

    ctx.font = 'bold 120px "Oswald", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shift RGB - Chromatic Aberration
    const shiftX = (Math.random() - 0.5) * 10;
    const shiftY = (Math.random() - 0.5) * 4;
    
    ctx.globalCompositeOperation = 'screen';
    
    // Red Channel
    ctx.fillStyle = `rgba(255, 0, 0, ${0.8 * alpha})`;
    ctx.fillText(text, cx + shiftX, textY + shiftY);
    
    // Cyan Channel
    ctx.fillStyle = `rgba(0, 255, 255, ${0.8 * alpha})`;
    ctx.fillText(text, cx - shiftX, textY - shiftY);
    
    // White Core
    ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * alpha})`;
    ctx.fillText(text, cx, textY);
    
    ctx.globalCompositeOperation = 'source-over';

    // 3. Noise / Static (Random Rects)
    // Draw 150 random small rects to simulate static noise without heavy per-pixel manipulation
    for(let i=0; i<150; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const w = Math.random() * 4 + 1;
        const h = Math.random() * 3 + 1;
        const gray = Math.floor(Math.random() * 100) + 50; // Dark gray static
        ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${0.3 * alpha})`;
        ctx.fillRect(x, y, w, h);
    }
    
    // 4. Horizontal Glitch Bands
    if (Math.random() > 0.7) {
        const y = Math.random() * height;
        const h = Math.random() * 80 + 20;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * alpha})`;
        ctx.fillRect(0, y, width, h);
    }

    // 5. Scanlines (Permanent)
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * alpha})`;
    for(let y=0; y<height; y+=5) {
        ctx.fillRect(0, y, width, 2);
    }

    // 6. Rolling Vertical Sync Bar
    const barY = (now * 0.1) % height;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * alpha})`;
    ctx.fillRect(0, barY, width, 150);
};