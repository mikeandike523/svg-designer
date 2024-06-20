import {useEffect, useState} from 'react'
import {v4 as uuidv4} from 'uuid'
import InlineSVG from 'react-inlinesvg'

/**
 * 
 * A React hook to seamlessly access a string as if it were a file
 * 
 * Useful for <img> and <svg> tags
 * 
 * @param {*} text 
 * @param {*} deps 
 * @returns 
 */
function useSVGSrcOrTextUrl(text=undefined, src=undefined,deps){
    if(typeof src !== "string" && typeof text!== "string"){
        throw new Error("Either src or text must be defined")
    }
    if(typeof src === "string" && typeof text === "string"){
        throw new Error("Either src or text must be defined, not both")
    }
    const [url,setUrl] = useState(null)
    useEffect(()=>{
        if(typeof src === "string"){
            setUrl(src)
        }else{
            setUrl(URL.createObjectURL(new Blob([text],{type:"image/svg+xml"})))
        }
    },[...deps,text,src])
    return url
}

/**
 * @typedef {Object<string,string>} CssVars
 */

const createSVGProcessor = (noMangle=[])=>(svgText) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = doc.documentElement;
  
  
    svgElement.querySelectorAll('[id]').forEach((element) => {
      const id = element.getAttribute('id');
      if (!noMangle.includes(id)) {
        element.setAttribute('id', `${id}-${Math.random().toString(36).substr(2, 9)}`);
      }
    });
  
    return new XMLSerializer().serializeToString(svgElement);
  };

/**
 * @typedef {Object} DynamicSVGProps
 * @extends React.HTMLAttributes<SVGElement>
 * 
 * @property {string} [src=undefined]
 * @property {string} [text=undefined]
 * @property {CssVars} [cssVars=undefined]
 * @property {Array<string>} [noMangle=[]]
 * 
 */

/**
 * @param {DynamicSVGProps} props
 * 
 * @returns {JSX.Element}
 * @throws
 *
 */
export default function DynamicSVG ({src,text, className,cssVars,noMangle=[],...rest}) {
    if(typeof src !== "string" && typeof text!== "string"){
        throw new Error("Either src or text must be defined")
    }
    if(typeof src === "string" && typeof text === "string"){
        throw new Error("Either src or text must be defined, not both")
    }
    const u = uuidv4()

    const componentCss = `
    .dynamic-svg-${u} {
        ${cssVars?Object.entries(cssVars).map(([k,v])=>(`${k}: ${v};`)).join("\n"):""};
    }
    `

    const combinedClassName = `${className?(className + " "):""}dynamic-svg-${u}`


    return (
        <>
        <style>
            {componentCss}
        </style>
        <InlineSVG preProcessor={createSVGProcessor(noMangle)} src={typeof text === "string" ? `data:image/svg+xml;utf8,${encodeURIComponent(text)}`: url} className={combinedClassName} {...rest} />
        </>
    );

}