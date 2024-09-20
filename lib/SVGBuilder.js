/**
 * A comprehensive set of utilities for building SVG text
 *
 * Supported Features:
 *
 * Path:
 *     ellipse, rectangle, line-segment, line-segment-path (closable),
 *     quadratic Bezier, cubic Bezier, Catmull-Rom spline, Canonical Spline
 *
 * !! Other shape tags are not supported since they are practically redundant with <Path> tag
 *
 * Stroke and Fill :
 *     color
 *     radial gradient
 *     linear gradient
 *
 * Stroke width
 *
 * Filters:
 *    drop shadow
 *    gaussian blur
 *
 * Embedded Images (base64)
 *     Not yet supported
 *
 * Animations:
 *    Not yet supported
 *
 * ViewBox
 */

import { buildSplineDString } from "./spline.js";
import PointMath from "./math/PointMath.js";
import getBounds from "svg-path-bounding-box";

export function combineBoundingBoxes(...boxes) {
  // Allow function to be called variadically or with an array
  if (boxes.length === 0) return null;
  const items = Array.isArray(boxes[0]) ? boxes[0] : boxes;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  // Allows for null boxes such as for unsupported or not yet implemented elements
  for (const item of items) {
    if (item) {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + item.width);
      maxY = Math.max(maxY, item.y + item.height);
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * @typedef {Object} SVGCommand
 *
 * @property {string} name
 * @property {number[]} args
 */

/**
 * @typedef {Object} LineData
 * @property {"line"} [kind="line"]
 * @property {Point} p1
 * @property {Point} p2
 */

/**
 * @typedef {Object} PathData
 * @property {"path"} [kind="path"]
 * @property {Point[]} path
 * @property {boolean} [closed=false]
 */

/**
 * @typedef {Object} RectData
 * @property {"rect"} [kind="rect"]
 * @property {Point} position
 * @property {number} width
 * @property {number} height
 */

/**
 *
 * Tbh, SVG ellipse arcs are one of the most
 * mind boggling data types
 *
 * I don't feel like learning the math
 *
 * I just copy the raw data
 * and ship it off to well know library 'svg-path-bounding-box'
 * and call it a day
 *
 * @typedef {Object} RawSVGAbsoluteEllipseArcData
 * @property {"ellipseArc"} [kind="ellipseArc"]
 * @property {Point} absoluteStart
 * @property {number} rX
 * @property {number} rY
 * @property {number} startAngle
 * @property {number} endAngle
 * @property {boolean} [largeArcFlag=false]
 * @property {boolean} [sweepFlag=false]
 * @property {Point} absoluteEnd
 */

/**
 * @typedef {Object} QuadraticBezierData
 *
 * @property {"quadraticBezier"} [kind="quadraticBezier"]
 * @property {Point} p1
 * @property {Point} p2
 * @property {Point} p3
 */

/**
 * @typedef {Object} CubicBezierData
 *
 * @property {"cubicBezier"} [kind="cubicBezier"]
 * @property {Point} p1
 * @property {Point} p2
 * @property {Point} p3
 */

/**
 * @typedef { LineData | PathData | RawSVGAbsoluteEllipseArcData | RectData | QuadraticBezierData | CubicBezierData } SupportedGeometryData
 */

const supportedSVGPathDLetters = "MLHVZCQA";

/**
 * @param {Array<SVGCommand>} svgCommandss
 * @returns {Array<SupportedGeometryData>}
 */
function executeSVGStateMachine(svgCommands) {
  /**
   * @type {Array<SupportedGeometryData>}
   *
   */
  const geometry = [];
  let brushTip = null;
  function setBrushTip(point) {
    brushTip = point;
  }
  function fromBrushTip(delta) {
    if (brushTip === null) {
      throw new Error("Brush tip not set");
    }
    return PointMath.sum(brushTip, delta);
  }

  function shiftPointIfNeeded(commandName, value) {
    if (commandName.toUpperCase() === commandName) {
      return value;
    }
    return fromBrushTip(value);
  }
  /**
   *
   * @param {SVGCommand} command
   */
  function processCommand(command) {
    switch (command.name) {
      case "M": // Move to (absolute)
      case "m": {
        // Move to (relative)
        const [x, y] = command.args;
        const point = shiftPointIfNeeded(command.name, [x, y]);
        setBrushTip(point);
        break;
      }

      case "L": // Line to (absolute)
      case "l": {
        // Line to (relative)
        const [x, y] = command.args;
        const point = shiftPointIfNeeded(command.name, [x, y]);
        geometry.push({
          kind: "line",
          p1: brushTip, // Both p1 and p2 should be tuples
          p2: point,
        });
        setBrushTip(point);
        break;
      }

      case "H": // Horizontal line to (absolute)
      case "h": {
        // Horizontal line to (relative)
        const [x] = command.args;
        const point = shiftPointIfNeeded(command.name, [x, brushTip[1]]);
        geometry.push({
          kind: "line",
          p1: brushTip,
          p2: point,
        });
        setBrushTip(point);
        break;
      }

      case "V": // Vertical line to (absolute)
      case "v": {
        // Vertical line to (relative)
        const [y] = command.args;
        const point = shiftPointIfNeeded(command.name, [brushTip[0], y]);
        geometry.push({
          kind: "line",
          p1: brushTip,
          p2: point,
        });
        setBrushTip(point);
        break;
      }

      case "C": // Cubic Bezier curve (absolute)
      case "c": {
        // Cubic Bezier curve (relative)
        const [cx1, cy1, cx2, cy2, x, y] = command.args;
        const controlPoint1 = shiftPointIfNeeded(command.name, [cx1, cy1]);
        const controlPoint2 = shiftPointIfNeeded(command.name, [cx2, cy2]);
        const endPoint = shiftPointIfNeeded(command.name, [x, y]);

        geometry.push({
          kind: "cubicBezier",
          p1: brushTip,
          cp1: controlPoint1,
          cp2: controlPoint2,
          p2: endPoint,
        });

        setBrushTip(endPoint);
        break;
      }

      case "Q": // Quadratic Bezier curve (absolute)
      case "q": {
        // Quadratic Bezier curve (relative)
        const [cx, cy, x, y] = command.args;
        const controlPoint = shiftPointIfNeeded(command.name, [cx, cy]);
        const endPoint = shiftPointIfNeeded(command.name, [x, y]);

        geometry.push({
          kind: "quadraticBezier",
          p1: brushTip,
          cp: controlPoint,
          p2: endPoint,
        });

        setBrushTip(endPoint);
        break;
      }

      case "A": // Arc (absolute)
      case "a": {
        const [rX, rY, angle, largeArcFlag, sweepFlag, x, y] = command.args;
        // Need a copy, not a reference
        // Could have also use JSON.parse(JSON.stringify()) if I wanted to
        const absoluteStart = shiftPointIfNeeded(command.name, [0, 0]);
        const absoluteEnd = shiftPointIfNeeded(command.name, [x, y]);
        const arcData = {
          kind: "ellipseArc",
          absoluteStart,
          rX,
          rY,
          angle,
          largeArcFlag,
          sweepFlag,
          absoluteEnd,
        };
        geometry.push(arcData);
        break;
      }

      case "Z": // Close path
      case "z": {
        if (geometry.length && geometry[0].p1) {
          geometry.push({
            kind: "line",
            p1: brushTip,
            p2: geometry[0].p1, // Close the path to the starting point
          });
        }
        break;
      }

      default:
        throw new Error(`Unsupported SVG command: ${command.name}`);
    }
  }
  for (const command of svgCommands) {
    processCommand(command);
  }
  return geometry;
}

/**
 * @typedef {Object} GradientStop
 *
 * @property {number} offset
 * @property {string} color
 * @property {number} opacity
 */

/**
 * @typedef {Object} LinearGradient
 *
 * @property {"linear-gradient"} kind
 * @property {string} [id=undefined]
 * @property {number} x1
 * @property {number} x2
 * @property {number} y1
 * @property {number} y2
 * @property {GradientStop[]} stops
 */

/**
 * @typedef {Object} RadialGradient
 *
 * @property {"radial-gradient"} kind
 * @property {string} [id=undefined]
 * @property {number} x1
 * @property {number} y1
 * @property {number} r1
 * @property {number} r2
 * @property {GradientStop[]} stops
 */

/**
 * @typedef {string|LinearGradient|RadialGradient} StrokeOrFill
 */

/**
 * @typedef {"center" | [number, number]} TransformOrigin
 */

/**
 * @typedef {Object} Transform
 * @property {number} translateX
 * @property {number} translateY
 * @property {number} scaleX
 * @property {number} scaleY
 * @property {number} rotateDegrees
 * @property {TransformOrigin} transformOrigin
 */

/**
 * @typedef {Object} DropShadow
 * @property {string} [id=undefined]
 * @property {number} dx
 * @property {number} dy
 * @property {number} stdDeviation
 * @property {string} color
 */

/**
 * @typedef {Object} GaussianBlur
 * @property {string} [id=undefined]
 * @property {number} stdDeviation
 */

function transformOriginToString(origin) {
  return typeof origin === "string" ? origin : `${origin[0]} ${origin[1]}`;
}

/**
 * Creates a linear gradient object
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {GradientStop[]} stops
 * @param {string} id
 * @returns {LinearGradient}
 */
export function createLinearGradient(x1, y1, x2, y2, stops) {
  return {
    kind: "linear-gradient",
    x1,
    y1,
    x2,
    y2,
    stops,
  };
}

/**
 * Creates a radial gradient object
 * @param {number} x1
 * @param {number} y1
 * @param {number} r1
 * @param {number} r2
 * @param {GradientStop[]} stops
 * @param {string} id
 * @returns {RadialGradient}
 */
export function createRadialGradient(x1, y1, r1, r2, stops) {
  return {
    kind: "radial-gradient",
    x1,
    y1,
    r1,
    r2,
    stops,
  };
}

/**
 * Creates a transform object
 * @param {number} translateX
 * @param {number} translateY
 * @param {number} scaleX
 * @param {number} scaleY
 * @param {number} rotateDegrees
 * @param {string} transformOrigin
 * @returns {Transform}
 */
export function createTransform(
  translateX = 0,
  translateY = 0,
  scaleX = 1,
  scaleY = 1,
  rotateDegrees = 0,
  transformOrigin = "center"
) {
  return {
    translateX,
    translateY,
    scaleX,
    scaleY,
    rotateDegrees,
    transformOrigin,
  };
}

/**
 * Compiles a linear gradient object to an SVG string
 * @param {LinearGradient} gradient
 * @returns {string}
 */
export function compileLinearGradient(gradient) {
  const stops = gradient.stops
    .map(
      (stop) =>
        `<stop offset="${stop.offset}%" style="stop-color:${stop.color};stop-opacity:${stop.opacity}" />`
    )
    .join("");
  return `<linearGradient id="${gradient.id}" x1="${gradient.x1}" y1="${gradient.y1}" x2="${gradient.x2}" y2="${gradient.y2}">${stops}</linearGradient>`;
}

/**
 * Compiles a radial gradient object to an SVG string
 * @param {RadialGradient} gradient
 * @returns {string}
 */
export function compileRadialGradient(gradient) {
  const stops = gradient.stops
    .map(
      (stop) =>
        `<stop offset="${stop.offset}%" style="stop-color:${stop.color};stop-opacity:${stop.opacity}" />`
    )
    .join("");
  return `<radialGradient id="${gradient.id}" cx="${gradient.x1}" cy="${gradient.y1}" r="${gradient.r1}">${stops}</radialGradient>`;
}

export function compileStrokeOrFill(strokeOrFill) {
  if (typeof strokeOrFill === "object" && strokeOrFill !== null) {
    if (strokeOrFill.kind === "linear-gradient") {
      return compileLinearGradient(strokeOrFill);
    }
    if (strokeOrFill.kind === "radial-gradient") {
      return compileRadialGradient(strokeOrFill);
    }
  }
  return "";
}

/**
 * Compiles a path element to an SVG string
 * @param {string} d
 * @param {StrokeOrFill} [stroke]
 * @param {number} [strokeWidth=1.0]
 * @param {StrokeOrFill} [fill]
 * @param {number} [opacity=1.0]
 * @param {Transform} [transform]
 * @returns {string}
 */
export function compilePathElement(
  d,
  stroke,
  strokeWidth = 1.0,
  fill,
  opacity = 1.0,
  transform
) {
  let transformString = "";
  if (transform) {
    transformString = `transform="translate(${transform.translateX}, ${
      transform.translateY
    }) scale(${transform.scaleX}, ${transform.scaleY}) rotate(${
      transform.rotateDegrees
    }, ${transformOriginToString(transform.transformOrigin)})" `;
  }

  let strokeString = stroke
    ? typeof stroke === "string"
      ? `stroke="${stroke}"`
      : `stroke="url(#${stroke.id})"`
    : 'stroke="none"';
  let fillString = fill
    ? typeof fill === "string"
      ? `fill="${fill}"`
      : `fill="url(#${fill.id})"`
    : 'fill="none"';

  return `<path d="${d}" ${strokeString} ${fillString} opacity="${opacity}" stroke-width="${strokeWidth}" ${transformString}/>`;
}

/**
 * Compiles a drop shadow filter to an SVG string
 * @param {DropShadow} dropShadow
 * @returns {string}
 */
export function compileDropShadow(dropShadow) {
  return `<filter id="${dropShadow.id}" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="${dropShadow.dx}" dy="${dropShadow.dy}" stdDeviation="${dropShadow.stdDeviation}" flood-color="${dropShadow.color}" />
            </filter>`;
}

/**
 * Compiles a Gaussian blur filter to an SVG string
 * @param {GaussianBlur} gaussianBlur
 * @returns {string}
 */
export function compileGaussianBlur(gaussianBlur) {
  return `<filter id="${gaussianBlur.id}" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="${gaussianBlur.stdDeviation}" />
            </filter>`;
}

/**
 * Builds a path data string for an ellipse arc
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} rx - horizontal radius
 * @param {number} ry - vertical radius
 * @param {number} startAngle - start angle in radians
 * @param {number} endAngle - end angle in radians
 * @param {"cw" | "ccw"} direction - clockwise or counterclockwise
 * @returns {string}
 */
export function buildDStringForEllipseArc(
  x,
  y,
  rx,
  ry,
  startAngle,
  endAngle,
  direction
) {
  const startX = x + rx * Math.cos(startAngle);
  const startY = y + ry * Math.sin(startAngle);
  const endX = x + rx * Math.cos(endAngle);
  const endY = y + ry * Math.sin(endAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
  const sweepFlag = direction === "cw" ? 1 : 0;

  return `M ${startX} ${startY} A ${rx} ${ry} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
}

/**
 * Builds a path data string for an ellipse
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} rx - horizontal radius
 * @param {number} ry - vertical radius
 * @returns {string}
 */
export function buildDStringForEllipse(x, y, rx, ry) {
  return `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${
    2 * rx
  } 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
}

/**
 * Builds a path data string for a rectangle
 * @param {number} x - top-left x
 * @param {number} y - top-left y
 * @param {number} width - width of the rectangle
 * @param {number} height - height of the rectangle
 * @returns {string}
 */
export function buildDStringForRectangle(x, y, width, height) {
  return `M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
}

export function buildDStringForLine(A, B) {
  return `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
}

export function buildDStringForLineSequence(points, close = false) {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  if (close) {
    d += ` Z`;
  }
  return d;
}

/**
 * @typedef {Object} ViewBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

export class Artist {
  constructor(
    stroke,
    strokeWidth,
    fill,
    opacity,
    transform,
    dropShadow,
    gaussianBlur,
    parentSVGBuilder
  ) {
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
    this.fill = fill;
    this.opacity = opacity;
    this.transform = transform;
    this.dropShadow = dropShadow;
    this.gaussianBlur = gaussianBlur;
    this.definitions = [];
    this.parentSVGBuilder = parentSVGBuilder;
  }

  rectangle(x, y, width, height) {
    this.definitions.push(buildDStringForRectangle(x, y, width, height));
    return this;
  }

  circle(center, radius) {
    this.definitions.push(
      buildDStringForEllipse(center.x, center.y, radius, radius)
    );
    return this;
  }

  ellipse(center, rx, ry) {
    this.definitions.push(buildDStringForEllipse(center.x, center.y, rx, ry));
    return this;
  }

  line(A, B) {
    this.definitions.push(buildDStringForLine(A, B));
    return this;
  }

  lineSequence(path, close = false) {
    this.definitions.push(buildDStringForLineSequence(path, close));
    return this;
  }

  curve(path, tension = 1.0) {
    this.definitions.push(buildSplineDString(path, tension));
    return this;
  }

  compile() {
    return this.definitions.join(" ");
  }

  commit() {
    this.parentSVGBuilder.addPath(
      this.compile(),
      this.stroke,
      this.strokeWidth,
      this.fill,
      this.opacity,
      this.transform,
      this.dropShadow,
      this.gaussianBlur
    );
    return this.parentSVGBuilder;
  }
}

/**
 * SVG class to construct and compile SVG elements
 *
 *
 * @class
 * @constructor
 *
 * @property {Array<string>} elements - array of SVG elements
 * @property {Array<string>} defs - array of defs
 * @property {Map<string,string>} idMap - map of values to ids for different types of elements
 * @property {number} uniqueIdCounter - counter for unique IDs
 * @property {number} width
 * @property {number} height
 *
 */
export default class SVGBuilder {
  /**
   *
   * @param {number} width
   * @param {number} height
   * @param {ViewBox} [viewBox={x:0,y:0,width,height} ]
   */
  constructor(width, height, viewBox) {
    viewBox = viewBox ?? { x: 0, y: 0, width, height };
    this.elements = new Array();
    this.defs = new Array();
    this.idMap = new Map();
    this.uniqueIdCounter = 0;

    this.width = width;
    this.height = height;
    this.viewBox = viewBox;
    this.vars = {};
  }

  /**
   *
   * @param {*} width
   * @param {*} height
   * @param {*} viewBox
   * @returns
   */
  static create(width, height, viewBox) {
    return new SVGBuilder(width, height, viewBox);
  }

  setVar(key, value) {
    this.vars[key] = value;
    return this;
  }

  setVars(vars) {
    Object.keys(vars).forEach((key) => {
      this.vars[key] = vars[key];
    });
    return this;
  }

  /**
   * Generates a unique ID
   * @param {Object} identifyingData
   * @returns {string}
   */
  getUniqueId(prefix, identifyingData) {
    if (identifyingData) {
      const key = prefix + ":" + JSON.stringify(identifyingData);
      if (!this.idMap.has(key)) {
        const newId = `id${this.uniqueIdCounter++}`;
        this.idMap.set(key, newId);
        return newId;
      }
      return this.idMap.get(key);
    }
    return `id${this.uniqueIdCounter++}`;
  }

  /**
   * @param {""} prefix
   * @param {any} item
   */
  withUniqueId(prefix, item) {
    const id = this.getUniqueId(prefix, item);
    if (typeof item === "object" && item !== null) {
      return Object.assign(item, { id });
    }
    return item;
  }

  /**
   * Adds a path element to the SVG
   * @param {string} d
   * @param {StrokeOrFill} stroke
   * @param {StrokeOrFill} fill
   * @param {number} opacity
   * @param {Transform} transform
   * @param {DropShadow} dropShadow
   * @param {GaussianBlur} gaussianBlur
   */
  addPath(
    d,
    stroke,
    strokeWidth,
    fill,
    opacity,
    transform,
    dropShadow,
    gaussianBlur
  ) {
    const uFill = this.withUniqueId("fill", fill);
    const uStroke = this.withUniqueId("stroke", stroke);
    const uDropShadow = this.withUniqueId("dropShadow", dropShadow);
    const uGaussianBlur = this.withUniqueId("gaussianBlur", gaussianBlur);
    const pathElement = compilePathElement(
      d,
      uStroke,
      strokeWidth,
      uFill,
      opacity,
      transform
    );
    this.elements.push(pathElement);
    [
      uFill && compileStrokeOrFill(uFill),
      uStroke && compileStrokeOrFill(uStroke),
      uDropShadow && compileDropShadow(uDropShadow),
      uGaussianBlur && compileGaussianBlur(uGaussianBlur),
    ]
      .filter(Boolean)
      .forEach((def) => {
        this.defs.push(def);
      });

    return this;
  }

  /**
   * Sets a drop shadow filter for the SVG
   * @param {DropShadow} dropShadow
   */
  setDropShadow(dropShadow) {
    this.defs.push(
      compileDropShadow(this.withUniqueId("dropShadow", dropShadow))
    );
    return this;
  }

  /**
   * Sets a Gaussian blur filter for the SVG
   * @param {GaussianBlur} gaussianBlur
   */
  setGaussianBlur(gaussianBlur) {
    this.defs.push(
      compileGaussianBlur(this.withUniqueId("gaussianBlur", gaussianBlur))
    );
    return this;
  }

  artist(
    stroke,
    strokeWidth,
    fill,
    opacity,
    transform,
    dropShadow,
    gaussianBlur
  ) {
    return new Artist(
      stroke,
      strokeWidth,
      fill,
      opacity,
      transform,
      dropShadow,
      gaussianBlur,
      this
    );
  }

  /**
   * Compiles the SVG elements into a complete SVG string
   * @returns {string}
   */
  compile(noVars = false) {
    return `
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${this.width}"
    height="${this.height}"
    viewBox="${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${
      this.viewBox.height
    }"
    preserveAspectRatio="xMidYMid meet"

    >
  ${
    !noVars
      ? `
    <style>

    :root {
${Object.entries(this.vars)
  .map(([key, value]) => {
    return `        ${key}: ${value};`;
  })
  .join("\n")}
    }

    </style>
  `
      : ""
  }
    <defs>
${this.defs.join("\n")}
    </defs>
${this.elements
  .join("\n")
  .split("\n")
  .map((line) => "    " + line)
  .join("\n")}
</svg>`.trim();
  }

  /**
   *
   * @param {*} maskId
   * @param {*} noVars
   * @returns
   */
  compileMask(maskId, noVars = false) {
    return `
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${this.width}"
    height="${this.height}"
    viewBox="${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${
      this.viewBox.height
    }"
    >
  ${
    !noVars
      ? `
    <style>

    :root {
${Object.entries(this.vars)
  .map(([key, value]) => {
    return `        ${key}: ${value};`;
  })
  .join("\n")}
    }

    </style>
  `
      : ""
  }
    <defs>
${this.defs.join("\n")}
  <mask id="${maskId}">
${this.elements
  .join("\n")
  .split("\n")
  .map((line) => "    " + line)
  .join("\n")}
  </mask>
    </defs>
</svg>`.trim();
  }

  getContentBoundingBox() {
    // supported shapes and corresponding svg path d letter
    // circle                                         - M cx, cy m -r, 0 a r,r 0 1,0 (2r,0) a r,r 0 1,0 (-2r,0)
    // ellipse                                        - M cx, cy m -rx, 0 a rx,ry 0 1,0 (2rx,0) a rx,ry 0 1,0
    // rectangle                                      - M x, y h width v height h -width Z
    // line                                           - M x1, y1 L x2, y2
    // path (line sequence)                           - M x1, y1 L x2, y2 L x3, y3 ... (sequence of L commands)
    // circle arc                                     - M x1, y1 A rx, ry x-axis-rotation large-arc-flag sweep-flag x2, y2
    // ellipse arc                                    - M x1, y1 A rx, ry x-axis-rotation large-arc-flag sweep-flag x2, y2
    // quadratic bezier                               - M x1, y1 Q cx, cy, x2, y2
    // cubic bezier                                   - M x1, y1 C cx1, cy1, cx2, cy2, x2, y2
    // movement commands                              - M (move to), L (line to), H (horizontal line), V (vertical line), Z (close path)
    let boundingBox = null;

    function incorporateBoundingBox(box) {
      if (boundingBox === null) {
        boundingBox = box;
      } else {
        boundingBox = combineBoundingBoxes(boundingBox, box);
      }
    }

    /**
     *
     * @param {string} elementText
     */
    function processElement(elementText) {
      const dRegex = /d\s*=\s*("|')\s*(.*?)\s*("|')/gis;
      const matches = Array.from(elementText.matchAll(dRegex));
      if (matches.length !== 1) {
        throw new Error("Invalid path data");
      }
      const d = matches[0][2].trim().replace(/\s+/g, " ");
      const bounds = getBounds(d);
      incorporateBoundingBox({
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.width,
        height: bounds.height,
      });
    }

    for (const elementText of this.elements) {
      processElement(elementText);
    }

    return boundingBox;
  }

  adjustViewboxToFitContent() {
    const boundingBox = this.getContentBoundingBox();
    if (boundingBox) {
      this.viewBox = this.getContentBoundingBox();
    } else {
      console.warn("No content found in SVG to adjust viewBox");
    }
    return this;
  }
}
