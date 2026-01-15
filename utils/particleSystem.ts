import { Point, VfxType } from '../types';

// Pool Configuration
const MAX_PARTICLES = 1000;

class PooledParticle {
    x: number = 0;
    y: number = 0;
    vx: number = 0;
    vy: number = 0;
    life: number = 0;
    color: string = '#FFF';
    size: number = 2;
    active: boolean = false;
}

export class ParticleSystem {
    private pool: PooledParticle[];
    private activeParticles: PooledParticle[];

    constructor() {
        this.pool = [];
        this.activeParticles = [];
        
        // Initialize Pool
        for (let i = 0; i < MAX_PARTICLES; i++) {
            this.pool.push(new PooledParticle());
        }
    }

    // Spawns particles based on a VfxEvent type
    public spawn(type: VfxType, x: number, y: number, color: string = '#FFF') {
        switch (type) {
            case 'explosion':
                this.createExplosion(x, y, color, 10);
                break;
            case 'impact':
                this.createImpact(x, y);
                break;
            case 'pickup':
                this.createSparkle(x, y, color);
                break;
            case 'heal':
                this.createHeal(x, y);
                break;
            case 'fill':
                this.createFill(x, y, color);
                break;
            case 'shield_break':
                this.createShieldBreak(x, y);
                break;
            case 'emp':
                this.createEmp(x, y);
                break;
        }
    }
    
    // Generic internal spawner
    private activateParticle(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number) {
        // Find first inactive particle in pool (or recycle oldest if full?) 
        // Simple search for now. With MAX=1000, we can just grab from a 'free list' stack if we optimized, 
        // but linear scan of inactive is okay if we maintain an active list.
        
        // Better: swap active/inactive logic.
        // Let's just use a pointer or filter.
        // For pooling to be efficient, we shouldn't create arrays.
        // We will just search the pool for an inactive one.
        
        const p = this.pool.find(p => !p.active);
        if (p) {
            p.active = true;
            p.x = x;
            p.y = y;
            p.vx = vx;
            p.vy = vy;
            p.life = life;
            p.color = color;
            p.size = size;
        }
    }

    private createExplosion(x: number, y: number, color: string, count: number) {
        for (let i = 0; i < count; i++) {
            this.activateParticle(
                x + (Math.random() - 0.5), 
                y + (Math.random() - 0.5),
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                1.0,
                color,
                Math.random() * 2 + 1
            );
        }
    }

    private createImpact(x: number, y: number) {
        for (let i = 0; i < 15; i++) {
            this.activateParticle(
                x + 0.5, y + 0.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                0.5 + Math.random() * 0.3,
                '#FFFFFF',
                1.5
            );
        }
    }

    private createSparkle(x: number, y: number, color: string) {
        for (let i = 0; i < 8; i++) {
            this.activateParticle(
                x, y,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                0.8,
                color,
                2
            );
        }
    }

    private createHeal(x: number, y: number) {
        for (let i = 0; i < 15; i++) {
            this.activateParticle(
                x + (Math.random() - 0.5) * 2,
                y + (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.05,
                -0.1 - Math.random() * 0.1,
                1.5,
                '#39FF14',
                2
            );
        }
    }

    private createFill(x: number, y: number, color: string) {
        for (let i = 0; i < 8; i++) {
            this.activateParticle(
                x, y,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                0.8,
                color,
                2
            );
        }
    }

    private createShieldBreak(x: number, y: number) {
        for (let i = 0; i < 20; i++) {
            this.activateParticle(
                x, y,
                (Math.random() - 0.5) * 1.0,
                (Math.random() - 0.5) * 1.0,
                0.6,
                '#FFD700',
                2
            );
        }
    }

    private createEmp(x: number, y: number) {
        for (let i = 0; i < 36; i++) {
            const angle = (Math.PI * 2 * i) / 36;
            const speed = 0.5 + Math.random() * 0.5;
            this.activateParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                1.5,
                '#00F0FF',
                2
            );
        }
    }

    public update() {
        // Iterate through pool and update active ones
        for (const p of this.pool) {
            if (p.active) {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.03; // Global decay rate
                if (p.life <= 0) {
                    p.active = false;
                }
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D, gridSize: number, centerOffset: number) {
        // We assume context is already cleared
        for (const p of this.pool) {
            if (p.active) {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                // Convert grid units to pixels for rendering if needed, 
                // but particles spawned with grid coordinates need conversion if drawing on grid canvas.
                // However, spawn() usually takes grid coordinates. 
                // Let's assume input X/Y are Grid Coordinates.
                
                // Draw Rect
                // (x * GRID_SIZE + CENTER) is roughly how GameCanvas calculates centers.
                // But particle X/Y might already be in pixels if we passed pixel coords?
                // gameLogic passes GRID COORDS.
                
                // NOTE: GameCanvas code applies GRID_SIZE scaling.
                // We should do it here.
                const px = (p.x * gridSize); // + centerOffset if needed, usually passed
                const py = (p.y * gridSize);
                
                ctx.fillRect(px, py, p.size * 2, p.size * 2); // Make them visible
            }
        }
        ctx.globalAlpha = 1.0;
    }
}

// Singleton Instance
export const particleSystem = new ParticleSystem();