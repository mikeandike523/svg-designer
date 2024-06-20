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

import lodash from "lodash";

import { buildSplineDString } from "./spline.js";

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
    if (typeof viewBox === "undefined") {
      viewBox = { x: 0, y: 0, width, height };
    }
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
    return new SVGBuilder(width, height, viewBox)
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
  compileMask(maskId,noVars = false) {
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
}
