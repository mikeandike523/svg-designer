import path from "path";
import fs from "fs";

import parseImportMetaUrl from "../lib/parseImportMetaUrl.js";
import SVGBuilder, {
} from "../lib/SVGBuilder.js";

// Define the Point class
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return new Point(this.x, this.y);
    }

    add(otherPoint){
        return new Point(this.x + otherPoint.x, this.y + otherPoint.y);
    }

    sub(otherPoint) {
        return new Point(this.x - otherPoint.x, this.y - otherPoint.y);
    }

    scale(s){
        return new Point(this.x * s, this.y * s);
    }

    getMagnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    getDirection() {
        return Math.atan2(this.y, this.x)
    }

    normalize() {
        const mag = this.getMagnitude()
        return new Point(this.x / mag, this.y / mag);
    }

    toArray() {
        return [this.x, this.y]
    }

    // Example math function: distance to another point
    distanceTo(otherPoint) {
        if (!(otherPoint instanceof Point)) {
            throw new Error("Argument must be an instance of Point");
        }
        const dx = this.x - otherPoint.x;
        const dy = this.y - otherPoint.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Extend the Array prototype
Object.defineProperty(Array.prototype, 'toPoint', {
    value: function() {
        if (this.length === 2 && this.every(num => typeof num === 'number')) {
            return new Point(this[0], this[1]);
        } else {
            throw new Error("Array must be of length 2 with numerical elements to convert to Point");
        }
    },
    enumerable: false // Prevents the method from showing up in for...in loops
});

const { __dirname } = parseImportMetaUrl(import.meta.url);

const outDir = path.join(__dirname, "out");


const svgBuilder = new SVGBuilder(256, 256);

const transformPoint = (pt) => {
    return [pt[0]+128, 128-pt[1]];
}

const tP = transformPoint;

const mirrorX = ([x,y]) => {
    return [-x,y]
}

const reverseArray = (arr) => {
    return arr.slice().reverse();
}

const tf1 = (pt)=>pt.toPoint().copy().add(new Point(0,30)).scale(0.85).toArray()

const halfOutline = [
    [0,-120],
    [50,-100],
    [70, -60],
    [75, -20],
    [70,20],
    [40, 40],
    [10,45],
    [0,47]
].map(tf1)


const halfOutlineEar = [
    [75,-20],
    [70,20],
    [70,70],
    [10,45]
].map(tf1)

const outline = [
   ...halfOutline,
   ...reverseArray(halfOutline.map(mirrorX))
]





// It appears as if the current implementation of canonical spline misses the first portion
// But catmull rom seems to work properly
// This is likely an implemntation bug, not a misunderstanding of the algorithm but I'm not sure
// @todo Do a full bug hunt
svgBuilder.artist("black").rectangle(0,0,128,128)
.rectangle(128,0,128,128)
.rectangle(0,128,128,128)
.rectangle(128,128,128,128)
.commit()
svgBuilder.artist("black",2).curve(halfOutlineEar.map(tP),0.8).commit()
svgBuilder.artist("black",2).curve(reverseArray(halfOutlineEar.map(mirrorX)).map(tP),0.8).commit()
svgBuilder.setVar("--theme-primary","red").artist("black",3,"var(--theme-primary)").curve(outline.map(tP),0.8).commit()




fs.writeFileSync(path.join(outDir, "logo.svg"), svgBuilder.compile(false));
fs.writeFileSync(path.join(outDir, "logo.themable.svg"), svgBuilder.compile(true));

