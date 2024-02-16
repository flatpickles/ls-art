import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import { renderPaths } from 'canvas-sketch-util/penplot';

// Ideas:
// - smooth paths relative to their zig zag size (angle) - configurable
// - nested zigzags - how? size > 1 maybe?

export default class RadialPatterns extends CanvasSketchProject {
    ringCount = 20; // "Ring Count", 2 to 100, step 1
    zigZagCount = 10; // "Zig Zag Count", 2 to 200, step 1
    zigZagSize = 0.5; // "Zig Zag Size", 0.1 to 1
    rotationOffset = 0; // "Rotation Offset", -1 to 1
    innerInset = 0.25; // "Inner Inset", 0.0 to 1.0
    outerInset = 0; // "Outer Inset", 0.0 to 1.0
    skew = 0; // "Skew", -1 to 1
    fillSpace = false; // "Fill Space"

    sketch() {
        return (props: CanvasSketchProps) => {
            const { width, height } = props;

            // Generate ring sizing
            const rings: [inside: number, outside: number][] = [];
            if (this.fillSpace) {
                // Calculate the scaled slope of the unit sizes
                const scaledSlope = (this.skew * (2 / this.ringCount)) / (this.ringCount - 1);

                // Calculate the unit size of each zigzag
                const unitZigZagSizes: number[] = [];
                const firstZigZagSize =
                    1 / this.ringCount - ((this.ringCount - 1) * scaledSlope) / 2;
                for (let layer = 0; layer < this.ringCount; layer++) {
                    const currentZigZagSize = firstZigZagSize + layer * scaledSlope;
                    unitZigZagSizes.push(currentZigZagSize);
                }

                // Generate ring sizes
                const fullRadius = Math.min(width, height) / 2;
                const radiusRangeSize = (1 - this.outerInset - this.innerInset) * fullRadius;
                let currentRadius = fullRadius * this.innerInset;
                for (let layer = 0; layer < this.ringCount; layer++) {
                    const currentZigZagSize = unitZigZagSizes[layer] * radiusRangeSize;
                    const ringSizes: [number, number] = [
                        currentRadius,
                        currentRadius + currentZigZagSize
                    ];
                    rings.push(ringSizes);
                    currentRadius += currentZigZagSize;
                }
            } else {
                // Calculate gap sizes between equidistant ring centers
                const maxRadius = Math.min(width, height) / 2;
                const radiusRangeSize = (1 - this.outerInset - this.innerInset) * maxRadius;
                const gapSize = (1 / this.ringCount) * radiusRangeSize;

                for (let layer = 0; layer < this.ringCount; layer++) {
                    // todo: resize from center
                    const radius = maxRadius * this.innerInset + (layer + 1) * gapSize;
                    const progress = layer / (this.ringCount - 1);
                    const skewSizeMultiplier =
                        this.skew > 0 ? 1 - this.skew * (1 - progress) : 1 + this.skew * progress;
                    const zigZagSize = gapSize * this.zigZagSize * skewSizeMultiplier;
                    rings.push([radius - zigZagSize, radius]);
                }
            }

            // Generate paths
            const center = [width / 2, height / 2];
            const paths: [number, number][][] = [];
            for (let pathIdx = 0; pathIdx < this.ringCount; pathIdx++) {
                const path: [number, number][] = [];
                const pointCount = this.zigZagCount * 2;
                for (let pointIdx = 0; pointIdx <= pointCount; pointIdx++) {
                    const t = (pointIdx + pathIdx * this.rotationOffset) / pointCount;
                    const angle = t * Math.PI * 2;
                    const radius = pointIdx % 2 === 0 ? rings[pathIdx][1] : rings[pathIdx][0];
                    const x = center[0] + Math.cos(angle) * radius;
                    const y = center[1] + Math.sin(angle) * radius;
                    path.push([x, y]);
                }
                paths.push(path);
            }

            return renderPaths(paths, {
                lineWidth: 0.05,
                lineJoin: 'round',
                lineCap: 'round',
                strokeStyle: ['black', 'black'],
                inkscape: true,
                ...props
            });
        };
    }
}
