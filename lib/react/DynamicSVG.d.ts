import { HTMLAttributes, JSXElementConstructor } from 'react';

declare module '@emotion/react' {
    export const css: (template: TemplateStringsArray, ...args: any[]) => string;
}

export function useSrcOrTextUrl(text?: string, src?: string, deps: any[]): string | null;

export interface CssVars {
    [key: string]: string;
}

export interface DynamicSVGProps extends HTMLAttributes<SVGElement> {
    src?: string;
    text?: string;
    cssVars?: CssVars;
}

declare const DynamicSVG: ({ src, text, className, cssVars, ...rest }: DynamicSVGProps) => JSX.Element;

export default DynamicSVG