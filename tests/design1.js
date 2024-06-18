import path from "path";
import fs from "fs";

import parseImportMetaUrl from "../lib/parseImportMetaUrl.js";
import SVGBuilder, {
  buildDStringForRectangle,
  createLinearGradient,
} from "../lib/SVGBuilder.js";

const { __dirname } = parseImportMetaUrl(import.meta.url);

const outDir = path.join(__dirname, "out");

console.log(outDir);

const svgBuilder = new SVGBuilder(256, 256);

svgBuilder.addPath(
  buildDStringForRectangle(10, 10, 128, 128),
  "black",
  createLinearGradient(0, 0, 256, 256, [
    { offset: 0, color: "red", opacity: 1 },
    { offset: 0.5, color: "green", opacity: 1 },
    { offset: 1, color: "blue", opacity: 1 },
  ])
);

console.log(svgBuilder.compile());

fs.writeFileSync(path.join(outDir, "design1.svg"), svgBuilder.compile());
