import {useEffect, useState} from 'react'
import {css} from '@emotion/react'

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
function useSrcOrTextUrl(text=undefined, src=undefined,deps){
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
            setUrl(URL.createObjectURL(new Blob([text],{type:"text/plain"})))
        }
    },[...deps,text,src])
    return url
}

/**
 * @typedef {Object<string,string>} CssVars
 */

/**
 * @typedef {Object} DynamicSVGProps
 * @extends React.HTMLAttributes<SVGElement>
 * 
 * @property {string} [src=undefined]
 * @property {string} [text=undefined]
 * @property {CssVars} [cssVars=undefined]
 * 
 */

/**
 * @param {DynamicSVGProps} props
 * 
 * @returns {JSX.Element}
 * @throws
 *
 */
export default function DynamicSVG ({src,text, className,cssVars,...rest}) {
    if(typeof src !== "string" && typeof text!== "string"){
        throw new Error("Either src or text must be defined")
    }
    if(typeof src === "string" && typeof text === "string"){
        throw new Error("Either src or text must be defined, not both")
    }
    const componentCss = css`
${cssVars?Object.entries(cssVars).map(([k,v])=>(`${k}: ${v};`)).join("\n"):""};
    `
    const combinedClassName = `${className} ${componentCss}`

    const url = useSrcOrTextUrl(text,src,[src,text])

    return (
        <object data={url} type="image/svg+xml" className={combinedClassName} {...rest}>
          Your browser does not support SVG
        </object>
    );

}