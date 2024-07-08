import { v4 as uuidv4 } from "uuid";
import InlineSVG from "react-inlinesvg";

/**
 * @typedef {import('@emotion/react').SerializedStyles} SerializedStyles
 */

/**
 * @typedef {Object} ViewBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object<string,string>} CssVars
 */

const createSVGProcessor =
  (noMangle = []) =>
  (svgText) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = doc.documentElement;

    svgElement.querySelectorAll("[id]").forEach((element) => {
      const id = element.getAttribute("id");
      if (!noMangle.includes(id)) {
        element.setAttribute(
          "id",
          `${id}-${Math.random().toString(36).substr(2, 9)}`
        );
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
 * @property {Viewbox|undefined} [viewBox=undefined]
 * @property css {SerializiedStyles} [css=undefined]
 *
 */

/**
 * @param {DynamicSVGProps} props
 *
 * @returns {JSX.Element}
 * @throws
 *
 */
export default function DynamicSVG({
  src,
  text,
  className,
  cssVars,
  css,
  noMangle = [],
  viewBox,
  ...rest
}) {
  if (typeof src !== "string" && typeof text !== "string") {
    throw new Error("Either src or text must be defined");
  }
  if (typeof src === "string" && typeof text === "string") {
    throw new Error("Either src or text must be defined, not both");
  }
  const u = uuidv4();

  const componentCss = `
    .dynamic-svg-${u} {
        ${
          cssVars
            ? Object.entries(cssVars)
                .map(([k, v]) => `${k}: ${v};`)
                .join("\n")
            : ""
        };
    }
    `;

  const classNames = [];

  if (className) {
    classNames.push(className);
  }

  classNames.push(`dynamic-svg-${u}`);

  const cn = css ? css.className : "";

  if (cn) {
    classNames.push(cn);
  }

  const combinedClassName = classNammes.join(" ");

  const viewBoxString = viewBox
    ? `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
    : undefined;

  return (
    <>
      <style>{componentCss}</style>
      <InlineSVG
        viewBox={viewBoxString}
        preProcessor={createSVGProcessor(noMangle)}
        src={
          typeof text === "string"
            ? `data:image/svg+xml;utf8,${encodeURIComponent(text)}`
            : url
        }
        className={combinedClassName}
        {...rest}
      />
    </>
  );
}
