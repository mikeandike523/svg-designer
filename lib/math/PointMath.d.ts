// PointMath.d.ts

/**
 * Represents a 2D point as a tuple of two numbers.
 */
export type Point = [number, number];

export default class PointMath {
  static sum(p1: Point, p2: Point): Point;
  static difference(p1: Point, p2: Point): Point;
  static lerp(p1: Point, p2: Point, t: number): Point;
  static scaledBy(p: Point, scalar: number): Point;
  static termByTermMultiplied(p1: Point, p2: Point): Point;
  static toXYObject(p: Point): { x: number; y: number };
  static directionVector(theta: number): Point;
  static bowAtMidpoint(p1: Point, p2: Point,offset:number): [Point,Point,Point];
}
