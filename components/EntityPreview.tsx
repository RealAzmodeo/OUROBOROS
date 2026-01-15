
import React, { useRef, useEffect } from 'react';
import { drawPortal } from '../utils/drawing';

interface EntityPreviewProps {
    id: string;
    category: 'enemy' | 'mechanic';
}

export const EntityPreview: React.FC<EntityPreviewProps> = ({ id, category }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const SIZE = 40; // Larger size for preview

        let frame = 0;

        const render = () => {
            frame++;
            const now = Date.now();
            ctx.clearRect(0, 0, width, height);

            // Grid Background (Subtle)
            ctx.strokeStyle = '#2d3748';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let x = 0; x <= width; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for(let y = 0; y <= height; y += 20) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);

            // Float Animation
            const floatY = Math.sin(frame * 0.05) * 5;
            ctx.translate(0, floatY);

            if (category === 'enemy') {
                const color = '#FF0033';
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;

                // Draw based on type
                if (id === 'static') {
                    // Triangle pointing up
                    ctx.beginPath();
                    ctx.moveTo(0, -SIZE/2);
                    ctx.lineTo(SIZE/2, SIZE/2);
                    ctx.lineTo(-SIZE/2, SIZE/2);
                    ctx.fill();
                } else if (id === 'chaser') {
                    // Diamond / Kite
                    ctx.beginPath();
                    ctx.moveTo(0, -SIZE/2);
                    ctx.lineTo(SIZE/2, 0);
                    ctx.lineTo(0, SIZE/2);
                    ctx.lineTo(-SIZE/2, 0);
                    ctx.fill();
                } else if (id === 'patrol') {
                    // Square with core
                    ctx.fillRect(-SIZE/2, -SIZE/2, SIZE, SIZE);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(-SIZE/4, -SIZE/4, SIZE/2, SIZE/2);
                } else {
                    // Wanderer / Default (Square)
                    ctx.fillRect(-SIZE/2, -SIZE/2, SIZE, SIZE);
                }
            } 
            else if (category === 'mechanic') {
                const color = id === 'stasis_orb' ? '#FFD700' : '#00F0FF';
                
                if (id === 'portal') {
                    // Use shared drawPortal util
                    // We need to undo translate since drawPortal takes absolute coords
                    ctx.restore(); 
                    drawPortal(ctx, cx, cy + floatY, SIZE * 1.5, now, '#39FF14', true);
                    ctx.save(); // restore context stack state for cleanup
                } else if (id === 'shield') {
                    // Shield Pickup (Green)
                    ctx.fillStyle = '#39FF14'; 
                    ctx.shadowColor = '#39FF14';
                    ctx.shadowBlur = 15;
                    
                    ctx.beginPath();
                    ctx.moveTo(0, SIZE/2); 
                    ctx.quadraticCurveTo(SIZE/2, SIZE/3, SIZE/2, -SIZE/4);
                    ctx.lineTo(SIZE/2, -SIZE/2);
                    ctx.lineTo(-SIZE/2, -SIZE/2);
                    ctx.lineTo(-SIZE/2, -SIZE/4);
                    ctx.quadraticCurveTo(-SIZE/2, SIZE/3, 0, SIZE/2);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Shine
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.beginPath();
                    ctx.arc(SIZE/4, -SIZE/4, SIZE/6, 0, Math.PI*2);
                    ctx.fill();
                } else {
                    // Items
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 15;

                    if (id === 'alpha') {
                        ctx.beginPath();
                        ctx.arc(0, 0, SIZE/2, 0, Math.PI*2);
                        ctx.fill();
                    } else if (id === 'beta') {
                        ctx.fillRect(-SIZE/2, -SIZE/2, SIZE, SIZE);
                    } else if (id === 'gamma') {
                        ctx.beginPath();
                        ctx.moveTo(0, -SIZE/2);
                        ctx.lineTo(SIZE/2, 0);
                        ctx.lineTo(0, SIZE/2);
                        ctx.lineTo(-SIZE/2, 0);
                        ctx.fill();
                    } else if (id === 'stasis_orb') {
                        // Atom Ring Effect
                        const time = now / 500;
                        ctx.beginPath();
                        ctx.arc(0, 0, SIZE/3, 0, Math.PI*2);
                        ctx.fill();
                        
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        
                        ctx.beginPath();
                        ctx.ellipse(0, 0, SIZE/1.5, SIZE/4, time, 0, Math.PI*2);
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.ellipse(0, 0, SIZE/1.5, SIZE/4, -time, 0, Math.PI*2);
                        ctx.stroke();
                    }
                }
            }

            ctx.restore();
            requestAnimationFrame(render);
        };

        const animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [id, category]);

    return (
        <div className="w-full h-32 mb-4 bg-black/50 border border-[#2d3748] rounded overflow-hidden relative">
            <canvas 
                ref={canvasRef} 
                width={300} 
                height={128} 
                className="w-full h-full block"
            />
        </div>
    );
};
