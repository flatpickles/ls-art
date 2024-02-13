// todo: re-enable typescript in this file
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import CanvasSketchProject, { type CanvasSketchProps } from '../util/CanvasSketchProject';
import { renderPaths } from 'canvas-sketch-util/penplot';

export default class RadialPatterns extends CanvasSketchProject {
    centerInset = 0.25; // "Center Inset", 0.0 to 1.0
    divisions = 20; // "Divisions", 2 to 100, step 1
    zigZagSize = 0.5; // "Zig Zag Size", 0.1 to 1
    rotationOffset = 0; // "Rotation Offset", -1 to 1
    insideTaper = 0; // "Inside Taper", 0 to 1
    outsideTaper = 0; // "Outside Taper", 0 to 1

    sketch() {
        return (props: CanvasSketchProps) => {
            const { width, height } = props;

            const paths = [];
            const center = [width / 2, height / 2];
            const maxRadius = Math.min(width, height) / 2;
            const radiusRangeSize = (1 - this.centerInset) * maxRadius;
            const gapSize = (1 / this.divisions) * radiusRangeSize;

            for (let layer = 0; layer < this.divisions; layer++) {
                const radius = (layer + 1) * gapSize;
                const progress = layer / (this.divisions - 1);
                const taperMultiplier =
                    progress * (1 - this.outsideTaper) + (1 - progress) * (1 - this.insideTaper);
                const zigZagSize = gapSize * this.zigZagSize * taperMultiplier;

                const path = [];
                for (let i = 0; i <= 100; i++) {
                    const currentRadius =
                        maxRadius * this.centerInset + (i % 2 === 0 ? radius : radius - zigZagSize);
                    const t = (i + layer * this.rotationOffset) / 100;
                    const angle = t * Math.PI * 2;
                    const x = center[0] + Math.cos(angle) * currentRadius;
                    const y = center[1] + Math.sin(angle) * currentRadius;
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
