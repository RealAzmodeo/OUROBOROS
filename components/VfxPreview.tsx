
import React, { useRef, useEffect } from 'react';

interface VfxPreviewProps {
    id: string;
}

export const VfxPreview: React.FC<VfxPreviewProps> = ({ id }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        let particles: any[] = []; // Reused for explosion/portal
        const width = canvas.width;
        const height = canvas.height;
        const cx = width / 2;
        const cy = height / 2;

        const render = () => {
            frame++;
            ctx.clearRect(0, 0, width, height);
            const now = Date.now();

            // --- EXPLOSION ---
            if (id === 'explosion') {
                if (frame % 90 === 1) { // Boom every 1.5s
                    for (let i = 0; i < 20; i++) {
                        particles.push({
                            x: cx, y: cy,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 1.0,
                            color: Math.random() > 0.5 ? '#FF0033' : '#FFD700'
                        });
                    }
                }
                
                // Update & Draw
                particles = particles.filter(p => p.life > 0);
                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 0.03;
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.fillRect(p.x, p.y, 4, 4);
                });
                ctx.globalAlpha = 1.0;
            }

            // --- PORTAL ---
            else if (id === 'portal_vfx') {
                const color = '#39FF14'; // Neon Green
                
                // Emit particles
                if (frame % 5 === 0) {
                    particles.push({
                        x: cx, y: cy,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        life: 1.0,
                        size: Math.random() * 3 + 1
                    });
                }

                // Draw Portal Rings
                ctx.save();
                ctx.translate(cx, cy);
                
                // Outer Ring - Slow Rotation
                ctx.rotate((now / 300) % (Math.PI * 2)); // Clockwise
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 5]);
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // Inner Square - Slow Rotation
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate((now / 200) % (Math.PI * 2)); // Clockwise
                
                // Pulse
                const pulse = 1 + (Math.sin(now / 100) * 0.15);
                ctx.scale(pulse, pulse);

                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
                ctx.strokeRect(-15, -15, 30, 30);
                ctx.restore();

                // Core
                ctx.fillStyle = '#FFF';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(cx, cy, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Draw Emission Particles
                particles = particles.filter(p => p.life > 0);
                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 0.02;
                    ctx.fillStyle = color;
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                });
                ctx.globalAlpha = 1.0;
            }

            // --- CRT FILTER ---
            else if (id === 'crt') {
                // Background Gradient
                const grad = ctx.createLinearGradient(0, 0, width, height);
                grad.addColorStop(0, '#1a1b26');
                grad.addColorStop(1, '#000');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);

                // Text
                ctx.font = 'bold 20px "Space Mono"';
                ctx.textAlign = 'center';
                
                // Chromatic Aberration
                ctx.fillStyle = 'rgba(255,0,0,0.5)';
                ctx.fillText("NO SIGNAL", cx - 2, cy);
                ctx.fillStyle = 'rgba(0,255,255,0.5)';
                ctx.fillText("NO SIGNAL", cx + 2, cy);
                ctx.fillStyle = '#FFF';
                ctx.fillText("NO SIGNAL", cx, cy);

                // Scanlines
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                for (let y = 0; y < height; y += 4) {
                    ctx.fillRect(0, y, width, 2);
                }

                // Rolling bar
                const barY = (frame * 2) % height;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(0, barY, width, 20);
            }

            // --- STASIS FIELD ---
            else if (id === 'stasis_field') {
                // Static Enemy
                ctx.fillStyle = '#FF0033';
                ctx.shadowColor = '#FF0033';
                ctx.shadowBlur = 10;
                ctx.fillRect(cx - 10, cy - 10, 20, 20);

                // Ice Overlay
                ctx.strokeStyle = '#FFF';
                ctx.shadowBlur = 0;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx-10, cy-10); ctx.lineTo(cx+10, cy+10);
                ctx.moveTo(cx+10, cy-10); ctx.lineTo(cx-10, cy+10);
                ctx.stroke();

                // Suspended Gold Particles
                if (particles.length === 0) {
                    for(let i=0; i<30; i++) {
                        particles.push({
                            x: cx + (Math.random()-0.5)*60,
                            y: cy + (Math.random()-0.5)*60,
                            vx: 0, vy: 0,
                            life: Math.random() * Math.PI * 2
                        });
                    }
                }

                particles.forEach(p => {
                    p.life += 0.05;
                    const floatY = Math.sin(p.life) * 2;
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(p.x, p.y + floatY, 2, 2);
                });
            }

            // --- TRAIL (Motion Echo) ---
            else if (id === 'trail') {
                // Move object in sine wave
                const x = cx + Math.sin(frame * 0.1) * 60;
                const y = cy;

                // Add to history
                particles.unshift({ x, y });
                if (particles.length > 8) particles.pop();

                // Draw Trail
                particles.forEach((p, i) => {
                    const alpha = 1 - (i / particles.length);
                    ctx.fillStyle = '#FF0033';
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
                });

                // Draw Head
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = '#FF0033';
                ctx.shadowColor = '#FF0033';
                ctx.shadowBlur = 10;
                ctx.fillRect(x - 10, y - 10, 20, 20);
            }
            
            // --- COIN ROTATE ---
            else if (id === 'coin_rotate') {
                // Same 3D flip animation as GameCanvas
                const size = 18; // Similar visual size to in-game
                const spinSpeed = 2000;
                const angle = (now / spinSpeed) * Math.PI * 2;
                const scaleX = Math.cos(angle); 
                const floatY = Math.sin(now / 800) * 3;

                ctx.save();
                ctx.translate(cx, cy + floatY);
                
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 12;
                
                ctx.fillRect(-(size * scaleX)/2, -size/2, size * scaleX, size);
                
                if (Math.abs(scaleX) > 0.3) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.globalAlpha = 0.6;
                    ctx.fillRect(-(size * 0.2 * scaleX)/2, -size * 0.4, size * 0.2 * scaleX, size * 0.8);
                    ctx.globalAlpha = 1.0;
                }
                
                ctx.restore();
            }

            // --- PICKUP SPARKLE ---
            else if (id === 'pickup_sparkle') {
                 // Draw Item Base
                 ctx.fillStyle = '#00F0FF';
                 ctx.shadowColor = '#00F0FF';
                 ctx.shadowBlur = 10;
                 ctx.beginPath();
                 ctx.arc(cx, cy, 10, 0, Math.PI*2);
                 ctx.fill();
                 
                 // Emit particles
                 if (frame % 3 === 0) {
                     particles.push({
                         x: cx, y: cy,
                         vx: (Math.random()-0.5)*2,
                         vy: (Math.random()-0.5)*2,
                         life: 1.0,
                         size: Math.random()*2+1
                     });
                 }
                 
                 particles = particles.filter(p => p.life > 0);
                 particles.forEach(p => {
                     p.x += p.vx;
                     p.y += p.vy;
                     p.life -= 0.05;
                     ctx.fillStyle = '#00F0FF';
                     ctx.globalAlpha = p.life;
                     ctx.fillRect(p.x, p.y, p.size, p.size);
                 });
                 ctx.globalAlpha = 1.0;
            }

            // --- SHIELD ORBITALS ---
            else if (id === 'shield_orbitals') {
                 // Draw Head
                 ctx.fillStyle = '#FFF';
                 ctx.fillRect(cx - 10, cy - 10, 20, 20);
                 
                 // Draw Orbitals
                 const count = 3;
                 const radius = 30;
                 for(let i=0; i<count; i++) {
                     const angle = (frame * 0.05) + (i * (Math.PI*2/count));
                     const ox = cx + Math.cos(angle) * radius;
                     const oy = cy + Math.sin(angle) * radius;
                     ctx.fillStyle = '#FFD700';
                     ctx.shadowColor = '#FFD700';
                     ctx.shadowBlur = 10;
                     ctx.beginPath();
                     ctx.arc(ox, oy, 4, 0, Math.PI*2);
                     ctx.fill();
                 }
            }
            
            // --- TARGETING ARROW ---
            else if (id === 'targeting_arrow') {
                 ctx.save();
                 ctx.translate(cx, cy);
                 ctx.rotate(Math.sin(frame * 0.05)); // Swing back and forth
                 
                 // Pulsing effect
                 const pulseScale = 1 + Math.sin(frame * 0.1) * 0.2;
                 ctx.scale(pulseScale, pulseScale);
                 
                 ctx.fillStyle = '#FFD700'; // Gold arrow
                 ctx.shadowColor = '#FFD700';
                 ctx.shadowBlur = 10;
                 
                 ctx.beginPath();
                 const dist = 30;
                 ctx.moveTo(dist, 0);
                 ctx.lineTo(dist - 10, -8);
                 ctx.lineTo(dist - 10, 8);
                 ctx.fill();
                 
                 ctx.restore();
                 
                 // Simulated object it points to
                 ctx.fillStyle = '#333';
                 ctx.fillRect(cx + 80, cy - 20, 20, 20);
            }
            
            // --- INVULNERABILITY ---
            else if (id === 'invulnerability') {
                // Blink opacity
                ctx.globalAlpha = (Math.floor(frame / 5) % 2 === 0) ? 0.5 : 1.0;
                ctx.fillStyle = '#FFF';
                ctx.fillRect(cx - 15, cy - 15, 30, 30);
                
                // Shield particles
                const count = 3;
                const radius = 40;
                for(let i=0; i<count; i++) {
                     const angle = (frame * 0.05) + (i * (Math.PI*2/count));
                     const ox = cx + Math.cos(angle) * radius;
                     const oy = cy + Math.sin(angle) * radius;
                     ctx.fillStyle = '#FFD700';
                     ctx.shadowColor = '#FFD700';
                     ctx.shadowBlur = 10;
                     ctx.beginPath();
                     ctx.arc(ox, oy, 4, 0, Math.PI*2);
                     ctx.fill();
                }
                ctx.globalAlpha = 1.0;
            }

            // --- GRID WARP ---
            else if (id === 'grid_warp') {
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 1;
                
                const cols = 20;
                const rows = 10;
                const cellW = width / cols;
                const cellH = height / rows;
                
                for(let i=0; i<=cols; i++) {
                    for(let j=0; j<=rows; j++) {
                        const px = i * cellW;
                        const py = j * cellH;
                        
                        // Warp logic
                        const dist = Math.sqrt(Math.pow(px - cx, 2) + Math.pow(py - cy, 2));
                        const angle = Math.atan2(py - cy, px - cx);
                        const warpAmt = Math.sin((dist * 0.1) - (frame * 0.2)) * 10;
                        
                        const wx = px + Math.cos(angle) * warpAmt;
                        const wy = py + Math.sin(angle) * warpAmt;
                        
                        // Draw point/lines (simplified grid)
                        ctx.fillStyle = '#555';
                        ctx.fillRect(wx, wy, 2, 2);
                    }
                }
            }

            // --- DIGITAL RAIN ---
            else if (id === 'digital_rain') {
                ctx.fillStyle = '#0F0';
                ctx.font = '12px monospace';
                
                if (particles.length === 0) {
                    for(let i=0; i<30; i++) {
                        particles.push({
                            x: Math.random() * width,
                            y: Math.random() * height,
                            speed: Math.random() * 5 + 2,
                            chars: '010101'
                        });
                    }
                }

                particles.forEach(p => {
                    p.y += p.speed;
                    if (p.y > height) p.y = 0;
                    ctx.globalAlpha = 0.5;
                    ctx.fillText(String.fromCharCode(0x30A0 + Math.random()*96), p.x, p.y);
                });
                ctx.globalAlpha = 1.0;
            }

            requestAnimationFrame(render);
        };

        const animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [id]);

    return (
        <div className="w-full h-32 mb-4 bg-black/50 border border-[#2d3748] rounded overflow-hidden relative">
            <canvas 
                ref={canvasRef} 
                width={300} 
                height={128} 
                className="w-full h-full block"
            />
            {/* Grid Overlay for aesthetic */}
            <div className="absolute inset-0 pointer-events-none opacity-20" 
                 style={{backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
            </div>
        </div>
    );
};
