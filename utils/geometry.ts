
import { Point, Wall } from '../types';

export const isPointInPolygon = (point: Point, vs: Point[]) => {
  // Ray-casting algorithm based on the Jordan Curve Theorem.
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    
    let intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export const getDistance = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const checkCollision = (p1: Point, p2: Point, threshold: number = 0.5) => {
    return Math.abs(p1.x - p2.x) < threshold && Math.abs(p1.y - p2.y) < threshold;
};

export const checkCollisionWithWalls = (x: number, y: number, walls: Wall[]) => {
    return walls.some(w => x >= w.x && x < w.x + w.width && y >= w.y && y < w.y + w.height);
};
