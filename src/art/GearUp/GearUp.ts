import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import { renderPaths } from 'canvas-sketch-util/penplot';
import PathUtil from '../util/Legacy/PathUtil';
import type { Path } from 'd3-path';

export default class GearUp extends CanvasSketchProject {
    minRadius = 0.2; // "Min Radius", 0.0 to 1.0
    maxRadius = 0.9; // "Max Radius", 0.0 to 1.0
    equidistant = false; // "Equidistant"
    tipCount = 30; // "Tip Count", 2 to 50, step 1
    ringCount = 7; // "Ring Count", 2 to 50, step 1
    rotationOffset = 0; // "Ring Rotation", -1 to 1
    ringSize = 1; // "Ring Size", 0 to 3
    sizeSkew = -0.6; // "Size Skew", -1 to 1
    smoothing = 0.2; // "Smoothing", 0 to 2
    smoothSkew = 0; // "Smooth Skew", -1 to 1

    sketch() {
        return (props: CanvasSketchProps) => {
            const { width, height } = props;
            const fullRadius = Math.min(width, height) / 2;

            // Generate ring sizing
            const rings: [inside: number, outside: number][] = [];
            if (this.equidistant) {
                // Calculate gap sizes between equidistant ring centers
                const radiusRangeSize = (this.maxRadius - this.minRadius) * fullRadius;
                const gapSize = (1 / this.ringCount) * radiusRangeSize;

                // Generate ring sizes
                for (let layer = 0; layer < this.ringCount; layer++) {
                    const radius = fullRadius * this.minRadius + (layer + 0.5) * gapSize;
                    const progress = layer / (this.ringCount - 1);
                    const skewSizeMultiplier =
                        this.sizeSkew > 0
                            ? 1 - this.sizeSkew * (1 - progress)
                            : 1 + this.sizeSkew * progress;
                    const zigZagSize = gapSize * this.ringSize * skewSizeMultiplier;
                    rings.push([radius - zigZagSize / 2, radius + zigZagSize / 2]);
                }
            } else {
                // Calculate the scaled slope of the unit sizes
                const scaledSlope = (this.sizeSkew * (2 / this.ringCount)) / (this.ringCount - 1);

                // Calculate the unit size of each zigzag
                const unitZigZagSizes: number[] = [];
                const firstZigZagSize =
                    1 / this.ringCount - ((this.ringCount - 1) * scaledSlope) / 2;
                for (let layer = 0; layer < this.ringCount; layer++) {
                    const currentZigZagSize = firstZigZagSize + layer * scaledSlope;
                    unitZigZagSizes.push(currentZigZagSize);
                }

                // Generate ring sizes
                const radiusRangeSize = (this.maxRadius - this.minRadius) * fullRadius;
                let currentRadius = fullRadius * this.minRadius;
                for (let layer = 0; layer < this.ringCount; layer++) {
                    const scaledZigZagSize = unitZigZagSizes[layer] * radiusRangeSize;
                    const adustedZigZagSize = scaledZigZagSize * this.ringSize;
                    const sizeOffset = (scaledZigZagSize - adustedZigZagSize) / 2;
                    const ringSizes: [number, number] = [
                        currentRadius + sizeOffset,
                        currentRadius + scaledZigZagSize - sizeOffset
                    ];
                    rings.push(ringSizes);
                    currentRadius += scaledZigZagSize;
                }
            }

            // Generate paths
            const center = [width / 2, height / 2];
            const paths: Path[] = [];
            for (let pathIdx = 0; pathIdx < this.ringCount; pathIdx++) {
                // Calculate path points
                const path: [number, number][] = [];
                const pointCount = this.tipCount * 2;
                for (let pointIdx = 0; pointIdx <= pointCount; pointIdx++) {
                    const t = (pointIdx + pathIdx * this.rotationOffset) / pointCount;
                    const angle = t * Math.PI * 2;
                    const radius = pointIdx % 2 === 0 ? rings[pathIdx][1] : rings[pathIdx][0];
                    const x = center[0] + Math.cos(angle) * radius;
                    const y = center[1] + Math.sin(angle) * radius;
                    path.push([x, y]);
                }

                // Calculate smoothing and add to paths
                const progress = pathIdx / (this.ringCount - 1);
                const smoothingMultiplier =
                    this.smoothSkew > 0
                        ? 1 - this.smoothSkew * (1 - progress)
                        : 1 + this.smoothSkew * progress;
                paths.push(
                    PathUtil.createCardinalSpline(path, this.smoothing * smoothingMultiplier)
                );
            }

            return renderPaths(paths, {
                lineWidth: 0.05,
                lineJoin: 'round',
                lineCap: 'round',
                strokeStyle: 'black',
                inkscape: true,
                ...props
            });
        };
    }
}
