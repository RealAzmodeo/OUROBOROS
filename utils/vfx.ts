
import { Particle } from '../types';

const randomId = () => Math.random().toString(36).substr(2, 9);

export const createExplosion = (x: number, y: number, color: string, count: number = 10): Particle[] => {
  const parts: Particle[] = [];
  for(let i=0; i<count; i++) {
      parts.push({
          id: randomId(),
          x: x + (Math.random() - 0.5), y: y + (Math.random() - 0.5),
          vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
          life: 1.0, color: color
      });
  }
  return parts;
};

export const createImpactSparks = (x: number, y: number): Particle[] => {
  const parts: Particle[] = [];
  for(let i=0; i<15; i++) {
      parts.push({
          id: randomId(),
          x: x + 0.5, y: y + 0.5, 
          vx: (Math.random() - 0.5) * 1.5, 
          vy: (Math.random() - 0.5) * 1.5,
          life: 0.5 + Math.random() * 0.3,
          color: '#FFFFFF' 
      });
  }
  return parts;
};

export const createEmpBlast = (x: number, y: number): Particle[] => {
    const parts: Particle[] = [];
    // Fast expanding ring particles
    for(let i=0; i<36; i++) {
        const angle = (Math.PI * 2 * i) / 36;
        const speed = 0.5 + Math.random() * 0.5;
        parts.push({
            id: randomId(),
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.5,
            color: '#00F0FF' // Cyan
        });
    }
    return parts;
};

export const createHealEffect = (x: number, y: number): Particle[] => {
    const parts: Particle[] = [];
    // Upward floating particles
    for(let i=0; i<15; i++) {
        parts.push({
            id: randomId(),
            x: x + (Math.random() - 0.5) * 2, 
            y: y + (Math.random() - 0.5) * 2,
            vx: (Math.random() - 0.5) * 0.05,
            vy: -0.1 - Math.random() * 0.1,
            life: 1.5,
            color: '#39FF14' // Green
        });
    }
    return parts;
};

export const createShieldBreak = (x: number, y: number): Particle[] => {
    const parts: Particle[] = [];
    for(let i=0; i<20; i++) {
        parts.push({
            id: randomId(),
            x: x, y: y,
            vx: (Math.random() - 0.5) * 1.0,
            vy: (Math.random() - 0.5) * 1.0,
            life: 0.6,
            color: '#FFD700' // Gold
        });
    }
    return parts;
};

export const createFillEffect = (x: number, y: number, color: string): Particle[] => {
    const parts: Particle[] = [];
    for(let i=0; i<8; i++) {
        parts.push({
            id: randomId(),
            x: x, y: y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            life: 0.8,
            color: color
        });
    }
    return parts;
};
