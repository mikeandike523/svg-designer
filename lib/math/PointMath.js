/**
 * @type {[number, number]} Point
 */

export default class PointMath {
  /**
   * @param {Point} p1
   * @param {Point} p2
   *
   * @returns {Point}
   *
   */
  static sum(p1, p2) {
    return [p1[0] + p2[0], p1[1] + p2[1]];
  }

  /**
   * @param {Point} p1
   * @param {Point} p2
   * @returns {Point}
   */
  static difference(p1, p2) {
    return [p1[0] - p2[0], p1[1] - p2[1]];
  }

  /**
   *
   * @param {Point} p
   * @param {number} scalar
   */
  static scaledBy(p, scalar) {
    return [p[0] * scalar, p[1] * scalar];
  }

  /**
   * @param {Point} p1
   * @param {Point} p2
   */
  static termByTermMultiplied(p1, p2) {
    return [p1[0] * p2[0], p1[1] * p2[1]];
  }

  /**
   * @param {Point} p1
   * @param {Point} p2
   * @param {number} t
   */
  static lerp(p1, p2, t) {
    return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
  }

  /**
   * Convert to an object with x and y properties
   *
   * @param {Point} p1
   */
  static toXYObject(p1) {
    return {
      x: p1[0],
      y: p1[1],
    };
  }

  /**
   * 
   * @param {number} theta 
   */
  static directionVector(theta) {
    return [Math.cos(theta), Math.sin(theta)]
  }

  /**
   * 
   * Follows right hand rule (add 90 degrees)
   * 
   * @param {Point} p1 
   * @param {Point} p2 
   * @param {number} offset 
   */
  static bowAtMidpoint(p1,  p2, offset) {
    const delta = PointMath.difference(p2, p1);
    const angle = Math.atan2(delta[1], delta[0]);
    const orthAngle = angle + Math.PI / 2;
    const bowVector = PointMath.directionVector(orthAngle);
    const offsetVector = PointMath.scaledBy(bowVector, offset);
    const midpoint = PointMath.lerp(p1, p2, 0.5);
    const newPoint = PointMath.sum(midpoint, offsetVector);
    return [
      p1,
      newPoint,
      p2,
    ]
  }
}
