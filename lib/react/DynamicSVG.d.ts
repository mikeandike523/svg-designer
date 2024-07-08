import { HTMLAttributes } from "react";
import { type SerializedStyles } from "@emotion/react";

export interface CssVars {
  [key: string]: string;
}

export interface DynamicSVGProps extends HTMLAttributes<SVGElement> {
  src?: string;
  text?: string;
  cssVars?: CssVars;
  noMangle?: string[];
  viewBox?:
    | {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    | undefined;
  css?: SerializedStyles;
}

declare const DynamicSVG: ({
  src,
  text,
  className,
  cssVars,
  noMangle,
  ...rest
}: DynamicSVGProps) => JSX.Element;

export default DynamicSVG;
