
import React, { useRef, useEffect } from 'react';
import { UpgradeType } from '../../types';

interface AnimatedUpgradeIconProps {
    type: UpgradeType;
    size?: number;
}

export const AnimatedUpgradeIcon: React.FC<AnimatedUpgradeIconProps> = ({ type, size = 80 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        let animationId: number;
        const cx = size / 2;
        const cy = size / 2;

        const render = () => {
            frame++;
            const now = Date.now();
            ctx.clearRect(0, 0, size, size);
            
            ctx.save();
            ctx.translate(cx, cy);

            switch (type) {
                case 'battery':
                    // Three vertical bars filling up
                    const barW = size * 0.15;
                    const barH = size * 0.4;
                    const gap = size * 0.05;
                    const totalW = (barW * 3) + (gap * 2);
                    ctx.translate(-totalW/2 + barW/2, 0);

                    for(let i=0; i<3; i++) {
                        // Fill animation speed
                        const cycle = Math.floor(frame / 30) % 4; // 0, 1, 2, 3 (3 is reset/full)
                        const isFilled = i < cycle;
                        
                        ctx.fillStyle = isFilled ? '#39FF14' : '#2d3748';
                        ctx.shadowColor = isFilled ? '#39FF14' : 'transparent';
                        ctx.shadowBlur = isFilled ? 10 : 0;
                        
                        const x = i * (barW + gap);
                        ctx.fillRect(x - barW/2, -barH/2, barW, barH);
                        
                        // Border
                        ctx.strokeStyle = '#555';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x - barW/2, -barH/2, barW, barH);
                    }
                    break;

                case 'wireless':
                    // Antenna tower emitting waves
                    ctx.fillStyle = '#00F0FF';
                    ctx.fillRect(-2, -size*0.2, 4, size*0.4);
                    ctx.beginPath();
                    ctx.arc(0, -size*0.2, 4, 0, Math.PI*2);
                    ctx.fill();

                    // Waves
                    ctx.strokeStyle = '#00F0FF';
                    ctx.lineWidth = 2;
                    for(let i=0; i<3; i++) {
                        const offset = (frame * 0.5) % 20;
                        const r = 10 + (i * 10) + offset;
                        const alpha = 1 - (r / (size/2));
                        
                        ctx.globalAlpha = Math.max(0, alpha);
                        ctx.beginPath();
                        ctx.arc(0, -size*0.2, r, Math.PI * 1.1, Math.PI * 1.9); // Top arc
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(0, -size*0.2, r, Math.PI * 0.1, Math.PI * 0.9); // Bottom arc looks weird, let's do left/right
                        // Actually just concentric circles
                        ctx.beginPath();
                        ctx.arc(0, -size*0.2, r, 0, Math.PI*2);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1.0;
                    break;

                case 'chassis':
                    // Rotating shield
                    const angle = frame * 0.05;
                    ctx.rotate(angle);
                    
                    // Core
                    ctx.fillStyle = '#00F0FF';
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.15, 0, Math.PI*2);
                    ctx.fill();
                    
                    // Shield Segments
                    ctx.strokeStyle = '#00F0FF';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#00F0FF';
                    ctx.shadowBlur = 10;
                    
                    for(let i=0; i<3; i++) {
                        ctx.rotate((Math.PI * 2) / 3);
                        ctx.beginPath();
                        ctx.arc(0, 0, size * 0.35, 0, Math.PI * 0.4);
                        ctx.stroke();
                    }
                    break;

                case 'agility':
                    // Fast moving trail figure-8
                    const t = frame * 0.1;
                    const ax = Math.sin(t) * (size * 0.3);
                    const ay = Math.sin(t * 2) * (size * 0.15);
                    
                    // Draw Trail
                    for(let i=0; i<5; i++) {
                         const prevT = t - (i * 0.2);
                         const px = Math.sin(prevT) * (size * 0.3);
                         const py = Math.sin(prevT * 2) * (size * 0.15);
                         ctx.fillStyle = '#F9591F';
                         ctx.globalAlpha = 0.5 - (i * 0.1);
                         ctx.beginPath();
                         ctx.arc(px, py, 4 - (i*0.5), 0, Math.PI*2);
                         ctx.fill();
                    }
                    ctx.globalAlpha = 1.0;
                    
                    // Head
                    ctx.fillStyle = '#FFF';
                    ctx.shadowColor = '#F9591F';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(ax, ay, 5, 0, Math.PI*2);
                    ctx.fill();
                    break;

                case 'volatile':
                    // Pulsing EMP Core
                    const pulse = 1 + Math.sin(frame * 0.2) * 0.2;
                    ctx.scale(pulse, pulse);
                    
                    // Core
                    ctx.fillStyle = '#FF0033';
                    ctx.shadowColor = '#FF0033';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.2, 0, Math.PI*2);
                    ctx.fill();
                    
                    // Shockwave
                    ctx.strokeStyle = '#00FFFF';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#00FFFF';
                    const waveR = (frame * 2) % (size * 0.5);
                    ctx.globalAlpha = 1 - (waveR / (size * 0.5));
                    ctx.beginPath();
                    ctx.arc(0, 0, waveR, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                    break;

                case 'phase':
                    // Ghosting square
                    const opacity = 0.5 + Math.sin(frame * 0.1) * 0.4;
                    
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#FFF';
                    ctx.shadowBlur = 10;
                    
                    const pSize = size * 0.4;
                    ctx.strokeRect(-pSize/2, -pSize/2, pSize, pSize);
                    ctx.fillRect(-pSize/2, -pSize/2, pSize, pSize);
                    break;

                case 'weaver':
                    // 3 Particles converging
                    const rot = frame * 0.02;
                    ctx.rotate(rot);
                    
                    for(let i=0; i<3; i++) {
                        ctx.rotate((Math.PI * 2) / 3);
                        // Float in and out
                        const dist = (size * 0.25) + Math.sin(frame * 0.1) * 5;
                        
                        ctx.fillStyle = '#39FF14';
                        ctx.shadowColor = '#39FF14';
                        ctx.shadowBlur = 10;
                        
                        // Draw Diamond
                        ctx.beginPath();
                        ctx.moveTo(0, -dist - 5);
                        ctx.lineTo(4, -dist);
                        ctx.lineTo(0, -dist + 5);
                        ctx.lineTo(-4, -dist);
                        ctx.fill();
                    }
                    break;

                case 'magnet':
                    // Magnet U Shape
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = '#AAA';
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.2, Math.PI, 0);
                    ctx.lineTo(size*0.2, size*0.3);
                    ctx.lineTo(size*0.1, size*0.3);
                    ctx.lineTo(size*0.1, 0);
                    ctx.arc(0, 0, size * 0.1, 0, Math.PI, true);
                    ctx.lineTo(-size*0.1, size*0.3);
                    ctx.lineTo(-size*0.2, size*0.3);
                    ctx.closePath();
                    ctx.stroke();
                    
                    // Tips
                    ctx.fillStyle = '#F00';
                    ctx.fillRect(-size*0.2, size*0.1, size*0.1, size*0.2); // N
                    ctx.fillStyle = '#00F';
                    ctx.fillRect(size*0.1, size*0.1, size*0.1, size*0.2); // S
                    
                    // Coin moving towards
                    const coinDist = (size * 0.4) - ((frame * 2) % (size * 0.4));
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(0, coinDist, 4, 0, Math.PI*2);
                    ctx.fill();
                    break;

                case 'greed':
                    // Spinning Coin
                    const spinSpeed = 2000;
                    const spinAngle = (now / spinSpeed) * Math.PI * 2;
                    const scaleX = Math.cos(spinAngle);
                    const cSize = size * 0.5;
                    
                    ctx.fillStyle = '#FFD700';
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 15;
                    
                    ctx.fillRect(-(cSize * scaleX)/2, -cSize/2, cSize * scaleX, cSize);
                    
                    // Shine
                    if (Math.abs(scaleX) > 0.3) {
                        ctx.fillStyle = '#FFF';
                        ctx.globalAlpha = 0.5;
                        ctx.fillRect(-(cSize * 0.2 * scaleX)/2, -cSize*0.4, cSize * 0.2 * scaleX, cSize*0.8);
                        ctx.globalAlpha = 1.0;
                    }
                    break;

                case 'stasis':
                    // Frozen particles
                    ctx.fillStyle = '#FFD700';
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 5;
                    
                    // Static positions with jitter
                    const particles = [
                        {x: -10, y: -10}, {x: 15, y: -5}, {x: -5, y: 15}, {x: 10, y: 10}, {x: 0, y: 0}
                    ];
                    
                    particles.forEach((p, i) => {
                         const jx = Math.random() - 0.5;
                         const jy = Math.random() - 0.5;
                         ctx.beginPath();
                         ctx.arc(p.x + jx, p.y + jy, 2 + (i%2), 0, Math.PI*2);
                         ctx.fill();
                    });
                    
                    // Ring
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 1;
                    const sRadius = (size * 0.3) + Math.sin(frame * 0.1) * 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, sRadius, 0, Math.PI*2);
                    ctx.stroke();
                    break;

                case 'stabilizer':
                    // Wall Impact and bounce
                    // Draw Wall
                    ctx.fillStyle = '#552222';
                    ctx.strokeStyle = '#F00';
                    ctx.lineWidth = 2;
                    ctx.fillRect(10, -size*0.4, 10, size*0.8);
                    ctx.strokeRect(10, -size*0.4, 10, size*0.8);
                    
                    // Moving Dot
                    const cycleLen = 60;
                    const f = frame % cycleLen;
                    let dx = -20 + (f * 1.5);
                    
                    // If hitting wall
                    if (dx > 5) {
                        // Impact/Bounce
                        // Flash blue shield
                        ctx.strokeStyle = '#00F0FF';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(5, 0, 10, 0, Math.PI * 2);
                        ctx.stroke();
                        dx = 5 - (dx - 5); // Bounce back
                    }
                    
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath();
                    ctx.arc(dx, 0, 4, 0, Math.PI*2);
                    ctx.fill();
                    break;

                case 'focus':
                    // Arrow pointing
                    const fAngle = Math.sin(frame * 0.05) * 0.5;
                    ctx.rotate(fAngle);
                    
                    ctx.fillStyle = '#FF0033';
                    ctx.shadowColor = '#FF0033';
                    ctx.shadowBlur = 10;
                    
                    ctx.beginPath();
                    ctx.moveTo(15, 0);
                    ctx.lineTo(-5, -10);
                    ctx.lineTo(-5, 10);
                    ctx.fill();
                    
                    // Dashed line
                    ctx.strokeStyle = '#FF0033';
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();
                    ctx.moveTo(-5, 0);
                    ctx.lineTo(-20, 0);
                    ctx.stroke();
                    break;
                
                case 'harvester_alpha':
                    // Coin with Alpha symbol
                    ctx.fillStyle = '#FFD700';
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.25, 0, Math.PI*2);
                    ctx.fill();
                    
                    // Orbiting Alpha
                    const orbitA = frame * 0.05;
                    const oax = Math.cos(orbitA) * (size * 0.35);
                    const oay = Math.sin(orbitA) * (size * 0.35);
                    ctx.fillStyle = '#00F0FF';
                    ctx.shadowColor = '#00F0FF';
                    ctx.beginPath();
                    ctx.arc(oax, oay, 6, 0, Math.PI*2);
                    ctx.fill();
                    break;

                case 'velocity_sync':
                    // Clock slowing down
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.3, 0, Math.PI*2);
                    ctx.stroke();
                    
                    // Hands
                    // Speed varies
                    const speed = 1 + Math.sin(frame * 0.05); // Oscillate speed
                    const ha = frame * 0.05 * speed;
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(ha) * size * 0.25, Math.sin(ha) * size * 0.25);
                    ctx.stroke();
                    
                    // Pulse arrows
                    ctx.fillStyle = '#00F0FF';
                    const py = (frame % 20) - 10;
                    ctx.beginPath();
                    ctx.moveTo(15, 10);
                    ctx.lineTo(15, -10);
                    ctx.lineTo(25, 0);
                    ctx.fill();
                    break;

                case 'integrity_echo':
                    // Shield pulse
                    const ipulse = 1 + Math.sin(frame * 0.1) * 0.2;
                    ctx.scale(ipulse, ipulse);
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.25, 0, Math.PI*2);
                    ctx.stroke();
                    
                    // Echo rings
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.35, 0, Math.PI*2);
                    ctx.stroke();
                    break;
                
                case 'replicator':
                    // Cloning item
                    const offsetR = Math.sin(frame * 0.1) * 10;
                    
                    // Main
                    ctx.fillStyle = '#00F0FF';
                    ctx.shadowColor = '#00F0FF';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(-10, 0, 8, 0, Math.PI*2);
                    ctx.fill();
                    
                    // Clone appearing
                    ctx.globalAlpha = 0.5 + Math.sin(frame * 0.1) * 0.5;
                    ctx.beginPath();
                    ctx.arc(10, 0, 8, 0, Math.PI*2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                    
                    // Connecting energy
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(-10, 0);
                    ctx.lineTo(10, 0);
                    ctx.stroke();
                    break;
            }

            ctx.restore();
            animationId = requestAnimationFrame(render);
        };

        animationId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationId);
    }, [type, size]);

    return (
        <canvas 
            ref={canvasRef} 
            width={size} 
            height={size} 
            className="block"
            style={{ width: size, height: size }}
        />
    );
};
