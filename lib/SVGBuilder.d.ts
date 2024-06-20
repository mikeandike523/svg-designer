export interface GradientStop {
    offset: number;
    color: string;
    opacity: number;
  }
  
  export interface LinearGradient {
    kind: "linear-gradient";
    id?: string;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    stops: GradientStop[];
  }
  
  export interface RadialGradient {
    kind: "radial-gradient";
    id?: string;
    x1: number;
    y1: number;
    r1: number;
    r2: number;
    stops: GradientStop[];
  }
  
  export type StrokeOrFill = string | LinearGradient | RadialGradient;
  
  export type TransformOrigin = "center" | [number, number];
  
  export interface Transform {
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
    rotateDegrees: number;
    transformOrigin: TransformOrigin;
  }
  
  export interface DropShadow {
    id?: string;
    dx: number;
    dy: number;
    stdDeviation: number;
    color: string;
  }
  
  export interface GaussianBlur {
    id?: string;
    stdDeviation: number;
  }
  
  export function transformOriginToString(origin: TransformOrigin): string;
  
  export function createLinearGradient(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stops: GradientStop[],
    id?: string
  ): LinearGradient;
  
  export function createRadialGradient(
    x1: number,
    y1: number,
    r1: number,
    r2: number,
    stops: GradientStop[],
    id?: string
  ): RadialGradient;
  
  export function createTransform(
    translateX?: number,
    translateY?: number,
    scaleX?: number,
    scaleY?: number,
    rotateDegrees?: number,
    transformOrigin?: string
  ): Transform;
  
  export function compileLinearGradient(gradient: LinearGradient): string;
  
  export function compileRadialGradient(gradient: RadialGradient): string;
  
  export function compileStrokeOrFill(strokeOrFill: StrokeOrFill): string;
  
  export function compilePathElement(
    d: string,
    stroke?: StrokeOrFill,
    strokeWidth?: number,
    fill?: StrokeOrFill,
    opacity?: number,
    transform?: Transform
  ): string;
  
  export function compileDropShadow(dropShadow: DropShadow): string;
  
  export function compileGaussianBlur(gaussianBlur: GaussianBlur): string;
  
  export function buildDStringForEllipseArc(
    x: number,
    y: number,
    rx: number,
    ry: number,
    startAngle: number,
    endAngle: number,
    direction: "cw" | "ccw"
  ): string;
  
  export function buildDStringForEllipse(
    x: number,
    y: number,
    rx: number,
    ry: number
  ): string;
  
  export function buildDStringForRectangle(
    x: number,
    y: number,
    width: number,
    height: number
  ): string;
  
  export function buildDStringForLine(
    A: { x: number; y: number },
    B: { x: number; y: number }
  ): string;
  
  export function buildDStringForLineSequence(
    points: [number, number][],
    close?: boolean
  ): string;
  
  export interface ViewBox {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export class Artist {
    constructor(
      stroke?: StrokeOrFill,
      strokeWidth?: number,
      fill?: StrokeOrFill,
      opacity?: number,
      transform?: Transform,
      dropShadow?: DropShadow,
      gaussianBlur?: GaussianBlur,
      parentSVGBuilder?: SVGBuilder
    );
  
    rectangle(x: number, y: number, width: number, height: number): Artist;
    circle(center: { x: number; y: number }, radius: number): Artist;
    ellipse(center: { x: number; y: number }, rx: number, ry: number): Artist;
    line(A: { x: number; y: number }, B: { x: number; y: number }): Artist;
    lineSequence(points: [number, number][], close?: boolean): Artist;
    curve(path: [number, number][], tension?: number): Artist;
    compile(): string;
    commit(): SVGBuilder;
  }
  
  export default class SVGBuilder {
    constructor(
      width: number,
      height: number,
      viewBox?: ViewBox
    );

    static create(
      width: number,
      height: number,
      viewBox?: ViewBox
    ): SVGBuilder;
  
    setVar(key: string, value: string): this;
    setVars(vars: Record<string, string>): this;
    getUniqueId(prefix: string, identifyingData?: any): string;
    withUniqueId(prefix: string, item: any): any;
    addPath(
      d: string,
      stroke?: StrokeOrFill,
      strokeWidth?: number,
      fill?: StrokeOrFill,
      opacity?: number,
      transform?: Transform,
      dropShadow?: DropShadow,
      gaussianBlur?: GaussianBlur
    ): this;
    setDropShadow(dropShadow: DropShadow): this;
    setGaussianBlur(gaussianBlur: GaussianBlur): this;
    artist(
      stroke?: StrokeOrFill,
      strokeWidth?: number,
      fill?: StrokeOrFill,
      opacity?: number,
      transform?: Transform,
      dropShadow?: DropShadow,
      gaussianBlur?: GaussianBlur
    ): Artist;
    compile(noVars?: boolean): string;
    compileMask(maskId: string, noVars?: boolean): string;
  }
  