/**
 * A collection of utilities for handling splines and SVG path definitions
 */

/**
 * @typedef {[number,number]} Point
 */

/**
 * @typedef {Array<Point>} Path
 */

/**
 * @typedef {[Point,Point]} LineSegmentPath
 */

/**
 * @typedef {[Point,Point,Point]} QuadraticBezierPath
 */

/**
 * @typedef {[Point,Point,Point,Point]} CubicBezierPath
 */

/**
 * @typedef {LineSegmentPath | QuadraticBezierPath | CubicBezierPath} SimplePath
 */

/**
 * @typedef {Array<SimplePath>} SimplePathList
 */

/**
 * Decompose a path into a list of quadratic Bezier curves using the Catmull-Rom algorithm
 *
 * @param {Path} points -
 * 
 *     The control points of the path
 *     The spline will pass through all points and not exceed the start or end
 * 
 * @param {number} [tension=1.0]
 * 
 *     The tension parameter used for the Catmull-Rom algorithm
 *     0 = loose fit
 *     1 = tight fit
 * 
 * @returns {SimplePathList}
 */
export function performCatmullRom(points, tension = 1.0) {
  if (points.length === 0) {
    throw new Error("At least 1 point required");
  }
  if (points.length < 4) {
    return [points];
  }
  let result = [];
  for (let i = 0; i < points.length - 1; i++) {
    let p0 = points[Math.max(i - 1, 0)];
    let p1 = points[i];
    let p2 = points[i + 1];
    let p3 = points[Math.min(i + 2, points.length - 1)];

    let t1x = ((p2[0] - p0[0]) / 2) * tension;
    let t1y = ((p2[1] - p0[1]) / 2) * tension;
    let t2x = ((p3[0] - p1[0]) / 2) * tension;
    let t2y = ((p3[1] - p1[1]) / 2) * tension;

    let cp1 = [p1[0] + t1x / 3, p1[1] + t1y / 3];
    let cp2 = [p2[0] - t2x / 3, p2[1] - t2y / 3];
    result.push([p1, cp1, cp2, p2]);
  }
  return result;
}

/**
 * Decompose a path into a list of cubic Bezier curves using the "Canonical Spline" algorithm
 *
 * @param {Path} points -
 * 
 *     The control points of the path
 *     The spline will pass through all points and not exceed the start or end
 * 
 * @param {number} [tension=1.0]
 * 
 *     The tension parameter used for the "Canonical Spline" algorithm
 *     0 = loose fit
 *     1 = tight fit
 * 
 * @returns {SimplePathList}
 */
export function performCanonicalSpline(points, tension = 1.0) {
  if (points.length === 0) {
    throw new Error("At least 1 point required");
  }
  if (points.length < 5) {
    return [points];
  }
  let result = [];
  for (let i = 1; i < points.length - 2; i++) {
    let p0 = points[i - 1];
    let p1 = points[i];
    let p2 = points[i + 1];
    let p3 = points[i + 2];

    let cp1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    let cp1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    let cp2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    let cp2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;

    result.push([p1, [cp1x, cp1y], [cp2x, cp2y], p2]);
  }
  return result;
}

/**
 * Builds an SVG "d" string (using directives with absolute coordinates)
 * for a line segment, quadratic bezier, or cubic bezier
 *
 * @param {Path} points - The points defining the linear segment, or simple curve
 * @returns {string} - The SVG "d" string for the segment or curve
 */
export function buildSimplePathDString(points) {
  if (points.length > 4) {
    throw new Error(
      `${points.length} points do not form a simple curve (line segment, quadratic bezier, cubic bezier). Consider using Catmull-Rom or canonical spline decomposition`
    );
  }
  if (![2, 3, 4].includes(points.length)) {
    throw new Error(
      "# Points must be 2, 3, or 4. Note that <svg> does not support drawing a single point. Use a <circle> instead."
    );
  }

  switch (points.length) {
    case 2:
      // Line segment
      return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;

    case 3:
      // Quadratic Bezier
      return `M ${points[0][0]} ${points[0][1]} Q ${points[1][0]} ${points[1][1]} ${points[2][0]} ${points[2][1]}`;

    case 4:
      // Cubic Bezier
      return `M ${points[0][0]} ${points[0][1]} C ${points[1][0]} ${points[1][1]} ${points[2][0]} ${points[2][1]} ${points[3][0]} ${points[3][1]}`;

    default:
      throw new Error("Unsupported number of points");
  }
}

/**
 *
 * @param {Path} points
 * @param {"cubic" | "quadratic"} [primitive="cubic"] - 
 * 
 * 
 *     Whether to construct the spline from cubic or quadratic bezier curves
 *
 *     If "cubic", then it will be linear for 2 points, quadratic for 3 points,
 *     and "Canonical Spline" for 4 points or more.
 *
 *     If "quadratic", then it will be linear for 2 points, quadratic for 3 points,
 *     and "Catmull-Rom" for 4 points or more.
 *
 *     Note that "cubic" and "quadratic" modes behave differently for 4 points.
 * 
 * @param {number?} [tension=1.0] - 
 *  
 *     The tension parameter for the requested spline solving algorithm ("Catmull-Rom" or "Canonical Spline")
 *     0 = loose fit
 *     1 = tight fit
 * 
 * @returns {string} - An SVG "d" string representing the spline
 */
export function buildSplineDString(points, primitive = "cubic", tension = 1.0) {
  const decomposed =
    primitive === "cubic"
      ? performCanonicalSpline(points, tension)
      : performCatmullRom(points, tension);
  return decomposed.map((c) => buildSimplePathDString(c)).join(" ")
}